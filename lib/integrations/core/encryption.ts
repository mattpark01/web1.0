import crypto from 'crypto'

/**
 * Token encryption utilities for secure storage of OAuth2 tokens
 * Uses AES-256-GCM for authenticated encryption
 */

// Get encryption key from environment or generate one
const getEncryptionKey = (): Buffer => {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY
  if (!key) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY environment variable is not set')
  }
  
  // Key should be 32 bytes (256 bits) hex string
  if (key.length !== 64) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }
  
  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a token for secure storage
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(16) // 128-bit IV for GCM
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  let encrypted = cipher.update(token, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  // Combine IV, auth tag, and encrypted data
  // Format: iv:authTag:encryptedData (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt a token from secure storage
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey()
  
  // Split the combined string
  const parts = encryptedToken.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }
  
  const [ivBase64, authTagBase64, encrypted] = parts
  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Generate a secure encryption key for initial setup
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Encrypt sensitive integration data
 */
export function encryptIntegrationData(data: any): string {
  return encryptToken(JSON.stringify(data))
}

/**
 * Decrypt sensitive integration data
 */
export function decryptIntegrationData(encryptedData: string): any {
  return JSON.parse(decryptToken(encryptedData))
}

/**
 * Hash a token for comparison without storing the actual value
 * Useful for webhook secrets
 */
export function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
}

/**
 * Verify a token against a hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  const tokenHash = hashToken(token)
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(hash)
  )
}