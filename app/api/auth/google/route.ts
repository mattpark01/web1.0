import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import crypto from 'crypto'

// Get the base URL from the request or use environment variable
function getBaseUrl(request: NextRequest) {
  // In production, use the actual host header (Vercel, Cloud Run, etc.)
  // This allows the app to work on any domain without hardcoding
  if (process.env.APP_URL) {
    return process.env.APP_URL
  }
  
  const host = request.headers.get('host')
  
  // Check common production hosts
  if (host?.includes('vercel.app') || host?.includes('run.app') || host?.includes('spatiolabs')) {
    return `https://${host}`
  }
  
  // Development or localhost
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

const getOAuthClient = (request: NextRequest) => {
  const baseUrl = getBaseUrl(request)
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/auth/google/callback`
  )
}

export async function GET(request: NextRequest) {
  try {
    const client = getOAuthClient(request)
    
    // Generate a random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex')
    
    // Get the intention from query params (signin or signup)
    const searchParams = request.nextUrl.searchParams
    const intent = searchParams.get('intent') || 'signin'
    const returnUrl = searchParams.get('returnUrl') || '/'
    
    // Store state in a cookie for verification in callback
    const stateData = {
      state,
      intent,
      returnUrl,
      timestamp: Date.now()
    }
    
    // Generate the authorization URL
    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: Buffer.from(JSON.stringify(stateData)).toString('base64'),
      prompt: 'select_account' // Always show account selection
    })
    
    return NextResponse.redirect(authorizeUrl)
  } catch (error) {
    console.error('OAuth initialization error:', error)
    return NextResponse.redirect('/signin?error=oauth_init_failed')
  }
}