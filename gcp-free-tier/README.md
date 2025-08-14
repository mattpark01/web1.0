# GCP Free Tier e2-micro Setup with Billing Protection

Complete automation scripts for setting up a GCP e2-micro instance that stays strictly within the free tier limits with comprehensive billing protection and monitoring.

## 🎯 Overview

This repository contains production-ready scripts to:
- Create and configure a GCP project with billing safeguards
- Deploy an e2-micro instance in free tier eligible regions
- Set up comprehensive monitoring and alerts
- Implement automatic emergency shutdown if limits are approached
- Verify free tier eligibility continuously

## 📋 Prerequisites

1. **Install gcloud CLI**:
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Linux/WSL
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   ```

2. **Authenticate**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

3. **Get your billing account ID**:
   ```bash
   gcloud billing accounts list
   ```

## 🚀 Quick Start

1. **Clone and configure**:
   ```bash
   # Set required environment variables
   export GCP_PROJECT_ID="my-free-tier-project"
   export GCP_BILLING_ACCOUNT_ID="XXXXXX-XXXXXX-XXXXXX"
   export NOTIFICATION_EMAIL="your-email@example.com"
   ```

2. **Run setup**:
   ```bash
   chmod +x *.sh
   ./setup.sh
   ```

3. **Verify free tier eligibility**:
   ```bash
   ./verify-free-tier.sh
   ```

4. **Monitor usage**:
   ```bash
   ./monitor-usage.sh
   ```

## 📂 Script Documentation

### setup.sh
Main setup script that creates everything needed for a free tier instance.

**What it does**:
- Creates a new GCP project
- Enables required APIs
- Sets up billing budgets with alerts at $0.01, $1, and $5
- Creates an e2-micro instance in a free tier region
- Configures firewall rules
- Sets up monitoring alerts for:
  - Network egress (800MB warning)
  - CPU utilization (>90%)
  - Disk usage (>25GB)
- Creates cron job for hourly monitoring

**Usage**:
```bash
./setup.sh
```

**Required Environment Variables**:
- `GCP_PROJECT_ID`: Your project ID (or auto-generated)
- `GCP_BILLING_ACCOUNT_ID`: Your billing account ID
- `NOTIFICATION_EMAIL`: Email for alerts

### monitor-usage.sh
Continuous monitoring script that checks usage against free tier limits.

**Features**:
- Checks instance hours (744/month free)
- Monitors network egress (1GB/month free)
- Tracks disk usage (30GB free)
- Monitors snapshot storage (5GB free)
- Can trigger emergency shutdown

**Usage**:
```bash
# Basic monitoring
./monitor-usage.sh

# Generate detailed report
./monitor-usage.sh --report

# Check without alerts
./monitor-usage.sh --check-only

# Trigger emergency shutdown
./monitor-usage.sh --shutdown
```

**Cron Setup** (automatically done by setup.sh):
```bash
# Run every hour
0 * * * * /path/to/monitor-usage.sh >> /var/log/gcp-monitor.log 2>&1
```

### verify-free-tier.sh
Verification script that confirms your setup is free tier eligible.

**Checks**:
- Machine type (must be e2-micro)
- Region (us-west1, us-central1, or us-east1)
- Disk size (max 30GB)
- Disk type (pd-standard)
- Billing configuration
- Alert policies
- Current usage

**Usage**:
```bash
./verify-free-tier.sh
```

**Output**:
- ✓ Green checks for compliant items
- ✗ Red X for non-compliant items
- ⚠ Yellow warnings for missing configurations

### emergency-shutdown.sh
Emergency shutdown script for when limits are exceeded.

**Actions**:
- Backs up current configuration
- Stops all compute instances
- Releases static IPs (if forced)
- Deletes excess snapshots (if forced)
- Checks for non-free tier resources
- Creates shutdown flag
- Generates detailed report

**Usage**:
```bash
# Interactive shutdown (with confirmation)
./emergency-shutdown.sh

# Force shutdown (no confirmation, deletes resources)
./emergency-shutdown.sh --force

# Dry run (show what would be done)
./emergency-shutdown.sh --dry-run

