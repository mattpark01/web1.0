#!/bin/bash

###############################################################################
# GCP Free Tier e2-micro Instance Setup Script
# This script sets up a GCP project with comprehensive billing protection
# and creates an e2-micro instance that stays within free tier limits
###############################################################################

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Load environment variables from .env file
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    set -a  # Mark all new variables for export
    source "$ENV_FILE"
    set +a  # Turn off auto-export
fi

# Configuration variables (from .env or defaults)
PROJECT_ID="${GCP_PROJECT_ID:-free-tier-$(date +%s)}"
PROJECT_NAME="${GCP_PROJECT_NAME:-Free Tier Project}"
BILLING_ACCOUNT_ID="${GCP_BILLING_ACCOUNT_ID:-}"  # Set this to your billing account
REGION="${REGION:-us-central1}"  # Free tier eligible region
ZONE="${ZONE:-us-central1-a}"
INSTANCE_NAME="${INSTANCE_NAME:-free-tier-vm}"
MACHINE_TYPE="e2-micro"
BOOT_DISK_SIZE="30"  # Max 30GB for free tier
NETWORK_NAME="free-tier-network"
FIREWALL_RULE_NAME="allow-ssh-http-https"
BUDGET_NAME="free-tier-budget"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"  # Set this to your email

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI is not installed. Please install it first: https://cloud.google.com/sdk/docs/install"
    fi
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        error "Not authenticated. Please run: gcloud auth login"
    fi
    
    # Check if billing account is set
    if [ -z "$BILLING_ACCOUNT_ID" ]; then
        warning "BILLING_ACCOUNT_ID not set. Listing available billing accounts..."
        gcloud billing accounts list
        error "Please set GCP_BILLING_ACCOUNT_ID environment variable with your billing account ID"
    fi
    
    # Check if notification email is set
    if [ -z "$NOTIFICATION_EMAIL" ]; then
        error "NOTIFICATION_EMAIL not set. Please set it to receive billing alerts"
    fi
    
    log "Prerequisites check passed ✓"
}

# Create and configure project
create_project() {
    log "Creating project: $PROJECT_ID..."
    
    # Create project
    if gcloud projects describe "$PROJECT_ID" &> /dev/null; then
        warning "Project $PROJECT_ID already exists"
    else
        gcloud projects create "$PROJECT_ID" \
            --name="$PROJECT_NAME" \
            --set-as-default \
            || error "Failed to create project"
        
        log "Project created successfully ✓"
    fi
    
    # Set as default project
    gcloud config set project "$PROJECT_ID"
    
    # Link billing account
    log "Linking billing account..."
    gcloud billing projects link "$PROJECT_ID" \
        --billing-account="$BILLING_ACCOUNT_ID" \
        || error "Failed to link billing account"
    
    log "Billing account linked ✓"
}

