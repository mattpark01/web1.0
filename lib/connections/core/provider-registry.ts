/**
 * Provider Registry - Central registry for all connection providers
 * This allows dynamic provider loading and easy extension
 */

import { ConnectionProvider } from './types'

export class ProviderRegistry {
  private static instance: ProviderRegistry
  private providers = new Map<string, ConnectionProvider>()
  private categories = new Set<string>()
  
  private constructor() {
    // Load built-in providers
    this.loadBuiltInProviders()
    
    // Load providers from catalog (async, so it happens after)
    this.loadFromCatalog().catch(console.error)
  }
  
  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry()
    }
    return ProviderRegistry.instance
  }
  
  /**
   * Register a new provider
   */
  register(provider: ConnectionProvider): void {
    this.providers.set(provider.id, provider)
    this.categories.add(provider.category)
  }
  
  /**
   * Get a provider by ID
   */
  get(providerId: string): ConnectionProvider | undefined {
    return this.providers.get(providerId)
  }
  
  /**
   * Get all providers
   */
  getAll(): ConnectionProvider[] {
    return Array.from(this.providers.values())
  }
  
  /**
   * Get providers by category
   */
  getByCategory(category: string): ConnectionProvider[] {
    return this.getAll().filter(p => p.category === category)
  }
  
  /**
   * Get providers by auth type
   */
  getByAuthType(authType: 'oauth2' | 'api_key' | 'basic_auth'): ConnectionProvider[] {
    return this.getAll().filter(p => p.authType === authType)
  }
  
  /**
   * Search providers
   */
  search(query: string): ConnectionProvider[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.id.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    )
  }
  
  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories)
  }
  
  /**
   * Load providers from database catalog
   */
  private async loadFromCatalog(): Promise<void> {
    try {
      // Dynamic import to avoid circular dependency
      const { prisma } = await import('@/lib/prisma')
      
      const catalogEntries = await prisma.integrationCatalog.findMany({
        where: { status: 'available' }
      })
      
      for (const entry of catalogEntries) {
        // Skip if we already have this provider from built-ins
        if (this.providers.has(entry.provider)) {
          continue
        }
        
        // Convert catalog entry to ConnectionProvider
        const provider: ConnectionProvider = {
          id: entry.provider,
          name: entry.name,
          category: entry.category || 'other',
          authType: (entry.authType as any) || 'oauth2',
          logoUrl: entry.iconUrl || undefined,
          documentation: entry.documentationUrl || undefined
        }
        
        // Add required scopes for OAuth2 providers
        if (entry.authType === 'oauth2' && entry.requiredScopes?.length) {
          // We'll need to get OAuth config from a different source
          // For now, just track that this is an OAuth2 provider
        }
        
        this.register(provider)
      }
    } catch (error) {
      console.warn('Failed to load providers from catalog:', error)
    }
  }

  /**
   * Load built-in providers
   */
  private loadBuiltInProviders(): void {
    // Google Calendar
    this.register({
      id: 'google-calendar',
      name: 'Google Calendar',
      category: 'calendar',
      authType: 'oauth2',
      logoUrl: 'https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png',
      documentation: 'https://developers.google.com/calendar',
      oauth2: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        revokeUrl: 'https://oauth2.googleapis.com/revoke',
        scopes: ['https://www.googleapis.com/auth/calendar'],
        authParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        userInfoMapping: {
          id: 'id',
          email: 'email',
          name: 'name',
        },
      },
      rateLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 600,
        requestsPerDay: 1000000,
      },
      healthCheck: {
        endpoint: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        expectedStatus: [200],
      },
    })
    
    // GitHub
    this.register({
      id: 'github',
      name: 'GitHub',
      category: 'code',
      authType: 'oauth2',
      logoUrl: 'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png',
      documentation: 'https://docs.github.com',
      oauth2: {
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        scopes: ['repo', 'user:email'],
        userInfoMapping: {
          id: (data: any) => data.id.toString(),
          email: 'email',
          name: 'name',
        },
      },
      rateLimits: {
        requestsPerHour: 5000,
      },
      healthCheck: {
        endpoint: 'https://api.github.com/user',
        expectedStatus: [200],
      },
      webhooks: {
        supportsWebhooks: true,
        events: ['push', 'pull_request', 'issues', 'release'],
        signatureHeader: 'X-Hub-Signature-256',
        signatureAlgorithm: 'hmac-sha256',
      },
    })
    
    // Linear
    this.register({
      id: 'linear',
      name: 'Linear',
      category: 'tasks',
      authType: 'oauth2',
      logoUrl: 'https://linear.app/favicon.ico',
      documentation: 'https://developers.linear.app',
      oauth2: {
        authUrl: 'https://linear.app/oauth/authorize',
        tokenUrl: 'https://api.linear.app/oauth/token',
        scopes: ['read', 'write'],
        userInfoMapping: {
          id: 'id',
          email: 'email',
          name: 'name',
        },
      },
      rateLimits: {
        requestsPerMinute: 1000,
        requestsPerHour: 30000,
      },
      webhooks: {
        supportsWebhooks: true,
        events: ['Issue', 'Project', 'Comment'],
        signatureHeader: 'Linear-Signature',
        signatureAlgorithm: 'hmac-sha256',
      },
    })
    
    // Plaid
    this.register({
      id: 'plaid',
      name: 'Plaid',
      category: 'banking',
      authType: 'oauth2',
      logoUrl: 'https://plaid.com/assets/img/company/thumbnail.png',
      documentation: 'https://plaid.com/docs',
      oauth2: {
        authUrl: 'https://cdn.plaid.com/link/v2/stable/link.html',
        tokenUrl: 'https://production.plaid.com/item/public_token/exchange',
        scopes: ['transactions', 'accounts', 'identity'],
      },
      rateLimits: {
        requestsPerMinute: 120,
        requestsPerDay: 15000,
      },
    })
    
    // Gmail
    this.register({
      id: 'gmail',
      name: 'Gmail',
      category: 'email',
      authType: 'oauth2',
      logoUrl: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
      documentation: 'https://developers.google.com/gmail',
      oauth2: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
        ],
        authParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        userInfoMapping: {
          id: 'id',
          email: 'email',
          name: 'name',
        },
      },
      rateLimits: {
        requestsPerSecond: 25,
        requestsPerDay: 1000000000,
      },
      healthCheck: {
        endpoint: 'https://www.googleapis.com/gmail/v1/users/me/profile',
        expectedStatus: [200],
      },
    })
    
    // Notion
    this.register({
      id: 'notion',
      name: 'Notion',
      category: 'notes',
      authType: 'oauth2',
      logoUrl: 'https://www.notion.so/images/favicon.ico',
      documentation: 'https://developers.notion.com',
      oauth2: {
        authUrl: 'https://api.notion.com/v1/oauth/authorize',
        tokenUrl: 'https://api.notion.com/v1/oauth/token',
        scopes: [],
        authParams: {
          owner: 'user',
        },
      },
      rateLimits: {
        requestsPerSecond: 3,
      },
      healthCheck: {
        endpoint: 'https://api.notion.com/v1/users/me',
        expectedStatus: [200],
      },
    })
    
    // Slack
    this.register({
      id: 'slack',
      name: 'Slack',
      category: 'communication',
      authType: 'oauth2',
      logoUrl: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
      documentation: 'https://api.slack.com',
      oauth2: {
        authUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        scopes: ['chat:write', 'channels:read', 'users:read'],
      },
      rateLimits: {
        requestsPerMinute: 60,
      },
      webhooks: {
        supportsWebhooks: true,
        events: ['message', 'app_mention', 'reaction_added'],
        signatureHeader: 'X-Slack-Signature',
        signatureAlgorithm: 'hmac-sha256',
      },
    })
    
    // Add more providers as needed...
  }
}

// Export singleton instance
export const providerRegistry = ProviderRegistry.getInstance()