import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { refreshIntegrationToken } from '@/lib/integrations/middleware/token-refresh'

/**
 * POST /api/integrations/[provider]/reconnect - Reconnect a disabled integration
 * Attempts to refresh tokens and reactivate
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('accountId')
    
    // Find the integration
    const provider = (await context.params).provider.toUpperCase().replace('-', '_') as any
    const where = accountId
      ? { userId: user.id, provider, accountId }
      : { userId: user.id, provider }
    
    const integration = await prisma.integration.findFirst({ where })
    
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }
    
    // If integration has refresh token, try to refresh
    if (integration.refreshToken) {
      const result = await refreshIntegrationToken(integration.id)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Integration reconnected successfully',
          integration: {
            id: result.integration!.id,
            provider: result.integration!.provider,
            status: result.integration!.status,
            accountEmail: result.integration!.accountEmail
          }
        })
      } else {
        // Refresh failed, need to re-authenticate
        return NextResponse.json({
          success: false,
          message: 'Token refresh failed, re-authentication required',
          requiresAuth: true,
          authUrl: `/api/integrations/${(await context.params).provider}/auth`
        })
      }
    } else {
      // No refresh token, need full re-authentication
      return NextResponse.json({
        success: false,
        message: 'Re-authentication required',
        requiresAuth: true,
        authUrl: `/api/integrations/${(await context.params).provider}/auth`
      })
    }
    
  } catch (error) {
    console.error('Reconnect integration error:', error)
    return NextResponse.json(
      { error: 'Failed to reconnect integration' },
      { status: 500 }
    )
  }
}