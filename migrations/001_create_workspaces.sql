-- Migration: Create workspace tables for user cloud machines
-- Date: 2025-08-08

-- 1. Create workspaces table for user workspace management
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL UNIQUE,
    hostname TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('active', 'suspended', 'stopped', 'provisioning', 'error')),
    tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'power')),
    
    -- Environment configuration
    environment JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Storage configuration
    storage JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Resource limits
    resources JSONB DEFAULT '{
        "cpu": "0.25",
        "memory": "512Mi",
        "storage": "1Gi",
        "timeout": "60m"
    }'::jsonb,
    
    -- Networking
    ip_address TEXT,
    dns_name TEXT,
    ports JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP(3),
    suspended_at TIMESTAMP(3),
    
    -- Cloud Run specific
    service_url TEXT,
    service_revision TEXT,
    
    -- Usage tracking
    total_runtime_seconds INTEGER DEFAULT 0,
    total_storage_bytes BIGINT DEFAULT 0
);

-- 2. Create workspace_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS workspace_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    
    -- Connection details
    websocket_id TEXT,
    terminal_pid INTEGER,
    connection_ip TEXT,
    user_agent TEXT,
    
    -- Session state
    state TEXT NOT NULL CHECK (state IN ('connecting', 'active', 'idle', 'disconnected')),
    idle_since TIMESTAMP(3),
    
    -- Timestamps
    started_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP(3),
    
    -- Session data
    terminal_buffer TEXT,
    environment_vars JSONB DEFAULT '{}'::jsonb,
    working_directory TEXT DEFAULT '/home/user'
);

-- 3. Create workspace_events table for audit trail
CREATE TABLE IF NOT EXISTS workspace_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create workspace_packages table to track installed software
CREATE TABLE IF NOT EXISTS workspace_packages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    package_name TEXT NOT NULL,
    package_version TEXT,
    installed_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, package_name)
);

-- 5. Create indexes for performance
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX idx_workspaces_state ON workspaces(state);
CREATE INDEX idx_workspaces_tier ON workspaces(tier);
CREATE INDEX idx_workspaces_last_accessed ON workspaces(last_accessed_at DESC);

CREATE INDEX idx_sessions_workspace_id ON workspace_sessions(workspace_id);
CREATE INDEX idx_sessions_user_id ON workspace_sessions(user_id);
CREATE INDEX idx_sessions_state ON workspace_sessions(state);
CREATE INDEX idx_sessions_last_activity ON workspace_sessions(last_activity_at DESC);

CREATE INDEX idx_events_workspace_id ON workspace_events(workspace_id);
CREATE INDEX idx_events_user_id ON workspace_events(user_id);
CREATE INDEX idx_events_created_at ON workspace_events(created_at DESC);

-- 6. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workspaces_updated_at 
    BEFORE UPDATE ON workspaces 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Add workspace_id to User table if needed
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS active_workspace_id TEXT REFERENCES workspaces(workspace_id) ON DELETE SET NULL;

-- 8. Create view for active workspaces
CREATE OR REPLACE VIEW active_workspaces AS
SELECT 
    w.*,
    u.email as user_email,
    u.username,
    COUNT(ws.id) as active_sessions,
    MAX(ws.last_activity_at) as last_session_activity
FROM workspaces w
JOIN "User" u ON w.user_id = u.id
LEFT JOIN workspace_sessions ws ON w.workspace_id = ws.workspace_id AND ws.state = 'active'
WHERE w.state IN ('active', 'suspended')
GROUP BY w.id, u.email, u.username;

-- 9. Create function to clean up idle workspaces
CREATE OR REPLACE FUNCTION cleanup_idle_workspaces()
RETURNS void AS $$
BEGIN
    -- Suspend workspaces idle for more than 5 minutes (free tier)
    UPDATE workspaces 
    SET state = 'suspended', suspended_at = CURRENT_TIMESTAMP
    WHERE tier = 'free' 
        AND state = 'active'
        AND last_accessed_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes';
    
    -- Stop workspaces idle for more than 30 minutes (basic tier)
    UPDATE workspaces 
    SET state = 'stopped'
    WHERE tier = 'basic' 
        AND state = 'active'
        AND last_accessed_at < CURRENT_TIMESTAMP - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- 10. Add comment documentation
COMMENT ON TABLE workspaces IS 'Stores user workspace configurations and state';
COMMENT ON TABLE workspace_sessions IS 'Tracks active terminal/IDE sessions';
COMMENT ON TABLE workspace_events IS 'Audit log for workspace activities';
COMMENT ON TABLE workspace_packages IS 'Tracks installed packages per workspace';
COMMENT ON COLUMN workspaces.workspace_id IS 'Unique identifier for Cloud Run service';
COMMENT ON COLUMN workspaces.machine_id IS 'Persistent machine UUID for user experience';
COMMENT ON COLUMN workspaces.tier IS 'User subscription tier determining resources';