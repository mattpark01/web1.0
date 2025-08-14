import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/integrations/user/[userId] - Get user's integrations for agent-runtime
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify API key for agent-runtime
    const apiKey = request.headers.get('x-api-key')
    
    if (apiKey !== process.env.AGENT_RUNTIME_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = params.userId
    
    // Get user's integrations
    const integrations = await prisma.integration.findMany({
      where: { 
        userId,
        status: 'ACTIVE' 
      },
      select: {
        id: true,
        provider: true,
        accountId: true,
        accountEmail: true,
        scopes: true,
        status: true,
        syncEnabled: true,
        lastSyncedAt: true,
        createdAt: true,
        errorMessage: true,
        errorCount: true,
      }
    })
    
    // Transform to a more usable format
    const integrationMap = integrations.reduce((acc, integration) => {
      const provider = integration.provider.toLowerCase().replace('_', '-')
      acc[provider] = {
        id: integration.id,
        connected: true,
        accountEmail: integration.accountEmail,
        accountId: integration.accountId,
        scopes: integration.scopes,
        syncEnabled: integration.syncEnabled,
        lastSync: integration.lastSyncedAt,
        hasErrors: integration.errorCount > 0,
        errorMessage: integration.errorMessage,
      }
      return acc
    }, {} as Record<string, any>)
    
    return NextResponse.json({
      userId,
      count: integrations.length,
      integrations: integrationMap,
      providers: integrations.map(i => i.provider),
    })
    
  } catch (error) {
    console.error('Failed to get user integrations:', error)
    return NextResponse.json(
      { error: 'Failed to get user integrations' },
      { status: 500 }
    )
  }
}