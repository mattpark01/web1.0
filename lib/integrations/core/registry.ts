import { IntegrationProvider, IntegrationAdapter } from './types'

export class IntegrationRegistry {
  private static instance: IntegrationRegistry
  private providers: Map<string, IntegrationProvider> = new Map()
  private adapters: Map<string, IntegrationAdapter> = new Map()

  private constructor() {}

  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry()
    }
    return IntegrationRegistry.instance
  }

  // Register a new integration provider
  register(provider: IntegrationProvider, adapter: IntegrationAdapter): void {
    if (this.providers.has(provider.slug)) {
      throw new Error(`Provider ${provider.slug} is already registered`)
    }

    this.providers.set(provider.slug, provider)
    this.adapters.set(provider.slug, adapter)

    console.log(`Registered integration: ${provider.name} (${provider.slug})`)
  }

  // Unregister a provider
  unregister(slug: string): void {
    this.providers.delete(slug)
    this.adapters.delete(slug)
  }

  // Get a specific provider
  getProvider(slug: string): IntegrationProvider | undefined {
    return this.providers.get(slug)
  }

  // Get a specific adapter
  getAdapter(slug: string): IntegrationAdapter | undefined {
    return this.adapters.get(slug)
  }

  // List all providers
  listProviders(): IntegrationProvider[] {
    return Array.from(this.providers.values())
  }

  // Search providers by category or features
  searchProviders(criteria: {
    category?: string
    features?: string[]
    isVerified?: boolean
  }): IntegrationProvider[] {
    let results = Array.from(this.providers.values())

    if (criteria.category) {
      results = results.filter(p => p.category === criteria.category)
    }

    if (criteria.features && criteria.features.length > 0) {
      results = results.filter(p => 
        criteria.features!.every(feature => p.features.includes(feature))
      )
    }

    if (criteria.isVerified !== undefined) {
      results = results.filter(p => p.isVerified === criteria.isVerified)
    }

    return results
  }

  // Get providers grouped by category
  getProvidersByCategory(): Record<string, IntegrationProvider[]> {
    const grouped: Record<string, IntegrationProvider[]> = {}

    for (const provider of this.providers.values()) {
      if (!grouped[provider.category]) {
        grouped[provider.category] = []
      }
      grouped[provider.category].push(provider)
    }

    return grouped
  }

  // Check if a provider supports specific features
  providerSupports(slug: string, features: string[]): boolean {
    const provider = this.providers.get(slug)
    if (!provider) return false

    return features.every(feature => provider.features.includes(feature))
  }

  // Get OAuth2 providers
  getOAuth2Providers(): IntegrationProvider[] {
    return Array.from(this.providers.values()).filter(
      p => p.auth.type === 'oauth2'
    )
  }

  // Clear all registrations (useful for testing)
  clear(): void {
    this.providers.clear()
    this.adapters.clear()
  }
}

// Export singleton instance
export const integrationRegistry = IntegrationRegistry.getInstance()