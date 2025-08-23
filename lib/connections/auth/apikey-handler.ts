/**
 * API Key Handler - Manages API key-based authentication
 */

import { ConnectionProvider } from '../core/types'

export class ApiKeyHandler {
  /**
   * Test if an API key is valid
   */
  async testApiKey(
    provider: ConnectionProvider,
    apiKey: string,
    apiSecret?: string
  ): Promise<boolean> {
    if (!provider.apiKey?.testEndpoint) {
      // No test endpoint, assume valid
      return true
    }
    
    try {
      const headers: Record<string, string> = {}
      
      // Add API key to headers or query based on configuration
      if (provider.apiKey.location === 'header') {
        const keyName = provider.apiKey.keyName
        const prefix = provider.apiKey.keyPrefix || ''
        headers[keyName] = prefix ? `${prefix} ${apiKey}` : apiKey
        
        // Add secret if provided
        if (apiSecret && provider.apiKey.secretName) {
          headers[provider.apiKey.secretName] = apiSecret
        }
      }
      
      // Build URL with query params if needed
      let url = provider.apiKey.testEndpoint
      if (provider.apiKey.location === 'query') {
        const params = new URLSearchParams()
        params.append(provider.apiKey.keyName, apiKey)
        if (apiSecret && provider.apiKey.secretName) {
          params.append(provider.apiKey.secretName, apiSecret)
        }
        url = `${url}?${params.toString()}`
      }
      
      // Make test request
      const response = await fetch(url, {
        method: provider.apiKey.testMethod || 'GET',
        headers,
      })
      
      // Check if status is expected
      const expectedStatus = provider.apiKey.testExpectedStatus || [200]
      return expectedStatus.includes(response.status)
      
    } catch (error) {
      console.error('API key test failed:', error)
      return false
    }
  }
  
  /**
   * Build headers for API requests
   */
  buildHeaders(
    provider: ConnectionProvider,
    apiKey: string,
    apiSecret?: string
  ): Record<string, string> {
    const headers: Record<string, string> = {}
    
    if (!provider.apiKey) {
      return headers
    }
    
    if (provider.apiKey.location === 'header') {
      const keyName = provider.apiKey.keyName
      const prefix = provider.apiKey.keyPrefix || ''
      headers[keyName] = prefix ? `${prefix} ${apiKey}` : apiKey
      
      if (apiSecret && provider.apiKey.secretName) {
        headers[provider.apiKey.secretName] = apiSecret
      }
    }
    
    return headers
  }
  
  /**
   * Build URL with API key in query params
   */
  buildUrl(
    provider: ConnectionProvider,
    baseUrl: string,
    apiKey: string,
    apiSecret?: string
  ): string {
    if (!provider.apiKey || provider.apiKey.location !== 'query') {
      return baseUrl
    }
    
    const url = new URL(baseUrl)
    url.searchParams.append(provider.apiKey.keyName, apiKey)
    
    if (apiSecret && provider.apiKey.secretName) {
      url.searchParams.append(provider.apiKey.secretName, apiSecret)
    }
    
    return url.toString()
  }
}