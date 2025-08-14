import { prisma } from '@/lib/prisma'
import { Integration, IntegrationStatus } from '@prisma/client'
import { integrationRegistry } from './registry'
import { getAccessToken } from '../middleware/token-refresh'

/**
 * Integration status checking and health monitoring utilities
 */

export interface IntegrationHealth {
  id: string
  provider: string
  status: IntegrationStatus
  isHealthy: boolean
  canSync: boolean
  needsReauth: boolean
  lastError?: string
  lastSuccessfulSync?: Date
  apiQuotaRemaining?: number
  details: {
    hasValidToken: boolean
    tokenExpiring: boolean
    connectionVerified: boolean
    syncEnabled: boolean
  }
}

/**
 * Check health status of a single integration
 */
export async function checkIntegrationHealth(
  integrationId: string
): Promise<IntegrationHealth | null> {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId }
    })
    
    if (!integration) {
      return null
    }
    
    // Check token validity
    const hasValidToken = await validateToken(integration)
    const tokenExpiring = isTokenExpiring(integration.expiresAt)
    const connectionVerified = await verifyConnection(integration)
    
    const needsReauth = 
      integration.status === 'EXPIRED' ||
      integration.status === 'REVOKED' ||
      (integration.status === 'ERROR' && integration.errorCount > 3) ||
      !hasValidToken
    
    const canSync = 
      integration.syncEnabled &&
      integration.status === 'ACTIVE' &&
      hasValidToken &&
      connectionVerified
    
    const isHealthy = 
      integration.status === 'ACTIVE' &&
      hasValidToken &&
      !tokenExpiring &&
      connectionVerified &&
      integration.errorCount === 0
    
    return {
      id: integration.id,
      provider: integration.provider,
      status: integration.status,
      isHealthy,
      canSync,
      needsReauth,
      lastError: integration.errorMessage || undefined,
      lastSuccessfulSync: integration.lastSyncedAt || undefined,
      details: {
        hasValidToken,
        tokenExpiring,
        connectionVerified,
        syncEnabled: integration.syncEnabled
      }
    }
  } catch (error) {
    console.error('Health check failed:', error)
    return null
  }
}

/**
 * Check health of all user integrations
 */
export async function checkUserIntegrationsHealth(
  userId: string
): Promise<IntegrationHealth[]> {
  const integrations = await prisma.integration.findMany({
    where: { userId }
  })
  
  const healthChecks = await Promise.all(
    integrations.map(i => checkIntegrationHealth(i.id))
  )
  
  return healthChecks.filter((h): h is IntegrationHealth => h !== null)
}

/**
 * Check if token is expiring soon (within 30 minutes)
 */
function isTokenExpiring(expiresAt: Date | null): boolean {
  if (!expiresAt) return false
  
  const now = Date.now()
  const expiryTime = new Date(expiresAt).getTime()
  const bufferMs = 30 * 60 * 1000 // 30 minutes
  
  return now > (expiryTime - bufferMs)
}

/**
 * Validate that we can decrypt and use the token
 */
async function validateToken(integration: Integration): Promise<boolean> {
  try {
    const token = await getAccessToken(integration.id)
    return token !== null && token.length > 0
  } catch {
    return false
  }
}

/**
 * Verify connection by making a test API call
 */
async function verifyConnection(integration: Integration): Promise<boolean> {
  try {
    const adapter = integrationRegistry.getAdapter(
      integration.provider.toLowerCase().replace('_', '-')
    )
    
    if (!adapter) {
      return false
    }
    
    // Convert database model to adapter format
    const connection = {
      id: integration.id,
      userId: integration.userId,
      providerId: integration.provider,
      accountId: integration.accountId,
      accountEmail: integration.accountEmail,
      credentials: {
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken,
        expiresAt: integration.expiresAt,
        tokenType: integration.tokenType,
        scopes: integration.scopes
      },
      status: integration.status === 'ACTIVE' ? 'active' : 'inactive',
      syncEnabled: integration.syncEnabled,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt
    } as any
    
    return await adapter.validateConnection(connection)
  } catch {
    return false
  }
}

/**
 * Get integration statistics
 */
export async function getIntegrationStats(userId: string): Promise<{
  total: number
  active: number
  expired: number
  error: number
  needsAttention: number
}> {
  const integrations = await prisma.integration.findMany({
    where: { userId }
  })
  
  return {
    total: integrations.length,
    active: integrations.filter(i => i.status === 'ACTIVE').length,
    expired: integrations.filter(i => i.status === 'EXPIRED').length,
    error: integrations.filter(i => i.status === 'ERROR').length,
    needsAttention: integrations.filter(i => 
      i.status === 'EXPIRED' || 
      i.status === 'ERROR' || 
      i.status === 'REVOKED'
    ).length
  }
}

/**
 * Mark integration as used (update lastUsedAt)
 */
export async function markIntegrationUsed(integrationId: string): Promise<void> {
  await prisma.integration.update({
    where: { id: integrationId },
    data: {
      lastUsedAt: new Date(),
      apiCallCount: { increment: 1 }
    }
  })
}