# Skip backup
./emergency-shutdown.sh --no-backup
```

## 🆓 GCP Free Tier Limits

| Resource | Free Tier Limit | Region Restriction |
|----------|----------------|-------------------|
| e2-micro instance | 744 hours/month | us-west1, us-central1, us-east1 |
| Standard persistent disk | 30GB total | Same as instance |
| Network egress | 1GB/month | Worldwide (excl. China & Australia) |
| Snapshot storage | 5GB total | Any region |
| External IP | 1 ephemeral | With running instance |

## 🛡️ Billing Protection Layers

### 1. **Budget Alerts**
- $0.01 - First penny alert
- $1.00 - Dollar threshold  
- $5.00 - Safety limit

### 2. **Monitoring Alerts**
- Network egress > 800MB (80% of 1GB)
- CPU utilization > 90%
- Disk usage > 25GB (83% of 30GB)

### 3. **Automated Monitoring**
- Hourly usage checks via cron
- Automatic comparison against limits
- Emergency shutdown capability

### 4. **Manual Quotas** (must set in console)
```
Compute Engine (per region):
- CPUs: 1
- Persistent Disk Standard: 30GB
- In-use IP addresses: 1
- Instances: 1
```

## 🎯 Essential gcloud Commands

### Instance Management
```bash
# List instances
gcloud compute instances list

# Start instance
gcloud compute instances start free-tier-vm --zone=us-central1-a

# Stop instance
gcloud compute instances stop free-tier-vm --zone=us-central1-a

# Delete instance
gcloud compute instances delete free-tier-vm --zone=us-central1-a

# SSH into instance
gcloud compute ssh free-tier-vm --zone=us-central1-a
```

### Billing & Budgets
```bash
# Check billing account
gcloud billing accounts list
gcloud billing projects describe PROJECT_ID

# List budgets
gcloud billing budgets list --billing-account=BILLING_ACCOUNT_ID

# Create budget (example)
gcloud billing budgets create \
    --billing-account=BILLING_ACCOUNT_ID \
    --display-name="Free Tier Budget" \
    --budget-amount=5USD \
    --threshold-rule=percent=20 \
    --threshold-rule=percent=50 \
    --threshold-rule=percent=90
```

### Monitoring
```bash
# List alert policies
gcloud alpha monitoring policies list

# Get current metrics (example for network)
gcloud monitoring read \
    "compute.googleapis.com/instance/network/sent_bytes_count" \
    --filter='resource.instance_id="free-tier-vm"' \
    --start-time=2024-01-01T00:00:00Z \
    --end-time=2024-01-31T23:59:59Z
```

### Resource Cleanup
```bash
# Stop all instances
gcloud compute instances stop $(gcloud compute instances list --format="value(name,zone)")

# Delete all snapshots
gcloud compute snapshots delete $(gcloud compute snapshots list --format="value(name)")

# Release static IPs
gcloud compute addresses delete ADDRESS_NAME --region=REGION
```

## ⚠️ Important Warnings

### Commands That May Incur Costs

1. **Creating static IPs**:
   ```bash
   # COSTS MONEY when not attached to running instance
   gcloud compute addresses create ...
   ```

2. **Creating additional instances**:
   ```bash
   # Only 1 e2-micro is free
   gcloud compute instances create second-instance ...
   ```

3. **Using premium network tier**:
   ```bash
   # Standard tier is free, premium costs
   --network-tier=PREMIUM  # AVOID THIS
   ```

4. **Creating resources outside free regions**:
   ```bash
   # These regions are NOT free tier
   --zone=europe-west1-b  # COSTS MONEY
   --zone=asia-southeast1-a  # COSTS MONEY
   ```

## 🔄 Rollback Procedures

### Rollback Project Creation
```bash
# Delete the project entirely
gcloud projects delete PROJECT_ID
```

### Rollback Instance Creation
```bash
# Stop and delete instance
gcloud compute instances stop free-tier-vm --zone=us-central1-a
gcloud compute instances delete free-tier-vm --zone=us-central1-a
```

### Rollback Network Configuration
```bash
# Delete firewall rules
gcloud compute firewall-rules delete allow-ssh-http-https

# Delete network
gcloud compute networks delete free-tier-network
```

### Rollback Monitoring
```bash
# Delete alert policies
gcloud alpha monitoring policies delete POLICY_ID

# Delete notification channels
gcloud alpha monitoring channels delete CHANNEL_ID
```

## 📊 Testing Alerts (Without Charges)

### Test Budget Alerts
```bash
# Budgets can be tested by setting very low thresholds temporarily
gcloud billing budgets update BUDGET_ID --budget-amount=0.01USD
# Remember to change back!
```

### Test Monitoring Alerts
```bash
# Temporarily lower thresholds
gcloud alpha monitoring policies update POLICY_ID \
    --update-threshold-value=100  # Very low value to trigger

