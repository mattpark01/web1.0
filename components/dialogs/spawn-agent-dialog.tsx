import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bot, 
  ChevronDown, 
  Rocket, 
  BookOpen, 
  Plus,
  Search,
  MessageSquare,
  BarChart,
  Code,
  FileText,
  Globe,
  Database,
  Mail,
  Check
} from "lucide-react";
import { agentAPI } from "@/lib/agent-api";

interface SpawnAgentDialogProps {
  onBack: () => void;
  onComplete: () => void;
}


interface AgentType {
  agentId: string;
  name: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  hasAllTools: boolean;
}

// Available tools grouped by category
interface ToolCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tools: string[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    name: "Information",
    icon: Search,
    tools: ["web_search", "read_file", "summarize"]
  },
  {
    name: "Communication",
    icon: MessageSquare,
    tools: ["send_email", "send_slack", "draft_message"]
  },
  {
    name: "Data Analysis",
    icon: BarChart,
    tools: ["query_database", "analyze_csv", "create_chart"]
  },
  {
    name: "Development",
    icon: Code,
    tools: ["execute_code", "git_commit", "run_tests"]
  },
  {
    name: "Files",
    icon: FileText,
    tools: ["create_file", "edit_file", "delete_file"]
  }
];

// Minimal set of preconfigured agents
const AGENTS: AgentType[] = [
  {
    agentId: "claude.code",
    name: "General Assistant",
    tagline: "Access to all tools",
    icon: Rocket,
    hasAllTools: true,
  },
  {
    agentId: "research.assistant",
    name: "Research",
    tagline: "Information gathering",
    icon: BookOpen,
    hasAllTools: false,
  },
  {
    agentId: "custom",
    name: "Create New Agent",
    tagline: "Select your tools",
    icon: Plus,
    hasAllTools: false,
  },
];

