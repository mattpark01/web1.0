# SpatioLabs Architecture Documentation

## Executive Summary

SpatioLabs is an all-in-one productivity workspace that aggregates data from multiple sources, provides AI-powered augmentation, and offers a unified interface for managing digital life. Unlike traditional cloud IDEs or VM providers, we're building a **data integration platform** with intelligent agents that work across all user information.

### What We're Building
- **Not**: Linux VMs or development environments per user
- **Yes**: Unified workspace that connects Gmail, GitHub, Linear, Google Drive, banking, and more
- **Yes**: AI agents that can operate across all integrated data
- **Yes**: Terminal interface for power users (commands, not bash)

### Target Scale
- **Goal**: $100K MRR ($20/month × 5,000 paid users)
- **Total Users**: 100,000 (1% paid conversion)
- **Infrastructure Budget**: $500/month maximum
- **Target Margin**: 95%+

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Vercel)                    │
│                      Next.js 14 + TypeScript                 │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│                    Authentication (Clerk)                    │
└─────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   PostgreSQL     │ │      R2      │ │   Cloud Run      │
│     (Neon)       │ │   Storage    │ │  (Agents Only)   │
│                  │ │              │ │                  │
│ • User Data      │ │ • Files      │ │ • Long Tasks     │
│ • Notes/Tasks    │ │ • Documents  │ │ • AI Processing  │
│ • Metadata       │ │ • Sheets     │ │ • Integrations   │
│ • Tokens         │ │ • Uploads    │ │                  │
└──────────────────┘ └──────────────┘ └──────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
        External APIs                    User Integrations
        • Gmail API                      • Plaid (Banking)
        • Google Calendar                • GitHub/GitLab
        • Linear                         • Robinhood
        • Google Drive                   • OneDrive
