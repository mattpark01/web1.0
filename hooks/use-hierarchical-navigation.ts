import { useState, useCallback, useEffect } from 'react';

export interface NavigationNode {
  id: string;
  level: number;
  component: React.ComponentType<NavigationProps>;
  props?: Record<string, any>;
  title?: string;
  parent?: string;
}

export interface NavigationProps {
  onNavigate: (nodeId: string, props?: any) => void;
  onBack: () => void;
  onComplete: (result?: any) => void;
  data?: any;
  level: number;
}

interface NavigationState {
  nodeId: string;
  props?: any;
}

export function useHierarchicalNavigation(initialNodeId?: string) {
  const [stack, setStack] = useState<NavigationState[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(initialNodeId || null);
  const [currentProps, setCurrentProps] = useState<any>(null);

  const navigate = useCallback((nodeId: string, props?: any) => {
    if (currentNodeId) {
      setStack(prev => [...prev, { nodeId: currentNodeId, props: currentProps }]);
    }
    setCurrentNodeId(nodeId);
    setCurrentProps(props);
  }, [currentNodeId, currentProps]);

  const back = useCallback(() => {
    if (stack.length > 0) {
      const previous = stack[stack.length - 1];
      setStack(prev => prev.slice(0, -1));
      setCurrentNodeId(previous.nodeId);
      setCurrentProps(previous.props);
      return true;
    }
    return false;
  }, [stack]);

  const reset = useCallback(() => {
    setStack([]);
    setCurrentNodeId(initialNodeId || null);
    setCurrentProps(null);
  }, [initialNodeId]);

  const getCurrentLevel = useCallback(() => {
    return stack.length + 1;
  }, [stack]);

  // Handle ESC key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        const navigatedBack = back();
        if (navigatedBack) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    // Only add listener if we have a current node (dialog is active)
    if (currentNodeId) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [currentNodeId, back]);

  return {
    currentNodeId,
    currentProps,
    stack,
    navigate,
    back,
    reset,
    getCurrentLevel,
    canGoBack: stack.length > 0,
  };
}