-- Database Permissions Setup for Table Ownership Model
-- This script sets up read/write permissions for web1.0 and agent-runtime
-- 
-- Run this script as a database superuser

-- ==========================================
-- STEP 1: Create application-specific users (if not exists)
-- ==========================================
-- Note: You'll need to update passwords and connection strings

DO $$
BEGIN
    -- Create web1.0 user if not exists
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'web_app') THEN
        CREATE USER web_app WITH PASSWORD 'CHANGE_THIS_PASSWORD';
    END IF;
    
    -- Create agent-runtime user if not exists
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'agent_runtime') THEN
        CREATE USER agent_runtime WITH PASSWORD 'CHANGE_THIS_PASSWORD';
    END IF;
END
$$;

-- ==========================================
-- STEP 2: Grant CONNECT privilege to database
-- ==========================================
GRANT CONNECT ON DATABASE main TO web_app, agent_runtime;

-- ==========================================
-- STEP 3: Grant USAGE on schema
-- ==========================================
GRANT USAGE ON SCHEMA public TO web_app, agent_runtime;

-- ==========================================
-- STEP 4: Grant READ (SELECT) to all tables for both services
-- ==========================================
-- Both services can read all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO web_app, agent_runtime;

-- Make sure future tables also get SELECT permission
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO web_app, agent_runtime;

-- ==========================================
-- STEP 5: Grant WRITE permissions to web1.0-owned tables
-- ==========================================
-- web1.0 owns user data and configuration tables
GRANT INSERT, UPDATE, DELETE ON TABLE 
    "User",
    "Integration",
    "CalendarEvent",
    "Email",
    "Note",
    "NoteFolder",
    "Task",
    "Project",
    "BankAccount",
    "Transaction",
    "Sheet",
    "SheetVersion",
    "File",
    "FileFolder",
    "WorkspaceItem",
    "AI",
    "Organization",
    "TeamMember",
    "License",
    "LicenseSection",
    "PotentialEnterpriseClient",
    "Activity",
    "LLMRequest",
    "BrokerageConnection",
    "Web3WalletConnection",
    "Holding",
    "Position",
    "Portfolio",
    "PortfolioTransaction",
    -- Integration management tables
    "integration_catalog",
    "user_installations",
    "app_platforms",
    "core_actions",
    "integration_actions",
    "integration_reviews",
    "integration_tags"
TO web_app;

-- ==========================================
-- STEP 6: Grant WRITE permissions to agent-runtime-owned tables
-- ==========================================
-- agent-runtime owns execution tracking tables
GRANT INSERT, UPDATE, DELETE ON TABLE 
    "agents",
    "agent_executions",
    "action_executions"
TO agent_runtime;

-- ==========================================
-- STEP 7: Grant SEQUENCE permissions
-- ==========================================
-- Both services need sequence permissions for their owned tables
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO web_app, agent_runtime;

-- ==========================================
-- STEP 8: Revoke cross-write permissions (IMPORTANT!)
-- ==========================================
-- Ensure web1.0 cannot write to agent-runtime tables
REVOKE INSERT, UPDATE, DELETE ON TABLE 
    "agents",
    "agent_executions",
    "action_executions"
FROM web_app;

-- Ensure agent-runtime cannot write to web1.0 tables
REVOKE INSERT, UPDATE, DELETE ON TABLE 
    "User",
    "Integration",
    "CalendarEvent",
    "Email",
    "Note",
    "Task",
    "BankAccount",
    "integration_catalog",
    "user_installations",
    "app_platforms",
    "core_actions"
FROM agent_runtime;

-- ==========================================
-- STEP 9: Create views for cross-service data (optional)
-- ==========================================
-- Create read-only views for commonly accessed cross-service data

-- View for agent-runtime to see user context
CREATE OR REPLACE VIEW user_context_for_agents AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    COUNT(DISTINCT i.id) as active_integrations,
    ARRAY_AGG(DISTINCT i.provider) as integration_providers
FROM "User" u
LEFT JOIN "Integration" i ON u.id = i."userId" AND i.status = 'ACTIVE'
GROUP BY u.id, u.email, u.name;

GRANT SELECT ON user_context_for_agents TO agent_runtime;

-- View for web1.0 to see execution statistics
CREATE OR REPLACE VIEW agent_execution_stats AS
SELECT 
    ae.user_id,
    ae.agent_id,
    COUNT(*) as total_executions,
    AVG(ae.execution_time_ms) as avg_execution_time,
    SUM(ae.actions_executed) as total_actions,
    MAX(ae.started_at) as last_execution
FROM agent_executions ae
WHERE ae.status = 'completed'
GROUP BY ae.user_id, ae.agent_id;

GRANT SELECT ON agent_execution_stats TO web_app;

-- ==========================================
-- VERIFICATION
-- ==========================================
-- Check permissions for web_app
SELECT 
    tablename,
    has_table_privilege('web_app', schemaname||'.'||tablename, 'SELECT') as can_read,
    has_table_privilege('web_app', schemaname||'.'||tablename, 'INSERT') as can_insert,
    has_table_privilege('web_app', schemaname||'.'||tablename, 'UPDATE') as can_update,
    has_table_privilege('web_app', schemaname||'.'||tablename, 'DELETE') as can_delete
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'Integration', 'agents', 'agent_executions')
ORDER BY tablename;

-- Check permissions for agent_runtime
SELECT 
    tablename,
    has_table_privilege('agent_runtime', schemaname||'.'||tablename, 'SELECT') as can_read,
    has_table_privilege('agent_runtime', schemaname||'.'||tablename, 'INSERT') as can_insert,
    has_table_privilege('agent_runtime', schemaname||'.'||tablename, 'UPDATE') as can_update,
    has_table_privilege('agent_runtime', schemaname||'.'||tablename, 'DELETE') as can_delete
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'Integration', 'agents', 'agent_executions')
ORDER BY tablename;

-- ==========================================
-- NOTES
-- ==========================================
-- 1. Update the passwords for web_app and agent_runtime users
-- 2. Update your application connection strings to use these users:
--    - web1.0 should connect as 'web_app'
--    - agent-runtime should connect as 'agent_runtime'
-- 3. The current neondb_owner user should only be used for migrations
-- 4. Consider using connection pooling for better performance
-- 5. Monitor permission violations in your logs