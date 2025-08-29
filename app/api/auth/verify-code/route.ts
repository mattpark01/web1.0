import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/email'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    try {
      const verifiedEmail = await verifyEmailToken(code)
      
      if (verifiedEmail !== email) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        )
      }

      // Create session for the verified user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          name: true,
          tier: true,
          createdAt: true,
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Create session
      const sessionId = crypto.randomUUID()
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          sessionId,
          lastLoginAt: new Date(),
        },
      })

      // Set session cookie and return user data
      const response = NextResponse.json({ 
        success: true,
        message: 'Email verified successfully',
        user,
        sessionId
      })

      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return response
    } catch (error: any) {
      console.error('Code verification error:', error)
      
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Verification code has expired. Please request a new one.' },
          { status: 410 }
        )
      }
      
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to verify code' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Verify code route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}