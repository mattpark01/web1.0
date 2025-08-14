import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/[id]/context - Get user context for agent-runtime
 * Used by agents to understand user's environment and available resources
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
            action: true,
            entityType: true,
            createdAt: true,
          }
        },
        // Financial accounts
        bankAccounts: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            mask: true,
          }
        },
        // Brokerage connections
        brokerageConnections: {
          where: { isActive: true },
          select: {
            provider: true,
            accountType: true,
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
    const context = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        memberSince: user.createdAt,
      },
      resources: {
        tasks: user._count.tasks,
        notes: user._count.notes,
        emails: user._count.emails,
        events: user._count.calendarEvents,
        bankAccounts: user._count.bankAccounts,
        integrations: user._count.integrations,
      },
      integrations: user.integrations.map(i => ({
        provider: i.provider,
        accountEmail: i.accountEmail,
        scopes: i.scopes,
        lastSync: i.lastSyncedAt,
        syncEnabled: i.syncEnabled,
      })),
      financialAccounts: {
        bank: user.bankAccounts.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          lastFour: a.mask,
        })),
        brokerage: user.brokerageConnections.map(b => ({
          provider: b.provider,
          type: b.accountType,
        })),
      },
      recentActivity: user.activities.map(a => ({
        action: a.action,
        type: a.entityType,
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