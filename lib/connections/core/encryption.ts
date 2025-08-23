/**
 * Production-ready encryption for credentials
 * Uses AES-256-GCM encryption
 */

import crypto from 'crypto'

export class CredentialEncryption {
  private algorithm = 'aes-256-gcm'
  private keyLength = 32
  private ivLength = 16
  private saltLength = 64
  private tagLength = 16
  private iterations = 100000
  
  private masterKey: Buffer
  
  constructor(masterKeyOrPassword?: string) {
    // Use environment variable or provided key
    const key = masterKeyOrPassword || process.env.CONNECTION_ENCRYPTION_KEY
    
    if (!key) {
      throw new Error('Encryption key not configured. Set CONNECTION_ENCRYPTION_KEY environment variable.')
    }
    
    // If key looks like base64, decode it
    if (key.match(/^[A-Za-z0-9+/]+=*$/)) {
      this.masterKey = Buffer.from(key, 'base64')
    } else {
      // Derive key from password
      const salt = crypto.createHash('sha256').update('spatiolabs-connections').digest()
      this.masterKey = crypto.pbkdf2Sync(key, salt, this.iterations, this.keyLength, 'sha256')
    }
    
    if (this.masterKey.length !== this.keyLength) {
      throw new Error(`Invalid encryption key length. Expected ${this.keyLength} bytes.`)
    }
  }
  
  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string): string {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength)
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv)
      
      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ])
      
      // Get auth tag
      const authTag = cipher.getAuthTag()
      
      // Combine IV + authTag + encrypted data
      const combined = Buffer.concat([iv, authTag, encrypted])
      
      // Return base64 encoded
      return combined.toString('base64')
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64')
      
      // Extract components
      const iv = combined.slice(0, this.ivLength)
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength)
      const encrypted = combined.slice(this.ivLength + this.tagLength)
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv)
      decipher.setAuthTag(authTag)
      
      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ])
      
      return decrypted.toString('utf8')
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Encrypt an object (JSON)
   */
  encryptObject(obj: any): string {
    return this.encrypt(JSON.stringify(obj))
  }
  
  /**
   * Decrypt an object (JSON)
   */
  decryptObject<T = any>(encryptedData: string): T {
    return JSON.parse(this.decrypt(encryptedData))
  }
  
  /**
   * Generate a secure random key for new installations
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('base64')
  }
  
  /**
   * Hash API keys for storage (one-way)
   */
  static hashApiKey(apiKey: string): string {
    return crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex')
  }
  
  /**
   * Generate secure state token for OAuth
   */
  static generateStateToken(): string {
    return crypto.randomBytes(32).toString('base64url')
  }
  
  /**
   * Verify webhook signatures
   */
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha1' = 'sha256'
  ): boolean {
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex')
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
}

// Export singleton instance
export const encryption = new CredentialEncryption()