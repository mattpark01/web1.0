# Add New Integration Command

## Description
This command helps you add a new third-party integration to the SpatioLabs platform. It follows the integration guide to create all necessary files and configurations for connecting external services via OAuth2.0, API keys, or other authentication methods.

## Usage
```
/add-new-integration <service-name> [auth-type] [category]
```

## Arguments
- `service-name` (required): The name of the service to integrate (e.g., "slack", "notion", "github")
- `auth-type` (optional): Authentication type - "oauth2" (default), "api_key", "basic", or "custom"
- `category` (optional): Service category - "calendar", "email", "task", "storage", "communication", "notes", "development", "analytics", "crm", or "custom"

## Examples
```
/add-new-integration slack
/add-new-integration notion oauth2 notes
/add-new-integration sendgrid api_key email
/add-new-integration jira oauth2 task
```
h
## What This Command Does

1. **Creates Provider Directory Structure**
   - `/lib/integrations/providers/[service-name]/`
   - `index.ts` - Provider configuration
   - `adapter.ts` - Adapter implementation

2. **Generates Provider Configuration**
   - Sets up OAuth2.0/API key configuration
   - Defines API endpoints and rate limits
   - Configures data mappings

3. **Implements Adapter Class**
   - Authentication methods
   - Token refresh logic
   - Data sync operations
   - CRUD operations (create, read, update, delete)
   - Data transformation methods

4. **Registers Integration**
   - Adds to `/lib/integrations/index.ts`
   - Makes it available system-wide

5. **Creates Environment Variables Template**
   - Generates `.env.example` entries
   - Documents required credentials

6. **Generates Database Migration** (if needed)
   - Creates migration file for service-specific tables
   - Updates Prisma schema if required

7. **Creates Integration Hook** (optional)
   - Generates React hook for using the integration
   - Provides methods for common operations

8. **Adds API Routes**
   - OAuth callback handling
   - Webhook endpoints (if applicable)

## Integration Guide Reference

This command follows the comprehensive integration guide located at:
`/docs/INTEGRATION_GUIDE.md`

The guide contains:
- Architecture overview
- Step-by-step implementation details
- Security best practices
- Common patterns (pagination, rate limiting, webhooks)
- Debugging tips
- Service-specific configurations

## Required Information

When you run this command, I will need to know:

### For OAuth2 Integrations:
- Authorization URL
- Token URL
- Required scopes
- API base URL
- Whether PKCE is needed (for public clients)

### For API Key Integrations:
- Header name or query parameter for the key
- API base URL
- Rate limits

### For All Integrations:
- Main entities to sync (e.g., events, messages, tasks)
- Data field mappings
- Supported operations (read-only vs full CRUD)
- Webhook support requirements

## Post-Creation Steps

After running this command, you'll need to:

1. **Add Credentials**
   ```bash
   # Add to .env.local
   [SERVICE]_CLIENT_ID=your_client_id
   [SERVICE]_CLIENT_SECRET=your_client_secret
   ```

2. **Register OAuth App** (for OAuth2)
   - Go to the service's developer console
   - Create a new OAuth application
   - Set redirect URI to: `https://yourapp.com/api/integrations/[service]/callback`
   - Copy client ID and secret

3. **Test the Integration**
   ```bash
   # Start OAuth flow
   curl http://localhost:3000/api/integrations/[service]/auth
   
   # Or test with the hook
   const { connectProvider } = useYourServiceIntegration()
   connectProvider('[service]')
   ```

4. **Run Database Migration** (if created)
   ```bash
   npx prisma migrate dev
   ```

## Common Service Templates

The command includes templates for popular services:
- **Google** (Calendar, Drive, Gmail)
- **Microsoft** (Outlook, OneDrive, Teams)
- **Slack** (Messages, Channels)
- **GitHub** (Repos, Issues, PRs)
- **Notion** (Pages, Databases)
- **Linear** (Issues, Projects)
- **Jira** (Issues, Projects)
- **Salesforce** (CRM)
- **Stripe** (Payments)
- **SendGrid/Mailgun** (Email)

## Error Handling

The command will:
- Check if integration already exists
- Validate service name format
- Ensure required directories exist
- Verify database connection
- Test API endpoint accessibility (if possible)

## Rollback

If you need to remove an integration:
```
/remove-integration <service-name>
```

This will:
- Remove provider files
- Unregister from index
- Clean up database entries
- Remove environment variables from example

## Support

For service-specific API documentation:
- Check the service's developer docs
- Look for OAuth2.0 or API authentication guides
- Find rate limits and best practices
- Review webhook documentation if needed

## Security Notes

The generated integration will include:
- CSRF protection via state parameter
- Token encryption recommendations
- Webhook signature verification
- Input sanitization
- Rate limiting implementation
- Secure credential storage

## Testing Checklist

After creation, test:
- [ ] OAuth flow completes successfully
- [ ] Tokens refresh properly
- [ ] Data syncs correctly
- [ ] CRUD operations work
- [ ] Webhooks receive events (if applicable)
- [ ] Rate limiting is respected
- [ ] Error handling works properly
- [ ] Disconnection cleans up properly