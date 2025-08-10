-- SpatioLabs App Models Migration
-- Adds new tables for all app functionality while preserving existing agent infrastructure

-- ==========================================
-- USER TABLE UPDATES
-- ==========================================

-- Add new columns to existing User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "tier" TEXT DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT,
ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "User_tier_idx" ON "User"("tier");

-- ==========================================
-- NOTES APP
-- ==========================================

-- Create NoteFolder table
CREATE TABLE IF NOT EXISTS "NoteFolder" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteFolder_pkey" PRIMARY KEY ("id")
);

-- Create Note table
CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'MARKDOWN',
    "folderId" TEXT,
    "tags" TEXT[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "virtualPath" TEXT,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- Note indexes
CREATE INDEX "Note_userId_createdAt_idx" ON "Note"("userId", "createdAt");
CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt");
CREATE INDEX "Note_folderId_idx" ON "Note"("folderId");
CREATE INDEX "Note_virtualPath_idx" ON "Note"("virtualPath");
CREATE UNIQUE INDEX "Note_shareToken_key" ON "Note"("shareToken");

-- NoteFolder indexes
CREATE UNIQUE INDEX "NoteFolder_userId_name_parentId_key" ON "NoteFolder"("userId", "name", "parentId");
CREATE INDEX "NoteFolder_userId_idx" ON "NoteFolder"("userId");

-- ==========================================
-- TASKS APP
-- ==========================================

-- Create Project table
CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- Create Task table
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "virtualPath" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- Task indexes
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");
CREATE INDEX "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_externalProvider_externalId_idx" ON "Task"("externalProvider", "externalId");

-- Project indexes
CREATE UNIQUE INDEX "Project_userId_name_key" ON "Project"("userId", "name");
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- ==========================================
-- MAIL APP
-- ==========================================

CREATE TABLE IF NOT EXISTS "Email" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
    "folder" TEXT NOT NULL DEFAULT 'INBOX',
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "virtualPath" TEXT,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- Email indexes
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");
CREATE UNIQUE INDEX "Email_gmailId_key" ON "Email"("gmailId");
CREATE UNIQUE INDEX "Email_outlookId_key" ON "Email"("outlookId");
CREATE INDEX "Email_userId_folder_idx" ON "Email"("userId", "folder");
CREATE INDEX "Email_userId_receivedAt_idx" ON "Email"("userId", "receivedAt");
CREATE INDEX "Email_threadId_idx" ON "Email"("threadId");

-- ==========================================
-- CALENDAR APP
-- ==========================================

CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "visibility" TEXT NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "virtualPath" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- Calendar indexes
CREATE UNIQUE INDEX "CalendarEvent_googleEventId_key" ON "CalendarEvent"("googleEventId");
CREATE UNIQUE INDEX "CalendarEvent_outlookEventId_key" ON "CalendarEvent"("outlookEventId");
CREATE INDEX "CalendarEvent_userId_startTime_idx" ON "CalendarEvent"("userId", "startTime");

-- ==========================================
-- FILES APP
-- ==========================================

CREATE TABLE IF NOT EXISTS "FileFolder" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileFolder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "File" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "virtualPath" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- File indexes
CREATE UNIQUE INDEX "File_r2Key_key" ON "File"("r2Key");
CREATE UNIQUE INDEX "File_shareToken_key" ON "File"("shareToken");
CREATE UNIQUE INDEX "File_driveFileId_key" ON "File"("driveFileId");
CREATE UNIQUE INDEX "File_dropboxId_key" ON "File"("dropboxId");
CREATE UNIQUE INDEX "File_onedriveId_key" ON "File"("onedriveId");
CREATE UNIQUE INDEX "File_userId_virtualPath_key" ON "File"("userId", "virtualPath");
CREATE INDEX "File_userId_path_idx" ON "File"("userId", "path");
CREATE INDEX "File_folderId_idx" ON "File"("folderId");

-- FileFolder indexes
CREATE UNIQUE INDEX "FileFolder_userId_name_parentId_key" ON "FileFolder"("userId", "name", "parentId");
CREATE INDEX "FileFolder_userId_idx" ON "FileFolder"("userId");

-- ==========================================
-- BANKING APP
-- ==========================================

CREATE TABLE IF NOT EXISTS "BankAccount" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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

-- Banking indexes
CREATE UNIQUE INDEX "BankAccount_plaidAccountId_key" ON "BankAccount"("plaidAccountId");
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");
CREATE INDEX "BankAccount_plaidItemId_idx" ON "BankAccount"("plaidItemId");
CREATE UNIQUE INDEX "Transaction_plaidTransactionId_key" ON "Transaction"("plaidTransactionId");
CREATE INDEX "Transaction_accountId_date_idx" ON "Transaction"("accountId", "date");

-- ==========================================
-- PORTFOLIO APP
-- ==========================================

CREATE TABLE IF NOT EXISTS "Portfolio" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Position" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "portfolioId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" DECIMAL(19,8) NOT NULL,
    "avgCost" DECIMAL(19,4) NOT NULL,
    "currentPrice" DECIMAL(19,4),
    "marketValue" DECIMAL(19,4),
    "dayChange" DECIMAL(19,4),
    "totalGainLoss" DECIMAL(19,4),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- Portfolio indexes
CREATE UNIQUE INDEX "Portfolio_userId_name_key" ON "Portfolio"("userId", "name");
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");
CREATE UNIQUE INDEX "Position_portfolioId_symbol_key" ON "Position"("portfolioId", "symbol");
CREATE INDEX "Position_portfolioId_idx" ON "Position"("portfolioId");

-- ==========================================
-- SHEETS APP
-- ==========================================

CREATE TABLE IF NOT EXISTS "Sheet" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "virtualPath" TEXT,

    CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id")
);

