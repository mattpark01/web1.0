import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { sessionId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        name: true,
        profilePhoto: true,
        tier: true,
        emailVerified: true,
        settings: true,
        createdAt: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        _count: {
          select: {
            notes: true,
            tasks: true,
            emails: true,
            files: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Session invalid' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}