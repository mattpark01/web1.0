/**
 * OAuth Handler - Generic OAuth2 implementation
 * Works with any OAuth2 provider
 */

import { ConnectionProvider } from '../core/types'

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  tokenType?: string
  expiresIn?: number
  expiresAt?: Date
  scopes?: string[]
}

export class OAuthHandler {
  /**
   * Build OAuth authorization URL
   */
  buildAuthUrl(
    provider: ConnectionProvider,
    options: {
      state: string
      redirectUri: string
      scopes?: string[]
    }
  ): string {
    if (!provider.oauth2) {
      throw new Error('Provider does not support OAuth2')
    }
    
    // Use unified Google credentials for all Google services
    const clientIdKey = provider.id.startsWith('google-') 
      ? 'GOOGLE_CLIENT_ID'
      : `${provider.id.toUpperCase().replace('-', '_')}_CLIENT_ID`
    
    const params = new URLSearchParams({
      client_id: process.env[clientIdKey] || '',
      redirect_uri: options.redirectUri,
      response_type: 'code',
      state: options.state,
    })
    
    // Add scopes
    const scopes = options.scopes || (
      typeof provider.oauth2.scopes === 'function' 
        ? provider.oauth2.scopes()
        : provider.oauth2.scopes
    )
    
    if (scopes.length > 0) {
      const separator = provider.oauth2.scopeSeparator || ' '
      params.append('scope', scopes.join(separator))
    }
    
    // Add additional auth params
    if (provider.oauth2.authParams) {
      Object.entries(provider.oauth2.authParams).forEach(([key, value]) => {
        params.append(key, value)
      })
    }
    
    return `${provider.oauth2.authUrl}?${params.toString()}`
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    provider: ConnectionProvider,
    code: string,
    redirectUri: string
  ): Promise<OAuthTokens> {
    if (!provider.oauth2) {
      throw new Error('Provider does not support OAuth2')
    }
    
    // Use unified Google credentials for all Google services
    const clientIdKey = provider.id.startsWith('google-') 
      ? 'GOOGLE_CLIENT_ID'
      : `${provider.id.toUpperCase().replace('-', '_')}_CLIENT_ID`
    const clientSecretKey = provider.id.startsWith('google-') || provider.id === 'gmail'
      ? 'GOOGLE_CLIENT_SECRET'
      : `${provider.id.toUpperCase().replace('-', '_')}_CLIENT_SECRET`
    
    const clientId = process.env[clientIdKey]
    const clientSecret = process.env[clientSecretKey]
    
    if (!clientId || !clientSecret) {
      throw new Error(`OAuth credentials not configured for ${provider.id}`)
    }
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    })
    
    // Add additional token params
    if (provider.oauth2.tokenParams) {
      Object.entries(provider.oauth2.tokenParams).forEach(([key, value]) => {
        params.append(key, value)
      })
    }
    
    const response = await fetch(provider.oauth2.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token exchange failed: ${error}`)
    }
    
    const data = await response.json()
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      expiresAt: data.expires_in 
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scopes: data.scope ? data.scope.split(' ') : undefined,
    }
  }
  
  /**
   * Refresh access token
   */
  async refreshAccessToken(
    provider: ConnectionProvider,
    refreshToken: string
  ): Promise<OAuthTokens> {
    if (!provider.oauth2) {
      throw new Error('Provider does not support OAuth2')
    }
    
    // Use unified Google credentials for all Google services
    const clientIdKey = provider.id.startsWith('google-') 
      ? 'GOOGLE_CLIENT_ID'
      : `${provider.id.toUpperCase().replace('-', '_')}_CLIENT_ID`
    const clientSecretKey = provider.id.startsWith('google-') || provider.id === 'gmail'
      ? 'GOOGLE_CLIENT_SECRET'
      : `${provider.id.toUpperCase().replace('-', '_')}_CLIENT_SECRET`
    
    const clientId = process.env[clientIdKey]
    const clientSecret = process.env[clientSecretKey]
    
    if (!clientId || !clientSecret) {
      throw new Error(`OAuth credentials not configured for ${provider.id}`)
    }
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    })
    
    const response = await fetch(provider.oauth2.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token refresh failed: ${error}`)
    }
    
    const data = await response.json()
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Some providers don't return new refresh token
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      expiresAt: data.expires_in 
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scopes: data.scope ? data.scope.split(' ') : undefined,
    }
  }
  
  /**
   * Get user info from provider
   */
  async getUserInfo(
    provider: ConnectionProvider,
    accessToken: string
  ): Promise<any> {
    if (!provider.oauth2?.userInfoUrl) {
      return {}
    }
    
    const response = await fetch(provider.oauth2.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.warn('Failed to fetch user info:', response.status)
      return {}
    }
    
    const data = await response.json()
    
    // Map to standard fields if mapping provided
    if (provider.oauth2.userInfoMapping) {
      const mapped: any = {}
      
      for (const [key, value] of Object.entries(provider.oauth2.userInfoMapping)) {
        if (typeof value === 'function') {
          mapped[key] = value(data)
        } else if (typeof value === 'string') {
          mapped[key] = data[value]
        }
      }
      
      return mapped
    }
    
    return data
  }
  
  /**
   * Revoke access token
   */
  async revokeToken(
    provider: ConnectionProvider,
    token: string
  ): Promise<boolean> {
    if (!provider.oauth2?.revokeUrl) {
      return false
    }
    
    try {
      const response = await fetch(provider.oauth2.revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token,
        }).toString(),
      })
      
      return response.ok
    } catch (error) {
      console.error('Token revocation failed:', error)
      return false
    }
  }
}