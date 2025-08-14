/**
 * Core types for action definitions
 * These match the agent-runtime ActionDefinition structure
 */

export interface ActionDefinition {
  // Identity
  id: string
  actionId: string  // e.g., "bank.send_money" or "bank.plaid.get_balance"
  platform: string  // e.g., "bank" (the app/category)
  provider: string  // "native" | "plaid" | "google" | etc.

  // Metadata
  name: string
  description: string
  icon?: string
  category?: 'primary' | 'secondary' | 'contextual'
  shortcut?: string

  // Execution
  executionType: 'direct' | 'agentic'
  requiresAuth: boolean
  requiresLLM: boolean
  agenticConfig?: AgenticConfig

  // Schema
  inputSchema?: any  // JSON Schema
  outputSchema?: any // JSON Schema

  // Additional metadata
  metadata?: Record<string, any>
  isActive: boolean
  
  // For integrations
  requiresIntegration?: string  // e.g., "google-calendar"
}

export interface AgenticConfig {
  requiresPlanning: boolean
  requiresConfirmation: boolean
  maxSteps: number
  systemPrompt: string
  tools?: string[]        // Available tools for the agent
  model?: string         // Specific LLM model to use
  temperature?: number   // LLM temperature
}

export interface ActionExecution {
  id: string
  userId: string
  actionId: string
  actionType: 'native' | 'integration'
  
  // Execution details
  inputData: any
  outputData?: any
  
  // Status tracking
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
  
  // Performance metrics
  executionTimeMs?: number
  llmTokensUsed?: number
  
  // Timestamps
  startedAt: Date
  completedAt?: Date
}

export interface ActionRegistry {
  native: Map<string, ActionDefinition>
  integrations: Map<string, ActionDefinition>
}

export interface UserAvailableTools {
  userId: string
  tools: ActionDefinition[]
  nativeTools: ActionDefinition[]
  integrationTools: ActionDefinition[]
}