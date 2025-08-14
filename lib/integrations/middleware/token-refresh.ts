import { prisma } from '@/lib/prisma'
import { OAuth2Client } from '../core/oauth2-client'
import { encryptToken, decryptToken } from '../core/encryption'
import { integrationRegistry } from '../core/registry'
import type { Integration, IntegrationStatus } from '@prisma/client'

/**
 * Middleware to ensure OAuth2 tokens are valid before API calls
 * Automatically refreshes expired tokens
 */

interface TokenRefreshResult {
  success: boolean
  integration: Integration | null
  error?: string
}

/**
 * Check if token needs refresh (5 minute buffer before expiry)
 */
function isTokenExpiring(expiresAt: Date | null): boolean {
  if (!expiresAt) return false
  
  const now = Date.now()
  const expiryTime = new Date(expiresAt).getTime()
  const bufferMs = 5 * 60 * 1000 // 5 minutes
  
  return now > (expiryTime - bufferMs)
}

/**
 * Refresh OAuth2 token for an integration
 */
export async function refreshIntegrationToken(
  integrationId: string
): Promise<TokenRefreshResult> {
  try {
    // Fetch integration with user data
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId }
    })
    
    if (!integration) {
      return {
        success: false,
        integration: null,
        error: 'Integration not found'
      }
    }
    
    // Check if refresh is needed
    if (!isTokenExpiring(integration.expiresAt)) {
      return {
        success: true,
        integration
      }
    }
    
    // Check if we have a refresh token
    if (!integration.refreshToken) {
      // Mark integration as expired
      const updated = await prisma.integration.update({
        where: { id: integrationId },
        data: {
          status: 'EXPIRED' as IntegrationStatus,
          errorMessage: 'No refresh token available',
          errorCount: integration.errorCount + 1
        }
      })
      
      return {
        success: false,
        integration: updated,
        error: 'No refresh token available'
      }
    }
    
    // Get provider configuration
    const provider = integrationRegistry.getProvider(
      integration.provider.toLowerCase().replace('_', '-')
    )
    
    if (!provider || provider.auth.type !== 'oauth2') {
      return {
        success: false,
        integration,
        error: 'Provider not configured for OAuth2'
      }
    }
    
    // Set up OAuth2 client with environment credentials
    const oauth2Config = { ...provider.auth.config } as any
    oauth2Config.clientId = process.env[`${integration.provider}_CLIENT_ID`]
    oauth2Config.clientSecret = process.env[`${integration.provider}_CLIENT_SECRET`]
    
    const oauth2Client = new OAuth2Client(oauth2Config)
    
    // Decrypt and refresh token
    const decryptedRefreshToken = decryptToken(integration.refreshToken)
    const tokens = await oauth2Client.refreshAccessToken(decryptedRefreshToken)
    
    // Update integration with new tokens
    const updated = await prisma.integration.update({
      where: { id: integrationId },
      data: {
        accessToken: encryptToken(tokens.accessToken),
        refreshToken: tokens.refreshToken 
          ? encryptToken(tokens.refreshToken)
          : integration.refreshToken,
        expiresAt: tokens.expiresIn 
          ? new Date(Date.now() + tokens.expiresIn * 1000)
          : null,
        tokenType: tokens.tokenType || 'Bearer',
        status: 'ACTIVE' as IntegrationStatus,
        errorMessage: null,
        errorCount: 0,
        lastUsedAt: new Date()
      }
    })
    
    return {
      success: true,
      integration: updated
    }
    
  } catch (error) {
    console.error('Token refresh failed:', error)
    
    // Update integration with error
    try {
      const updated = await prisma.integration.update({
        where: { id: integrationId },
        data: {
          status: 'ERROR' as IntegrationStatus,
          errorMessage: error instanceof Error ? error.message : 'Token refresh failed',
          errorCount: { increment: 1 }
        }
      })
      
      return {
        success: false,
        integration: updated,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      }
    } catch (updateError) {
      return {
        success: false,
        integration: null,
        error: 'Failed to update integration status'
      }
    }
  }
}

/**
 * Ensure integration has valid token before making API calls
 */
export async function ensureValidToken(
  integrationId: string
): Promise<Integration | null> {
  const result = await refreshIntegrationToken(integrationId)
  
  if (!result.success) {
    console.error(`Failed to ensure valid token: ${result.error}`)
    return null
  }
  
  return result.integration
}

/**
 * Get decrypted access token for API calls
 */
export async function getAccessToken(
  integrationId: string
): Promise<string | null> {
  const integration = await ensureValidToken(integrationId)
  
  if (!integration) {
    return null
  }
  
  try {
    return decryptToken(integration.accessToken)
  } catch (error) {
    console.error('Failed to decrypt access token:', error)
    return null
  }
}

/**
 * Batch refresh tokens that are expiring soon
 */
export async function refreshExpiringTokens(): Promise<void> {
  const expiringIntegrations = await prisma.integration.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: {
        lte: new Date(Date.now() + 30 * 60 * 1000) // 30 minute buffer
      },
      refreshToken: {
        not: null
      }
    }
  })
  
  console.log(`Found ${expiringIntegrations.length} expiring tokens to refresh`)
  
  const results = await Promise.allSettled(
    expiringIntegrations.map(integration => 
      refreshIntegrationToken(integration.id)
    )
  )
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length
  
  console.log(`Token refresh complete: ${successful} successful, ${failed} failed`)
}