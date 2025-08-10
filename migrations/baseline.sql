-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING');

-- CreateEnum
CREATE TYPE "public"."NoteContentType" AS ENUM ('MARKDOWN', 'RICH_TEXT', 'PLAIN_TEXT');

-- CreateEnum
CREATE TYPE "public"."AppTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."EmailFolder" AS ENUM ('INBOX', 'SENT', 'DRAFTS', 'SPAM', 'TRASH', 'ARCHIVE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('CONFIRMED', 'TENTATIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."EventVisibility" AS ENUM ('DEFAULT', 'PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."IntegrationProvider" AS ENUM ('GOOGLE', 'GITHUB', 'GITLAB', 'LINEAR', 'NOTION', 'SLACK', 'PLAID', 'ROBINHOOD', 'ALPACA', 'OPENAI', 'ANTHROPIC');

-- CreateEnum
CREATE TYPE "public"."WorkspaceItemType" AS ENUM ('NOTE', 'TASK', 'EMAIL', 'FILE', 'SHEET', 'AGENT');

-- CreateEnum
CREATE TYPE "public"."AgentStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'PAUSED', 'ERROR', 'DEPLOYING');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('EXECUTION_FAILED', 'EXECUTION_COMPLETED', 'RESOURCE_LIMIT', 'SCHEDULE_MISSED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."FileType" AS ENUM ('INPUT', 'OUTPUT', 'CONFIG', 'LOG');

-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('ORGANIZATION', 'CAPABILITY');

-- CreateEnum
CREATE TYPE "public"."LicenseType" AS ENUM ('INDIVIDUAL', 'INDIVIDUAL_DEVELOPER', 'TEAM', 'ENTERPRISE', 'LICENSE', 'DEVELOPER_LICENSE', 'PRO_LICENSE', 'ENTERPRISE_LICENSE');

-- CreateEnum
CREATE TYPE "public"."LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL');

