# Database Ownership Model

## Overview
Both `web1.0` and `agent-runtime` share the same PostgreSQL database with a clear ownership model:
- **Single Schema Source**: `web1.0/prisma/schema.prisma` is the authoritative source
- **Both services have FULL READ access** to all tables
- **Each service has WRITE access only to tables it owns**

## Table Ownership

### Tables Owned by web1.0 (UI/User Data)
web1.0 has full write access to these tables:

#### User & Auth
- `User` - User accounts and profiles
- `Organization`, `TeamMember` - Team management
- `License`, `LicenseSection` - Licensing

#### App Data
- `Note`, `NoteFolder` - Notes system
- `Task`, `Project` - Task management
- `CalendarEvent` - Calendar events
- `Email` - Email management
- `File`, `FileFolder` - File storage
- `Sheet`, `SheetVersion` - Spreadsheets
- `WorkspaceItem` - Workspace organization

#### Financial
- `BankAccount`, `Transaction` - Banking
- `BrokerageConnection`, `Holding`, `Position`, `Portfolio` - Investments
- `Web3WalletConnection` - Crypto wallets

#### Integrations & Actions
- `Integration` - User integrations
- `app_platforms` - Platform definitions (NEW)
- `core_actions` - Action definitions (NEW)
- `integration_catalog` - Available integrations
- `user_installations` - User's installed integrations

#### Analytics
- `Activity` - User activity tracking
- `LLMRequest` - LLM usage tracking

### Tables Owned by agent-runtime (Execution)
agent-runtime has full write access to these tables:

#### Agent System
- `agents` - Agent definitions
- `agent_executions` - Agent execution tracking
- `action_executions` - Individual action execution logs

## Migration Strategy

### Current Status
1. ✅ `web1.0/prisma/schema.prisma` now includes ALL tables
2. ✅ Tables are clearly marked with ownership comments
3. ✅ Both repos can read all data
4. ⚠️ Permissions need to be enforced at database level

### Database Users
```sql
-- web1.0 application user
web_app: 
  - SELECT on all tables
  - INSERT, UPDATE, DELETE on web1.0-owned tables

-- agent-runtime application user  
agent_runtime:
  - SELECT on all tables
  - INSERT, UPDATE, DELETE on agent-runtime-owned tables
```

## Best Practices

### DO:
- ✅ Use `web1.0/prisma/schema.prisma` as the single source of truth
- ✅ Run all Prisma migrations from web1.0
- ✅ Keep agent-runtime Go structs aligned with Prisma schema
- ✅ Use database-level permissions to enforce ownership
- ✅ Document any schema changes in both repos

### DON'T:
- ❌ Don't maintain separate Prisma schemas in both repos
- ❌ Don't run conflicting migrations from different services
- ❌ Don't write to tables you don't own
- ❌ Don't bypass the ownership model with admin credentials

## Schema Synchronization

### When web1.0 schema changes:
1. Update `web1.0/prisma/schema.prisma`
2. Run `npx prisma migrate dev` in web1.0
3. Update Go structs in `agent-runtime/types/` to match
4. Test both services can still read/write appropriately

### When agent-runtime needs new tables:
1. Add table definition to `web1.0/prisma/schema.prisma` with ownership comment
2. Run migration from web1.0
3. Create matching Go structs in agent-runtime
4. Update permission scripts if needed

## Validation Script
Run this to verify ownership model is correctly implemented:

```bash
# In web1.0 directory
npm run db:validate-ownership

# This checks:
# - All tables exist in schema
# - Permissions are correctly set
# - No cross-ownership writes
# - Go structs match Prisma types
```

## API Calling Pattern (CRITICAL)

### Service Communication Rules:
- ✅ **web1.0 → agent-runtime**: ALLOWED
  - web1.0 is the orchestrator/UI layer
  - Can call agent-runtime to execute agents
  - Can query execution status
  
- ❌ **agent-runtime → web1.0**: NOT ALLOWED
  - agent-runtime is execution-only
  - Cannot call back to web1.0
  - Must use database for state updates

This ensures clean separation of concerns and prevents circular dependencies.

## Cross-Service Data Access

### Reading data from other service's tables:
- ✅ Direct SELECT queries are allowed
- ✅ Use read-only Prisma models or views
- ✅ Cache frequently accessed data

### Modifying other service's data:
- ❌ Never write directly to other service's tables
- ✅ web1.0 calls agent-runtime API for execution
- ❌ agent-runtime never calls web1.0 API
- ✅ Use database for async state updates

## Example: Action Execution Flow

1. **web1.0** defines action in `core_actions` table (owns this)
2. **agent-runtime** reads action definition (read access)
3. **agent-runtime** executes action, writes to `action_executions` (owns this)
4. **web1.0** reads execution results for display (read access)

This ensures clean separation of concerns while maintaining data consistency.