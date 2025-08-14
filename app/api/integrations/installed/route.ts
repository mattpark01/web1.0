import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/integrations/installed - Get user's installed integrations
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication when next-auth is set up
    // For now, use a mock user ID
    const userId = 'mock-user-id' // Replace with actual user ID from session
    
    const integrations = await prisma.integration.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      }
    })
    
    // Transform the data for the UI
    const installedIntegrations = integrations.map(integration => ({
      id: integration.id,
      provider: integration.provider,
      status: integration.status,
      accountEmail: integration.accountEmail,
      accountId: integration.accountId,
      scopes: integration.scopes,
      syncEnabled: integration.syncEnabled,
      lastSyncedAt: integration.lastSyncedAt,
      errorMessage: integration.errorMessage,
      errorCount: integration.errorCount,
      lastUsedAt: integration.lastUsedAt,
      apiCallCount: integration.apiCallCount,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      // Health check data (would be calculated in production)
      health: {
        isHealthy: integration.status === 'ACTIVE' && integration.errorCount === 0,
        needsReauth: integration.status === 'EXPIRED' || integration.status === 'REVOKED',
        lastCheck: integration.updatedAt,
      }
    }))
    
    return NextResponse.json({
      integrations: installedIntegrations,
      total: installedIntegrations.length,
    })
    
  } catch (error) {
    console.error('Failed to fetch installed integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}