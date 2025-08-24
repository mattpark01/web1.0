/**
 * Connection Manager - Core orchestrator for all connections
 * Platform-agnostic, can be used in web, CLI, or API
 */

import { prisma } from '@/lib/prisma'
import { 
  ConnectionProvider, 
  ConnectionCredentials, 
  ConnectionOptions, 
  ConnectionResult,
  ConnectionHealth 
} from './types'
import { providerRegistry } from './provider-registry'
import { encryption, CredentialEncryption } from './encryption'
import { OAuthHandler } from '../auth/oauth-handler'
import { ApiKeyHandler } from '../auth/apikey-handler'

export class ConnectionManager {
  private static instance: ConnectionManager
  private oauthHandler: OAuthHandler
  private apiKeyHandler: ApiKeyHandler
  
  private constructor() {
    this.oauthHandler = new OAuthHandler()
    this.apiKeyHandler = new ApiKeyHandler()
  }
  
  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }
  
  /**
   * Install a new connection
   */
  async installConnection(
    userId: string,
    providerId: string,
    options: ConnectionOptions = {}
  ): Promise<ConnectionResult> {
    try {
      const provider = providerRegistry.get(providerId)
      if (!provider) {
        return {
          success: false,
          error: `Provider ${providerId} not found`,
        }
      }
      
      // Check if connection already exists
      const existingConnection = await this.getUserConnection(userId, providerId)
      if (existingConnection && existingConnection.status === 'active') {
        return {
          success: true,
          connectionId: existingConnection.id,
        }
      }
      
      // Handle different auth types
      switch (provider.authType) {
        case 'oauth2':
          return await this.initiateOAuth(userId, provider, options)
        
        case 'api_key':
          return {
            success: false,
            requiresAction: 'api_key',
          }
        
        default:
          return {
            success: false,
            error: `Unsupported auth type: ${provider.authType}`,
          }
      }
    } catch (error) {
      console.error('Failed to install connection:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
  
  /**
   * Initiate OAuth flow
   */
  private async initiateOAuth(
    userId: string,
    provider: ConnectionProvider,
    options: ConnectionOptions
  ): Promise<ConnectionResult> {
    if (!provider.oauth2) {
      return {
        success: false,
        error: 'Provider does not support OAuth2',
      }
    }
    
    // Generate state token
    const state = CredentialEncryption.generateStateToken()
    
    // TODO: Store state in a temporary storage for verification
    // For now, we'll encode it in the state parameter itself
    // await prisma.connectionJob.create({
    //   data: {
    //     jobType: 'oauth_state',
    //     providerId: provider.id,
    //     payload: {
    //       userId,
    //       state,
    //       providerId: provider.id,
    //       source: options.source || 'web',
    //       metadata: options.metadata,
    //     },
    //     status: 'pending',
    //     scheduledAt: new Date(),
    //   },
    // })
    
    // Build OAuth URL
    const authUrl = this.oauthHandler.buildAuthUrl(provider, {
      state,
      redirectUri: options.redirectUri || this.getRedirectUri(options.source),
    })
    
    return {
      success: true,
      authUrl,
      requiresAction: 'oauth',
    }
  }
  
  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    code: string,
    state: string
  ): Promise<ConnectionResult> {
    try {
      // Verify state token
      // TODO: Verify state from temporary storage
      // const stateJob = await prisma.connectionJob.findFirst({
      //   where: {
      //     jobType: 'oauth_state',
      //     payload: {
      //       path: ['state'],
      //       equals: state,
      //     },
      //     status: 'pending',
      //   },
      // })
      // Temporary mock - in production, decode state to get these values
      const stateJob = { payload: { userId: 'temp-user', providerId: 'temp-provider' } } // Temporary mock
      
      if (!stateJob) {
        return {
          success: false,
          error: 'Invalid or expired state token',
        }
      }
      
      const { userId, providerId, source, metadata } = stateJob.payload as any
      
      // Get provider
      const provider = providerRegistry.get(providerId)
      if (!provider || !provider.oauth2) {
        return {
          success: false,
          error: 'Invalid provider',
        }
      }
      
      // Exchange code for tokens
      const tokens = await this.oauthHandler.exchangeCodeForTokens(
        provider,
        code,
        this.getRedirectUri(source)
      )
      
      if (!tokens.accessToken) {
        return {
          success: false,
          error: 'Failed to obtain access token',
        }
      }
      
      // Get user info if available
      let accountInfo: any = {}
      if (provider.oauth2.userInfoUrl) {
        accountInfo = await this.oauthHandler.getUserInfo(provider, tokens.accessToken)
      }
      
      // Store connection
      const connection = await this.storeConnection(userId, providerId, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: tokens.tokenType || 'Bearer',
        expiresAt: tokens.expiresAt,
        scopes: tokens.scopes,
        accountId: accountInfo.id,
        accountEmail: accountInfo.email,
        accountName: accountInfo.name,
        metadata: {
          ...metadata,
          source,
        },
      })
      
      // Mark state as completed
      // TODO: Update state job when implemented
      // await prisma.connectionJob.update({
      //   where: { id: stateJob.id },
      //   data: {
      //     status: 'completed',
      //     completedAt: new Date(),
      //   },
      // })
      
      return {
        success: true,
        connectionId: connection.id,
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed',
      }
    }
  }
  
  /**
   * Configure API key
   */
  async configureApiKey(
    userId: string,
    providerId: string,
    apiKey: string,
    apiSecret?: string
  ): Promise<ConnectionResult> {
    try {
      const provider = providerRegistry.get(providerId)
      if (!provider || provider.authType !== 'api_key') {
        return {
          success: false,
          error: 'Invalid provider or auth type',
        }
      }
      
      // Test API key if endpoint provided
      if (provider.apiKey?.testEndpoint) {
        const isValid = await this.apiKeyHandler.testApiKey(provider, apiKey, apiSecret)
        if (!isValid) {
          return {
            success: false,
            error: 'Invalid API key',
          }
        }
      }
      
      // Store connection
      const connection = await this.storeConnection(userId, providerId, {
        apiKey,
        apiSecret,
      })
      
      return {
        success: true,
        connectionId: connection.id,
      }
    } catch (error) {
      console.error('API key configuration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to configure API key',
      }
    }
  }
  
  /**
   * Store connection credentials
   */
  private async storeConnection(
    userId: string,
    providerId: string,
    credentials: Partial<ConnectionCredentials>
  ): Promise<ConnectionCredentials> {
    // Encrypt sensitive data
    const encryptedData: any = {}
    
    if (credentials.accessToken) {
      encryptedData.accessToken = encryption.encrypt(credentials.accessToken)
    }
    if (credentials.refreshToken) {
      encryptedData.refreshToken = encryption.encrypt(credentials.refreshToken)
    }
    if (credentials.apiKey) {
      encryptedData.apiKey = encryption.encrypt(credentials.apiKey)
    }
    if (credentials.apiSecret) {
      encryptedData.apiSecret = encryption.encrypt(credentials.apiSecret)
    }
    
    // Map provider ID to enum (you'll need to maintain this mapping)
    const providerEnumMap: Record<string, string> = {
      'google-calendar': 'GOOGLE_CALENDAR',
      'gmail': 'GOOGLE_GMAIL',
      'github': 'GITHUB',
      'linear': 'LINEAR',
      'plaid': 'PLAID',
      'slack': 'SLACK',
      'notion': 'NOTION',
    }
    
    const providerEnum = providerEnumMap[providerId]
    if (!providerEnum) {
      throw new Error(`Provider ${providerId} not mapped to enum`)
    }
    
    // Store in database
    const connection = await prisma.integration.upsert({
      where: {
        userId_provider_accountId: {
          userId,
          provider: providerEnum as any,
          accountId: credentials.accountId || 'default',
        },
      },
      update: {
        ...encryptedData,
        tokenType: credentials.tokenType,
        expiresAt: credentials.expiresAt,
        scopes: credentials.scopes || [],
        accountEmail: credentials.accountEmail,
        metadata: credentials.metadata as any,
        status: 'ACTIVE',
        errorMessage: null,
        errorCount: 0,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: providerEnum as any,
        ...encryptedData,
        tokenType: credentials.tokenType,
        expiresAt: credentials.expiresAt,
        scopes: credentials.scopes || [],
        accountId: credentials.accountId || 'default',
        accountEmail: credentials.accountEmail,
        metadata: credentials.metadata as any,
        status: 'ACTIVE',
        lastSyncedAt: new Date(),
      },
    })
    
    // Return decrypted version
    return {
      id: connection.id,
      userId: connection.userId,
      providerId,
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      tokenType: connection.tokenType || undefined,
      expiresAt: connection.expiresAt || undefined,
      scopes: connection.scopes,
      accountId: connection.accountId || undefined,
      accountEmail: connection.accountEmail || undefined,
      metadata: connection.metadata as any,
      status: 'active',
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
      lastSyncedAt: connection.lastSyncedAt || undefined,
    }
  }
  
  /**
   * Get user's connection for a provider
   */
  async getUserConnection(
    userId: string,
    providerId: string
  ): Promise<ConnectionCredentials | null> {
    const providerEnumMap: Record<string, string> = {
      'google-calendar': 'GOOGLE_CALENDAR',
      'gmail': 'GOOGLE_GMAIL',
      'github': 'GITHUB',
      'linear': 'LINEAR',
      'plaid': 'PLAID',
      'slack': 'SLACK',
      'notion': 'NOTION',
    }
    
    const providerEnum = providerEnumMap[providerId]
    if (!providerEnum) {
      return null
    }
    
    const connection = await prisma.integration.findFirst({
      where: {
        userId,
        provider: providerEnum as any,
      },
    })
    
    if (!connection) {
      return null
    }
    
    // Decrypt credentials
    return {
      id: connection.id,
      userId: connection.userId,
      providerId,
      accessToken: connection.accessToken ? encryption.decrypt(connection.accessToken) : undefined,
      refreshToken: connection.refreshToken ? encryption.decrypt(connection.refreshToken) : undefined,
      tokenType: connection.tokenType || undefined,
      expiresAt: connection.expiresAt || undefined,
      scopes: connection.scopes,
      accountId: connection.accountId || undefined,
      accountEmail: connection.accountEmail || undefined,
      metadata: connection.metadata as any,
      status: connection.status === 'ACTIVE' ? 'active' : 'error',
      errorMessage: connection.errorMessage || undefined,
      errorCount: connection.errorCount,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
      lastUsedAt: connection.lastUsedAt || undefined,
      lastSyncedAt: connection.lastSyncedAt || undefined,
    }
  }
  
  /**
   * Get all user connections
   */
  async getUserConnections(userId: string): Promise<ConnectionCredentials[]> {
    const connections = await prisma.integration.findMany({
      where: { userId },
    })
    
    // Map and decrypt
    return connections.map(conn => ({
      id: conn.id,
      userId: conn.userId,
      providerId: conn.provider.toLowerCase().replace('_', '-'),
      accessToken: conn.accessToken ? encryption.decrypt(conn.accessToken) : undefined,
      refreshToken: conn.refreshToken ? encryption.decrypt(conn.refreshToken) : undefined,
      tokenType: conn.tokenType || undefined,
      expiresAt: conn.expiresAt || undefined,
      scopes: conn.scopes,
      accountId: conn.accountId || undefined,
      accountEmail: conn.accountEmail || undefined,
      metadata: conn.metadata as any,
      status: conn.status === 'ACTIVE' ? 'active' as const : 'error' as const,
      errorMessage: conn.errorMessage || undefined,
      errorCount: conn.errorCount,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
      lastUsedAt: conn.lastUsedAt || undefined,
      lastSyncedAt: conn.lastSyncedAt || undefined,
    }))
  }
  
  /**
   * Refresh OAuth token
   */
  async refreshToken(connectionId: string): Promise<boolean> {
    try {
      const connection = await prisma.integration.findUnique({
        where: { id: connectionId },
      })
      
      if (!connection || !connection.refreshToken) {
        return false
      }
      
      const providerId = connection.provider.toLowerCase().replace('_', '-')
      const provider = providerRegistry.get(providerId)
      
      if (!provider || !provider.oauth2) {
        return false
      }
      
      const refreshToken = encryption.decrypt(connection.refreshToken)
      const newTokens = await this.oauthHandler.refreshAccessToken(provider, refreshToken)
      
      if (!newTokens.accessToken) {
        return false
      }
      
      // Update connection
      await prisma.integration.update({
        where: { id: connectionId },
        data: {
          accessToken: encryption.encrypt(newTokens.accessToken),
          refreshToken: newTokens.refreshToken 
            ? encryption.encrypt(newTokens.refreshToken)
            : connection.refreshToken,
          expiresAt: newTokens.expiresAt,
          updatedAt: new Date(),
        },
      })
      
      return true
    } catch (error) {
      console.error('Token refresh error:', error)
      return false
    }
  }
  
  /**
   * Get redirect URI based on source
   */
  private getRedirectUri(source?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Use same domain for both web and CLI
    // CLI can open browser to web callback URL
    return `${baseUrl}/api/connections/oauth/callback`
  }
  
  /**
   * Check connection health
   */
  async checkConnectionHealth(connectionId: string): Promise<ConnectionHealth> {
    try {
      const connection = await prisma.integration.findUnique({
        where: { id: connectionId },
      })
      
      if (!connection) {
        return {
          connectionId,
          status: 'failed',
          lastChecked: new Date(),
          error: 'Connection not found',
        }
      }
      
      const providerId = connection.provider.toLowerCase().replace('_', '-')
      const provider = providerRegistry.get(providerId)
      
      if (!provider || !provider.healthCheck) {
        return {
          connectionId,
          status: 'healthy',
          lastChecked: new Date(),
        }
      }
      
      // Perform health check based on auth type
      const startTime = Date.now()
      let status: 'healthy' | 'degraded' | 'failed' = 'healthy'
      let error: string | undefined
      
      try {
        if (provider.authType === 'oauth2' && connection.accessToken) {
          const accessToken = encryption.decrypt(connection.accessToken)
          const response = await fetch(
            typeof provider.healthCheck.endpoint === 'function'
              ? provider.healthCheck.endpoint({ accessToken })
              : provider.healthCheck.endpoint,
            {
              method: provider.healthCheck.method || 'GET',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                ...provider.healthCheck.headers,
              },
            }
          )
          
          if (!provider.healthCheck.expectedStatus?.includes(response.status)) {
            status = response.status === 401 ? 'failed' : 'degraded'
            error = `Unexpected status: ${response.status}`
          }
        }
      } catch (err) {
        status = 'failed'
        error = err instanceof Error ? err.message : 'Health check failed'
      }
      
      const responseTime = Date.now() - startTime
      
      // TODO: Store health check result when connectionHealth model is added
      // await prisma.connectionHealth.create({
      //   data: {
      //     integrationId: connectionId,
      //     status,
      //     responseTimeMs: responseTime,
      //     lastError: error,
      //     failureCount: status === 'failed' ? 1 : 0,
      //     lastCheckAt: new Date(),
      //   },
      // })
      
      return {
        connectionId,
        status,
        lastChecked: new Date(),
        responseTime,
        error,
      }
    } catch (error) {
      console.error('Health check error:', error)
      return {
        connectionId,
        status: 'failed',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Health check failed',
      }
    }
  }
}

// Export singleton instance
export const connectionManager = ConnectionManager.getInstance()