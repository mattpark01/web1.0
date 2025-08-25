import { useState, useRef, useEffect } from 'react';
import { NavigationProps } from '@/hooks/use-hierarchical-navigation';
import { DialogHeader } from '@/components/ui/hierarchical-dialog';
import { Button } from '@/components/ui/button';
import { Rocket, BookOpen, Loader2 } from 'lucide-react';
import { agentAPI } from '@/lib/agent-api';
import { useToast } from '@/hooks/use-toast';

export function ConfigureGeneralAgentView({ onComplete, onBack, data, level }: NavigationProps) {
  const [task, setTask] = useState('');
  const [isSpawning, setIsSpawning] = useState(false);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  
  const agentType = data?.agentType;
  const Icon = agentType?.icon || Rocket;

  useEffect(() => {
    // Focus prompt input on mount
    setTimeout(() => {
      promptInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSpawn = async () => {
    if (!task.trim()) return;

    setIsSpawning(true);
    try {
      // Map our agent type to the backend agent ID
      const agentIdMap: Record<string, string> = {
        'general': 'general.assistant',
        'research': 'research.assistant',
      };
      
      const agentId = agentIdMap[agentType?.id || 'general'] || 'general.assistant';
      
      // Execute the agent with the provided task
      const execution = await agentAPI.executeAgent({
        agentId: agentId,
        goal: task,
        stream: false, // For now, we'll use non-streaming
      });
      
      toast({
        title: "Agent Spawned",
        description: `${agentType?.name} is now working on your task`,
      });
      
      onComplete({ 
        success: true, 
        agent: agentType,
        task: task,
        executionId: execution.executionId,
      });
    } catch (error) {
      console.error('Failed to spawn agent:', error);
      toast({
        title: "Failed to spawn agent",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
      setIsSpawning(false);
    }
  };

  return (
    <div className="w-full">
      <DialogHeader 
        title={agentType?.name || 'Configure Agent'} 
        onBack={onBack}
        level={level}
      />
      
      <div className="px-4 pt-2 pb-6 space-y-4">
        {/* Agent Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="p-2 rounded-lg bg-background">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium">{agentType?.name}</div>
            <div className="text-xs text-muted-foreground">
              {agentType?.description}
            </div>
          </div>
        </div>

        {/* Task Input */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            What do you need help with?
          </label>
          <textarea
            ref={promptInputRef}
            placeholder="Describe your task..."
            value={task}
            onChange={(e) => {
              setTask(e.target.value);
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSpawn();
              }
            }}
            className="w-full min-h-[100px] max-h-[200px] px-3 py-2 text-sm border rounded-lg bg-transparent resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            The agent will use this context to better assist you
          </p>
        </div>

        {/* Agent Capabilities */}
        {agentType?.hasAllTools && (
          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-xs text-primary">
              This agent has access to all available tools and can help with any task
            </p>
          </div>
        )}
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
          onClick={handleSpawn}
          disabled={!task.trim() || isSpawning}
        >
          {isSpawning ? 'Spawning...' : 'Spawn Agent'}
        </Button>
      </div>
    </div>
  );
}