/**
 * Core types for the connection system
 * Shared between web and CLI
 */

export interface ConnectionProvider {
  id: string
  name: string
  category: string
  authType: 'oauth2' | 'api_key' | 'basic_auth'
  logoUrl?: string
  documentation?: string
  
  // OAuth2 Configuration
  oauth2?: {
    authUrl: string
    tokenUrl: string
    userInfoUrl?: string
    revokeUrl?: string
    scopes: string[] | ((options?: any) => string[])
    scopeSeparator?: string
    authParams?: Record<string, string>
    tokenParams?: Record<string, string>
    pkce?: boolean
    // Map user info response to standard fields
    userInfoMapping?: {
      id: string | ((data: any) => string)
      email?: string | ((data: any) => string)
      name?: string | ((data: any) => string)
    }
  }
  
  // API Key Configuration
  apiKey?: {
    location: 'header' | 'query' | 'body'
    keyName: string
    keyPrefix?: string
    secretName?: string // For API key + secret combos
    testEndpoint?: string
    testMethod?: 'GET' | 'POST'
    testExpectedStatus?: number[]
  }
  
  // Rate Limiting
  rateLimits?: {
    requestsPerSecond?: number
    requestsPerMinute?: number
    requestsPerHour?: number
    requestsPerDay?: number
    concurrent?: number
  }
  
  // Health Check
  healthCheck?: {
    endpoint: string | ((credentials: any) => string)
    method?: 'GET' | 'POST'
    headers?: Record<string, string> | ((credentials: any) => Record<string, string>)
    expectedStatus?: number[]
    timeout?: number
  }
  
  // Webhooks
  webhooks?: {
    supportsWebhooks: boolean
    registerEndpoint?: string
    events?: string[]
    signatureHeader?: string
    signatureAlgorithm?: 'hmac-sha256' | 'hmac-sha1'
  }
}

export interface ConnectionCredentials {
  id: string
  userId: string
  providerId: string
  
  // OAuth tokens
  accessToken?: string
  refreshToken?: string
  tokenType?: string
  expiresAt?: Date
  scopes?: string[]
  
  // API Keys
  apiKey?: string
  apiSecret?: string
  
  // Account info
  accountId?: string
  accountEmail?: string
  accountName?: string
  
  // Metadata
  metadata?: Record<string, any>
  
  // Status
  status: 'active' | 'expired' | 'revoked' | 'error'
  errorMessage?: string
  errorCount?: number
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
  lastSyncedAt?: Date
}

export interface ConnectionOptions {
  // For OAuth
  redirectUri?: string
  state?: string
  
  // For API keys
  testConnection?: boolean
  
  // For both
  metadata?: Record<string, any>
  source?: 'web' | 'cli' | 'api'
}

export interface ConnectionResult {
  success: boolean
  connectionId?: string
  authUrl?: string // For OAuth flow
  requiresAction?: 'oauth' | 'api_key' | 'verify'
  error?: string
}

export interface ConnectionHealth {
  connectionId: string
  status: 'healthy' | 'degraded' | 'failed'
  lastChecked: Date
  responseTime?: number
  error?: string
  details?: Record<string, any>
}

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number
}

// Automation-specific types
export interface Trigger {
  id: string
  connectionId: string
  type: 'webhook' | 'polling'
  event: string
  config?: Record<string, any>
  lastTriggered?: Date
}

export interface Action {
  id: string
  connectionId: string
  type: string
  params: Record<string, any>
}

export interface Automation {
  id: string
  userId: string
  name: string
  description?: string
  trigger: Trigger
  actions: Action[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}