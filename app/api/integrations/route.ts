import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkIntegrationHealth } from '@/lib/integrations/core/status'

/**
 * GET /api/integrations - List user's integrations
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch user's integrations
    const integrations = await prisma.integration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })
    
    // Add health status to each integration
    const integrationsWithHealth = await Promise.all(
      integrations.map(async (integration) => {
        const health = await checkIntegrationHealth(integration.id)
        return {
          ...integration,
          health: health ? {
            isHealthy: health.isHealthy,
            canSync: health.canSync,
            needsReauth: health.needsReauth,
            lastError: health.lastError
          } : null
        }
      })
    )
    
    return NextResponse.json({
      integrations: integrationsWithHealth,
      count: integrations.length
    })
    
  } catch (error) {
    console.error('Failed to fetch integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}