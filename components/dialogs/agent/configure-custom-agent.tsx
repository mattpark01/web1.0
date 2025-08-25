import { useState, useRef, useEffect } from 'react';
import { NavigationProps } from '@/hooks/use-hierarchical-navigation';
import { DialogHeader } from '@/components/ui/hierarchical-dialog';
import { Button } from '@/components/ui/button';
import { 
  Check,
  Search,
  MessageSquare,
  BarChart,
  Code,
  FileText,
  Loader2,
} from 'lucide-react';
import { agentAPI } from '@/lib/agent-api';
import { useToast } from '@/hooks/use-toast';

interface ToolCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tools: string[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    name: 'Information',
    icon: Search,
    tools: ['web_search', 'read_file', 'summarize'],
  },
  {
    name: 'Communication',
    icon: MessageSquare,
    tools: ['send_email', 'send_slack', 'draft_message'],
  },
  {
    name: 'Data Analysis',
    icon: BarChart,
    tools: ['query_database', 'analyze_csv', 'create_chart'],
  },
  {
    name: 'Development',
    icon: Code,
    tools: ['execute_code', 'git_commit', 'run_tests'],
  },
  {
    name: 'Files',
    icon: FileText,
    tools: ['create_file', 'edit_file', 'delete_file'],
  },
];

export function ConfigureCustomAgentView({ onComplete, onBack, data, level }: NavigationProps) {
  const [agentName, setAgentName] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [focusedToolIndex, setFocusedToolIndex] = useState(-1);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const toolRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Focus name input on mount
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  }, []);

  const handleCreate = async () => {
    if (!agentName.trim() || !agentPrompt.trim()) return;

    setIsCreating(true);
    try {
      const agentId = agentName.toLowerCase().replace(/\s+/g, '.');
      await agentAPI.createAgent({
        agentId: `custom.${agentId}`,
        name: agentName,
        description: agentPrompt,
        systemPrompt: `You are ${agentName}. ${agentPrompt}`,
        allowedActions: selectedTools.length > 0 ? selectedTools : undefined,
      });
      
      toast({
        title: "Agent Created",
        description: `${agentName} has been created successfully`,
      });
      
      onComplete({ 
        success: true, 
        agent: { name: agentName, id: `custom.${agentId}` } 
      });
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast({
        title: "Failed to create agent",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };

  const toggleCategory = (category: ToolCategory) => {
    const allSelected = category.tools.every(tool => selectedTools.includes(tool));
    
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
  };

  return (
    <div className="w-full">
      <DialogHeader 
        title="Create New Agent" 
        onBack={onBack}
        level={level}
      />
      
      <div className="px-4 pt-2 pb-6 space-y-4">
        {/* Agent Name */}
        <div>
          <input
            ref={nameInputRef}
            type="text"
            placeholder="Agent name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full h-12 text-lg font-medium bg-transparent border-0 shadow-none px-0 placeholder:text-muted-foreground/60 text-foreground focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <textarea
            placeholder="What should this agent help with?"
            value={agentPrompt}
            onChange={(e) => {
              setAgentPrompt(e.target.value);
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
            className="w-full min-h-[60px] max-h-[120px] px-0 py-2 text-sm border-0 shadow-none bg-transparent resize-none placeholder:text-muted-foreground/60 focus:outline-none"
            rows={3}
          />
        </div>

        {/* Tool Selection */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Select tools (optional)</div>
          <div className="bg-muted/30 rounded-lg p-1">
            {TOOL_CATEGORIES.map((category, index) => {
              const CategoryIcon = category.icon;
              const allSelected = category.tools.every(tool => selectedTools.includes(tool));
              const someSelected = category.tools.some(tool => selectedTools.includes(tool));
              const isFocused = index === focusedToolIndex;
              
              return (
                <button
                  key={category.name}
                  ref={el => {toolRefs.current[index] = el}}
                  onClick={() => toggleCategory(category)}
                  onMouseEnter={() => setFocusedToolIndex(index)}
                  onMouseLeave={() => setFocusedToolIndex(-1)}
                  className={`
                    flex items-center gap-2.5 text-sm w-full text-left px-2.5 py-2 rounded-md
                    transition-all
                    ${isFocused ? 'bg-background shadow-sm' : 'hover:bg-background/50'}
                  `}
                >
                  <div className={`
                    h-4 w-4 border-2 rounded-sm flex items-center justify-center transition-all
                    ${allSelected 
                      ? 'bg-primary border-primary' 
                      : someSelected 
                        ? 'bg-primary/30 border-primary' 
                        : 'border-muted-foreground/30'
                    }
                  `}>
                    {(allSelected || someSelected) && (
                      <Check className={`h-2.5 w-2.5 ${allSelected ? 'text-primary-foreground' : 'text-primary'}`} />
                    )}
                  </div>
                  <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1">{category.name}</span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {category.tools.length}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground px-1">
            {selectedTools.length === 0 
              ? 'All tools enabled by default' 
              : `${selectedTools.length} tool${selectedTools.length === 1 ? '' : 's'} selected`}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!agentName.trim() || !agentPrompt.trim() || isCreating}
        >
          {isCreating ? 'Creating...' : 'Create Agent'}
        </Button>
      </div>
    </div>
  );
}