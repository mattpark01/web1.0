"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { ItemList, ListItem, ItemSection } from "@/components/shared/item-list"
import { AppSidebar, AppSidebarItem } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Clock,
  Archive,
  Trash2,
  MessageSquare,
  Filter,
  Search,
  Settings,
  Star,
  Bot,
  Zap,
  Shield,
  Database,
  Globe,
  GitBranch,
  Terminal,
  Grid3X3,
  List,
  ChevronDown,
  Loader2
} from "lucide-react"

interface Agent {
  id: string
  name: string
  description?: string
  status: 'running' | 'idle' | 'stopped' | 'error'
  health: 'healthy' | 'warning' | 'critical' | 'offline'
  type: 'compute' | 'storage' | 'network' | 'database' | 'ml' | 'api'
  resources: {
    cpu: number // percentage
    memory: number // percentage
    disk?: number // percentage
  }
  location: string
  uptime: string
  lastActivity: string
  tags?: string[]
}

const mockAgents: Agent[] = [
  {
    id: "agent-001",
    name: "db-primary-01",
    description: "Primary database server for production",
    status: "running",
    health: "healthy",
    type: "database",
    resources: {
      cpu: 45,
      memory: 62,
      disk: 78
    },
    location: "us-west-2",
    uptime: "15d 3h 42m",
    lastActivity: "2 min ago",
    tags: ["production", "primary"]
  },
  {
    id: "agent-002",
    name: "api-gateway-01",
    status: "running",
    health: "warning",
    type: "api",
    resources: {
      cpu: 82,
      memory: 71
    },
    location: "us-east-1",
    uptime: "7d 12h 15m",
    lastActivity: "5 sec ago",
    tags: ["gateway", "public"]
  },
  {
    id: "agent-003",
    name: "ml-training-03",
    description: "GPU instance for model training",
    status: "idle",
    health: "healthy",
    type: "ml",
    resources: {
      cpu: 12,
      memory: 34,
      disk: 45
    },
    location: "eu-central-1",
    uptime: "2d 6h 30m",
    lastActivity: "15 min ago",
    tags: ["gpu", "training"]
  },
  {
    id: "agent-004",
    name: "storage-node-02",
    status: "running",
    health: "healthy",
    type: "storage",
    resources: {
      cpu: 23,
      memory: 41,
      disk: 89
    },
    location: "ap-southeast-1",
    uptime: "30d 0h 0m",
    lastActivity: "1 min ago",
    tags: ["s3", "backup"]
  },
  {
    id: "agent-005",
    name: "compute-worker-05",
    status: "error",
    health: "critical",
    type: "compute",
    resources: {
      cpu: 95,
      memory: 92,
      disk: 67
    },
    location: "us-west-1",
    uptime: "0d 2h 45m",
    lastActivity: "30 min ago",
    tags: ["worker", "batch"]
  },
  {
    id: "agent-006",
    name: "network-lb-01",
    description: "Load balancer for web traffic",
    status: "running",
    health: "healthy",
    type: "network",
    resources: {
      cpu: 35,
      memory: 28
    },
    location: "us-east-2",
    uptime: "45d 12h 18m",
    lastActivity: "now",
    tags: ["loadbalancer", "web"]
  },
  {
    id: "agent-007",
    name: "db-replica-01",
    status: "stopped",
    health: "offline",
    type: "database",
    resources: {
      cpu: 0,
      memory: 0,
      disk: 72
    },
    location: "eu-west-1",
    uptime: "0d 0h 0m",
    lastActivity: "3 hours ago",
    tags: ["replica", "standby"]
  },
  {
    id: "agent-008",
    name: "api-backend-02",
    status: "running",
    health: "healthy",
    type: "api",
    resources: {
      cpu: 58,
      memory: 64
    },
    location: "us-west-2",
    uptime: "10d 8h 22m",
    lastActivity: "10 sec ago",
    tags: ["backend", "internal"]
  },
  {
    id: "agent-009",
    name: "ml-inference-01",
    status: "running",
    health: "healthy",
    type: "ml",
    resources: {
      cpu: 67,
      memory: 73,
      disk: 52
    },
    location: "us-east-1",
    uptime: "5d 14h 7m",
    lastActivity: "30 sec ago",
    tags: ["inference", "production"]
  },
  {
    id: "agent-010",
    name: "compute-spot-12",
    description: "Spot instance for batch processing",
    status: "idle",
    health: "healthy",
    type: "compute",
    resources: {
      cpu: 8,
      memory: 15,
      disk: 23
    },
    location: "ap-northeast-1",
    uptime: "0d 18h 45m",
    lastActivity: "2 hours ago",
    tags: ["spot", "batch"]
  }
]

