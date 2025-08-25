import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(['12h', '24h']),
  weekStartsOn: z.number().min(0).max(6),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    desktop: z.boolean(),
    soundEnabled: z.boolean(),
    emailDigest: z.enum(['daily', 'weekly', 'monthly', 'never']),
    mentionsOnly: z.boolean(),
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']),
    showEmail: z.boolean(),
    showActivity: z.boolean(),
  }),
  appearance: z.object({
    fontSize: z.enum(['small', 'medium', 'large']),
    sidebarCollapsed: z.boolean(),
    compactMode: z.boolean(),
    showAnimations: z.boolean(),
  }),
})

async function getUserFromSession(req: NextRequest) {
  const sessionId = req.cookies.get('sessionId')?.value
  
  if (!sessionId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { sessionId },
    select: { id: true, email: true, settings: true }
  })

  return user
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return user settings from the database
    if (user.settings && typeof user.settings === 'object') {
      return NextResponse.json({ settings: user.settings })
    }

    // Return 404 if no settings exist yet
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate the settings
    const validationResult = settingsSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid settings format', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Update user settings in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        settings: {
          ...validationResult.data,
          userId: user.id,
          updatedAt: new Date().toISOString(),
        }
      },
      select: { settings: true }
    })

    return NextResponse.json({ settings: updatedUser.settings })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromSession(req)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Reset settings to default (empty object)
    await prisma.user.update({
      where: { id: user.id },
      data: { settings: {} }
    })

    return NextResponse.json({ message: 'Settings reset successfully' })
  } catch (error) {
    console.error('Failed to reset settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}