```

---

## Core Principles

### 1. Data-First Architecture
- User data lives in PostgreSQL and R2, not in containers
- Virtual filesystem abstracts over databases and APIs
- No persistent VMs or containers per user

### 2. Integration Platform
- OAuth2 connections to external services
- Cached data for performance
- Webhooks for real-time updates

### 3. AI Agent Runtime
- Agents run on-demand in Cloud Run
- Access user's integrated data via APIs
- Long-running tasks supported (up to 60 min)

### 4. Cost Optimization
- Free tier users: Zero marginal cost
- Paid users: ~$0.50/month infrastructure cost
- Aggressive caching and API rate limit management

---

## Detailed Technical Stack

### Frontend

#### Framework & Hosting
```yaml
Framework: Next.js 14 (App Router)
Language: TypeScript 5.x
Styling: Tailwind CSS + Shadcn/ui
Terminal: xterm.js with custom command processor
Editor: Monaco Editor (VSCode's editor)
Hosting: Vercel
  - Free tier: 100GB bandwidth
  - Pro ($20/mo): 1TB bandwidth
  - Automatic scaling and caching
```

#### Key Libraries
```yaml
State Management: Zustand or Jotai
Data Fetching: TanStack Query
Forms: React Hook Form + Zod
Tables: TanStack Table
Charts: Recharts
File Upload: react-dropzone
WebSocket: Native WebSocket API
```

### Backend

#### API Layer
```yaml
Initial: Next.js API Routes
  - Simple to start
  - Same deployment as frontend
  - Built-in TypeScript

Scale to: Hono + Bun
  - 3x faster than Node.js
  - Better WebSocket support
  - Separate deployment possible
```

#### Database
```yaml
Primary: Neon PostgreSQL
  - Serverless PostgreSQL
  - Free tier: 3GB storage
  - Auto-scaling and branching
  - Connection pooling built-in

Schema Management: Prisma
  - Type-safe queries
  - Migration tracking
  - Auto-generated types
```

#### File Storage
```yaml
Provider: Cloudflare R2
  - S3-compatible API
  - Free tier: 10GB storage
  - Zero egress fees (huge savings)
  - Global CDN included

Structure:
  users/
    {userId}/
      files/
      sheets/
      uploads/
      agent-outputs/
```

#### Caching & Queues
```yaml
Cache: Upstash Redis
  - Serverless Redis
  - Free tier: 10,000 requests/day
  - Global replication
  - REST API available

Queue: Inngest
  - Serverless job queues
  - Free tier: 50K events/month
  - Retries and monitoring
  - Perfect for agent scheduling
```

### Agent Runtime

#### Compute Platform
```yaml
Service: Google Cloud Run
  - Free tier: 2M requests/month
  - Scales to zero
  - 60-minute max timeout
  - Native container support

Why Cloud Run:
  - Generous permanent free tier
  - Long-running process support
  - Auto-scaling built-in
  - No infrastructure management
```

#### Agent Architecture
```yaml
Container Base: Alpine Linux + Python/Node
Image Size: <100MB
Cold Start: 2-5 seconds
Warm Start: <500ms

Environment:
  - Read-only access to user data
  - Temporary write to R2
  - API access to integrations
  - No persistent state
```

### Integrations

#### Authentication & OAuth
```yaml
Service: Clerk
  - Free tier: 5,000 MAU
  - Social login providers
  - OAuth token management
  - Webhooks for sync

Supported Providers:
  - Google (Gmail, Calendar, Drive)
  - GitHub
  - Linear
  - Microsoft (Outlook, OneDrive)
```

#### External APIs
```yaml
Email: Gmail API
  - IMAP/SMTP fallback
  - Real-time webhooks
  - Full search capabilities

Calendar: Google Calendar API
  - Event CRUD
  - Availability checking
  - Recurring events

Banking: Plaid
  - Account balances
  - Transaction history
  - ACH transfers

Tasks: Linear API
  - Issue management
  - Project tracking
  - Webhooks for updates

Code: GitHub/GitLab APIs
  - Repository access
  - Commit history
  - PR/Issue management

Trading: Alpaca/Robinhood APIs
  - Portfolio data
  - Trade execution
  - Market data
```

---

## Data Model

### Core Entities

```typescript
// User & Authentication
interface User {
  id: string;
  email: string;
  tier: 'free' | 'basic' | 'pro';
  createdAt: Date;
  
  // Billing
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  
  // Preferences
  settings: JsonValue;
}

// Workspace Data
interface Note {
  id: string;
  userId: string;
  title: string;
  content: string; // Markdown or rich text
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
  integrationId?: string; // Linear, Jira, etc.
  integrationSyncedAt?: Date;
}

interface File {
  id: string;
  userId: string;
  path: string; // Virtual path
  r2Key: string; // Actual R2 location
  size: number;
  mimeType: string;
  metadata: JsonValue;
  createdAt: Date;
}

// Integrations
interface Integration {
  id: string;
  userId: string;
  provider: 'gmail' | 'github' | 'linear' | 'plaid' | ...;
  accessToken: string; // Encrypted
  refreshToken?: string; // Encrypted
  metadata: JsonValue;
  lastSyncedAt: Date;
}

// AI Agents
interface Agent {
  id: string;
  name: string;
  description: string;
  code: string; // Or reference to container
  triggers: AgentTrigger[];
  permissions: string[];
  userId?: string; // null = system agent
}

interface AgentExecution {
  id: string;
  agentId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: JsonValue;
  output?: JsonValue;
  startedAt: Date;
  completedAt?: Date;
  cloudRunJobId?: string;
}
```

### Virtual Filesystem

```typescript
// Virtual filesystem that maps to various data sources
interface VirtualFS {
  '/notes/': Note[],                    // From PostgreSQL
  '/tasks/': Task[],                    // From PostgreSQL
  '/mail/inbox/': EmailMessage[],       // From Gmail API (cached)
  '/mail/sent/': EmailMessage[],        // From Gmail API (cached)
  '/calendar/': CalendarEvent[],        // From Google Calendar
  '/files/': File[],                    // From R2
  '/code/': Repository[],                // From GitHub/GitLab
  '/banking/accounts/': PlaidAccount[], // From Plaid (cached)
}

// Terminal commands operate on this virtual filesystem
// Example: 'cat /notes/meeting.md' reads from PostgreSQL
// Example: 'ls /files/' lists from R2
// Example: 'agent run analyzer /tasks/' runs AI on tasks
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
```yaml
Goal: Core platform with basic apps
Cost: $20/month (Vercel only)

Features:
  - User authentication (Clerk)
  - Notes app (PostgreSQL)
  - Tasks app (PostgreSQL)
  - Files app (R2 storage)
  - Settings/preferences
  - Basic terminal with virtual filesystem

Tech:
  - Next.js on Vercel
  - Neon PostgreSQL
  - Cloudflare R2
  - Clerk authentication
```

### Phase 2: Integrations (Weeks 3-4)
```yaml
Goal: Connect external services
Cost: $20/month (still just Vercel)

Features:
  - Gmail integration
  - Google Calendar sync
  - GitHub repositories
  - Linear tasks import
  - Google Drive mounting

Tech:
  - OAuth flows
  - Webhook handlers
  - Background sync jobs (Inngest)
  - Redis caching (Upstash)
```

### Phase 3: AI Agents (Weeks 5-6)
```yaml
Goal: Intelligent automation
Cost: $70/month (+$50 for Cloud Run)

Features:
  - Agent marketplace
  - Custom agent creation
  - Scheduled agents
  - Cross-app agents
  - Natural language commands

Tech:
  - Google Cloud Run
  - Container registry
  - OpenAI/Anthropic APIs
  - Agent sandboxing
```

### Phase 4: Advanced Apps (Weeks 7-8)
```yaml
Goal: Complete the suite
Cost: $70/month (same)

Features:
  - Banking via Plaid
  - Portfolio tracking
  - IDE with GitHub integration
  - Sheets with Excel compatibility
  - Mail compose and rules

Tech:
  - Plaid integration
  - Trading APIs
  - Monaco editor
  - Luckysheet/x-spreadsheet
```

### Phase 5: Scale & Optimize (Month 3+)
```yaml
Goal: Handle growth efficiently
Cost: Scales with usage

Optimizations:
  - Move API to Hono/Bun
  - Add CDN caching
  - Implement rate limiting
  - Add monitoring (Posthog)
  - Database indexing
  - API response caching

At 1,000 paid users:
  - Revenue: $20,000/month
  - Costs: ~$200/month
  - Margin: 99%
```

---

## Terminal Implementation

### Not a Linux Shell
The terminal is a **command interface** for the unified workspace, not a Linux shell.

```typescript
// Example commands
> ls /notes
meeting-notes.md
project-ideas.md
personal-journal.md

> cat /notes/meeting-notes.md
# Team Standup - 2024-01-15
- Discussed Q1 roadmap...

> search "invoice" in /mail/inbox
Found 3 messages:
1. "Invoice #1234" from client@example.com
2. "Re: Invoice Payment" from accounting@...

> agent run summarizer /notes/* > /notes/summary.md
Running agent 'summarizer'...
Created /notes/summary.md (2.3KB)

> github clone spatiolabs/workspace /code/
Cloning repository...
Synced to /code/spatiolabs/workspace/

> calendar schedule "Team meeting" tomorrow 2pm
Event created: "Team meeting" 2024-01-16 14:00

> plaid balance
Checking: $12,543.21
Savings: $45,231.89
Credit: -$1,234.56
```

### Command Architecture
```typescript
interface Command {
  name: string;
  args: string[];
  flags: Record<string, any>;
  execute: (context: UserContext) => Promise<CommandResult>;
}

class TerminalProcessor {
  commands: Map<string, Command> = new Map([
    ['ls', new ListCommand()],
    ['cat', new ReadCommand()],
    ['echo', new WriteCommand()],
    ['agent', new AgentCommand()],
    ['github', new GitHubCommand()],
    ['gmail', new GmailCommand()],
    ['calendar', new CalendarCommand()],
    ['plaid', new PlaidCommand()],
    // ... more commands
  ]);
  
  async execute(input: string, userId: string) {
    const parsed = this.parse(input);
    const command = this.commands.get(parsed.command);
    
    if (!command) {
      return { error: `Command not found: ${parsed.command}` };
    }
    
    const context = await this.getUserContext(userId);
    return command.execute(context);
  }
}
```

---

## Security & Compliance

### Data Security
```yaml
Encryption:
  - At rest: AES-256 (PostgreSQL, R2)
  - In transit: TLS 1.3
  - Tokens: Encrypted with app key
  - PII: Additional encryption layer

Access Control:
  - Row-level security in PostgreSQL
  - Signed URLs for R2 access
  - API rate limiting per user
  - OAuth scope limitations
```

### Compliance
```yaml
GDPR:
  - Data export functionality
  - Right to deletion
  - Consent management
  - Data minimization

SOC 2 (Future):
  - Audit logging
  - Access controls
  - Encryption standards
  - Incident response

Banking (Plaid):
  - Token encryption
  - No credential storage
  - Webhook validation
  - Transaction encryption
```

---

## Cost Analysis

### At Different Scales

#### 100 Users (1 paid)
```yaml
Revenue: $20/month
Costs:
  - Vercel: $0 (free tier)
  - Neon: $0 (free tier)
  - R2: $0 (free tier)
  - Cloud Run: $0 (free tier)
Total Cost: $0/month
Profit: $20/month (100% margin)
```

#### 10,000 Users (100 paid)
```yaml
Revenue: $2,000/month
Costs:
  - Vercel: $20
  - Neon: $25
  - R2: $15
  - Cloud Run: $50
  - Redis: $10
Total Cost: $120/month
Profit: $1,880/month (94% margin)
```

#### 100,000 Users (1,000 paid)
```yaml
Revenue: $20,000/month
Costs:
  - Vercel: $20
  - Neon: $100
  - R2: $150
  - Cloud Run: $200
  - Redis: $50
  - Monitoring: $30
Total Cost: $550/month
Profit: $19,450/month (97.3% margin)
```

#### Target: 5,000 Paid Users ($100K MRR)
```yaml
Revenue: $100,000/month
Costs:
  - Vercel Pro: $200
  - Neon Business: $700
  - R2: $500
  - Cloud Run: $1,000
  - Redis: $100
  - Other services: $200
Total Cost: $2,700/month
Profit: $97,300/month (97.3% margin)
```

---

## Monitoring & Observability

### Key Metrics
```yaml
Business:
  - MRR/ARR
  - User activation rate
  - Free → Paid conversion
  - Churn rate
  - Feature adoption

Technical:
  - API response times
  - Agent execution duration
  - Integration sync failures
  - Storage usage per user
  - Cloud Run invocations

Cost:
  - Cost per user
  - Infrastructure as % of revenue
  - API call costs
  - Storage growth rate
```

### Monitoring Stack
```yaml
Analytics: PostHog
  - Free tier: 1M events
  - User behavior tracking
  - Feature flags
  - A/B testing

Error Tracking: Sentry
  - Free tier: 5K errors/month
  - Performance monitoring
  - Release tracking

Logs: Vercel/Cloud Run native
  - Built into platforms
  - No additional cost

Uptime: Better Uptime
  - Free tier: 10 monitors
  - Status page included
```

---

## Migration & Scaling Strategy

### When to Scale Components

#### Database (Neon)
```yaml
Free → Pro ($25/mo):
  - At 3GB data
  - Or 10K users
  - Or 100 requests/sec

Pro → Business ($700/mo):
  - At 50GB data
  - Or 50K users
  - Or 1000 requests/sec
```

#### API Layer
```yaml
Next.js API → Hono/Bun:
  - At 1000 paid users
  - Or performance issues
  - Or need WebSocket scale

Triggers:
  - Response time >500ms
  - Memory usage >90%
  - Cold starts >3 seconds
```

#### Agent Runtime
```yaml
Cloud Run → Cloud Run + GKE:
  - At 10K agent executions/day
  - Or need GPUs
  - Or need >60 min execution

Keep Cloud Run for:
  - Short agents (<5 min)
  - Stateless processing

Add GKE for:
  - Long-running agents
  - Stateful processing
  - GPU workloads
```

---

## Development Workflow

### Repository Structure
```yaml
spatiolabs/
├── apps/
│   ├── web/          # Next.js frontend + API
│   └── agents/       # Agent containers
├── packages/
│   ├── ui/           # Shared components
│   ├── db/           # Prisma schema
│   ├── types/        # TypeScript types
│   └── utils/        # Shared utilities
├── docs/
│   └── ARCHITECTURE.md  # This file
└── infrastructure/
    ├── terraform/    # Future IaC
    └── docker/       # Agent Dockerfiles
```

### Development Environment
```yaml
Requirements:
  - Node.js 20+
  - pnpm 8+
  - Docker Desktop
  - PostgreSQL (local or Neon)

Environment Variables:
  - DATABASE_URL
  - R2_ACCESS_KEY
  - CLERK_SECRET_KEY
  - OPENAI_API_KEY
  - GOOGLE_CLIENT_ID
  - PLAID_SECRET
```

### Deployment Pipeline
```yaml
Development:
  - Local Next.js dev server
  - Local PostgreSQL or Neon branch
  - R2 development bucket
  - Clerk development instance

Staging:
  - Vercel preview deployments
  - Neon branch database
  - R2 staging bucket
  - Cloud Run staging project

Production:
  - Vercel production
  - Neon main database
  - R2 production bucket
  - Cloud Run production project
  - Monitoring enabled
```

---

## Conclusion

SpatioLabs is a **data integration platform**, not a VM provider. This architecture provides:

1. **Extreme cost efficiency**: 97%+ margins at scale
2. **Simple infrastructure**: No Kubernetes or VMs needed
3. **Fast development**: Ship MVP in 2-4 weeks
4. **Unlimited scale**: Same architecture for 100 or 100K users
5. **User value**: Unified workspace for all digital tools

The key insight: We're aggregating and organizing data, not providing compute. This dramatically simplifies our infrastructure while providing more value to users.

**Next Steps**:
1. Set up Neon database with Prisma schema
2. Implement virtual filesystem over PostgreSQL
3. Add first integration (Gmail or GitHub)
4. Deploy MVP to Vercel
5. Launch with 100 beta users

Total time to revenue: 4 weeks
Total initial cost: $20/month