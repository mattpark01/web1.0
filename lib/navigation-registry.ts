import { NavigationNode } from '@/hooks/use-hierarchical-navigation';
import React from 'react';

export interface NavigationFlow {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  nodes: Map<string, NavigationNode>;
  initialNodeId: string;
  description?: string;
}

class NavigationRegistry {
  private static instance: NavigationRegistry;
  private flows: Map<string, NavigationFlow> = new Map();

  private constructor() {}

  static getInstance(): NavigationRegistry {
    if (!NavigationRegistry.instance) {
      NavigationRegistry.instance = new NavigationRegistry();
    }
    return NavigationRegistry.instance;
  }

  register(flowId: string, flow: NavigationFlow) {
    this.flows.set(flowId, flow);
  }

  unregister(flowId: string) {
    this.flows.delete(flowId);
  }

  getFlow(flowId: string): NavigationFlow | undefined {
    return this.flows.get(flowId);
  }

  getAllFlows(): NavigationFlow[] {
    return Array.from(this.flows.values());
  }

  hasFlow(flowId: string): boolean {
    return this.flows.has(flowId);
  }

  // Helper to create a flow with builder pattern
  createFlow(id: string, name: string) {
    return new FlowBuilder(id, name);
  }
}

// Flow builder for easier flow creation
export class FlowBuilder {
  private flow: NavigationFlow;
  private nodes: Map<string, NavigationNode> = new Map();

  constructor(id: string, name: string) {
    this.flow = {
      id,
      name,
      icon: () => null,
      nodes: new Map(),
      initialNodeId: '',
    };
  }

  setIcon(icon: React.ComponentType<{ className?: string }>) {
    this.flow.icon = icon;
    return this;
  }

  setDescription(description: string) {
    this.flow.description = description;
    return this;
  }

  addNode(node: NavigationNode) {
    this.nodes.set(node.id, node);
    if (!this.flow.initialNodeId && node.level === 1) {
      this.flow.initialNodeId = node.id;
    }
    return this;
  }

  setInitialNode(nodeId: string) {
    this.flow.initialNodeId = nodeId;
    return this;
  }

  build(): NavigationFlow {
    this.flow.nodes = this.nodes;
    if (!this.flow.initialNodeId && this.nodes.size > 0) {
      // Use the first node as initial if not set
      this.flow.initialNodeId = Array.from(this.nodes.keys())[0];
    }
    return this.flow;
  }
}

// Export singleton instance
export const navigationRegistry = NavigationRegistry.getInstance();

// Helper to create a navigation node
export function createNode(
  id: string,
  component: React.ComponentType<any>,
  options?: {
    level?: number;
    title?: string;
    parent?: string;
    props?: Record<string, any>;
  }
): NavigationNode {
  return {
    id,
    component,
    level: options?.level ?? 1,
    title: options?.title,
    parent: options?.parent,
    props: options?.props,
  };
}