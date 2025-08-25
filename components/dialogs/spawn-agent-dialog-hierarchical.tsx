import { useEffect } from 'react';
import { Bot } from 'lucide-react';
import { HierarchicalDialog } from '@/components/ui/hierarchical-dialog';
import { navigationRegistry, createNode } from '@/lib/navigation-registry';
import { SelectAgentTypeView } from './agent/select-agent-type';
import { ConfigureGeneralAgentView } from './agent/configure-general-agent';
import { ConfigureCustomAgentView } from './agent/configure-custom-agent';

interface SpawnAgentDialogProps {
  onBack: () => void;
  onComplete: () => void;
}

// Register the agent creation flow
const registerAgentFlow = () => {
  const flow = navigationRegistry.createFlow('spawn-agent', 'Spawn Agent')
    .setIcon(Bot)
    .setDescription('Create or spawn an AI agent')
    .addNode(createNode('select-type', SelectAgentTypeView, {
      level: 1,
      title: 'Select Agent Type',
    }))
    .addNode(createNode('configure-general', ConfigureGeneralAgentView, {
      level: 2,
      title: 'Configure Agent',
      parent: 'select-type',
    }))
    .addNode(createNode('configure-research', ConfigureGeneralAgentView, {
      level: 2,
      title: 'Configure Research Agent',
      parent: 'select-type',
    }))
    .addNode(createNode('configure-custom', ConfigureCustomAgentView, {
      level: 2,
      title: 'Create New Agent',
      parent: 'select-type',
    }))
    .setInitialNode('select-type')
    .build();

  navigationRegistry.register('spawn-agent', flow);
};

// Ensure flow is registered
registerAgentFlow();

export function SpawnAgentDialogHierarchical({
  onBack,
  onComplete,
}: SpawnAgentDialogProps) {
  const flow = navigationRegistry.getFlow('spawn-agent');

  if (!flow) {
    console.error('Agent spawn flow not registered');
    return null;
  }

  const handleComplete = (result?: any) => {
    console.log('Agent creation completed:', result);
    onComplete();
  };

  return (
    <HierarchicalDialog
      nodes={flow.nodes}
      initialNodeId={flow.initialNodeId}
      onComplete={handleComplete}
      onExit={onBack}
    />
  );
}