# Integration System Guide

## Overview
This guide explains how to add new third-party integrations to the SpatioLabs platform. The system supports any API service with OAuth 2.0, OAuth 1.0, API Key, or Basic authentication.

## Architecture Overview

```
/lib/integrations/
├── core/                     # Core integration framework
│   ├── types.ts             # Type definitions
│   ├── base-adapter.ts      # Base adapter class
│   ├── oauth2-client.ts     # OAuth 2.0 client
│   └── registry.ts          # Integration registry
├── providers/               # Integration implementations
│   ├── google-calendar/
│   │   ├── index.ts        # Provider definition & export
│   │   └── adapter.ts      # Adapter implementation
│   └── [your-service]/     # Your new integration
└── index.ts                # Registration & initialization
```

## Step-by-Step: Adding a New Integration

### 1. Create Provider Directory

Create a new directory for your integration:
```bash
mkdir -p lib/integrations/providers/[service-name]
```

Example: `lib/integrations/providers/slack/`

### 2. Define the Provider Configuration

Create `lib/integrations/providers/[service-name]/index.ts`:

```typescript
import { IntegrationProvider } from '../../core/types'
import { YourServiceAdapter } from './adapter'

export const yourServiceProvider: IntegrationProvider = {
  slug: 'your-service',  // Unique identifier (lowercase, hyphenated)
  name: 'Your Service',   // Display name
  description: 'Connect your Your Service account',
  iconUrl: '/icons/your-service.svg',  // Optional icon
  category: 'communication',  // One of: calendar, email, task, storage, communication, notes, development, analytics, crm, custom
  
  auth: {
    type: 'oauth2',  // or 'oauth1', 'api_key', 'basic', 'custom'
    config: {
      // For OAuth2:
      authorizationUrl: 'https://service.com/oauth/authorize',
      tokenUrl: 'https://service.com/oauth/token',
      scopes: ['read', 'write'],  // Required scopes
      responseType: 'code',
      accessType: 'offline',  // For refresh tokens
      grantType: 'authorization_code',
      pkce: false,  // Set true for public clients
      
      // For API Key:
      // headerName: 'X-API-Key',  // or queryParam: 'api_key'
      // placement: 'header',  // or 'query', 'body'
    },
  },
  
  api: {
    baseUrl: 'https://api.service.com/v1',
    version: 'v1',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    rateLimit: {
      requests: 100,
      period: 60,  // seconds
    },
  },
  
  features: ['sync', 'create', 'update', 'delete', 'webhooks'],  // Capabilities
  
  endpoints: {
    // Define available endpoints (optional, for documentation)
    list: {
      method: 'GET',
      path: '/items',
      description: 'List all items',
      paginated: true,
    },
    create: {
      method: 'POST',
      path: '/items',
      description: 'Create an item',
    },
    // ... more endpoints
  },
  
  dataMappings: {
    // Define how to map external fields to internal (optional)
    title: {
      externalField: 'name',
      internalField: 'title',
      transform: (value: string) => value.trim(),
    },
  },
  
  documentationUrl: 'https://docs.service.com/api',
  isVerified: false,  // Set true once tested
}

// Export adapter instance
export const yourServiceAdapter = new YourServiceAdapter(yourServiceProvider)
```

### 3. Implement the Adapter

Create `lib/integrations/providers/[service-name]/adapter.ts`:

