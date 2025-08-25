"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { 
  Bot,
  Search,
  Plus,
  Loader2,
  Rocket,
  BookOpen,
  BarChart,
  MessageSquare,
  Code,
  Users,
  Zap,
  Play,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { agentAPI, type Agent, type PreconfiguredAgent } from "@/lib/agent-api"
import { useToast } from "@/hooks/use-toast"

interface AgentExecution {
  id: string;
  status: 'idle' | 'planning' | 'executing' | 'completed' | 'failed';
  error?: string;
  result?: any;
}

interface AIAgent extends Agent {
  lastExecution?: AgentExecution;
  executionCount?: number;
}

const statusConfig = {
  'idle': { 
    label: 'Idle', 
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  'executing': { 
    label: 'Executing', 
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    animate: true
  },
  'completed': { 
    label: 'Completed', 
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500'
  },
  'failed': { 
    label: 'Failed', 
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500'
  }
}

const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'general.assistant': Rocket,
  'research.assistant': BookOpen,
  'data.analyst': BarChart,
  'comm.coordinator': MessageSquare,
  'dev.assistant': Code,
  'claude.code': Code,
}

export default function AIAgentPage() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [preconfiguredAgents, setPreconfiguredAgents] = useState<PreconfiguredAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [executingAgents, setExecutingAgents] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  // Load agents on mount
  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      const [customAgents, preconfigured] = await Promise.all([
        agentAPI.getAgents(),
        agentAPI.getPreconfiguredAgents()
      ])
      
      // Convert to AIAgent format
      const aiAgents: AIAgent[] = customAgents.map(agent => ({
        ...agent,
        executionCount: 0
      }))
      
      setAgents(aiAgents)
      setPreconfiguredAgents(preconfigured)
    } catch (error) {
      console.error('Failed to load agents:', error)
      toast({
        title: "Failed to load agents",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter agents based on search
  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents
    
    const query = searchQuery.toLowerCase()
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(query) ||
      agent.agentId.toLowerCase().includes(query) ||
      agent.description?.toLowerCase().includes(query)
    )
  }, [agents, searchQuery])

  // Get agent status
  const getAgentStatus = (agent: AIAgent) => {
    if (executingAgents.has(agent.id)) {
      return 'executing'
    }
    if (agent.lastExecution) {
      if (agent.lastExecution.status === 'completed') return 'completed'
      if (agent.lastExecution.status === 'failed') return 'failed'
      if (agent.lastExecution.status === 'executing' || agent.lastExecution.status === 'planning') return 'executing'
    }
    return 'idle'
  }

  // Execute agent
  const executeAgent = async (agent: AIAgent, goal: string) => {
    try {
      setExecutingAgents(prev => new Set(prev).add(agent.id))
      
      const execution = await agentAPI.executeAgent({
        agentId: agent.agentId,
        goal: goal,
        stream: false
      })
      
      toast({
        title: "Agent started",
        description: `${agent.name} is working on your task`
      })
      
      // Update agent with execution
      setAgents(prev => prev.map(a => 
        a.id === agent.id 
          ? { ...a, lastExecution: execution as any, executionCount: (a.executionCount || 0) + 1 }
          : a
      ))
    } catch (error) {
      console.error('Failed to execute agent:', error)
      toast({
        title: "Execution failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setExecutingAgents(prev => {
        const next = new Set(prev)
        next.delete(agent.id)
        return next
      })
    }
  }

  // Render agent card
  const renderAgentCard = (agent: AIAgent) => {
    const status = getAgentStatus(agent)
    const statusInfo = statusConfig[status as keyof typeof statusConfig]
    const Icon = agentIcons[agent.agentId] || Bot
    
    return (
      <div
        key={agent.id}
        className={cn(
          "p-4 border rounded-lg hover:bg-accent/50 transition-all cursor-pointer",
          selectedAgent?.id === agent.id && "ring-2 ring-primary"
        )}
        onClick={() => setSelectedAgent(agent)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{agent.agentId}</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 text-xs",
            statusInfo.color
          )}>
            <statusInfo.icon className={cn(
              "h-3.5 w-3.5",
              'animate' in statusInfo && statusInfo.animate && "animate-spin"
            )} />
            <span>{statusInfo.label}</span>
          </div>
        </div>
        
        {agent.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {agent.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{agent.executionCount || 0} runs</span>
            <span>Model: {agent.model}</span>
          </div>
          {status === 'idle' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                const goal = prompt('What would you like the agent to do?')
                if (goal) executeAgent(agent, goal)
              }}
            >
              <Play className="h-3 w-3" />
              Run
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Render preconfigured agent card
  const renderPreconfiguredCard = (agent: PreconfiguredAgent) => {
    const Icon = agentIcons[agent.agentId] || Bot
    
    return (
      <div
        key={agent.agentId}
        className="p-4 border rounded-lg hover:bg-accent/50 transition-all cursor-pointer"
        onClick={() => {
          // Spawn this agent
          const goal = prompt(`What would you like ${agent.name} to help with?`)
          if (goal) {
            agentAPI.executeAgent({
              agentId: agent.agentId,
              goal: goal,
              stream: false
            }).then(() => {
              toast({
                title: "Agent started",
                description: `${agent.name} is working on your task`
              })
            }).catch(error => {
              toast({
                title: "Failed to start agent",
                description: error.message,
                variant: "destructive"
              })
            })
          }
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{agent.tagline}</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">
          {agent.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {agent.hasAllTools ? 'All tools' : `${agent.toolCount} tools`}
          </span>
          <Button size="sm" variant="ghost">
            <Zap className="h-3 w-3" />
            Use
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">AI Agents</h1>
          <Button
            onClick={() => {
              // Open spawn agent dialog
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                bubbles: true
              });
              document.dispatchEvent(event);
              setTimeout(() => {
                const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
                if (input) {
                  input.value = 'spawn agent';
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }, 100);
            }}
          >
            <Plus className="h-4 w-4" />
            New Agent
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Preconfigured Agents */}
        {preconfiguredAgents.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Featured Agents</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {preconfiguredAgents.map(renderPreconfiguredCard)}
            </div>
          </div>
        )}

        {/* Custom Agents */}
        {filteredAgents.length > 0 ? (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Your Agents</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredAgents.map(renderAgentCard)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No agents found' : 'No custom agents yet'}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true
                });
                document.dispatchEvent(event);
                setTimeout(() => {
                  const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
                  if (input) {
                    input.value = 'spawn agent';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }, 100);
              }}
            >
              <Plus className="h-4 w-4" />
              Create your first agent
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}