const statusConfig = {
  'running': { 
    label: 'Running', 
    icon: Zap,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-500',
    count: mockAgents.filter(a => a.status === 'running').length
  },
  'idle': { 
    label: 'Idle', 
    icon: Clock,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500',
    count: mockAgents.filter(a => a.status === 'idle').length
  },
  'stopped': { 
    label: 'Stopped', 
    icon: Archive,
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-500',
    count: mockAgents.filter(a => a.status === 'stopped').length
  },
  'error': { 
    label: 'Error', 
    icon: AlertCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-500',
    count: mockAgents.filter(a => a.status === 'error').length
  }
}

const healthConfig = {
  'healthy': { color: 'bg-green-500', label: 'Healthy' },
  'warning': { color: 'bg-yellow-500', label: 'Warning' },
  'critical': { color: 'bg-red-500', label: 'Critical' },
  'offline': { color: 'bg-gray-400', label: 'Offline' }
}

const typeIcons = {
  'compute': Terminal,
  'storage': Database,
  'network': Globe,
  'database': Database,
  'ml': Zap,
  'api': Globe
}

// Generate more mock data to simulate thousands of agents
// Using a simple deterministic pseudo-random for consistent values between server and client
const generateMockAgents = (count: number): Agent[] => {
  const baseAgents = [...mockAgents]
  const statuses: Agent['status'][] = ['running', 'idle', 'stopped', 'error']
  const healths: Agent['health'][] = ['healthy', 'warning', 'critical', 'offline']
  const types: Agent['type'][] = ['compute', 'storage', 'network', 'database', 'ml', 'api']
  const locations = ['us-west-1', 'us-west-2', 'us-east-1', 'us-east-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1']
  
  // Simple deterministic pseudo-random based on index
  const seededRandom = (seed: number, max: number) => {
    const x = Math.sin(seed) * 10000
    return Math.floor((x - Math.floor(x)) * max)
  }
  
  for (let i = baseAgents.length; i < count; i++) {
    const type = types[seededRandom(i * 7, types.length)]
    const status = statuses[seededRandom(i * 13, statuses.length)]
    baseAgents.push({
      id: `agent-${String(i + 1).padStart(3, '0')}`,
      name: `${type}-node-${String(i + 1).padStart(2, '0')}`,
      description: seededRandom(i * 17, 2) === 1 ? `Auto-scaled ${type} instance` : undefined,
      status: status,
      health: status === 'stopped' ? 'offline' : healths[seededRandom(i * 19, 3)],
      type: type,
      resources: {
        cpu: status === 'stopped' ? 0 : seededRandom(i * 23, 100),
        memory: status === 'stopped' ? 0 : seededRandom(i * 29, 100),
        disk: seededRandom(i * 31, 100)
      },
      location: locations[seededRandom(i * 37, locations.length)],
      uptime: status === 'stopped' ? '0d 0h 0m' : `${seededRandom(i * 41, 30)}d ${seededRandom(i * 43, 24)}h ${seededRandom(i * 47, 60)}m`,
      lastActivity: `${seededRandom(i * 53, 60)} min ago`,
      tags: ['auto-scaled']
    })
  }
  
  return baseAgents
}

const ITEMS_PER_PAGE = 100
const GRID_ITEM_HEIGHT = 140 // Height of each grid item in pixels - increased to prevent overlap