export function SpawnAgentDialog({
  onBack,
  onComplete,
}: SpawnAgentDialogProps) {
  const [selectedType, setSelectedType] = useState<string>("claude.code");
  const [agentName, setAgentName] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [showToolSelector, setShowToolSelector] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const selectedAgent = AGENTS.find(a => a.agentId === selectedType);

  const handleSpawn = async () => {
    try {
      const baseAgent = selectedType === "custom" ? null : selectedType;
      
      // For preconfigured agents, we'll use them directly
      // For custom agents, we need to create them
      if (selectedType === "custom") {
        const agentId = agentName.toLowerCase().replace(/\s+/g, '.');
        await agentAPI.createAgent({
          agentId: `custom.${agentId}`,
          name: agentName,
          description: agentPrompt,
          systemPrompt: `You are ${agentName}. ${agentPrompt}`,
          allowedActions: selectedTools.length > 0 ? selectedTools : undefined, // Use selected tools or all if none selected
        });
      }
      
      // For now, just log the spawn action
      console.log("Spawning agent:", { 
        baseAgent,
        name: agentName || selectedAgent?.name,
        prompt: agentPrompt 
      });
      
      onComplete();
    } catch (error) {
      console.error("Failed to spawn agent:", error);
      // TODO: Show error to user
    }
  };

  // Focus the first input when the dialog opens with delay to prevent focus ring
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  // Focus appropriate input based on selected type
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedType === "custom" && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (promptInputRef.current) {
        promptInputRef.current.focus();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedType]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (agentPrompt.trim() || (selectedType === "custom" && agentName.trim())) {
          handleSpawn();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack, agentName, agentPrompt, selectedType]);

  return (
    <div
      className="px-1"
      onFocus={(e) => (e.target.style.outline = "none")}
      onBlur={(e) => (e.target.style.outline = "none")}
      style={{
        outline: "none !important",
        boxShadow: "none !important",
        WebkitAppearance: "none",
        MozAppearance: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 mt-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6  bg-primary/10">
            <Bot className="h-3 w-3 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-medium text-foreground">
              Spawn Agent
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Esc
          </kbd>
          <span>to go back</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-2 pb-6 space-y-3">
        {/* Agent Type Selector - Minimal dropdown */}
        <div className="space-y-2">
          <button
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {selectedAgent?.icon && <selectedAgent.icon className="h-4 w-4" />}
            <span>{selectedAgent?.name}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          
          {showTypeSelector && (
            <div className="absolute z-10 mt-1 py-1 bg-background border rounded-md shadow-sm">
              {AGENTS.map((agent) => (
                <button
                  key={agent.agentId}
                  onClick={() => {
                    setSelectedType(agent.agentId);
                    setShowTypeSelector(false);
                    if (agent.agentId !== "custom") {
                      setAgentName("");
                    }
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <agent.icon className="h-4 w-4" />
                  <span>{agent.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{agent.tagline}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom Agent Name and Tools (only for custom type) */}
        {selectedType === "custom" && (
          <>
            <div className="space-y-2">
              <input
                ref={nameInputRef}
                placeholder="Agent name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                onFocus={(e) => (e.target.style.outline = "none")}
                onBlur={(e) => (e.target.style.outline = "none")}
                className="h-12 w-full text-lg font-medium bg-transparent border-0 shadow-none px-0 placeholder:text-muted-foreground/60 text-foreground"
                style={{
                  outline: "none !important",
                  boxShadow: "none !important",
                  background: "transparent !important",
                  border: "none !important",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  WebkitTapHighlightColor: "transparent",
                  WebkitUserSelect: "text",
                }}
              />
            </div>

            {/* Tool Selection */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Select tools (optional)</div>
              <div className="space-y-2">
                {TOOL_CATEGORIES.map((category) => {
                  const CategoryIcon = category.icon;
                  const allSelected = category.tools.every(tool => selectedTools.includes(tool));
                  const someSelected = category.tools.some(tool => selectedTools.includes(tool));
                  
                  return (
                    <div key={category.name} className="space-y-1">
                      <button
                        onClick={() => {
                          if (allSelected) {
                            // Remove all tools from this category
                            setSelectedTools(prev => 
                              prev.filter(tool => !category.tools.includes(tool))
                            );
                          } else {
                            // Add all tools from this category
                            setSelectedTools(prev => [
                              ...prev.filter(tool => !category.tools.includes(tool)),
                              ...category.tools
                            ]);
                          }
                        }}
                        className="flex items-center gap-2 text-sm hover:text-foreground transition-colors w-full text-left"
                      >
                        <div className={`h-4 w-4 border rounded flex items-center justify-center ${
                          allSelected ? 'bg-primary border-primary' : someSelected ? 'bg-primary/50 border-primary' : ''
                        }`}>
                          {allSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <CategoryIcon className="h-4 w-4" />
                        <span>{category.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {category.tools.length} tools
                        </span>
                      </button>
                      
                      {/* Individual tools (hidden by default, can expand if needed) */}
                      {showToolSelector && (
                        <div className="ml-6 space-y-1">
                          {category.tools.map(tool => (
                            <button
                              key={tool}
                              onClick={() => {
                                if (selectedTools.includes(tool)) {
                                  setSelectedTools(prev => prev.filter(t => t !== tool));
                                } else {
                                  setSelectedTools(prev => [...prev, tool]);
                                }
                              }}
                              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full text-left"
                            >
                              <div className={`h-3 w-3 border rounded flex items-center justify-center ${
                                selectedTools.includes(tool) ? 'bg-primary border-primary' : ''
                              }`}>
                                {selectedTools.includes(tool) && <Check className="h-2 w-2 text-primary-foreground" />}
                              </div>
                              <span>{tool.replace(/_/g, ' ')}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedTools.length === 0 
                  ? "No tools selected - agent will have access to all tools" 
                  : `${selectedTools.length} tools selected`}
              </div>
            </div>
          </>
        )}

        {/* Task/Prompt Field */}
        <div className="space-y-3">
          <textarea
            ref={promptInputRef}
            placeholder={selectedType === "custom" ? "What should this agent help with?" : "What do you need help with?"}
            value={agentPrompt}
            onChange={(e) => {
              setAgentPrompt(e.target.value);
              // Auto-resize textarea
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.metaKey || e.ctrlKey)) {
                e.stopPropagation();
              }
            }}
            onFocus={(e) => (e.target.style.outline = "none")}
            onBlur={(e) => (e.target.style.outline = "none")}
            className="w-full min-h-[80px] max-h-[200px] px-0 py-2 text-sm border-0 shadow-none bg-transparent resize-none placeholder:text-muted-foreground/60 overflow-y-auto"
            style={{
              outline: "none !important",
              boxShadow: "none !important",
              background: "transparent !important",
              border: "none !important",
              WebkitAppearance: "none",
              MozAppearance: "none",
              WebkitTapHighlightColor: "transparent",
              WebkitUserSelect: "text",
              resize: "none",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
            rows={4}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-3 border-t border-border/50">
        <div></div>
        <Button
          size="lg"
          onClick={handleSpawn}
          disabled={
            !agentPrompt.trim() && 
            (selectedType !== "custom" || !agentName.trim())
          }
          className="text-xs"
        >
          Spawn Agent
        </Button>
      </div>
    </div>
  );
}
