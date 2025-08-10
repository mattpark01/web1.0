import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  tier: string;
  emailVerified: boolean;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return null;
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
        tier: true,
        emailVerified: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

export function createAuthResponse(data: any, statusCode: number = 200) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}