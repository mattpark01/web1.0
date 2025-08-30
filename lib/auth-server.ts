import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUserApiKey } from '@/lib/api-key';

/**
 * Gets the current user from the session cookie
 */
export async function getUserFromSession(request: NextRequest) {
  const sessionId = request.cookies.get('sessionId')?.value;
  
  if (!sessionId) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { sessionId },
    select: {
      id: true,
      email: true,
    },
  });
  
  return user;
}

/**
 * Gets the internal API key for the current user session
 * Creates one if it doesn't exist
 */
export async function getUserApiKey(request: NextRequest): Promise<string | null> {
  const user = await getUserFromSession(request);
  
  if (!user) {
    return null;
  }
  
  return getOrCreateUserApiKey(user.id);
}