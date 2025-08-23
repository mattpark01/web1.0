import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectionManager } from '@/lib/connections/core/connection-manager'
import { providerRegistry } from '@/lib/connections/core/provider-registry'

/**
 * GET /api/connections/user
 * Get all user's connected integrations
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get all user connections
    const connections = await connectionManager.getUserConnections(user.id)
    
    // Enhance with provider info
    const enhancedConnections = connections.map(conn => {
      const provider = providerRegistry.get(conn.providerId)
      
      return {
        id: conn.id,
        providerId: conn.providerId,
        name: provider?.name || conn.providerId,
        icon: provider?.logoUrl,
        accountEmail: conn.accountEmail,
        status: conn.status,
        connectedAt: conn.createdAt,
        lastSyncedAt: conn.lastSyncedAt,
        error: conn.errorMessage,
      }
    })
    
    return NextResponse.json({
      connections: enhancedConnections,
      count: enhancedConnections.length,
    })
    
  } catch (error) {
    console.error('Failed to fetch user connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}