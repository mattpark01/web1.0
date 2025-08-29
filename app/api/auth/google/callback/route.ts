import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
  console.log('OAuth callback received')
  console.log('Environment check:', {
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  })
  
  try {
    const client = getOAuthClient(request)
    console.log('Callback URL:', `${getBaseUrl(request)}/api/auth/google/callback`)
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    
    console.log('Code:', code ? 'present' : 'missing')
    console.log('State:', state ? 'present' : 'missing')
    
    if (!code || !state) {
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('error', 'missing_oauth_params')
      return NextResponse.redirect(redirectUrl)
    }
    
    // Parse and verify state
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      
      // Check if state is not too old (15 minutes)
      if (Date.now() - stateData.timestamp > 15 * 60 * 1000) {
        const redirectUrl = new URL('/signin', request.url)
        redirectUrl.searchParams.set('error', 'oauth_state_expired')
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('State parse error:', error)
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('error', 'invalid_oauth_state')
      return NextResponse.redirect(redirectUrl)
    }
    
    // Exchange code for tokens
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)
    
    // Get user info from Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID!
    })
    
    const payload = ticket.getPayload()
    if (!payload) {
      const redirectUrl = new URL('/signin', request.url)
      redirectUrl.searchParams.set('error', 'invalid_google_token')
      return NextResponse.redirect(redirectUrl)
    }
    
    const googleId = payload.sub
    const email = payload.email!
    const name = payload.name
    const picture = payload.picture
    const emailVerified = payload.email_verified || false
    
    // Check if OAuth account exists
    const existingOAuthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'GOOGLE',
          providerAccountId: googleId
        }
      },
      include: {
        user: true
      }
    })
    
    if (existingOAuthAccount) {
      // User already has Google linked, sign them in
      const sessionId = crypto.randomBytes(32).toString('hex')
      
      await prisma.user.update({
        where: { id: existingOAuthAccount.userId },
        data: {
          sessionId,
          lastLoginAt: new Date()
        }
      })
      
      // Update OAuth account with new tokens
      await prisma.oAuthAccount.update({
        where: { id: existingOAuthAccount.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingOAuthAccount.refreshToken,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          lastUsedAt: new Date()
        }
      })
      
      const redirectTo = new URL(stateData.returnUrl || '/', request.url)
      const response = NextResponse.redirect(redirectTo)
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      return response
    }
    
    // Check if user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      // User exists but Google not linked
      // Redirect to account linking page with temporary token
      const linkingToken = crypto.randomBytes(32).toString('hex')
      
      // Store linking token temporarily (you might want to use Redis or a temporary table)
      // For now, we'll use URLSearchParams to pass the data
      const linkingData = {
        userId: existingUser.id,
        googleId,
        email,
        name,
        picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date,
        returnUrl: stateData.returnUrl
      }
      
      const encodedData = Buffer.from(JSON.stringify(linkingData)).toString('base64')
      const linkUrl = new URL('/link-account', request.url)
      linkUrl.searchParams.set('token', encodedData)
      return NextResponse.redirect(linkUrl)
    }
    
    // New user - create account
    const sessionId = crypto.randomBytes(32).toString('hex')
    
    // Generate a unique username from email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    let username = baseUsername
    let counter = 1
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`
      counter++
    }
    
    // Create user and OAuth account in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          username,
          profilePhoto: picture,
          emailVerified,
          sessionId,
          tier: 'FREE',
          lastLoginAt: new Date()
        }
      })
      
      await tx.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'GOOGLE',
          providerAccountId: googleId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          tokenType: tokens.token_type,
          scope: tokens.scope,
          idToken: tokens.id_token,
          email,
          name,
          picture,
          isPrimary: true,
          lastUsedAt: new Date()
        }
      })
      
      return user
    })
    
    const redirectTo = new URL(stateData.returnUrl || '/', request.url)
    const response = NextResponse.redirect(redirectTo)
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    
    const redirectUrl = new URL('/signin', request.url)
    redirectUrl.searchParams.set('error', 'oauth_callback_failed')
    return NextResponse.redirect(redirectUrl)
  }
}