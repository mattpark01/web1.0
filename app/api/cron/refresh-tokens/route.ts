import { NextRequest, NextResponse } from 'next/server'
import { refreshTokensJob } from '@/lib/jobs/refresh-tokens'

/**
 * API endpoint for token refresh cron job
 * Can be called by Vercel Cron, GitHub Actions, or external cron service
 * 
 * Recommended schedule: Every 15 minutes
 * Vercel cron config: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/refresh-tokens",
 *     "schedule": "0 0,15,30,45 * * * *"
 *   }]
 * }
 */

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  try {
    await refreshTokensJob()
    
    return NextResponse.json({
      success: true,
      message: 'Token refresh job completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron job failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}