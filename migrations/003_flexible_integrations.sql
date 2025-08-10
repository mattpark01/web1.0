-- Flexible Third-Party Integration System
-- Allows any app to register and connect via OAuth2.0 or other auth methods

-- Drop the existing enum constraint to make it more flexible
ALTER TABLE "Integration" 
ALTER COLUMN "provider" TYPE TEXT;

-- Create integration_providers table for dynamic provider registration
CREATE TABLE integration_providers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL, -- e.g., 'google-calendar', 'slack', 'notion'
  name TEXT NOT NULL, -- Display name
  description TEXT,
  icon_url TEXT,
  category TEXT NOT NULL, -- 'calendar', 'email', 'task', 'storage', 'communication', etc.
  
  -- Auth configuration
  auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth2', 'oauth1', 'api_key', 'basic', 'custom')),
  auth_config JSONB NOT NULL DEFAULT '{}', -- Stores OAuth URLs, scopes, etc.
  
  -- API configuration
  api_base_url TEXT,
  api_version TEXT,
  rate_limit JSONB, -- {"requests": 100, "period": 3600}
  
  -- Feature flags
  features TEXT[] DEFAULT '{}', -- ['sync', 'webhooks', 'realtime', etc.]
  
  -- Endpoint mappings
  endpoints JSONB DEFAULT '{}', -- Define available endpoints
  data_mappings JSONB DEFAULT '{}', -- Map external data to internal format
  
  -- Metadata
  documentation_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false, -- For trusted integrations
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create integration_connections table (extending existing Integration model)
CREATE TABLE integration_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES integration_providers(id) ON DELETE CASCADE,
  
  -- Connection details
  connection_name TEXT, -- User-friendly name for this connection
  account_id TEXT, -- External account ID
  account_email TEXT,
  
  -- Credentials (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  api_key TEXT,
  expires_at TIMESTAMP,
  token_type TEXT,
  
  -- Additional auth data
  scopes TEXT[],
  raw_credentials JSONB, -- Store any additional auth data
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'expired', 'revoked')),
  error_message TEXT,
  
  -- Sync settings
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency INTEGER, -- in minutes
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  webhook_url TEXT, -- For receiving updates
  webhook_secret TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, provider_id, account_id)
);

-- Create integration_sync_logs table
CREATE TABLE integration_sync_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  connection_id TEXT NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'webhook'
  direction TEXT NOT NULL CHECK (direction IN ('pull', 'push', 'bidirectional')),
  
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_deleted INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  error_message TEXT,
  error_details JSONB,
  
  metadata JSONB DEFAULT '{}'
);

-- Create integration_data_cache table for storing synced data
CREATE TABLE integration_data_cache (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  connection_id TEXT NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL, -- 'event', 'task', 'email', 'file', etc.
  external_id TEXT NOT NULL, -- ID from the external service
  internal_id TEXT, -- ID in our system (references appropriate table)
  
  data JSONB NOT NULL, -- Cached data from external service
  checksum TEXT, -- For detecting changes
  
  last_modified TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(connection_id, entity_type, external_id)
);

-- Create webhook_subscriptions table
CREATE TABLE webhook_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  connection_id TEXT NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  
  webhook_id TEXT, -- External webhook ID
  events TEXT[], -- Events to listen for
  callback_url TEXT NOT NULL,
  secret TEXT,
  
  is_active BOOLEAN DEFAULT true,
  verified_at TIMESTAMP,
  last_received_at TIMESTAMP,
  failure_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_integration_providers_slug ON integration_providers(slug);
CREATE INDEX idx_integration_providers_category ON integration_providers(category);
CREATE INDEX idx_integration_providers_active ON integration_providers(is_active);

CREATE INDEX idx_integration_connections_user ON integration_connections(user_id);
CREATE INDEX idx_integration_connections_provider ON integration_connections(provider_id);
CREATE INDEX idx_integration_connections_status ON integration_connections(status);
CREATE INDEX idx_integration_connections_sync ON integration_connections(sync_enabled, next_sync_at);

CREATE INDEX idx_integration_sync_logs_connection ON integration_sync_logs(connection_id);
CREATE INDEX idx_integration_sync_logs_status ON integration_sync_logs(status);

CREATE INDEX idx_integration_data_cache_connection ON integration_data_cache(connection_id);
CREATE INDEX idx_integration_data_cache_entity ON integration_data_cache(entity_type);
CREATE INDEX idx_integration_data_cache_internal ON integration_data_cache(internal_id);

CREATE INDEX idx_webhook_subscriptions_connection ON webhook_subscriptions(connection_id);
CREATE INDEX idx_webhook_subscriptions_active ON webhook_subscriptions(is_active);

-- Seed some initial providers (examples)
INSERT INTO integration_providers (slug, name, category, auth_type, auth_config, api_base_url, features) VALUES
('google-calendar', 'Google Calendar', 'calendar', 'oauth2', 
 '{"authorization_url": "https://accounts.google.com/o/oauth2/v2/auth", 
   "token_url": "https://oauth2.googleapis.com/token",
   "scopes": ["https://www.googleapis.com/auth/calendar.readonly", "https://www.googleapis.com/auth/calendar.events"],
   "response_type": "code",
   "access_type": "offline"}',
 'https://www.googleapis.com/calendar/v3',
 ARRAY['sync', 'webhooks', 'create', 'update', 'delete']),

('slack', 'Slack', 'communication', 'oauth2',
 '{"authorization_url": "https://slack.com/oauth/v2/authorize",
   "token_url": "https://slack.com/api/oauth.v2.access",
   "scopes": ["channels:read", "chat:write", "users:read"]}',
 'https://slack.com/api',
 ARRAY['sync', 'webhooks', 'realtime']),

('notion', 'Notion', 'notes', 'oauth2',
 '{"authorization_url": "https://api.notion.com/v1/oauth/authorize",
   "token_url": "https://api.notion.com/v1/oauth/token",
   "scopes": []}',
 'https://api.notion.com/v1',
 ARRAY['sync', 'create', 'update']),

('github', 'GitHub', 'development', 'oauth2',
 '{"authorization_url": "https://github.com/login/oauth/authorize",
   "token_url": "https://github.com/login/oauth/access_token",
   "scopes": ["repo", "user"]}',
 'https://api.github.com',
 ARRAY['sync', 'webhooks', 'create', 'update', 'delete']);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integration_providers_updated_at BEFORE UPDATE
ON integration_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_connections_updated_at BEFORE UPDATE
ON integration_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_subscriptions_updated_at BEFORE UPDATE
ON webhook_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();