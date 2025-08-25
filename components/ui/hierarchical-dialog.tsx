import { motion, AnimatePresence } from 'framer-motion';
import { useHierarchicalNavigation, NavigationNode, NavigationProps } from '@/hooks/use-hierarchical-navigation';
import { useEffect } from 'react';

interface HierarchicalDialogProps {
  nodes: Map<string, NavigationNode>;
  initialNodeId: string;
  onComplete: (result?: any) => void;
  onExit: () => void;
}

export function HierarchicalDialog({
  nodes,
  initialNodeId,
  onComplete,
  onExit,
}: HierarchicalDialogProps) {
  const {
    currentNodeId,
    currentProps,
    navigate,
    back,
    reset,
    getCurrentLevel,
    canGoBack,
  } = useHierarchicalNavigation(initialNodeId);

  // Initialize with the initial node on mount
  useEffect(() => {
    reset();
  }, []);

  // Handle navigation
  const handleNavigate = (nodeId: string, props?: any) => {
    if (nodes.has(nodeId)) {
      navigate(nodeId, props);
    } else {
      console.error(`Navigation node "${nodeId}" not found`);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    const wentBack = back();
    if (!wentBack) {
      // If we can't go back anymore, exit the dialog
      onExit();
    }
  };

  // Handle ESC key to exit when at top level
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !canGoBack && !e.defaultPrevented) {
        e.preventDefault();
        e.stopPropagation();
        onExit();
      }
    };

    // Add listener with capture phase to handle before inner navigation
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [canGoBack, onExit]);

  // Handle completion
  const handleComplete = (result?: any) => {
    onComplete(result);
    reset();
  };

  // Get current node
  const currentNode = currentNodeId ? nodes.get(currentNodeId) : null;
  if (!currentNode) {
    return null;
  }

  const Component = currentNode.component;
  const level = getCurrentLevel();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentNodeId}
        initial={{ opacity: 0, x: level > 1 ? 20 : 0 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: level > 1 ? -20 : 0 }}
        transition={{ 
          duration: 0.15,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="w-full"
      >
        <Component
          onNavigate={handleNavigate}
          onBack={handleBack}
          onComplete={handleComplete}
          data={currentProps}
          level={level}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// Header component for consistent navigation UI
interface DialogHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  level?: number;
}

export function DialogHeader({ title, onBack, showBack = true, level = 1 }: DialogHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 mt-1">
      <div className="flex items-center gap-2">
        {level > 1 && showBack && (
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ←
          </button>
        )}
        <h1 className="text-sm font-medium text-foreground">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          Esc
        </kbd>
        <span>to go back</span>
      </div>
    </div>
  );
}