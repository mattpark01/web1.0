import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/[id]/context - Get user context for agent-runtime
 * Used by agents to understand user's environment and available resources
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
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
    
    const params = await ctx.params
    const userId = params.id
    
    // Get user with their integrations and key data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        // Count of various resources
        _count: {
          select: {
            tasks: true,
            notes: true,
            emails: true,
            calendarEvents: true,
            bankAccounts: true,
            integrations: true,
          }
        },
        // Active integrations
        integrations: {
          where: { status: 'ACTIVE' },
          select: {
            provider: true,
            accountEmail: true,
            scopes: true,
            lastSyncedAt: true,
            syncEnabled: true,
          }
        },
        // Recent activity
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            entityType: true,
            entityId: true,
            createdAt: true,
          }
        },
        // Financial accounts
        bankAccounts: {
          select: {
            id: true,
            name: true,
            type: true,
            mask: true,
          }
        },
        // Brokerage connections
        brokerageConnections: {
          select: {
            id: true,
            provider: true,
          }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Build context object
    const userWithRelations = user as any
    const context = {
      user: {
        id: userWithRelations.id,
        email: userWithRelations.email,
        name: userWithRelations.name,
        memberSince: userWithRelations.createdAt,
      },
      resources: {
        tasks: userWithRelations._count?.tasks || 0,
        notes: userWithRelations._count?.notes || 0,
        emails: userWithRelations._count?.emails || 0,
        events: userWithRelations._count?.calendarEvents || 0,
        bankAccounts: userWithRelations._count?.bankAccounts || 0,
        integrations: userWithRelations._count?.integrations || 0,
      },
      integrations: (userWithRelations.integrations || []).map((i: any) => ({
        provider: i.provider,
        accountEmail: i.accountEmail,
        scopes: i.scopes,
        lastSync: i.lastSyncedAt,
        syncEnabled: i.syncEnabled,
      })),
      financialAccounts: {
        bank: (userWithRelations.bankAccounts || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          lastFour: a.mask,
        })),
        brokerage: (userWithRelations.brokerageConnections || []).map((b: any) => ({
          id: b.id,
          provider: b.provider,
        })),
      },
      recentActivity: (userWithRelations.activities || []).map((a: any) => ({
        id: a.id,
        type: a.entityType,
        entityId: a.entityId,
        timestamp: a.createdAt,
      })),
      preferences: {
        timezone: 'UTC', // TODO: Get from user preferences
        locale: 'en-US',
        currency: 'USD',
      }
    }
    
    return NextResponse.json(context)
    
  } catch (error) {
    console.error('Failed to get user context:', error)
    return NextResponse.json(
      { error: 'Failed to get user context' },
      { status: 500 }
    )
  }
}