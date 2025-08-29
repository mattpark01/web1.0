import { NextRequest, NextResponse } from 'next/server'
import { createVerificationCode, sendVerificationCode } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const resendSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resendSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate and send new verification code
    const verificationCode = await createVerificationCode(email)
    await sendVerificationCode(email, verificationCode)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}