-- CreateEnum
CREATE TYPE "public"."NodeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."NodeType" AS ENUM ('MAC_CLIENT', 'CLOUD_INSTANCE', 'MOBILE_DEVICE', 'EDGE_DEVICE');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "licenseKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "password" TEXT,
    "username" TEXT,
    "profilePhoto" TEXT,
    "active_workspace_id" TEXT,
    "tier" "public"."UserTier" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "subscriptionId" TEXT,
    "subscriptionStatus" "public"."SubscriptionStatus",
    "trialEndsAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" "public"."NoteContentType" NOT NULL DEFAULT 'MARKDOWN',
    "folderId" TEXT,
    "tags" TEXT[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "virtualPath" TEXT,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NoteFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."AppTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "public"."TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "projectId" TEXT,
    "parentId" TEXT,
    "tags" TEXT[],
    "externalId" TEXT,
    "externalProvider" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "recurrenceRule" TEXT,
    "recurrenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "virtualPath" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Email" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT[],
    "cc" TEXT[],
    "bcc" TEXT[],
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "folder" "public"."EmailFolder" NOT NULL DEFAULT 'INBOX',
    "labels" TEXT[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB[],
    "gmailId" TEXT,
    "gmailThreadId" TEXT,
    "outlookId" TEXT,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "virtualPath" TEXT,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "recurrenceRule" TEXT,
    "recurrenceId" TEXT,
    "attendees" JSONB[],
    "organizer" TEXT,
    "color" TEXT,
    "reminders" JSONB[],
    "googleEventId" TEXT,
    "outlookEventId" TEXT,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'CONFIRMED',
    "visibility" "public"."EventVisibility" NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "virtualPath" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."File" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "folderId" TEXT,
    "metadata" JSONB,
    "thumbnail" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "driveFileId" TEXT,
    "dropboxId" TEXT,
    "onedriveId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "virtualPath" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plaidAccountId" TEXT NOT NULL,
    "plaidItemId" TEXT NOT NULL,
    "plaidAccessToken" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "mask" TEXT NOT NULL,
    "currentBalance" DECIMAL(19,4),
    "availableBalance" DECIMAL(19,4),
    "creditLimit" DECIMAL(19,4),
    "institution" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "plaidTransactionId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "merchantName" TEXT,
    "category" TEXT[],
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Portfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "totalValue" DECIMAL(19,4),
    "dayChange" DECIMAL(19,4),
    "dayChangePercent" DECIMAL(19,4),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Position" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" DECIMAL(19,8) NOT NULL,
    "avgCost" DECIMAL(19,4) NOT NULL,
    "currentPrice" DECIMAL(19,4),
    "marketValue" DECIMAL(19,4),
    "dayChange" DECIMAL(19,4),
    "totalGainLoss" DECIMAL(19,4),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sheet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "formulas" JSONB,
    "styles" JSONB,
    "rowCount" INTEGER NOT NULL DEFAULT 100,
    "columnCount" INTEGER NOT NULL DEFAULT 26,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "virtualPath" TEXT,

    CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LLMRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "response" JSONB,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "latency" INTEGER,
    "agentExecutionId" TEXT,
    "appContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LLMRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Integration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "public"."IntegrationProvider" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "accountId" TEXT,
    "accountEmail" TEXT,
    "scopes" TEXT[],
    "metadata" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkspaceItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."WorkspaceItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,
    "section" TEXT,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkspaceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AI" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Darwin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."License" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "licenseType" "public"."LicenseType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LicenseSection" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION,
    "frequency" TEXT,
    "licenseId" TEXT NOT NULL,

    CONSTRAINT "LicenseSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeCustomerId" TEXT,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PotentialEnterpriseClient" (
    "id" TEXT NOT NULL,
    "teamSize" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "usesMac" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PotentialEnterpriseClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamMember" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_alerts" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_deployments" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "resources" JSONB NOT NULL,
    "replicas" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "deployed_at" TIMESTAMP(3),

    CONSTRAINT "agent_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_environments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "configuration" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_executions" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "status" "public"."ExecutionStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "output" JSONB,
    "error" TEXT,

    CONSTRAINT "agent_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_files" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "type" "public"."FileType" NOT NULL,
    "size" INTEGER,
    "agent_id" TEXT,
    "user_id" TEXT NOT NULL,
    "is_temporary" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_logs" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "execution_id" TEXT,
    "level" "public"."LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_metrics" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_schedules" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "cron_expression" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_tasks" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,

    CONSTRAINT "agent_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "dockerfile" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "author_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "execution_time" INTEGER NOT NULL DEFAULT 0,
    "cpu_seconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memory_mb_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storage_used_mb" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "agent_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template_id" TEXT,
    "configuration" JSONB NOT NULL,
    "status" "public"."AgentStatus" NOT NULL DEFAULT 'INACTIVE',
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."capabilities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "organization_id" TEXT NOT NULL,
    "group_id" TEXT,
    "group_name" TEXT,
    "items" JSONB,
    "api_schema" JSONB,
    "auth_flow" JSONB,
    "examples" JSONB,
    "relationships" JSONB,
    "path" TEXT,
    "url" TEXT,
    "tags" JSONB,
    "categories" JSONB,
    "entry_point" TEXT,
    "type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."compute_nodes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."NodeType" NOT NULL,
    "location" TEXT,
    "resources" JSONB NOT NULL,
    "status" "public"."NodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "user_id" TEXT,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compute_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "platform" TEXT,
    "version" TEXT,
    "last_active" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" TEXT NOT NULL,
    "license_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."featured" (
    "id" SERIAL NOT NULL,
    "organization_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "featured_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "organization_id" TEXT NOT NULL,
    "path" TEXT,
    "url" TEXT,
    "tags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "path" TEXT,
    "url" TEXT,
    "parent_id" TEXT,
    "children" JSONB,
    "tags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."repository_versions" (
    "id" TEXT NOT NULL,
    "repository" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_capabilities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capabilityPath" TEXT NOT NULL,
    "capabilityType" "public"."ItemType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_events" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_packages" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "workspace_id" TEXT NOT NULL,
    "package_name" TEXT NOT NULL,
    "package_version" TEXT,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_sessions" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "websocket_id" TEXT,
    "terminal_pid" INTEGER,
    "connection_ip" TEXT,
    "user_agent" TEXT,
    "state" TEXT NOT NULL,
    "idle_since" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "terminal_buffer" TEXT,
    "environment_vars" JSONB DEFAULT '{}',
    "working_directory" TEXT DEFAULT '/home/user',

    CONSTRAINT "workspace_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspaces" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "environment" JSONB NOT NULL DEFAULT '{}',
    "storage" JSONB NOT NULL DEFAULT '{}',
    "resources" JSONB DEFAULT '{"cpu": "0.25", "memory": "512Mi", "storage": "1Gi", "timeout": "60m"}',
    "ip_address" TEXT,
    "dns_name" TEXT,
    "ports" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" TIMESTAMP(3),
    "suspended_at" TIMESTAMP(3),
    "service_url" TEXT,
    "service_revision" TEXT,
    "total_runtime_seconds" INTEGER DEFAULT 0,
    "total_storage_bytes" BIGINT DEFAULT 0,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_sessionId_key" ON "public"."User"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "public"."User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_tier_idx" ON "public"."User"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "Note_shareToken_key" ON "public"."Note"("shareToken");

-- CreateIndex
CREATE INDEX "Note_userId_createdAt_idx" ON "public"."Note"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Note_userId_updatedAt_idx" ON "public"."Note"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Note_folderId_idx" ON "public"."Note"("folderId");

-- CreateIndex
CREATE INDEX "Note_virtualPath_idx" ON "public"."Note"("virtualPath");

-- CreateIndex
CREATE INDEX "NoteFolder_userId_idx" ON "public"."NoteFolder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteFolder_userId_name_parentId_key" ON "public"."NoteFolder"("userId", "name", "parentId");

-- CreateIndex
CREATE INDEX "Task_userId_status_idx" ON "public"."Task"("userId", "status");

-- CreateIndex
CREATE INDEX "Task_userId_dueDate_idx" ON "public"."Task"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "public"."Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_externalProvider_externalId_idx" ON "public"."Task"("externalProvider", "externalId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "public"."Project"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_userId_name_key" ON "public"."Project"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Email_messageId_key" ON "public"."Email"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Email_gmailId_key" ON "public"."Email"("gmailId");

-- CreateIndex
CREATE UNIQUE INDEX "Email_outlookId_key" ON "public"."Email"("outlookId");

-- CreateIndex
CREATE INDEX "Email_userId_folder_idx" ON "public"."Email"("userId", "folder");

-- CreateIndex
CREATE INDEX "Email_userId_receivedAt_idx" ON "public"."Email"("userId", "receivedAt");

-- CreateIndex
CREATE INDEX "Email_threadId_idx" ON "public"."Email"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_googleEventId_key" ON "public"."CalendarEvent"("googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_outlookEventId_key" ON "public"."CalendarEvent"("outlookEventId");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_startTime_idx" ON "public"."CalendarEvent"("userId", "startTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_googleEventId_idx" ON "public"."CalendarEvent"("googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "File_r2Key_key" ON "public"."File"("r2Key");

-- CreateIndex
CREATE UNIQUE INDEX "File_shareToken_key" ON "public"."File"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "File_driveFileId_key" ON "public"."File"("driveFileId");

-- CreateIndex
CREATE UNIQUE INDEX "File_dropboxId_key" ON "public"."File"("dropboxId");

-- CreateIndex
CREATE UNIQUE INDEX "File_onedriveId_key" ON "public"."File"("onedriveId");

-- CreateIndex
CREATE INDEX "File_userId_path_idx" ON "public"."File"("userId", "path");

-- CreateIndex
CREATE INDEX "File_folderId_idx" ON "public"."File"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "File_userId_virtualPath_key" ON "public"."File"("userId", "virtualPath");

-- CreateIndex
CREATE INDEX "FileFolder_userId_idx" ON "public"."FileFolder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FileFolder_userId_name_parentId_key" ON "public"."FileFolder"("userId", "name", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_plaidAccountId_key" ON "public"."BankAccount"("plaidAccountId");

-- CreateIndex
CREATE INDEX "BankAccount_userId_idx" ON "public"."BankAccount"("userId");

-- CreateIndex
CREATE INDEX "BankAccount_plaidItemId_idx" ON "public"."BankAccount"("plaidItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_plaidTransactionId_key" ON "public"."Transaction"("plaidTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_date_idx" ON "public"."Transaction"("accountId", "date");

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "public"."Portfolio"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_userId_name_key" ON "public"."Portfolio"("userId", "name");

-- CreateIndex
CREATE INDEX "Position_portfolioId_idx" ON "public"."Position"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_portfolioId_symbol_key" ON "public"."Position"("portfolioId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Sheet_shareToken_key" ON "public"."Sheet"("shareToken");

-- CreateIndex
CREATE INDEX "Sheet_userId_idx" ON "public"."Sheet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Sheet_userId_name_key" ON "public"."Sheet"("userId", "name");

-- CreateIndex
CREATE INDEX "LLMRequest_userId_createdAt_idx" ON "public"."LLMRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LLMRequest_provider_idx" ON "public"."LLMRequest"("provider");

-- CreateIndex
CREATE INDEX "LLMRequest_appContext_idx" ON "public"."LLMRequest"("appContext");

-- CreateIndex
CREATE INDEX "Integration_provider_idx" ON "public"."Integration"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_userId_provider_key" ON "public"."Integration"("userId", "provider");

-- CreateIndex
CREATE INDEX "WorkspaceItem_userId_isPinned_idx" ON "public"."WorkspaceItem"("userId", "isPinned");

-- CreateIndex
CREATE INDEX "WorkspaceItem_userId_lastAccessedAt_idx" ON "public"."WorkspaceItem"("userId", "lastAccessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceItem_userId_type_itemId_key" ON "public"."WorkspaceItem"("userId", "type", "itemId");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "public"."Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_entityType_entityId_idx" ON "public"."Activity"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "AI_userId_key" ON "public"."AI"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseKey_key" ON "public"."License"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseSection_licenseId_sectionId_key" ON "public"."LicenseSection"("licenseId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_ownerId_key" ON "public"."Organization"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "PotentialEnterpriseClient_userId_key" ON "public"."PotentialEnterpriseClient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PotentialEnterpriseClient_organizationId_key" ON "public"."PotentialEnterpriseClient"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_organizationId_key" ON "public"."TeamMember"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "idx_alert_agent" ON "public"."agent_alerts"("agent_id");

-- CreateIndex
CREATE INDEX "idx_alert_read" ON "public"."agent_alerts"("is_read");

-- CreateIndex
CREATE INDEX "idx_alert_severity" ON "public"."agent_alerts"("severity");

-- CreateIndex
CREATE INDEX "idx_alert_type" ON "public"."agent_alerts"("type");

-- CreateIndex
CREATE INDEX "idx_alert_user" ON "public"."agent_alerts"("user_id");

-- CreateIndex
CREATE INDEX "idx_deployment_agent" ON "public"."agent_deployments"("agent_id");

-- CreateIndex
CREATE INDEX "idx_deployment_environment" ON "public"."agent_deployments"("environment_id");

-- CreateIndex
CREATE INDEX "idx_environment_user" ON "public"."agent_environments"("user_id");

-- CreateIndex
CREATE INDEX "idx_execution_agent" ON "public"."agent_executions"("agent_id");

-- CreateIndex
CREATE INDEX "idx_execution_started" ON "public"."agent_executions"("started_at");

-- CreateIndex
CREATE INDEX "idx_execution_status" ON "public"."agent_executions"("status");

-- CreateIndex
CREATE INDEX "idx_file_agent" ON "public"."agent_files"("agent_id");

-- CreateIndex
CREATE INDEX "idx_file_type" ON "public"."agent_files"("type");

-- CreateIndex
CREATE INDEX "idx_file_user" ON "public"."agent_files"("user_id");

-- CreateIndex
CREATE INDEX "idx_log_agent" ON "public"."agent_logs"("agent_id");

-- CreateIndex
CREATE INDEX "idx_log_execution" ON "public"."agent_logs"("execution_id");

-- CreateIndex
CREATE INDEX "idx_log_level" ON "public"."agent_logs"("level");

-- CreateIndex
CREATE INDEX "idx_log_timestamp" ON "public"."agent_logs"("timestamp");

-- CreateIndex
CREATE INDEX "idx_metric_agent_type_time" ON "public"."agent_metrics"("agent_id", "metric", "timestamp");

-- CreateIndex
CREATE INDEX "idx_schedule_active" ON "public"."agent_schedules"("is_active");

-- CreateIndex
CREATE INDEX "idx_schedule_agent" ON "public"."agent_schedules"("agent_id");

-- CreateIndex
CREATE INDEX "idx_task_agent" ON "public"."agent_tasks"("agent_id");

-- CreateIndex
CREATE INDEX "idx_task_scheduled" ON "public"."agent_tasks"("scheduled_at");

-- CreateIndex
CREATE INDEX "idx_task_status" ON "public"."agent_tasks"("status");

-- CreateIndex
CREATE INDEX "idx_template_author" ON "public"."agent_templates"("author_id");

-- CreateIndex
CREATE INDEX "idx_template_category" ON "public"."agent_templates"("category");

-- CreateIndex
CREATE INDEX "idx_template_public" ON "public"."agent_templates"("is_public");

-- CreateIndex
CREATE INDEX "idx_usage_agent" ON "public"."agent_usage"("agent_id");

-- CreateIndex
CREATE INDEX "idx_usage_date" ON "public"."agent_usage"("date");

-- CreateIndex
CREATE INDEX "idx_usage_user" ON "public"."agent_usage"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_usage_user_id_agent_id_date_key" ON "public"."agent_usage"("user_id", "agent_id", "date");

-- CreateIndex
CREATE INDEX "idx_agent_status" ON "public"."agents"("status");

-- CreateIndex
CREATE INDEX "idx_agent_template" ON "public"."agents"("template_id");

-- CreateIndex
CREATE INDEX "idx_agent_user" ON "public"."agents"("user_id");

-- CreateIndex
CREATE INDEX "idx_cap_categories" ON "public"."capabilities"("categories");

-- CreateIndex
CREATE INDEX "idx_cap_group" ON "public"."capabilities"("group_id");

-- CreateIndex
CREATE INDEX "idx_cap_name" ON "public"."capabilities"("name");

-- CreateIndex
CREATE INDEX "idx_cap_org" ON "public"."capabilities"("organization_id");

-- CreateIndex
CREATE INDEX "idx_cap_tags" ON "public"."capabilities"("tags");

-- CreateIndex
CREATE INDEX "idx_cap_title" ON "public"."capabilities"("title");

-- CreateIndex
CREATE INDEX "idx_cap_type" ON "public"."capabilities"("type");

-- CreateIndex
CREATE INDEX "idx_node_status" ON "public"."compute_nodes"("status");

-- CreateIndex
CREATE INDEX "idx_node_type" ON "public"."compute_nodes"("type");

-- CreateIndex
CREATE INDEX "idx_node_user" ON "public"."compute_nodes"("user_id");

-- CreateIndex
CREATE INDEX "idx_device_license" ON "public"."devices"("license_id");

-- CreateIndex
CREATE INDEX "idx_device_type" ON "public"."devices"("device_type");

-- CreateIndex
CREATE INDEX "idx_device_user" ON "public"."devices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "featured_organization_id_key" ON "public"."featured"("organization_id");

-- CreateIndex
CREATE INDEX "idx_featured_order" ON "public"."featured"("display_order");

-- CreateIndex
CREATE INDEX "idx_featured_org" ON "public"."featured"("organization_id");

-- CreateIndex
CREATE INDEX "idx_group_name" ON "public"."groups"("name");

-- CreateIndex
CREATE INDEX "idx_group_org" ON "public"."groups"("organization_id");

-- CreateIndex
CREATE INDEX "idx_org_name" ON "public"."organizations"("name");

-- CreateIndex
CREATE INDEX "idx_org_parent" ON "public"."organizations"("parent_id");

-- CreateIndex
CREATE INDEX "idx_org_path" ON "public"."organizations"("path");

-- CreateIndex
CREATE UNIQUE INDEX "repository_versions_repository_key" ON "public"."repository_versions"("repository");

-- CreateIndex
CREATE UNIQUE INDEX "user_capabilities_userId_capabilityPath_key" ON "public"."user_capabilities"("userId", "capabilityPath");

-- CreateIndex
CREATE INDEX "idx_events_created_at" ON "public"."workspace_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_events_user_id" ON "public"."workspace_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_events_workspace_id" ON "public"."workspace_events"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_packages_workspace_id_package_name_key" ON "public"."workspace_packages"("workspace_id", "package_name");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_sessions_session_token_key" ON "public"."workspace_sessions"("session_token");

-- CreateIndex
CREATE INDEX "idx_sessions_last_activity" ON "public"."workspace_sessions"("last_activity_at" DESC);

-- CreateIndex
CREATE INDEX "idx_sessions_state" ON "public"."workspace_sessions"("state");

-- CreateIndex
CREATE INDEX "idx_sessions_user_id" ON "public"."workspace_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_sessions_workspace_id" ON "public"."workspace_sessions"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_workspace_id_key" ON "public"."workspaces"("workspace_id");

-- CreateIndex
CREATE INDEX "idx_workspaces_last_accessed" ON "public"."workspaces"("last_accessed_at" DESC);

-- CreateIndex
CREATE INDEX "idx_workspaces_state" ON "public"."workspaces"("state");

-- CreateIndex
CREATE INDEX "idx_workspaces_tier" ON "public"."workspaces"("tier");

-- CreateIndex
CREATE INDEX "idx_workspaces_user_id" ON "public"."workspaces"("user_id");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_active_workspace_id_fkey" FOREIGN KEY ("active_workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."NoteFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NoteFolder" ADD CONSTRAINT "NoteFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."NoteFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Email" ADD CONSTRAINT "Email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."FileFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileFolder" ADD CONSTRAINT "FileFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."FileFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Position" ADD CONSTRAINT "Position_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "public"."Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sheet" ADD CONSTRAINT "Sheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LLMRequest" ADD CONSTRAINT "LLMRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkspaceItem" ADD CONSTRAINT "WorkspaceItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AI" ADD CONSTRAINT "AI_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."License" ADD CONSTRAINT "License_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."License" ADD CONSTRAINT "License_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LicenseSection" ADD CONSTRAINT "LicenseSection_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "public"."License"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PotentialEnterpriseClient" ADD CONSTRAINT "PotentialEnterpriseClient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PotentialEnterpriseClient" ADD CONSTRAINT "PotentialEnterpriseClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_alerts" ADD CONSTRAINT "agent_alerts_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_alerts" ADD CONSTRAINT "agent_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_deployments" ADD CONSTRAINT "agent_deployments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_deployments" ADD CONSTRAINT "agent_deployments_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "public"."agent_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_environments" ADD CONSTRAINT "agent_environments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_executions" ADD CONSTRAINT "agent_executions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_files" ADD CONSTRAINT "agent_files_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_files" ADD CONSTRAINT "agent_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_logs" ADD CONSTRAINT "agent_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_logs" ADD CONSTRAINT "agent_logs_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "public"."agent_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_metrics" ADD CONSTRAINT "agent_metrics_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_schedules" ADD CONSTRAINT "agent_schedules_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_tasks" ADD CONSTRAINT "agent_tasks_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_templates" ADD CONSTRAINT "agent_templates_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_usage" ADD CONSTRAINT "agent_usage_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_usage" ADD CONSTRAINT "agent_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agents" ADD CONSTRAINT "agents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."agent_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agents" ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."capabilities" ADD CONSTRAINT "capabilities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."capabilities" ADD CONSTRAINT "capabilities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compute_nodes" ADD CONSTRAINT "compute_nodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "public"."License"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."featured" ADD CONSTRAINT "featured_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."groups" ADD CONSTRAINT "groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_capabilities" ADD CONSTRAINT "user_capabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_events" ADD CONSTRAINT "workspace_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workspace_events" ADD CONSTRAINT "workspace_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workspace_packages" ADD CONSTRAINT "workspace_packages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workspace_sessions" ADD CONSTRAINT "workspace_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workspace_sessions" ADD CONSTRAINT "workspace_sessions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workspaces" ADD CONSTRAINT "workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

