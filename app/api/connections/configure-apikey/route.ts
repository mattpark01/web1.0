import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { connectionManager } from '@/lib/connections/core/connection-manager'

/**
 * POST /api/connections/configure-apikey
 * Configure API key for a connection
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { providerId, apiKey, apiSecret } = body
    
    if (!providerId || !apiKey) {
      return NextResponse.json(
        { error: 'Provider ID and API key are required' },
        { status: 400 }
      )
    }
    
    // Configure API key
    const result = await connectionManager.configureApiKey(
      user.id,
      providerId,
      apiKey,
      apiSecret
    )
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Failed to configure API key:', error)
    return NextResponse.json(
      { error: 'Failed to configure API key' },
      { status: 500 }
    )
  }
}