export default function AgentInboxPage() {
  const [allAgents] = useState<Agent[]>(() => generateMockAgents(5000)) // Simulate 5000 agents
  const [agents, setAgents] = useState<Agent[]>(allAgents)
  const [openSections, setOpenSections] = useState<string[]>(["running", "idle"])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<Agent['status']>>(new Set())
  const [activeSidebarItem, setActiveSidebarItem] = useState("all-agents")
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Agent['status'] | 'all'>('all')
  const [healthFilter, setHealthFilter] = useState<Agent['health'] | 'all'>('all')
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 200 })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const toggleGroupCollapse = (status: Agent['status']) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(status)) {
        newSet.delete(status)
      } else {
        newSet.add(status)
      }
      return newSet
    })
  }

  // Filter agents based on search and filters
  const filteredAgents = useMemo(() => {
    return allAgents.filter(agent => {
      const matchesSearch = searchQuery === '' || 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.location.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
      const matchesHealth = healthFilter === 'all' || agent.health === healthFilter
      
      return matchesSearch && matchesStatus && matchesHealth
    })
  }, [allAgents, searchQuery, statusFilter, healthFilter])

  // Group agents by status for better organization
  const groupedAgents = useMemo(() => {
    const groups: Record<Agent['status'], Agent[]> = {
      running: [],
      idle: [],
      stopped: [],
      error: []
    }
    
    filteredAgents.forEach(agent => {
      groups[agent.status].push(agent)
    })
    
    return groups
  }, [filteredAgents])

  // Calculate visible items for virtual scrolling
  const visibleAgents = useMemo(() => {
    return filteredAgents.slice(visibleRange.start, visibleRange.end)
  }, [filteredAgents, visibleRange])

  // Handle scroll for virtual scrolling
  const handleScroll = useCallback(() => {
    if (!gridContainerRef.current) return
    
    const container = gridContainerRef.current
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight
    
    // Calculate which items should be visible
    const columnsPerRow = Math.floor(container.clientWidth / 150) // Approximate item width
    const rowHeight = GRID_ITEM_HEIGHT
    const firstVisibleRow = Math.floor(scrollTop / rowHeight)
    const lastVisibleRow = Math.ceil((scrollTop + containerHeight) / rowHeight)
    
    const newStart = Math.max(0, firstVisibleRow * columnsPerRow - columnsPerRow * 5) // Larger buffer
    const newEnd = Math.min(filteredAgents.length, lastVisibleRow * columnsPerRow + columnsPerRow * 5)
    
    // Immediate update for better responsiveness
    setVisibleRange({ start: newStart, end: newEnd })
  }, [filteredAgents.length])

  // Set up scroll listener
  useEffect(() => {
    const container = gridContainerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const getAgentsByStatus = (status: Agent['status']) => {
    return agents.filter(agent => agent.status === status)
  }

  const sidebarItems: AppSidebarItem[] = [
    {
      id: "all-agents",
      label: "All Agents",
      icon: Bot,
      count: agents.length,
      isActive: activeSidebarItem === "all-agents",
      onClick: () => setActiveSidebarItem("all-agents")
    },
    {
      id: "compute",
      label: "Compute",
      icon: Terminal,
      count: agents.filter(a => a.type === 'compute').length,
      isActive: activeSidebarItem === "compute",
      onClick: () => setActiveSidebarItem("compute")
    },
    {
      id: "database",
      label: "Database",
      icon: Database,
      count: agents.filter(a => a.type === 'database').length,
      isActive: activeSidebarItem === "database",
      onClick: () => setActiveSidebarItem("database")
    },
    {
      id: "network",
      label: "Network",
      icon: Globe,
      count: agents.filter(a => a.type === 'network').length,
      isActive: activeSidebarItem === "network",
      onClick: () => setActiveSidebarItem("network")
    },
    {
      id: "storage",
      label: "Storage",
      icon: Archive,
      count: agents.filter(a => a.type === 'storage').length,
      isActive: activeSidebarItem === "storage",
      onClick: () => setActiveSidebarItem("storage")
    },
    {
      id: "ml",
      label: "ML/AI",
      icon: Zap,
      count: agents.filter(a => a.type === 'ml').length,
      isActive: activeSidebarItem === "ml",
      onClick: () => setActiveSidebarItem("ml")
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      isActive: activeSidebarItem === "settings",
      onClick: () => setActiveSidebarItem("settings")
    }
  ]

  const sections: ItemSection<Agent>[] = (Object.keys(statusConfig) as Agent['status'][]).map(status => {
    const config = statusConfig[status]
    return {
      id: status,
      label: config.label,
      icon: config.icon,
      iconColor: config.iconColor,
      headerColor: 'bg-white/[0.025]',
      items: getAgentsByStatus(status),
      count: config.count
    }
  })

  const renderAgentItem = (agent: Agent) => {
    const TypeIcon = typeIcons[agent.type]
    const StatusIcon = statusConfig[agent.status].icon
    
    return (
      <div className="group relative">
        <ListItem
          icon={TypeIcon}
          iconClassName={agent.status === 'running' ? 'text-green-500' : 'text-muted-foreground'}
          id={agent.id}
          title={agent.name}
          indicator={{
            color: healthConfig[agent.health].color,
            tooltip: healthConfig[agent.health].label
          }}
          badge={{
            label: agent.location,
            variant: "secondary"
          }}
          date={agent.lastActivity}
          onClick={() => {
            setSelectedAgent(agent)
          }}
          className="pr-12"
        />
        {agent.description && (
          <div className="px-6 pb-2 -mt-1">
            <p className="text-xs text-muted-foreground ml-11">
              {agent.description}
            </p>
          </div>
        )}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <StatusIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    )
  }

  const renderGridCard = (agent: Agent) => {
    const TypeIcon = typeIcons[agent.type]
    const StatusIcon = statusConfig[agent.status].icon
    const HealthConfig = healthConfig[agent.health]
    const isSelected = selectedAgent?.id === agent.id
    
    return (
      <div 
        className={cn(
          "h-full w-full border-r border-b hover:bg-accent cursor-pointer p-3 flex flex-col",
          isSelected && "bg-accent ring-2 ring-primary"
        )}
        onClick={() => {
          setSelectedAgent(agent)
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <StatusIcon className={`h-4 w-4 ${statusConfig[agent.status].iconColor}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${HealthConfig.color}`} title={HealthConfig.label} />
        </div>
        
        <h3 className="font-medium text-xs mb-1 line-clamp-2">{agent.name}</h3>
        
        {/* Resource bars */}
        <div className="space-y-1 mt-auto">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground w-7">CPU</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden relative">
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 transition-all",
                  agent.resources.cpu > 80 ? "bg-red-500" : agent.resources.cpu > 60 ? "bg-yellow-500" : "bg-green-500"
                )}
                style={{ 
                  width: `${agent.resources.cpu}%`,
                  height: '100%'
                }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground w-8 text-right">{agent.resources.cpu}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground w-7">MEM</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden relative">
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 transition-all",
                  agent.resources.memory > 80 ? "bg-red-500" : agent.resources.memory > 60 ? "bg-yellow-500" : "bg-green-500"
                )}
                style={{ 
                  width: `${agent.resources.memory}%`,
                  height: '100%'
                }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground w-8 text-right">{agent.resources.memory}%</span>
          </div>
        </div>
        
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground truncate">
              {agent.location}
            </span>
            <TypeIcon className="h-3 w-3 text-muted-foreground/50" />
          </div>
        </div>
      </div>
    )
  }

  const renderGridView = () => {
    const columnsClass = "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10"
    
    return (
      <div className="h-full flex flex-col">
        {/* Filters Bar */}
        <div className="flex items-center gap-1 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm border-0 bg-muted/50"
              />
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter('all')}
            className={cn(
              "h-8 border-0",
              statusFilter === 'all' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
            )}
          >
            All ({filteredAgents.length})
          </Button>
          
          {(Object.keys(statusConfig) as Agent['status'][]).map(status => {
            const config = statusConfig[status]
            const StatusIcon = config.icon
            const count = groupedAgents[status].length
            
            return (
              <Button
                key={status}
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "h-8 gap-1 border-0",
                  statusFilter === status ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                )}
              >
                <StatusIcon className={`h-3 w-3 ${config.iconColor}`} />
                {config.label} ({count})
              </Button>
            )
          })}
          
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {filteredAgents.length} total agents
            </span>
          </div>
        </div>
        
        {/* Virtual Scrolling Grid Container */}
        <div 
          ref={gridContainerRef}
          className="flex-1 overflow-auto relative"
          style={{ contain: 'strict' }}
        >
          {/* Virtual spacer for proper scrollbar */}
          <div 
            style={{ 
              height: Math.ceil(filteredAgents.length / 10) * GRID_ITEM_HEIGHT,
              position: 'relative'
            }}
          >
            {/* Render only visible items */}
            <div 
              className={`${columnsClass} absolute top-0 left-0 right-0 [&>*:nth-child(3n+1)]:border-l-0 sm:[&>*:nth-child(4n+1)]:border-l-0 md:[&>*:nth-child(5n+1)]:border-l-0 lg:[&>*:nth-child(6n+1)]:border-l-0 xl:[&>*:nth-child(8n+1)]:border-l-0 2xl:[&>*:nth-child(10n+1)]:border-l-0 [&>*:last-child]:border-r-0`}
              style={{
                transform: `translateY(${Math.floor(visibleRange.start / 10) * GRID_ITEM_HEIGHT}px)`
              }}
            >
              {visibleAgents.map((agent) => (
                <div key={agent.id} className="relative border-l" style={{ height: GRID_ITEM_HEIGHT, boxSizing: 'border-box' }}>
                  {renderGridCard(agent)}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-1 border-t bg-muted/30 text-xs">
          <span className="text-muted-foreground">
            Showing {visibleRange.start + 1}-{Math.min(visibleRange.end, filteredAgents.length)} of {filteredAgents.length}
          </span>
          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* <AppSidebar items={sidebarItems} /> */}
      <div className="flex-1 overflow-hidden flex">
        <div className={cn(
          "flex-1 overflow-hidden",
          selectedAgent && "border-r"
        )}>
          {viewMode === 'list' ? (
            <ItemList
              sections={sections}
              renderItem={renderAgentItem}
              openSections={openSections}
              onSectionToggle={setOpenSections}
              onAddItem={(sectionId) => console.log('Add message to', sectionId)}
            />
          ) : (
            renderGridView()
          )}
        </div>
        
        {/* Detail Panel */}
        {selectedAgent && (
          <div className="w-96 overflow-hidden flex flex-col bg-background">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const TypeIcon = typeIcons[selectedAgent.type]
                    return <TypeIcon className="h-5 w-5 text-muted-foreground" />
                  })()}
                  <div>
                    <h2 className="font-semibold text-sm">{selectedAgent.name}</h2>
                    <p className="text-xs text-muted-foreground">{selectedAgent.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-1 hover:bg-accent rounded"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Status and Health */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const StatusIcon = statusConfig[selectedAgent.status].icon
                    return <StatusIcon className={`h-3.5 w-3.5 ${statusConfig[selectedAgent.status].iconColor}`} />
                  })()}
                  <span className="text-xs font-medium">{statusConfig[selectedAgent.status].label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${healthConfig[selectedAgent.health].color}`} />
                  <span className="text-xs font-medium">{healthConfig[selectedAgent.health].label}</span>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {selectedAgent.description && (
                  <div>
                    <h3 className="font-medium text-sm mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{selectedAgent.description}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-sm mb-2">Resources</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">CPU Usage</span>
                        <span>{selectedAgent.resources.cpu}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            selectedAgent.resources.cpu > 80 ? "bg-red-500" : selectedAgent.resources.cpu > 60 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${selectedAgent.resources.cpu}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Memory Usage</span>
                        <span>{selectedAgent.resources.memory}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            selectedAgent.resources.memory > 80 ? "bg-red-500" : selectedAgent.resources.memory > 60 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${selectedAgent.resources.memory}%` }}
                        />
                      </div>
                    </div>
                    {selectedAgent.resources.disk !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Disk Usage</span>
                          <span>{selectedAgent.resources.disk}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all",
                              selectedAgent.resources.disk > 80 ? "bg-red-500" : selectedAgent.resources.disk > 60 ? "bg-yellow-500" : "bg-green-500"
                            )}
                            style={{ width: `${selectedAgent.resources.disk}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm mb-2">Information</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="capitalize">{selectedAgent.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location</span>
                      <span>{selectedAgent.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uptime</span>
                      <span>{selectedAgent.uptime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Activity</span>
                      <span>{selectedAgent.lastActivity}</span>
                    </div>
                  </div>
                </div>
                
                {selectedAgent.tags && selectedAgent.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedAgent.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-0.5 bg-muted text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const newStatus = selectedAgent.status === 'running' ? 'stopped' : 'running'
                    setAgents(prev => prev.map(a => 
                      a.id === selectedAgent.id ? { ...a, status: newStatus } : a
                    ))
                    setSelectedAgent({ ...selectedAgent, status: newStatus })
                  }}
                >
                  {selectedAgent.status === 'running' ? (
                    <>
                      <Archive className="h-3 w-3" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    // Restart action
                    console.log('Restart agent', selectedAgent.id)
                  }}
                >
                  <Loader2 className="h-3 w-3" />
                  Restart
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}