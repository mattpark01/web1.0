import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Generates a secure API key with the format: sk_live_[random]
 */
export function generateApiKey(): string {
  const prefix = 'sk_live_';
  const randomPart = randomBytes(32).toString('base64url');
  return `${prefix}${randomPart}`;
}

/**
 * Gets or creates an API key for a user
 * This is used internally by the proxy routes
 */
export async function getOrCreateUserApiKey(userId: string): Promise<string> {
  // Check if user already has an active API key
  const existingKey = await prisma.spatioApiKey.findFirst({
    where: {
      userId,
      isActive: true,
    },
  });

  if (existingKey) {
    // Update last used timestamp
    await prisma.spatioApiKey.update({
      where: { id: existingKey.id },
      data: { lastUsedAt: new Date() },
    });
    return existingKey.apiKey;
  }

  // Generate a new API key for the user
  const apiKey = generateApiKey();
  
  await prisma.spatioApiKey.create({
    data: {
      userId,
      apiKey,
      name: 'Auto-generated Internal Key',
    },
  });

  return apiKey;
}

/**
 * Validates an API key and returns the associated user ID
 */
export async function validateApiKey(apiKey: string): Promise<string | null> {
  const key = await prisma.spatioApiKey.findUnique({
    where: { apiKey },
    select: { userId: true, isActive: true },
  });

  if (!key || !key.isActive) {
    return null;
  }

  // Update last used timestamp
  await prisma.spatioApiKey.update({
    where: { apiKey },
    data: { lastUsedAt: new Date() },
  });

  return key.userId;
}