```typescript
import { BaseIntegrationAdapter } from '../../core/base-adapter'
import { 
  IntegrationConnection, 
  IntegrationProvider, 
  SyncOptions, 
  SyncResult, 
  FetchParams 
} from '../../core/types'
import { OAuth2Client } from '../../core/oauth2-client'

// Define external data structure
export interface ExternalItem {
  id: string
  name: string
  // ... external API fields
}

// Define internal data structure
export interface InternalItem {
  id: string
  title: string
  externalId: string
  // ... your internal fields
}

export class YourServiceAdapter extends BaseIntegrationAdapter<InternalItem> {
  private oauth2Client: OAuth2Client

  constructor(provider: IntegrationProvider) {
    super(provider)
    // Initialize OAuth client if using OAuth2
    if (provider.auth.type === 'oauth2') {
      this.oauth2Client = new OAuth2Client(provider.auth.config as any)
    }
  }

  // 1. AUTHENTICATION - Exchange code for tokens
  async authenticate(config: Record<string, any>): Promise<IntegrationConnection> {
    if (this.provider.auth.type === 'oauth2') {
      const { code, codeVerifier, userId } = config
      
      // Exchange code for tokens
      const tokens = await this.oauth2Client.exchangeCodeForTokens(code, codeVerifier)
      
      // Get user info from the service
      const userInfo = await this.getUserInfo(tokens.accessToken)
      
      return {
        id: '',  // Will be set by database
        userId,
        providerId: this.provider.slug,
        connectionName: `${this.provider.name} - ${userInfo.email}`,
        accountId: userInfo.id,
        accountEmail: userInfo.email,
        credentials: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresIn 
            ? new Date(Date.now() + tokens.expiresIn * 1000) 
            : undefined,
          tokenType: tokens.tokenType,
          scopes: tokens.scope?.split(' '),
        },
        status: 'active',
        syncEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    } else if (this.provider.auth.type === 'api_key') {
      // Handle API key authentication
      const { apiKey, userId } = config
      
      return {
        id: '',
        userId,
        providerId: this.provider.slug,
        connectionName: this.provider.name,
        credentials: {
          apiKey,
        },
        status: 'active',
        syncEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
    
    throw new Error(`Auth type ${this.provider.auth.type} not implemented`)
  }

  // 2. TOKEN REFRESH - Refresh expired tokens
  async refreshToken(connection: IntegrationConnection): Promise<IntegrationConnection> {
    if (!connection.credentials.refreshToken) {
      throw new Error('No refresh token available')
    }

    const tokens = await this.oauth2Client.refreshAccessToken(
      connection.credentials.refreshToken
    )
    
    connection.credentials.accessToken = tokens.accessToken
    if (tokens.refreshToken) {
      connection.credentials.refreshToken = tokens.refreshToken
    }
    if (tokens.expiresIn) {
      connection.credentials.expiresAt = new Date(Date.now() + tokens.expiresIn * 1000)
    }
    connection.updatedAt = new Date()
    
    return connection
  }

  // 3. VALIDATE CONNECTION - Check if connection is valid
  async validateConnection(connection: IntegrationConnection): Promise<boolean> {
    try {
      // Check token expiry
      if (OAuth2Client.isTokenExpired(connection)) {
        await this.refreshToken(connection)
      }
      
      // Make a simple API call to verify connection
      await this.makeRequest(connection, '/user', { method: 'GET' })
      return true
    } catch (error) {
      console.error('Connection validation failed:', error)
      return false
    }
  }

  // 4. SYNC DATA - Sync data from external service
  async sync(connection: IntegrationConnection, options?: SyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      itemsProcessed: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsDeleted: 0,
      itemsFailed: 0,
      errors: [],
    }

    try {
      // Ensure token is valid
      if (OAuth2Client.isTokenExpired(connection)) {
        await this.refreshToken(connection)
      }

      // Fetch items from external service
      const items = await this.fetchExternalItems(connection, options?.since)
      
      result.itemsProcessed = items.length
      
      // Process each item
      for (const externalItem of items) {
        try {
          const internalItem = this.transformToInternal(externalItem)
          
          // Here you would typically:
          // 1. Check if item exists in your database
          // 2. Create or update accordingly
          // 3. Track the operation in result
          
          result.itemsCreated++ // or itemsUpdated++
        } catch (error) {
          result.itemsFailed++
          result.errors?.push({
            item: externalItem,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
      
      result.success = true
    } catch (error) {
      result.success = false
      result.errors?.push({
        item: null,
        error: error instanceof Error ? error.message : 'Sync failed',
      })
    }

    return result
  }

  // 5. FETCH DATA - Fetch data with filters
  async fetch(connection: IntegrationConnection, params?: FetchParams): Promise<InternalItem[]> {
    const externalItems = await this.fetchExternalItems(connection, params?.since)
    return externalItems.map(item => this.transformToInternal(item))
  }

  // 6. CREATE - Create item in external service (optional)
  async create(connection: IntegrationConnection, data: Partial<InternalItem>): Promise<InternalItem> {
    const externalData = this.transformToExternal(data as InternalItem)
    
    const created = await this.makeRequest<ExternalItem>(
      connection,
      '/items',
      {
        method: 'POST',
        body: JSON.stringify(externalData),
      }
    )
    
    return this.transformToInternal(created)
  }

  // 7. UPDATE - Update item in external service (optional)
  async update(
    connection: IntegrationConnection, 
    id: string, 
    data: Partial<InternalItem>
  ): Promise<InternalItem> {
    const externalData = this.transformToExternal(data as InternalItem)
    
    const updated = await this.makeRequest<ExternalItem>(
      connection,
      `/items/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(externalData),
      }
    )
    
    return this.transformToInternal(updated)
  }

  // 8. DELETE - Delete item from external service (optional)
  async delete(connection: IntegrationConnection, id: string): Promise<void> {
    await this.makeRequest(
      connection,
      `/items/${id}`,
      {
        method: 'DELETE',
      }
    )
  }

  // 9. TRANSFORM TO INTERNAL - Convert external data to internal format
  transformToInternal(external: ExternalItem): InternalItem {
    return {
      id: external.id,
      title: external.name,
      externalId: external.id,
      // Map other fields...
    }
  }

  // 10. TRANSFORM TO EXTERNAL - Convert internal data to external format
  transformToExternal(internal: InternalItem): Partial<ExternalItem> {
    return {
      name: internal.title,
      // Map other fields...
    }
  }

  // Helper: Get user info from service
  private async getUserInfo(accessToken: string): Promise<{ id: string; email: string }> {
    const response = await fetch(`${this.provider.api.baseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return response.json()
  }

  // Helper: Fetch items from external service
  private async fetchExternalItems(
    connection: IntegrationConnection,
    since?: Date
  ): Promise<ExternalItem[]> {
    const params = new URLSearchParams()
    if (since) {
      params.append('since', since.toISOString())
    }
    
    const response = await this.makeRequest<{ items: ExternalItem[] }>(
      connection,
      `/items?${params.toString()}`,
      { method: 'GET' }
    )
    
    return response.items || []
  }
}
```

### 4. Register the Integration

Add to `lib/integrations/index.ts`:

```typescript
import { yourServiceProvider, yourServiceAdapter } from './providers/your-service'

export function initializeIntegrations() {
  // ... existing registrations
  
  // Register your new integration
  integrationRegistry.register(yourServiceProvider, yourServiceAdapter)
}
```

### 5. Add Environment Variables

Add to `.env.local`:

```bash
# Your Service OAuth (use UPPERCASE, replace hyphens with underscores)
YOUR_SERVICE_CLIENT_ID=your_client_id_here
YOUR_SERVICE_CLIENT_SECRET=your_client_secret_here

# For API Key auth:
# YOUR_SERVICE_API_KEY=your_api_key_here
```

### 6. Update Database (if needed)

If your integration needs custom tables, create a migration:

```sql
-- migrations/004_your_service_integration.sql
-- Add any service-specific tables or columns
```

### 7. Create Integration Hook (Optional)

For app-specific integration logic, create a hook:

```typescript
// hooks/use-your-service.tsx
import { useState, useEffect } from 'react'
import { useCalendarIntegration } from './use-calendar-integration'

export function useYourService() {
  // Integration-specific logic
  // See use-calendar-integration.tsx for example
}
```

## Testing Your Integration

### 1. Test OAuth Flow
```bash
# Start the OAuth flow
curl http://localhost:3000/api/integrations/your-service/auth
```

### 2. Test Connection
```typescript
// Test script
const adapter = integrationRegistry.getAdapter('your-service')
const connection = await adapter.authenticate({ 
  code: 'test_code',
  userId: 'test_user' 
})
const isValid = await adapter.validateConnection(connection)
```

### 3. Test Sync
```typescript
const result = await adapter.sync(connection)
console.log('Sync result:', result)
```

## Common Integration Patterns

### Pagination
```typescript
protected async paginate<T>(
  connection: IntegrationConnection,
  endpoint: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const results: T[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const response = await this.makeRequest<any>(
      connection, 
      `${endpoint}?page=${page}&limit=100`
    )
    results.push(...response.data)
    hasMore = response.has_more
    page++
  }

  return results
}
```

### Rate Limiting
```typescript
private async rateLimitedRequest<T>(
  connection: IntegrationConnection,
  endpoint: string,
  options: RequestInit
): Promise<T> {
  // Implement rate limiting logic
  await this.checkRateLimit()
  const response = await this.makeRequest<T>(connection, endpoint, options)
  this.updateRateLimit()
  return response
}
```

### Webhook Support
```typescript
async subscribeWebhook(
  connection: IntegrationConnection, 
  events: string[]
): Promise<WebhookSubscription> {
  const webhook = await this.makeRequest(connection, '/webhooks', {
    method: 'POST',
    body: JSON.stringify({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/${connection.id}`,
      events,
    }),
  })
  
  return {
    id: webhook.id,
    connectionId: connection.id,
    webhookId: webhook.id,
    events,
    callbackUrl: webhook.url,
    secret: webhook.secret,
    isActive: true,
    verifiedAt: new Date(),
    lastReceivedAt: null,
    failureCount: 0,
  }
}
```

## Debugging Tips

1. **Enable Debug Logging**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[YourService] Making request:', endpoint)
  console.log('[YourService] Response:', response)
}
```

