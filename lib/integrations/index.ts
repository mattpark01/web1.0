import { integrationRegistry } from './core/registry'
import { googleCalendarProvider, googleCalendarAdapter } from './providers/google-calendar'

// Initialize and register all integration providers
export function initializeIntegrations() {
  // Register Google Calendar
  integrationRegistry.register(googleCalendarProvider, googleCalendarAdapter)
  
  // Add more providers here as they are implemented
  // Example:
  // integrationRegistry.register(slackProvider, slackAdapter)
  // integrationRegistry.register(notionProvider, notionAdapter)
  // integrationRegistry.register(githubProvider, githubAdapter)
  
  console.log('Integrations initialized:', integrationRegistry.listProviders().map(p => p.slug))
}

// Export registry and types for use across the app
export { integrationRegistry } from './core/registry'
export * from './core/types'
export { OAuth2Client } from './core/oauth2-client'
export { BaseIntegrationAdapter } from './core/base-adapter'

// Call initialization (you might want to do this in your app initialization)
if (typeof window === 'undefined') {
  // Server-side only
  initializeIntegrations()
}