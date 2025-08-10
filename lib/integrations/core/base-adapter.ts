import { IntegrationAdapter, IntegrationConnection, IntegrationProvider, SyncOptions, SyncResult, FetchParams, WebhookSubscription } from './types'

export abstract class BaseIntegrationAdapter<TEntity = any> implements IntegrationAdapter<TEntity> {
  constructor(public provider: IntegrationProvider) {}

  // Abstract methods that must be implemented
  abstract authenticate(config: Record<string, any>): Promise<IntegrationConnection>
  abstract refreshToken(connection: IntegrationConnection): Promise<IntegrationConnection>
  abstract validateConnection(connection: IntegrationConnection): Promise<boolean>
  abstract sync(connection: IntegrationConnection, options?: SyncOptions): Promise<SyncResult>
  abstract fetch(connection: IntegrationConnection, params?: FetchParams): Promise<TEntity[]>
  abstract transformToInternal(externalData: any): TEntity
  abstract transformToExternal(internalData: TEntity): any

  // Optional methods with default implementations
  async revokeAccess(connection: IntegrationConnection): Promise<void> {
    // Default: mark connection as revoked in database
    connection.status = 'revoked'
  }

  async create(connection: IntegrationConnection, data: Partial<TEntity>): Promise<TEntity> {
    throw new Error(`Create operation not supported for ${this.provider.name}`)
  }

  async update(connection: IntegrationConnection, id: string, data: Partial<TEntity>): Promise<TEntity> {
    throw new Error(`Update operation not supported for ${this.provider.name}`)
  }

  async delete(connection: IntegrationConnection, id: string): Promise<void> {
    throw new Error(`Delete operation not supported for ${this.provider.name}`)
  }

  async subscribeWebhook(connection: IntegrationConnection, events: string[]): Promise<WebhookSubscription> {
    throw new Error(`Webhook subscriptions not supported for ${this.provider.name}`)
  }

  async unsubscribeWebhook(connection: IntegrationConnection, subscriptionId: string): Promise<void> {
    throw new Error(`Webhook unsubscribe not supported for ${this.provider.name}`)
  }

  async handleWebhook(connection: IntegrationConnection, payload: any): Promise<void> {
    throw new Error(`Webhook handling not supported for ${this.provider.name}`)
  }

  // Helper methods
  protected getAuthHeaders(connection: IntegrationConnection): Record<string, string> {
    const headers: Record<string, string> = {}
    
    if (connection.credentials.accessToken) {
      headers['Authorization'] = `${connection.credentials.tokenType || 'Bearer'} ${connection.credentials.accessToken}`
    } else if (connection.credentials.apiKey) {
      const authConfig = this.provider.auth.config as any
      if (authConfig.headerName) {
        headers[authConfig.headerName] = connection.credentials.apiKey
      } else {
        headers['X-API-Key'] = connection.credentials.apiKey
      }
    }
    
    return headers
  }

  protected async makeRequest<T = any>(
    connection: IntegrationConnection,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(endpoint, this.provider.api.baseUrl)
    
    const headers = {
      'Content-Type': 'application/json',
      ...this.provider.api.headers,
      ...this.getAuthHeaders(connection),
      ...options.headers,
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  protected async paginate<T = any>(
    connection: IntegrationConnection,
    endpoint: string,
    params: Record<string, any> = {},
    maxPages: number = 10
  ): Promise<T[]> {
    const results: T[] = []
    let page = 1
    let hasMore = true

    while (hasMore && page <= maxPages) {
      const response = await this.makeRequest<any>(connection, endpoint, {
        method: 'GET',
        // @ts-ignore
        params: { ...params, page, limit: 100 }
      })

      if (Array.isArray(response)) {
        results.push(...response)
        hasMore = response.length === 100
      } else if (response.data && Array.isArray(response.data)) {
        results.push(...response.data)
        hasMore = response.hasMore || response.data.length === 100
      } else {
        hasMore = false
      }

      page++
    }

    return results
  }
}