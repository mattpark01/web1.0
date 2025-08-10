// Core types for the flexible integration system

export type AuthType = 'oauth2' | 'oauth1' | 'api_key' | 'basic' | 'custom'
export type IntegrationCategory = 'calendar' | 'email' | 'task' | 'storage' | 'communication' | 'notes' | 'development' | 'analytics' | 'crm' | 'custom'
export type ConnectionStatus = 'active' | 'inactive' | 'error' | 'expired' | 'revoked'

// OAuth2 configuration
export interface OAuth2Config {
  authorizationUrl: string
  tokenUrl: string
  clientId?: string // Can be set at runtime from env
  clientSecret?: string // Can be set at runtime from env
  redirectUri?: string // Can be set at runtime
  scopes: string[]
  responseType?: 'code' | 'token'
  accessType?: 'offline' | 'online'
  grantType?: 'authorization_code' | 'client_credentials' | 'password' | 'refresh_token'
  pkce?: boolean // For public clients
  state?: string // For CSRF protection
}

// API Key configuration
export interface ApiKeyConfig {
  headerName?: string // Default: 'X-API-Key'
  queryParam?: string // Alternative: pass as query parameter
  placement?: 'header' | 'query' | 'body'
}

// Provider definition - this is what gets registered
export interface IntegrationProvider {
  slug: string // Unique identifier like 'google-calendar'
  name: string // Display name
  description?: string
  iconUrl?: string
  category: IntegrationCategory
  
  auth: {
    type: AuthType
    config: OAuth2Config | ApiKeyConfig | Record<string, any>
  }
  
  api: {
    baseUrl: string
    version?: string
    headers?: Record<string, string>
    rateLimit?: {
      requests: number
      period: number // in seconds
    }
  }
  
  features: string[] // ['sync', 'webhooks', 'realtime', 'create', 'update', 'delete']
  
  endpoints?: Record<string, EndpointDefinition>
  dataMappings?: Record<string, DataMapping>
  
  documentationUrl?: string
  isVerified?: boolean
}

export interface EndpointDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description?: string
  parameters?: Record<string, any>
  headers?: Record<string, string>
  paginated?: boolean
  rateLimit?: {
    requests: number
    period: number
  }
}

export interface DataMapping {
  externalField: string
  internalField: string
  transform?: (value: any) => any
  required?: boolean
}

// User's connection to a provider
export interface IntegrationConnection {
  id: string
  userId: string
  providerId: string
  provider?: IntegrationProvider
  
  connectionName?: string
  accountId?: string
  accountEmail?: string
  
  credentials: {
    accessToken?: string
    refreshToken?: string
    apiKey?: string
    expiresAt?: Date
    tokenType?: string
    scopes?: string[]
    raw?: Record<string, any>
  }
  
  status: ConnectionStatus
  errorMessage?: string
  
  syncEnabled: boolean
  syncFrequency?: number // in minutes
  lastSyncAt?: Date
  nextSyncAt?: Date
  
  metadata?: Record<string, any>
  webhookUrl?: string
  webhookSecret?: string
  
  createdAt: Date
  updatedAt: Date
}

// Sync operation result
export interface SyncResult {
  success: boolean
  itemsProcessed: number
  itemsCreated: number
  itemsUpdated: number
  itemsDeleted: number
  itemsFailed: number
  errors?: Array<{
    item: any
    error: string
  }>
  metadata?: Record<string, any>
}

// Webhook subscription
export interface WebhookSubscription {
  id: string
  connectionId: string
  webhookId?: string // External webhook ID
  events: string[]
  callbackUrl: string
  secret?: string
  isActive: boolean
  verifiedAt?: Date
  lastReceivedAt?: Date
  failureCount: number
}

// Base adapter interface that all integrations must implement
export interface IntegrationAdapter<TEntity = any> {
  provider: IntegrationProvider
  
  // Authentication
  authenticate(config: Record<string, any>): Promise<IntegrationConnection>
  refreshToken(connection: IntegrationConnection): Promise<IntegrationConnection>
  revokeAccess(connection: IntegrationConnection): Promise<void>
  validateConnection(connection: IntegrationConnection): Promise<boolean>
  
  // Data operations
  sync(connection: IntegrationConnection, options?: SyncOptions): Promise<SyncResult>
  fetch(connection: IntegrationConnection, params?: FetchParams): Promise<TEntity[]>
  create?(connection: IntegrationConnection, data: Partial<TEntity>): Promise<TEntity>
  update?(connection: IntegrationConnection, id: string, data: Partial<TEntity>): Promise<TEntity>
  delete?(connection: IntegrationConnection, id: string): Promise<void>
  
  // Webhook management
  subscribeWebhook?(connection: IntegrationConnection, events: string[]): Promise<WebhookSubscription>
  unsubscribeWebhook?(connection: IntegrationConnection, subscriptionId: string): Promise<void>
  handleWebhook?(connection: IntegrationConnection, payload: any): Promise<void>
  
  // Data transformation
  transformToInternal(externalData: any): TEntity
  transformToExternal(internalData: TEntity): any
}

export interface SyncOptions {
  fullSync?: boolean
  since?: Date
  entityTypes?: string[]
  limit?: number
}

export interface FetchParams {
  id?: string
  filters?: Record<string, any>
  sort?: string
  limit?: number
  offset?: number
  since?: Date
  until?: Date
}