# Generic Connection System Design

## Current Limitations

1. **Hardcoded Provider Enum**: The `IntegrationProvider` enum in Prisma schema limits us to predefined providers
2. **Static Provider Mapping**: The `providerEnumMap` in connection-manager.ts requires manual mapping
3. **No Dynamic Provider Loading**: All providers must be defined at compile time

## Proposed Solution: Generic Connection Architecture

### 1. Database Schema Changes

Replace the enum-based provider with a flexible string-based approach:

```prisma
model Integration {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Change from enum to string reference
  providerId   String   // e.g., "google-calendar", "custom-api-123"
  providerType String   // e.g., "oauth2", "api_key", "webhook"
  
  // Generic credential storage (encrypted)
  credentials  Json     @db.JsonB  // Flexible JSON for any auth type
  
  // OAuth2 specific (optional)
  accessToken  String?  @db.Text
  refreshToken String?  @db.Text
  expiresAt    DateTime?
  tokenType    String?  @default("Bearer")
  
  // Account identification
  accountId    String   @default("default")
  accountEmail String?
  scopes       String[]
  
  // Connection status
  status       IntegrationStatus @default(ACTIVE)
  errorMessage String? @db.Text
  errorCount   Int     @default(0)
  
  // Metadata
  metadata     Json?    @db.JsonB  // Custom provider data
  
  // Timestamps
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  lastSyncedAt DateTime?
  lastUsedAt   DateTime?
  
  @@unique([userId, providerId, accountId])
  @@index([userId, providerId])
  @@index([providerId])
}

model ConnectionProvider {
  id           String   @id // e.g., "google-calendar"
  name         String   // Display name
  category     String   // e.g., "calendar", "email", "custom"
  authType     String   // "oauth2", "api_key", "webhook", etc.
  
  // Provider configuration (JSON)
  config       Json     @db.JsonB  // Full provider config
  
  // Discovery
  isCustom     Boolean  @default(false)
  isPublic     Boolean  @default(true)
  createdBy    String?  // User ID for custom providers
  
  // Metadata
  logoUrl      String?
  documentation String?
  version      String   @default("1.0.0")
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([category])
  @@index([createdBy])
}
```

### 2. Provider Registry Enhancement

```typescript
// lib/connections/core/provider-registry.ts

export class ProviderRegistry {
  private providers = new Map<string, ConnectionProvider>()
  
  async loadFromDatabase(): Promise<void> {
    // Load all providers from ConnectionProvider table
    const dbProviders = await prisma.connectionProvider.findMany({
      where: { isPublic: true }
    })
    
    for (const provider of dbProviders) {
      this.providers.set(provider.id, {
        id: provider.id,
        name: provider.name,
        category: provider.category,
        authType: provider.authType as any,
        ...provider.config as any
      })
    }
  }
  
  async registerCustomProvider(
    userId: string,
    provider: ConnectionProvider
  ): Promise<string> {
    // Generate unique ID for custom provider
    const providerId = `custom-${userId}-${Date.now()}`
    
    // Store in database
    await prisma.connectionProvider.create({
      data: {
        id: providerId,
        name: provider.name,
        category: provider.category || 'custom',
        authType: provider.authType,
        config: provider as any,
        isCustom: true,
        isPublic: false,
        createdBy: userId
      }
    })
    
    // Add to registry
    this.providers.set(providerId, {
      ...provider,
      id: providerId
    })
    
    return providerId
  }
}
```

### 3. Dynamic Provider Configuration

Allow users to add custom providers via UI or API:

```typescript
// Example: Adding a custom API provider
const customProvider = {
  name: "My Custom API",
  category: "custom",
  authType: "api_key",
  apiKey: {
    location: "header",
    keyName: "X-API-Key",
    testEndpoint: "https://api.example.com/health",
    testMethod: "GET",
    testExpectedStatus: [200]
  },
  rateLimits: {
    requestsPerMinute: 60
  }
}

const providerId = await providerRegistry.registerCustomProvider(
  userId,
  customProvider
)
```

### 4. Connection Manager Updates

