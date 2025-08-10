import { NextRequest, NextResponse } from 'next/server'
import { integrationRegistry } from '@/lib/integrations/core/registry'
import { OAuth2Client } from '@/lib/integrations/core/oauth2-client'
import { auth } from '@/lib/auth'
import crypto from 'crypto'

// GET /api/integrations/[provider]/auth - Start OAuth flow
export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const provider = integrationRegistry.getProvider(params.provider)
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    if (provider.auth.type !== 'oauth2') {
      return NextResponse.json({ error: 'Provider does not support OAuth2' }, { status: 400 })
    }

    const oauth2Config = provider.auth.config as any
    
    // Get client credentials from environment
    oauth2Config.clientId = process.env[`${params.provider.toUpperCase().replace('-', '_')}_CLIENT_ID`]
    oauth2Config.clientSecret = process.env[`${params.provider.toUpperCase().replace('-', '_')}_CLIENT_SECRET`]
    oauth2Config.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${params.provider}/callback`

    if (!oauth2Config.clientId) {
      return NextResponse.json({ error: 'Provider not configured' }, { status: 500 })
    }

    const oauth2Client = new OAuth2Client(oauth2Config)
    
    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('base64url')
    
    // Store state in session/cookie (you might want to use a session store)
    const response = NextResponse.redirect(
      oauth2Client.getAuthorizationUrl(state, {
        prompt: 'consent', // Force consent to get refresh token
      })
    )
    
    // Set state in secure cookie
    response.cookies.set(`oauth_state_${params.provider}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    })
    
    // Store PKCE verifier if needed
    if (oauth2Config.pkce) {
      const codeVerifier = crypto.randomBytes(32).toString('base64url')
      response.cookies.set(`pkce_verifier_${params.provider}`, codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
      })
    }
    
    return response
  } catch (error) {
    console.error('OAuth auth error:', error)
    return NextResponse.json(
      { error: 'Failed to start OAuth flow' },
      { status: 500 }
    )
  }
}