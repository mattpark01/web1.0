# Proxy Architecture Diagram

## Request Flow: Before (Exposed URL)

```
┌─────────────┐
│   Browser   │
│(Client-side)│
└──────┬──────┘
       │
       │ Direct request with exposed URL
       │ https://agent-runtime-565753126849.us-east1.run.app/api/chat
       │ ❌ URL visible in DevTools
       │ ❌ CORS issues
       │
       ▼
┌─────────────────────────────────────┐
│         Cloud Run Service           │
│  agent-runtime-565753126849.run.app │
│         (Agent Runtime)              │
└─────────────────────────────────────┘
```

## Request Flow: After (Hidden URL via Proxy)

```
┌─────────────┐
│   Browser   │
│(Client-side)│
└──────┬──────┘
       │
       │ Local API request
       │ /api/chat
       │ ✅ Backend URL hidden
       │ ✅ No CORS issues
       │
       ▼
┌─────────────────────────────────────┐
│        Next.js Server               │
│      (app.spatiolabs.org)           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   API Proxy Routes:          │   │
│  │   • /api/chat                │   │
│  │   • /api/agents/*            │   │
│  │   • /api/executions/*        │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│             │ Server-side request   │
│             │ using AGENT_RUNTIME_URL│
│             │ (environment variable) │
└─────────────┼───────────────────────┘
              │
              │ https://agent-runtime-565753126849.us-east1.run.app
              │ ✅ URL only known server-side
              │ ✅ Can be changed without rebuilding client
              │
              ▼
┌─────────────────────────────────────┐
│         Cloud Run Service           │
│  agent-runtime-565753126849.run.app │
│         (Agent Runtime)              │
└─────────────────────────────────────┘
```

## Component Details

### 1. Browser (Client-Side)
```
┌──────────────────────────────────┐
│        React Components          │
│  ┌────────────────────────────┐  │
│  │ command-chat.tsx           │  │
│  │ fetch('/api/chat')         │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ AgentAPI class             │  │
│  │ baseUrl: '' (relative)     │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 2. Next.js API Routes (Proxy Layer)
```
┌──────────────────────────────────────┐
│         API Route Handlers           │
├──────────────────────────────────────┤
│ /app/api/chat/route.ts              │
│   └─> Forwards to /api/chat         │
├──────────────────────────────────────┤
│ /app/api/agents/[...path]/route.ts  │
│   └─> Forwards to /api/agents/*     │
├──────────────────────────────────────┤
│ /app/api/executions/[...path]/route.ts│
│   └─> Forwards to /api/executions/* │
└──────────────────────────────────────┘
```

### 3. Environment Configuration
```
┌──────────────────────────────────────┐
│        Environment Variables         │
├──────────────────────────────────────┤
│ Development (.env.local):            │
│   AGENT_RUNTIME_URL=                 │
│     "http://localhost:8081"          │
├──────────────────────────────────────┤
│ Production (Vercel/Deploy):          │
│   AGENT_RUNTIME_URL=                 │
│     "https://agent-runtime-*.run.app"│
└──────────────────────────────────────┘
```

## Security Benefits

```
┌─────────────────────────────────────────┐
│           Security Layer                │
├─────────────────────────────────────────┤
│ ✅ Backend URL never exposed to client  │
│ ✅ Can add rate limiting at proxy       │
│ ✅ Can validate/sanitize requests       │
│ ✅ Can add authentication checks        │
│ ✅ Can log all requests centrally       │
│ ✅ Can change backend without rebuild   │
└─────────────────────────────────────────┘
```

## Data Flow for Streaming Responses

```
Browser ← SSE Stream ← Next.js Proxy ← Cloud Run
   │                        │              │
   │   Text chunks          │  Forward     │
   │   data: {...}          │  stream      │  Generate
   │   data: [DONE]         │  chunks      │  response
   └────────────────────────┴──────────────┘
```

## File Structure

```
/web1.0
├── /app/api                    # Proxy routes
│   ├── /chat
│   │   └── route.ts           # Chat proxy
│   ├── /agents
│   │   └── [...path]
│   │       └── route.ts       # Agent operations proxy
│   └── /executions
│       └── [...path]
│           └── route.ts       # Execution tracking proxy
│
├── /components/chat
│   └── command-chat.tsx       # Uses /api/chat (no URL)
│
├── /lib
│   └── agent-api.ts           # Uses relative URLs
│
└── .env.example               # Documents AGENT_RUNTIME_URL
```

## Summary

**Before:** `Browser → Cloud Run (URL exposed)`

**After:** `Browser → Next.js → Cloud Run (URL hidden)`

The proxy architecture adds a security layer between the client and backend, hiding sensitive URLs and providing a place to add additional security controls.