```typescript
// lib/connections/core/connection-manager.ts

private async storeConnection(
  userId: string,
  providerId: string,
  credentials: Partial<ConnectionCredentials>
): Promise<ConnectionCredentials> {
  // No more enum mapping needed!
  
  const encryptedCredentials = this.encryptCredentials(credentials)
  
  const connection = await prisma.integration.upsert({
    where: {
      userId_providerId_accountId: {
        userId,
        providerId, // Direct string, no enum
        accountId: credentials.accountId || 'default',
      },
    },
    update: {
      credentials: encryptedCredentials,
      status: 'ACTIVE',
      errorMessage: null,
      errorCount: 0,
      lastSyncedAt: new Date(),
    },
    create: {
      userId,
      providerId, // Direct string, no enum
      providerType: provider.authType,
      credentials: encryptedCredentials,
      accountId: credentials.accountId || 'default',
      status: 'ACTIVE',
    },
  })
  
  return this.mapToConnectionCredentials(connection)
}
```

### 5. Provider Discovery API

```typescript
// app/api/providers/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  
  // Get public providers
  const providers = await prisma.connectionProvider.findMany({
    where: {
      AND: [
        { isPublic: true },
        category ? { category } : {},
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } }
          ]
        } : {}
      ]
    }
  })
  
  return NextResponse.json(providers)
}

export async function POST(request: Request) {
  // Add custom provider
  const session = await getSession()
  if (!session) return unauthorized()
  
  const provider = await request.json()
  
  const providerId = await providerRegistry.registerCustomProvider(
    session.userId,
    provider
  )
  
  return NextResponse.json({ providerId })
}
```

### 6. Provider Templates

Pre-built templates for common integration patterns:

```typescript
const templates = {
  'rest-api-bearer': {
    name: "REST API with Bearer Token",
    authType: "api_key",
    apiKey: {
      location: "header",
      keyName: "Authorization",
      keyPrefix: "Bearer ",
      testEndpoint: "{{baseUrl}}/health"
    }
  },
  'webhook-hmac': {
    name: "Webhook with HMAC Signature",
    authType: "webhook",
    webhooks: {
      supportsWebhooks: true,
      signatureHeader: "X-Signature",
      signatureAlgorithm: "hmac-sha256"
    }
  },
  'oauth2-standard': {
    name: "Standard OAuth 2.0",
    authType: "oauth2",
    oauth2: {
      authUrl: "{{baseUrl}}/oauth/authorize",
      tokenUrl: "{{baseUrl}}/oauth/token",
      scopes: []
    }
  }
}
```

## Migration Path

1. **Phase 1**: Add new tables without removing old enum
2. **Phase 2**: Migrate existing connections to new schema
3. **Phase 3**: Update connection manager to use new schema
4. **Phase 4**: Add UI for custom provider management
5. **Phase 5**: Remove old enum-based code

## Benefits

1. **Infinite Scalability**: Add any number of providers without code changes
2. **User-Defined Integrations**: Users can add their own custom APIs
3. **Provider Marketplace**: Share and discover community providers
4. **Version Management**: Track provider configuration versions
5. **Multi-tenant Support**: Each organization can have custom providers
6. **Dynamic Configuration**: Update provider settings without deployment

## Example Use Cases

1. **Custom Internal APIs**: Connect to company-specific services
2. **Regional Variations**: Different OAuth endpoints for different regions
3. **Beta Integrations**: Test new providers before making them public
4. **White-label Solutions**: Customers can brand their own integrations
5. **API Aggregators**: Create meta-providers that combine multiple APIs

## Security Considerations

1. **Provider Validation**: Validate provider configurations before storage
2. **Credential Encryption**: All credentials encrypted at rest
3. **Scope Management**: Enforce minimum required scopes
4. **Rate Limiting**: Apply rate limits per provider and user
5. **Audit Logging**: Track all connection activities

## Next Steps

1. Create migration scripts for database schema
2. Update connection manager to support dynamic providers
3. Build provider management UI
4. Create provider validation service
5. Implement provider templates system
6. Add import/export functionality for provider configs