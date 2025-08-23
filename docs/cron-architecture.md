# Cron Job Architecture

## Overview
This document outlines our cron job strategy for the connection system, designed to scale from MVP to thousands of automations.

## Architecture Phases

### Phase 1: MVP (Current)
**Technology:** Cloudflare Workers  
**Cost:** Free tier (100k requests/day)  
**Use Cases:**
- Token refresh (hourly)
- Basic health checks
- Simple trigger polling

### Phase 2: Scale (Future)
**Technology:** Cloud Run + Cloud Scheduler  
**Cost:** Pay per use (~$50-100/month at scale)  
**Use Cases:**
- Complex automation processing
- AI/ML workloads
- Bulk data synchronization
- Long-running jobs (>30 seconds)

## Implementation Strategy

### Short Term: Cloudflare Workers (Free)

```javascript
// wrangler.toml
name = "spatiolabs-cron"
main = "src/index.ts"

[triggers]
crons = [
  "0 * * * *",      // Hourly: Token refresh
  "*/5 * * * *",    // 5 min: Health checks
  "* * * * *"       // 1 min: Trigger polling (when needed)
]

// src/index.ts
export default {
  async scheduled(event, env, ctx) {
    const { cron } = event
    
    switch(cron) {
      case "0 * * * *":
        // Token refresh - lightweight
        await refreshExpringTokens(env)
        break
      
      case "*/5 * * * *":
        // Health checks - quick pings
        await checkConnectionHealth(env)
        break
        
      case "* * * * *":
        // Trigger polling - check for new events
        await pollTriggers(env)
        break
    }
  }
}
```

**Limitations:**
- 30 second max execution time
- 128MB memory
- Stateless execution
- JavaScript/TypeScript only

### Long Term: Cloud Run + Cloud Scheduler

```python
# Cloud Run Service (Python/Node/Go)
from flask import Flask, request
import asyncio

app = Flask(__name__)

@app.route('/cron/process-automations', methods=['POST'])
async def process_automations():
    """
    Heavy processing that can run for up to 60 minutes
    """
    # Get all active automations
    automations = await get_active_automations()
    
    # Process in parallel
    tasks = []
    for automation in automations:
        tasks.append(process_single_automation(automation))
    
    results = await asyncio.gather(*tasks)
    
    return {"processed": len(results)}, 200

async def process_single_automation(automation):
    """
    Complex automation logic:
    - Fetch data from multiple sources
    - Run AI transformations
    - Update multiple destinations
    - Generate reports
    """
    # Can use up to 32GB RAM and multiple CPUs
    pass
```

```yaml
# Cloud Scheduler Configuration
- name: process-heavy-automations
  schedule: "*/15 * * * *"  # Every 15 minutes
  httpTarget:
    uri: https://automation-processor-xyz.run.app/cron/process-automations
    httpMethod: POST
    headers:
      Authorization: Bearer ${CRON_SECRET}
```

## Migration Path

### Step 1: Start Simple (Cloudflare Workers)
- Deploy basic cron jobs for token refresh
- Monitor usage and performance
- Cost: $0

### Step 2: Add Trigger Polling (Cloudflare Workers)
- When users create automations
- Poll for new events every minute
- Still within free tier for <300 automations

### Step 3: Hybrid Approach (Cloudflare + Cloud Run)
- Cloudflare checks triggers (lightweight)
- Cloud Run processes automations (heavy)
- Cost: ~$5-20/month

### Step 4: Full Cloud Run (Scale)
- When processing takes >30 seconds
- Need stateful processing
- Complex AI/ML operations
- Cost: $50-100/month

## Decision Matrix

| Scenario | Solution | Why |
|----------|----------|-----|
| Check if email arrived | Cloudflare Worker | Quick API call (<100ms) |
| Refresh OAuth token | Cloudflare Worker | Simple token exchange |
| Parse email with AI | Cloud Run | Needs 5-10 seconds |
| Sync 10,000 records | Cloud Run | Needs minutes |
| Check connection health | Cloudflare Worker | Quick ping |
| Generate AI reports | Cloud Run | Heavy computation |

## Cost Optimization

### Free Tier Maximization
- Cloudflare: 100,000 requests/day free
- Cloud Run: 2 million requests/month free
- Cloud Scheduler: 3 jobs free

### When to Upgrade
- >100k trigger checks/day → Add Cloud Run
- >30 second processing → Use Cloud Run
- >128MB memory needed → Use Cloud Run
- Need persistent state → Use Cloud Run

## Environment Variables

### Cloudflare Worker
```toml
[vars]
APP_URL = "https://yourapp.com"
CRON_SECRET = "your-secret"

[secrets]
# wrangler secret put CRON_SECRET
```

### Cloud Run
```yaml
env:
  - name: DATABASE_URL
    value: "postgresql://..."
  - name: CRON_SECRET
    valueFrom:
      secretKeyRef:
        name: cron-secret
        key: latest
```

## Monitoring

### Cloudflare Analytics
- Free dashboard showing all executions
- Error rates and duration
- No additional setup

### Cloud Run Monitoring
- Google Cloud Monitoring
- Custom metrics
- Alerts on failures

## Security

1. **Authentication:** All cron endpoints require `CRON_SECRET`
2. **Network:** Cloudflare → Your API requires auth
3. **Rate Limiting:** Built into both platforms
4. **Audit:** All executions logged

## Next Steps

1. Set up Cloudflare Worker for token refresh
2. Add health check cron
3. Monitor usage for 2 weeks
4. Evaluate if Cloud Run needed
5. Migrate heavy processing as needed