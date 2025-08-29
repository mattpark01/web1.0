import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getAuthUser } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
    const currentUser = await getAuthUser(request)
    
    const body = await request.json()
    const { password, linkingData } = body
    
    if (!linkingData) {
      return NextResponse.json(
        { error: 'Missing linking data' },
        { status: 400 }
      )
    }
    
    // Parse the linking data
    const { 
      userId, 
      googleId, 
      email, 
      name, 
      picture, 
      accessToken, 
      refreshToken, 
      expiresAt 
    } = linkingData
    
    // If user is logged in, use their ID, otherwise use the ID from linking data
    const targetUserId = currentUser?.id || userId
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        oauthAccounts: {
          where: { provider: 'GOOGLE' }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if Google account already linked
    if (user.oauthAccounts.length > 0) {
      return NextResponse.json(
        { error: 'Google account already linked' },
        { status: 400 }
      )
    }
    
    // If user has a password, verify it
    if (user.password && password) {
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        )
      }
    } else if (user.password && !password) {
      // User has password but didn't provide one
      return NextResponse.json(
        { error: 'Password required to link account' },
        { status: 400 }
      )
    }
    
    // Link the Google account
    await prisma.oAuthAccount.create({
      data: {
        userId: targetUserId,
        provider: 'GOOGLE',
        providerAccountId: googleId,
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        email,
        name,
        picture,
        isPrimary: !user.password, // Make primary if no password
        lastUsedAt: new Date()
      }
    })
    
    // Update user profile if needed
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        profilePhoto: user.profilePhoto || picture,
        name: user.name || name,
        emailVerified: true // Google accounts are verified
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Google account linked successfully'
    })
    
  } catch (error) {
    console.error('Account linking error:', error)
    return NextResponse.json(
      { error: 'Failed to link account' },
      { status: 500 }
    )
  }
}