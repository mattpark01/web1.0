import { OAuth2Config, IntegrationConnection } from './types'
import crypto from 'crypto'

export class OAuth2Client {
  constructor(private config: OAuth2Config) {}

  // Generate authorization URL for user to visit
  getAuthorizationUrl(state?: string, additionalParams?: Record<string, string>): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId!,
      redirect_uri: this.config.redirectUri!,
      response_type: this.config.responseType || 'code',
      scope: this.config.scopes.join(' '),
      state: state || this.generateState(),
      ...additionalParams,
    })

    if (this.config.accessType) {
      params.append('access_type', this.config.accessType)
    }

    if (this.config.pkce) {
      const codeVerifier = this.generateCodeVerifier()
      const codeChallenge = this.generateCodeChallenge(codeVerifier)
      params.append('code_challenge', codeChallenge)
      params.append('code_challenge_method', 'S256')
      // Store code_verifier in session/cache for later use
    }

    return `${this.config.authorizationUrl}?${params.toString()}`
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    tokenType?: string
    scope?: string
  }> {
    const params: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri!,
      client_id: this.config.clientId!,
    }

    if (this.config.clientSecret) {
      params.client_secret = this.config.clientSecret
    }

    if (codeVerifier) {
      params.code_verifier = codeVerifier
    }

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token exchange failed: ${error}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    tokenType?: string
  }> {
    const params: Record<string, string> = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId!,
    }

    if (this.config.clientSecret) {
      params.client_secret = this.config.clientSecret
    }

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token refresh failed: ${error}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    }
  }

  // Revoke token
  async revokeToken(token: string, tokenType: 'access_token' | 'refresh_token' = 'access_token'): Promise<void> {
    // Not all providers support token revocation
    // This is a best-effort attempt
    const revokeUrl = (this.config as any).revokeUrl
    if (!revokeUrl) {
      return
    }

    const params = new URLSearchParams({
      token,
      token_type_hint: tokenType,
    })

    if (this.config.clientId) {
      params.append('client_id', this.config.clientId)
    }

    if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret)
    }

    await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })
  }

  // PKCE helpers
  private generateState(): string {
    return crypto.randomBytes(32).toString('base64url')
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url')
  }

  private generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url')
  }

  // Check if token is expired
  static isTokenExpired(connection: IntegrationConnection): boolean {
    if (!connection.credentials.expiresAt) {
      return false
    }
    
    const now = new Date()
    const expiresAt = new Date(connection.credentials.expiresAt)
    
    // Consider token expired 5 minutes before actual expiry
    const bufferMs = 5 * 60 * 1000
    return now.getTime() > (expiresAt.getTime() - bufferMs)
  }
}