-- Sheet indexes
CREATE UNIQUE INDEX "Sheet_userId_name_key" ON "Sheet"("userId", "name");
CREATE UNIQUE INDEX "Sheet_shareToken_key" ON "Sheet"("shareToken");
CREATE INDEX "Sheet_userId_idx" ON "Sheet"("userId");

-- ==========================================
-- INTEGRATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS "Integration" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- Integration indexes
CREATE UNIQUE INDEX "Integration_userId_provider_key" ON "Integration"("userId", "provider");
CREATE INDEX "Integration_provider_idx" ON "Integration"("provider");

-- ==========================================
-- LLM SERVICE INTEGRATION
-- ==========================================

CREATE TABLE IF NOT EXISTS "LLMRequest" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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

-- LLMRequest indexes
CREATE INDEX "LLMRequest_userId_createdAt_idx" ON "LLMRequest"("userId", "createdAt");
CREATE INDEX "LLMRequest_provider_idx" ON "LLMRequest"("provider");
CREATE INDEX "LLMRequest_appContext_idx" ON "LLMRequest"("appContext");

-- ==========================================
-- WORKSPACE FEATURES
-- ==========================================

CREATE TABLE IF NOT EXISTS "WorkspaceItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,
    "section" TEXT,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkspaceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Activity" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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

-- WorkspaceItem indexes
CREATE UNIQUE INDEX "WorkspaceItem_userId_type_itemId_key" ON "WorkspaceItem"("userId", "type", "itemId");
CREATE INDEX "WorkspaceItem_userId_isPinned_idx" ON "WorkspaceItem"("userId", "isPinned");
CREATE INDEX "WorkspaceItem_userId_lastAccessedAt_idx" ON "WorkspaceItem"("userId", "lastAccessedAt");

-- Activity indexes
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");
CREATE INDEX "Activity_entityType_entityId_idx" ON "Activity"("entityType", "entityId");

-- ==========================================
-- FOREIGN KEY CONSTRAINTS
-- ==========================================

-- Notes
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "NoteFolder"("id") ON DELETE SET NULL;
ALTER TABLE "NoteFolder" ADD CONSTRAINT "NoteFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "NoteFolder" ADD CONSTRAINT "NoteFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NoteFolder"("id") ON DELETE CASCADE;

-- Tasks
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL;
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Email
ALTER TABLE "Email" ADD CONSTRAINT "Email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Calendar
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Files
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "File" ADD CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "FileFolder"("id") ON DELETE SET NULL;
ALTER TABLE "FileFolder" ADD CONSTRAINT "FileFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "FileFolder" ADD CONSTRAINT "FileFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FileFolder"("id") ON DELETE CASCADE;

-- Banking
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE;

-- Portfolio
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Position" ADD CONSTRAINT "Position_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE;

-- Sheets
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Integration
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- LLMRequest
ALTER TABLE "LLMRequest" ADD CONSTRAINT "LLMRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- WorkspaceItem
ALTER TABLE "WorkspaceItem" ADD CONSTRAINT "WorkspaceItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Activity
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;