2. **Test with Postman/Insomnia**
First test the external API directly to understand its behavior.

3. **Check Token Expiry**
Always verify tokens before making requests:
```typescript
if (OAuth2Client.isTokenExpired(connection)) {
  connection = await this.refreshToken(connection)
}
```

4. **Handle Errors Gracefully**
```typescript
try {
  // Your code
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired, refresh and retry
  } else if (error.response?.status === 429) {
    // Rate limited, wait and retry
  } else {
    // Other error
  }
}
```

## Security Considerations

1. **Never commit credentials** - Use environment variables
2. **Encrypt tokens in database** - Use encryption for sensitive data
3. **Validate webhooks** - Verify webhook signatures
4. **Use PKCE for public clients** - Set `pkce: true` for SPAs
5. **Implement CSRF protection** - Use state parameter in OAuth
6. **Sanitize user input** - Validate and sanitize all inputs
7. **Rate limit your endpoints** - Prevent abuse

## Common Services Quick Reference

### Google Services
- Auth URL: `https://accounts.google.com/o/oauth2/v2/auth`
- Token URL: `https://oauth2.googleapis.com/token`
- API Base: `https://www.googleapis.com/[service]/v[version]`

### Microsoft/Office 365
- Auth URL: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- Token URL: `https://login.microsoftonline.com/common/oauth2/v2.0/token`
- API Base: `https://graph.microsoft.com/v1.0`

### Slack
- Auth URL: `https://slack.com/oauth/v2/authorize`
- Token URL: `https://slack.com/api/oauth.v2.access`
- API Base: `https://slack.com/api`

### GitHub
- Auth URL: `https://github.com/login/oauth/authorize`
- Token URL: `https://github.com/login/oauth/access_token`
- API Base: `https://api.github.com`

### Notion
- Auth URL: `https://api.notion.com/v1/oauth/authorize`
- Token URL: `https://api.notion.com/v1/oauth/token`
- API Base: `https://api.notion.com/v1`

## Support

For questions or issues with integrations:
1. Check this guide first
2. Review existing integrations in `/lib/integrations/providers/`
3. Check the external service's API documentation
4. Test with the service's API explorer/sandbox