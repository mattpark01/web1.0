import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Code, Search, BarChart, MessageSquare, Wrench } from "lucide-react";

interface SpawnAgentDialogProps {
  onBack: () => void;
  onComplete: () => void;
}

interface PreconfiguredAgent {
  agentId: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  hasAllTools: boolean;
  toolCount: number;
}

// Mock data - will be fetched from API
const FEATURED_AGENTS: PreconfiguredAgent[] = [
  {
    agentId: "claude.code",
    name: "Claude Code",
    tagline: "Your AI pair programmer",
    description: "General-purpose assistant with all tools",
    icon: "🚀",
    hasAllTools: true,
    toolCount: -1,
  },
  {
    agentId: "research.assistant",
    name: "Research Assistant",
    tagline: "Deep dive into any topic",
    description: "Specialized in gathering and synthesizing information",
    icon: "📚",
    hasAllTools: false,
    toolCount: 5,
  },
  {
    agentId: "data.analyst",
    name: "Data Analyst",
    tagline: "Transform data into insights",
    description: "Expert at analyzing data and creating visualizations",
    icon: "📊",
    hasAllTools: false,
    toolCount: 6,
  },
];

const TOOL_CATEGORIES = [
  { id: "information", name: "Information", icon: Search, description: "Search and gather data" },
  { id: "communication", name: "Communication", icon: MessageSquare, description: "Send messages" },
  { id: "analysis", name: "Analysis", icon: BarChart, description: "Analyze data" },
  { id: "development", name: "Development", icon: Code, description: "Write code" },
];

export function SpawnAgentDialogV2({
  onBack,
  onComplete,
}: SpawnAgentDialogProps) {
  const [mode, setMode] = useState<"select" | "custom">("select");
  const [selectedAgent, setSelectedAgent] = useState<PreconfiguredAgent | null>(null);
  const [customName, setCustomName] = useState("");
  const [task, setTask] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const handleSpawn = async () => {
    if (mode === "select" && selectedAgent) {
      // Spawn from preconfigured agent
      console.log("Spawning agent:", {
        baseAgent: selectedAgent.agentId,
        task: task,
      });
      // TODO: Call API to create agent instance
    } else if (mode === "custom") {
      // Create custom agent
      console.log("Creating custom agent:", {
        name: customName,
        task: task,
        toolCategories: selectedCategories,
      });
      // TODO: Call API to create custom agent
    }
    onComplete();
  };

  // Focus task input when agent is selected
  useEffect(() => {
    if (selectedAgent && taskInputRef.current) {
      setTimeout(() => taskInputRef.current?.focus(), 100);
    }
  }, [selectedAgent]);

  return (
    <div className="px-1">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 mt-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 bg-primary/10">
            <Bot className="h-3 w-3 text-primary" />
          </div>
          <h1 className="text-sm font-medium text-foreground">
            Spawn Agent
          </h1>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Esc
          </kbd>
          <span>to go back</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-2 pb-6">
        {!selectedAgent && mode === "select" ? (
          // Step 1: Choose an agent
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Choose an agent or create your own
            </div>

            {/* Featured Agents */}
            <div className="space-y-2">
              {FEATURED_AGENTS.map((agent) => (
                <button
                  key={agent.agentId}
                  onClick={() => setSelectedAgent(agent)}
                  className="w-full p-3 border rounded-lg hover:bg-accent/50 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{agent.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {agent.tagline}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {agent.hasAllTools ? (
                          <span className="text-primary">All tools available</span>
                        ) : (
                          <span>{agent.toolCount} specialized tools</span>
                        )}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </div>
                  </div>
                </button>
              ))}

              {/* Custom Agent Option */}
              <button
                onClick={() => setMode("custom")}
                className="w-full p-3 border border-dashed rounded-lg hover:bg-accent/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Create Custom Agent</div>
                    <div className="text-xs text-muted-foreground">
                      Build your own with selected tools
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : selectedAgent ? (
          // Step 2: Configure selected agent
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl">{selectedAgent.icon}</div>
              <div>
                <div className="font-medium">{selectedAgent.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedAgent.tagline}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                What do you need help with?
              </label>
              <input
                ref={taskInputRef}
                type="text"
                placeholder="Describe your task..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                The agent will use this context to help you better
              </p>
            </div>
          </div>
        ) : mode === "custom" ? (
          // Custom agent creation
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Agent name
              </label>
              <input
                type="text"
                placeholder="My Assistant"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                What should it help with?
              </label>
              <input
                type="text"
                placeholder="Describe the tasks..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Select capabilities
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TOOL_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCategories(prev => 
                            prev.filter(id => id !== category.id)
                          );
                        } else {
                          setSelectedCategories(prev => [...prev, category.id]);
                        }
                      }}
                      className={`p-2 border rounded-lg transition-colors ${
                        isSelected 
                          ? "bg-primary/10 border-primary" 
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{category.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (selectedAgent) {
              setSelectedAgent(null);
              setTask("");
            } else if (mode === "custom") {
              setMode("select");
              setCustomName("");
              setTask("");
              setSelectedCategories([]);
            } else {
              onBack();
            }
          }}
        >
          {selectedAgent || mode === "custom" ? "Back" : "Cancel"}
        </Button>
        <Button
          size="sm"
          onClick={handleSpawn}
          disabled={
            (mode === "select" && (!selectedAgent || !task.trim())) ||
            (mode === "custom" && (!customName.trim() || !task.trim()))
          }
        >
          Spawn Agent
        </Button>
      </div>
    </div>
  );
}