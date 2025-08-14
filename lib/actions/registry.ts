import { ActionDefinition, ActionRegistry, UserAvailableTools } from './types'
import { prisma } from '@/lib/prisma'

// Import native actions
import { calendarActions } from './native/calendar/actions'
import { taskActions } from './native/tasks/actions'

// Import integration actions
import { googleCalendarActions } from './integrations/google-calendar/actions'

/**
 * Central registry for all action definitions
 */
class ActionRegistryImpl implements ActionRegistry {
  native: Map<string, ActionDefinition>
  integrations: Map<string, ActionDefinition>

  constructor() {
    this.native = new Map()
    this.integrations = new Map()
    this.initialize()
  }

  private initialize() {
    // Register native actions
    this.registerNativeActions('calendar', calendarActions)
    this.registerNativeActions('tasks', taskActions)
    
    // Register integration actions
    this.registerIntegrationActions('google-calendar', googleCalendarActions)
  }

  private registerNativeActions(platform: string, actions: ActionDefinition[]) {
    actions.forEach(action => {
      this.native.set(action.actionId, action)
    })
  }

  private registerIntegrationActions(provider: string, actions: ActionDefinition[]) {
    actions.forEach(action => {
      this.integrations.set(action.actionId, action)
    })
  }

  /**
   * Get all available actions for a user based on their integrations
   */
  async getUserAvailableTools(userId: string): Promise<UserAvailableTools> {
    // Get all native actions
    const nativeTools = Array.from(this.native.values()).filter(action => action.isActive)

    // Get user's active integrations
    const userIntegrations = await prisma.integration.findMany({
      where: {
        userId,
        status: 'ACTIVE'
      },
      select: {
        provider: true
      }
    })

    // Map integration providers to their actions
    const integrationTools: ActionDefinition[] = []
    
    userIntegrations.forEach(integration => {
      // Convert provider enum to integration key (e.g., GOOGLE_CALENDAR -> google-calendar)
      const providerKey = integration.provider.toLowerCase().replace('_', '-')
      
      // Get actions for this integration
      this.integrations.forEach(action => {
        if (action.requiresIntegration === providerKey && action.isActive) {
          integrationTools.push(action)
        }
      })
    })

    return {
      userId,
      tools: [...nativeTools, ...integrationTools],
      nativeTools,
      integrationTools
    }
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): ActionDefinition | undefined {
    return this.native.get(actionId) || this.integrations.get(actionId)
  }

  /**
   * Get all actions for a platform
   */
  getPlatformActions(platform: string): ActionDefinition[] {
    const actions: ActionDefinition[] = []
    
    this.native.forEach(action => {
      if (action.platform === platform) {
        actions.push(action)
      }
    })
    
    this.integrations.forEach(action => {
      if (action.platform === platform) {
        actions.push(action)
      }
    })
    
    return actions
  }

  /**
   * Check if user has access to an action
   */
  async userHasAccess(userId: string, actionId: string): Promise<boolean> {
    const action = this.getAction(actionId)
    if (!action) return false

    // Native actions are always available (with auth)
    if (action.provider === 'native') {
      return true
    }

    // Check if user has the required integration
    if (action.requiresIntegration) {
      const integration = await prisma.integration.findFirst({
        where: {
          userId,
          provider: action.requiresIntegration.toUpperCase().replace('-', '_'),
          status: 'ACTIVE'
        }
      })
      return !!integration
    }

    return false
  }
}

// Export singleton instance
export const actionRegistry = new ActionRegistryImpl()

// Export helper functions
export async function getUserAvailableTools(userId: string): Promise<UserAvailableTools> {
  return actionRegistry.getUserAvailableTools(userId)
}

export function getAction(actionId: string): ActionDefinition | undefined {
  return actionRegistry.getAction(actionId)
}

export async function userHasAccess(userId: string, actionId: string): Promise<boolean> {
  return actionRegistry.userHasAccess(userId, actionId)
}