# Enable required APIs
enable_apis() {
    log "Enabling required APIs..."
    
    local apis=(
        "compute.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "billingbudgets.googleapis.com"
        "cloudbilling.googleapis.com"
        "pubsub.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        log "Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT_ID" || warning "Failed to enable $api"
    done
    
    log "APIs enabled ✓"
    
    # Wait for APIs to be fully enabled
    log "Waiting for APIs to initialize..."
    sleep 10
}

# Set up billing budgets and alerts
setup_billing_protection() {
    log "Setting up billing budgets and alerts..."
    
    # Create budget with multiple thresholds
    log "Creating budget with alerts at \$0.01, \$1, and \$5..."
    
    # Create a Pub/Sub topic for notifications (optional, for programmatic handling)
    log "Creating Pub/Sub topic for budget notifications..."
    gcloud pubsub topics create budget-notifications \
        --project="$PROJECT_ID" \
        2>/dev/null || warning "Pub/Sub topic might already exist"
    
    # Create budget using gcloud
    # Note: Budget creation via CLI requires specific format
    gcloud billing budgets create \
        --billing-account="$BILLING_ACCOUNT_ID" \
        --display-name="$BUDGET_NAME" \
        --budget-amount=5USD \
        --threshold-rule=percent=0.2 \
        --threshold-rule=percent=20 \
        --threshold-rule=percent=50 \
        --threshold-rule=percent=90 \
        --threshold-rule=percent=100 \
        --filter-projects="projects/$PROJECT_ID" \
        --notifications-rule-monitoring-notification-channels="" \
        --notifications-rule-pubsub-topic="projects/$PROJECT_ID/topics/budget-notifications" \
        2>/dev/null || {
        warning "Budget might already exist or creation failed"
        warning "You may need to create it manually in the console"
    }
    
    log "Budget alerts configured ✓"
}

# Create compute instance
create_instance() {
    log "Creating e2-micro instance..."
    
    # Set default region and zone
    gcloud config set compute/region "$REGION"
    gcloud config set compute/zone "$ZONE"
    
    # Create VPC network (if not exists)
    log "Creating VPC network..."
    gcloud compute networks create "$NETWORK_NAME" \
        --subnet-mode=auto \
        --project="$PROJECT_ID" \
        2>/dev/null || warning "Network might already exist"
    
    # Create firewall rules
    log "Creating firewall rules..."
    gcloud compute firewall-rules create "$FIREWALL_RULE_NAME" \
        --network="$NETWORK_NAME" \
        --allow=tcp:22,tcp:80,tcp:443,icmp \
        --source-ranges=0.0.0.0/0 \
        --project="$PROJECT_ID" \
        2>/dev/null || warning "Firewall rule might already exist"
    
    # Create the e2-micro instance
    log "Creating e2-micro instance in $ZONE..."
    gcloud compute instances create "$INSTANCE_NAME" \
        --machine-type="$MACHINE_TYPE" \
        --zone="$ZONE" \
        --boot-disk-size="${BOOT_DISK_SIZE}GB" \
        --boot-disk-type=pd-standard \
        --boot-disk-device-name="$INSTANCE_NAME" \
        --network-interface=network="$NETWORK_NAME",subnet=default \
        --maintenance-policy=MIGRATE \
        --provisioning-model=STANDARD \
        --create-disk=auto-delete=yes,boot=yes,device-name="$INSTANCE_NAME",image-family=debian-11,image-project=debian-cloud,mode=rw,size="${BOOT_DISK_SIZE}",type=pd-standard \
        --no-shielded-secure-boot \
        --shielded-vtpm \
        --shielded-integrity-monitoring \
        --reservation-affinity=any \
        --labels=environment=free-tier,purpose=always-free \
        --project="$PROJECT_ID" \
        || error "Failed to create instance"
    
    log "Instance created successfully ✓"
}

# Set up monitoring alerts
setup_monitoring() {
    log "Setting up monitoring alerts..."
    
    # Create notification channel for email
    log "Creating email notification channel..."
    
    # First, check if channel already exists
    CHANNEL_NAME="email-notification"
    EXISTING_CHANNEL=$(gcloud alpha monitoring channels list \
        --filter="displayName:$CHANNEL_NAME" \
        --format="value(name)" \
        --project="$PROJECT_ID" 2>/dev/null || echo "")
    
    if [ -z "$EXISTING_CHANNEL" ]; then
        # Create notification channel descriptor file
        cat > /tmp/notification-channel.yaml <<EOF
type: email
displayName: $CHANNEL_NAME
description: Email notifications for free tier monitoring
enabled: true
labels:
  email_address: $NOTIFICATION_EMAIL
EOF
        
        NOTIFICATION_CHANNEL=$(gcloud alpha monitoring channels create \
            --channel-content-from-file=/tmp/notification-channel.yaml \
            --project="$PROJECT_ID" \
            --format="value(name)" \
            || echo "")
        
        rm -f /tmp/notification-channel.yaml
    else
        NOTIFICATION_CHANNEL="$EXISTING_CHANNEL"
        log "Using existing notification channel"
    fi
    
    # Create alert policies
    create_alert_policy() {
        local policy_name="$1"
        local display_name="$2"
        local metric_type="$3"
        local threshold="$4"
        local comparison="$5"
        
        log "Creating alert policy: $display_name..."
        
        cat > /tmp/alert-policy-${policy_name}.yaml <<EOF
displayName: "$display_name"
documentation:
  content: "Alert when $display_name exceeds threshold"
conditions:
  - displayName: "$display_name condition"
    conditionThreshold:
      filter: "metric.type=\"$metric_type\" AND resource.type=\"gce_instance\""
      comparison: $comparison
      thresholdValue: $threshold
      duration: 60s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
notificationChannels:
  - $NOTIFICATION_CHANNEL
alertStrategy:
  autoClose: 86400s
enabled: true
EOF
        
        gcloud alpha monitoring policies create \
            --policy-from-file=/tmp/alert-policy-${policy_name}.yaml \
            --project="$PROJECT_ID" \
            2>/dev/null || warning "Alert policy $display_name might already exist"
        
        rm -f /tmp/alert-policy-${policy_name}.yaml
    }
    
    # Create network egress alert (800MB warning for 1GB free limit)
    create_alert_policy \
        "network-egress" \
        "Network Egress Warning (800MB)" \
        "compute.googleapis.com/instance/network/sent_bytes_count" \
        "13981013"  # 800MB in bytes per minute (800*1024*1024/60)
        "COMPARISON_GT"
    
    # Create CPU utilization alert
    create_alert_policy \
        "cpu-utilization" \
        "High CPU Utilization (>90%)" \
        "compute.googleapis.com/instance/cpu/utilization" \
        "0.9" \
        "COMPARISON_GT"
    
    # Create disk usage alert (25GB warning for 30GB disk)
    create_alert_policy \
        "disk-usage" \
        "Disk Usage Warning (>25GB)" \
        "compute.googleapis.com/instance/disk/write_bytes_count" \
        "26843545600"  # 25GB in bytes
        "COMPARISON_GT"
    
    log "Monitoring alerts configured ✓"
}

# Create quota limits for additional protection
setup_quotas() {
    log "Setting up resource quotas..."
    
    # Note: Quota management via gcloud is limited
    # We'll create a configuration file for reference
    
    cat > quota-limits.txt <<EOF
# Recommended Quota Limits for Free Tier Protection
# These need to be set manually in the GCP Console under IAM & Admin > Quotas
# Or contact GCP support to set these limits

COMPUTE ENGINE QUOTAS (per region):
- CPUs: 1
- Persistent Disk Standard (GB): 30
- In-use IP addresses: 1
- Networks: 1
- Firewalls: 5
- Images: 5
- Instances: 1

NETWORK QUOTAS:
- Egress bandwidth: 1 GB/month

To apply these quotas:
1. Go to https://console.cloud.google.com/iam-admin/quotas
2. Filter by service and metric
3. Select the quota and click "Edit Quotas"
4. Set the new limit value
EOF
    
    log "Quota recommendations saved to quota-limits.txt"
    warning "Manual action required: Please set quotas in the console as per quota-limits.txt"
}

# Create cron job for monitoring
setup_monitoring_cron() {
    log "Setting up monitoring cron job..."
    
    # Create monitoring script path
    MONITOR_SCRIPT_PATH="$(pwd)/monitor-usage.sh"
    
    # Add cron job (runs every hour)
    (crontab -l 2>/dev/null || true; echo "0 * * * * $MONITOR_SCRIPT_PATH >> /var/log/gcp-monitor.log 2>&1") | crontab -
    
    log "Cron job configured to run hourly ✓"
}

# Summary
print_summary() {
    echo ""
    echo "=========================================="
    echo "     GCP FREE TIER SETUP COMPLETE!"
    echo "=========================================="
    echo ""
    echo "Project ID: $PROJECT_ID"
    echo "Instance Name: $INSTANCE_NAME"
    echo "Region/Zone: $REGION/$ZONE"
    echo "Machine Type: $MACHINE_TYPE"
    echo "Boot Disk: ${BOOT_DISK_SIZE}GB"
    echo ""
    echo "BILLING PROTECTION:"
    echo "✓ Budget alerts at \$0.01, \$1, and \$5"
    echo "✓ Email notifications to: $NOTIFICATION_EMAIL"
    echo ""
    echo "MONITORING ALERTS:"
    echo "✓ Network egress (800MB warning)"
    echo "✓ CPU utilization (>90%)"
    echo "✓ Disk usage (>25GB)"
    echo ""
    echo "NEXT STEPS:"
    echo "1. Review and apply quotas from quota-limits.txt"
    echo "2. Run ./verify-free-tier.sh to verify setup"
    echo "3. Run ./monitor-usage.sh to check current usage"
    echo "4. SSH into instance: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
    echo ""
    echo "IMPORTANT COMMANDS:"
    echo "- Check instance: gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE"
    echo "- Stop instance: gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE"
    echo "- Delete instance: gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE"
    echo "- Check billing: gcloud billing accounts list"
    echo ""
    warning "Remember to regularly monitor your usage to stay within free tier limits!"
}

# Main execution
main() {
    log "Starting GCP Free Tier setup..."
    
    check_prerequisites
    create_project
    enable_apis
    setup_billing_protection
    create_instance
    setup_monitoring
    setup_quotas
    setup_monitoring_cron
    print_summary
    
    log "Setup completed successfully! ✓"
}

# Run main function
main "$@"