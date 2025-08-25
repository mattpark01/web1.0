import { useState, useEffect, useRef } from 'react';
import { NavigationProps } from '@/hooks/use-hierarchical-navigation';
import { DialogHeader } from '@/components/ui/hierarchical-dialog';
import { Rocket, BookOpen, Plus } from 'lucide-react';

interface AgentType {
  id: string;
  nodeId: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  hasAllTools: boolean;
}

const AGENT_TYPES: AgentType[] = [
  {
    id: 'general',
    nodeId: 'configure-general',
    name: 'General Assistant',
    description: 'Access to all available tools',
    icon: Rocket,
    hasAllTools: true,
  },
  {
    id: 'research',
    nodeId: 'configure-research',
    name: 'Research Assistant',
    description: 'Specialized in information gathering',
    icon: BookOpen,
    hasAllTools: false,
  },
  {
    id: 'custom',
    nodeId: 'configure-custom',
    name: 'Create New Agent',
    description: 'Define your own agent with custom tools',
    icon: Plus,
    hasAllTools: false,
  },
];

export function SelectAgentTypeView({ onNavigate, onBack, level }: NavigationProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleSelect = (type: AgentType) => {
    onNavigate(type.nodeId, { agentType: type });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % AGENT_TYPES.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + AGENT_TYPES.length) % AGENT_TYPES.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(AGENT_TYPES[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onNavigate]);

  // Focus selected item
  useEffect(() => {
    itemRefs.current[selectedIndex]?.focus();
  }, [selectedIndex]);

  return (
    <div className="w-full">
      <DialogHeader 
        title="Select Agent Type" 
        onBack={onBack}
        showBack={level > 1}
        level={level}
      />
      
      <div className="px-2 pt-1 pb-2">
        {AGENT_TYPES.map((type, index) => {
          const Icon = type.icon;
          const isSelected = index === selectedIndex;
          
          return (
            <button
              key={type.id}
              ref={el => {itemRefs.current[index] = el}}
              onClick={() => handleSelect(type)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full px-3 py-2.5 text-left rounded-md transition-all
                flex items-center gap-3 group relative
                ${isSelected 
                  ? 'bg-accent text-accent-foreground' 
                  : 'hover:bg-accent/50 text-foreground'
                }
              `}
            >
              <div className={`
                p-1.5 rounded-md transition-colors
                ${isSelected ? 'bg-background/10' : 'bg-muted'}
              `}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{type.name}</div>
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  {type.description}
                </div>
              </div>
              {isSelected && (
                <div className="text-xs text-muted-foreground">
                  ⏎
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="px-3 pb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
        <span>Navigate</span>
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⏎</kbd>
        <span>Select</span>
      </div>
    </div>
  );
}