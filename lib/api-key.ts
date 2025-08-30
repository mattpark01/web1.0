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
  console.log('[API Key] Getting or creating key for user:', userId);
  
  // Check if user already has an active API key using raw SQL
  const existingKeys = await prisma.$queryRaw<Array<{api_key: string, id: string}>>`
    SELECT id, api_key FROM spatio_api_keys 
    WHERE user_id = ${userId} AND is_active = true
    LIMIT 1
  `;

  if (existingKeys && existingKeys.length > 0) {
    console.log('[API Key] Found existing key for user');
    // Update last used timestamp
    await prisma.$executeRaw`
      UPDATE spatio_api_keys 
      SET last_used_at = NOW() 
      WHERE id = ${existingKeys[0].id}::uuid
    `;
    return existingKeys[0].api_key;
  }

  console.log('[API Key] No existing key, creating new one');
  
  // Generate a new API key for the user
  const apiKey = generateApiKey();
  
  await prisma.$executeRaw`
    INSERT INTO spatio_api_keys (api_key, user_id, name, created_at, is_active)
    VALUES (${apiKey}, ${userId}, 'Auto-generated Internal Key', NOW(), true)
  `;

  console.log('[API Key] Created new API key for user');
  return apiKey;
}

/**
 * Validates an API key and returns the associated user ID
 */
export async function validateApiKey(apiKey: string): Promise<string | null> {
  const keys = await prisma.$queryRaw<Array<{user_id: string, is_active: boolean}>>`
    SELECT user_id, is_active FROM spatio_api_keys 
    WHERE api_key = ${apiKey}
    LIMIT 1
  `;

  if (!keys || keys.length === 0 || !keys[0].is_active) {
    return null;
  }

  // Update last used timestamp
  await prisma.$executeRaw`
    UPDATE spatio_api_keys 
    SET last_used_at = NOW() 
    WHERE api_key = ${apiKey}
  `;

  return keys[0].user_id;
}