# Send test notification
gcloud alpha monitoring channels verify CHANNEL_ID
```

### Test Emergency Shutdown
```bash
# Dry run mode (no actual changes)
./emergency-shutdown.sh --dry-run
```

## 🐛 Troubleshooting

### Issue: "Permission denied" errors
```bash
# Ensure you have the right roles
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="user:your-email@example.com" \
    --role="roles/owner"
```

### Issue: APIs not enabled
```bash
# Enable all required APIs
gcloud services enable compute.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable billingbudgets.googleapis.com
```

### Issue: Budget creation fails
```bash
# Check billing account permissions
gcloud billing accounts get-iam-policy BILLING_ACCOUNT_ID

# May need to use console for initial budget setup
echo "Visit: https://console.cloud.google.com/billing/budgets"
```

### Issue: Instance not free tier eligible
```bash
# Run verification
./verify-free-tier.sh

# Check specific requirements
gcloud compute instances describe free-tier-vm \
    --zone=us-central1-a \
    --format="yaml(machineType,disks,zone)"
```

## 📈 Monitoring Dashboard

Create a custom dashboard for easy monitoring:

```bash
# Create dashboard configuration
cat > dashboard.json <<EOF
{
  "displayName": "Free Tier Monitoring",
  "widgets": [
    {
      "title": "Instance Hours",
      "xyChart": {
        "dataSets": [{
          "timeSeriesQuery": {
            "timeSeriesFilter": {
              "filter": "metric.type=\"compute.googleapis.com/instance/uptime\""
            }
          }
        }]
      }
    },
    {
      "title": "Network Egress",
      "xyChart": {
        "dataSets": [{
          "timeSeriesQuery": {
            "timeSeriesFilter": {
              "filter": "metric.type=\"compute.googleapis.com/instance/network/sent_bytes_count\""
            }
          }
        }]
      }
    }
  ]
}
EOF

# Create dashboard (requires dashboards API)
gcloud monitoring dashboards create --config-from-file=dashboard.json
```

## 💰 Cost Optimization Tips

1. **Always stop instances when not in use**:
   ```bash
   gcloud compute instances stop free-tier-vm --zone=us-central1-a
   ```

2. **Use Cloud Scheduler for automatic start/stop**:
   ```bash
   # Start at 9 AM
   gcloud scheduler jobs create pubsub start-instance \
       --schedule="0 9 * * *" \
       --topic=instance-schedule \
       --message-body='{"instance":"free-tier-vm","action":"start"}'
   
   # Stop at 6 PM
   gcloud scheduler jobs create pubsub stop-instance \
       --schedule="0 18 * * *" \
       --topic=instance-schedule \
       --message-body='{"instance":"free-tier-vm","action":"stop"}'
   ```

3. **Monitor egress carefully**:
   - Use Cloud CDN for static content
   - Compress data before transfer
   - Use internal IPs when possible

4. **Clean up unused resources regularly**:
   ```bash
   # Find and delete old snapshots
   gcloud compute snapshots list --filter="creationTimestamp<$(date -d '30 days ago' --iso-8601)"
   ```

## 📚 Additional Resources

- [GCP Free Tier Documentation](https://cloud.google.com/free/docs/free-cloud-features)
- [Compute Engine Pricing](https://cloud.google.com/compute/pricing)
- [Budget API Documentation](https://cloud.google.com/billing/docs/how-to/budgets)
- [Monitoring API Documentation](https://cloud.google.com/monitoring/api/v3)

## 🤝 Contributing

Feel free to submit issues and pull requests to improve these scripts.

## ⚖️ License

MIT License - Use at your own risk. Always monitor your GCP billing!

## ⚡ Quick Reference Card

```bash
# Setup
export GCP_PROJECT_ID="my-project"
export GCP_BILLING_ACCOUNT_ID="XXXXXX-XXXXXX-XXXXXX"
export NOTIFICATION_EMAIL="me@example.com"
./setup.sh

# Daily Operations
./monitor-usage.sh                    # Check usage
gcloud compute instances stop free-tier-vm --zone=us-central1-a  # Stop when not needed
gcloud compute instances start free-tier-vm --zone=us-central1-a # Start when needed

# Emergency
./emergency-shutdown.sh              # Interactive shutdown
./emergency-shutdown.sh --force      # Force shutdown

# Verification
./verify-free-tier.sh                # Check eligibility
```

---

**Remember**: The free tier is perpetual but has strict limits. Always monitor your usage and stop resources when not in use!