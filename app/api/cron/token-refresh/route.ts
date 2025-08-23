import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { connectionManager } from '@/lib/connections/core/connection-manager'

/**
 * GET /api/cron/token-refresh
 * Refresh expiring OAuth tokens
 * Should be called every hour via Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Find tokens expiring within the next hour
    const expiringConnections = await prisma.integration.findMany({
      where: {
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
        refreshToken: {
          not: null,
        },
        status: 'ACTIVE',
      },
    })
    
    console.log(`Found ${expiringConnections.length} tokens to refresh`)
    
    const results = {
      total: expiringConnections.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    }
    
    // Refresh each token
    for (const connection of expiringConnections) {
      try {
        const success = await connectionManager.refreshToken(connection.id)
        if (success) {
          results.success++
        } else {
          results.failed++
          results.errors.push(`Failed to refresh ${connection.id}`)
        }
      } catch (error) {
        results.failed++
        results.errors.push(
          `Error refreshing ${connection.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
    
    console.log('Token refresh results:', results)
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Token refresh cron error:', error)
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max for cron job