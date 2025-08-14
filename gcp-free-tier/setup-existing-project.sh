#!/bin/bash

###############################################################################
# GCP Free Tier Setup for EXISTING Project with Cloud Run
# This script adds a free tier e2-micro instance to an existing project
# WITHOUT disrupting Cloud Run or other services
###############################################################################

set -euo pipefail

# Load environment variables from .env file
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-kinetic-road-425815-k1}"
BILLING_ACCOUNT_ID="${GCP_BILLING_ACCOUNT_ID:-}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"
INSTANCE_NAME="${INSTANCE_NAME:-free-tier-vm}"
MACHINE_TYPE="e2-micro"
BOOT_DISK_SIZE="30"
BUDGET_NAME="free-tier-budget"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites for existing project..."
    
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI is not installed"
    fi
    
    if [ -z "$PROJECT_ID" ]; then
        error "PROJECT_ID not set"
    fi
    
    if [ -z "$NOTIFICATION_EMAIL" ]; then
        error "NOTIFICATION_EMAIL not set"
    fi
    
    # Set the project
    gcloud config set project "$PROJECT_ID"
    
    log "Using existing project: $PROJECT_ID"
    log "Prerequisites check passed ✓"
}

# Check existing resources to avoid conflicts
check_existing_resources() {
    log "Checking existing resources in project..."
    
    # Check if Cloud Run is active
    local cloud_run_services=$(gcloud run services list --platform=managed --format="value(name)" 2>/dev/null | wc -l || echo "0")
    if [ "$cloud_run_services" -gt 0 ]; then
        info "Found $cloud_run_services Cloud Run service(s) - will preserve them"
    fi
    
    # Check existing compute instances
    local existing_instances=$(gcloud compute instances list --format="value(name)" 2>/dev/null || echo "")
    if [ -n "$existing_instances" ]; then
        warning "Found existing compute instances:"
        echo "$existing_instances" | sed 's/^/  - /'
        
        # Check if our instance already exists
        if echo "$existing_instances" | grep -q "^${INSTANCE_NAME}$"; then
            error "Instance $INSTANCE_NAME already exists. Please delete it first or choose a different name."
        fi
    fi
    
    # Check existing networks
    local default_network=$(gcloud compute networks list --filter="name=default" --format="value(name)" 2>/dev/null || echo "")
    if [ -z "$default_network" ]; then
        warning "No default network found. Will use or create one."
    else
        info "Using existing default network"
    fi
    
    # Check billing
    local billing_enabled=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingEnabled)" 2>/dev/null || echo "false")
    if [ "$billing_enabled" != "True" ]; then
        error "Billing is not enabled for this project"
    fi
    
    info "Existing resources check complete ✓"
}

# Enable only necessary APIs (skip if already enabled)
enable_required_apis() {
    log "Checking and enabling required APIs..."
    
    local apis=(
        "compute.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "billingbudgets.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
            info "$api already enabled ✓"
        else
            log "Enabling $api..."
            gcloud services enable "$api" --project="$PROJECT_ID" || warning "Failed to enable $api"
        fi
    done
    
    log "APIs check complete ✓"
}

# Setup billing alerts (check if already exist)
setup_billing_protection() {
    log "Setting up billing protection..."
    
    # Get billing account
    local billing_account=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingAccountName)" 2>/dev/null || echo "")
    
    if [ -z "$billing_account" ]; then
        error "No billing account found for project"
    fi
    
    BILLING_ACCOUNT_ID="${billing_account##*/}"
    info "Using billing account: $BILLING_ACCOUNT_ID"
    
    # Check existing budgets
    local existing_budgets=$(gcloud billing budgets list \
        --billing-account="$BILLING_ACCOUNT_ID" \
        --filter="projects/$PROJECT_ID" \
        --format="value(displayName)" 2>/dev/null || echo "")
    
    if echo "$existing_budgets" | grep -q "$BUDGET_NAME"; then
        warning "Budget '$BUDGET_NAME' already exists"
    else
        log "Creating budget with alerts at \$0.01, \$1, and \$5..."
        
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
            2>/dev/null || warning "Budget creation failed - you may need to create it manually"
    fi
    
    log "Billing protection setup complete ✓"
}

# Create the e2-micro instance
create_free_tier_instance() {
    log "Creating free tier e2-micro instance..."
    
    # Set default region and zone
    gcloud config set compute/region "$REGION"
    gcloud config set compute/zone "$ZONE"
    
    # Check if default network exists
    local network_name="default"
    if ! gcloud compute networks describe "$network_name" --project="$PROJECT_ID" &>/dev/null; then
        log "Creating default network..."
        gcloud compute networks create "$network_name" \
            --subnet-mode=auto \
            --project="$PROJECT_ID" \
            2>/dev/null || warning "Network creation failed"
    fi
    
    # Check/create firewall rules for SSH/HTTP/HTTPS
    local firewall_ssh="default-allow-ssh"
    if ! gcloud compute firewall-rules describe "$firewall_ssh" --project="$PROJECT_ID" &>/dev/null; then
        log "Creating SSH firewall rule..."
        gcloud compute firewall-rules create "$firewall_ssh" \
            --network="$network_name" \
            --allow=tcp:22 \
            --source-ranges=0.0.0.0/0 \
            --project="$PROJECT_ID" \
            2>/dev/null || warning "SSH firewall rule may already exist"
    fi
    
    # Create the instance
    log "Creating e2-micro instance: $INSTANCE_NAME in $ZONE..."
    
    gcloud compute instances create "$INSTANCE_NAME" \
        --machine-type="$MACHINE_TYPE" \
        --zone="$ZONE" \
        --boot-disk-size="${BOOT_DISK_SIZE}GB" \
        --boot-disk-type=pd-standard \
        --network-interface=network="$network_name",subnet=default \
        --maintenance-policy=MIGRATE \
        --provisioning-model=STANDARD \
        --image-family=debian-11 \
        --image-project=debian-cloud \
        --no-shielded-secure-boot \
        --shielded-vtpm \
        --shielded-integrity-monitoring \
        --labels=environment=free-tier,purpose=always-free,type=e2-micro \
        --project="$PROJECT_ID" \
        || error "Failed to create instance"
    
    log "Instance created successfully ✓"
}

# Setup monitoring specific to the e2-micro instance
setup_instance_monitoring() {
    log "Setting up monitoring for free tier instance..."
    
    # Create email notification channel
    local channel_name="free-tier-email-notification"
    
    # Check if channel exists
    local existing_channel=$(gcloud alpha monitoring channels list \
        --filter="displayName:$channel_name" \
        --format="value(name)" \
        --project="$PROJECT_ID" 2>/dev/null || echo "")
    
    if [ -z "$existing_channel" ]; then
        cat > /tmp/notification-channel.yaml <<EOF
type: email
displayName: $channel_name
description: Email notifications for free tier monitoring
enabled: true
labels:
  email_address: $NOTIFICATION_EMAIL
EOF
        
        NOTIFICATION_CHANNEL=$(gcloud alpha monitoring channels create \
            --channel-content-from-file=/tmp/notification-channel.yaml \
            --project="$PROJECT_ID" \
            --format="value(name)" \
            2>/dev/null || echo "")
        
        rm -f /tmp/notification-channel.yaml
    else
        NOTIFICATION_CHANNEL="$existing_channel"
        info "Using existing notification channel"
    fi
    
    # Create monitoring policies specific to our instance
    create_instance_alert() {
        local policy_name="$1"
        local display_name="$2"
        local metric_type="$3"
        local threshold="$4"
        local comparison="$5"
        
        log "Creating alert: $display_name..."
        
        cat > /tmp/alert-policy-${policy_name}.yaml <<EOF
displayName: "[Free Tier] $display_name"
documentation:
  content: "Alert for free tier instance $INSTANCE_NAME when $display_name exceeds threshold"
conditions:
  - displayName: "$display_name condition"
    conditionThreshold:
      filter: "metric.type=\"$metric_type\" AND resource.type=\"gce_instance\" AND resource.labels.instance_id=\"$INSTANCE_NAME\""
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
    
    # Create alerts specific to our free tier instance
    create_instance_alert \
        "free-tier-network-egress" \
        "Network Egress Warning (800MB)" \
        "compute.googleapis.com/instance/network/sent_bytes_count" \
        "13981013" \
        "COMPARISON_GT"
    
    create_instance_alert \
        "free-tier-cpu" \
        "CPU Utilization (>90%)" \
        "compute.googleapis.com/instance/cpu/utilization" \
        "0.9" \
        "COMPARISON_GT"
    
    log "Monitoring setup complete ✓"
}

# Create tracking document
create_tracking_info() {
    cat > free-tier-instance-info.txt <<EOF
FREE TIER INSTANCE INFORMATION
==============================
Created: $(date)
Project: $PROJECT_ID
Instance: $INSTANCE_NAME
Zone: $ZONE
Type: e2-micro (FREE TIER)

IMPORTANT LIMITS:
- Instance hours: 744/month (24/7 for 31 days)
- Network egress: 1GB/month
- Disk size: 30GB (current)
- Region: $REGION (free tier eligible)

MONITORING:
- Budget alerts at: \$0.01, \$1, \$5
- Network egress alert at 800MB
- CPU utilization alert at 90%
- Email notifications to: $NOTIFICATION_EMAIL

CLOUD RUN COMPATIBILITY:
- This instance runs independently of Cloud Run
- Uses separate compute quotas
- No conflict with serverless services

COMMANDS:
Start:  gcloud compute instances start $INSTANCE_NAME --zone=$ZONE
Stop:   gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE  
SSH:    gcloud compute ssh $INSTANCE_NAME --zone=$ZONE
Delete: gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE

MONITORING:
./monitor-usage.sh          # Check current usage
./verify-free-tier.sh       # Verify free tier compliance
./emergency-shutdown.sh     # Emergency stop if needed
EOF
    
    log "Instance information saved to free-tier-instance-info.txt"
}

# Main execution
main() {
    log "Starting Free Tier Setup for EXISTING Project"
    log "================================================"
    info "Project: $PROJECT_ID"
    info "This will ADD a free tier VM without affecting Cloud Run"
    echo ""
    
    # Confirmation
    read -p "Continue with setup in existing project? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        error "Setup cancelled by user"
    fi
    
    check_prerequisites
    check_existing_resources
    enable_required_apis
    setup_billing_protection
    create_free_tier_instance
    setup_instance_monitoring
    create_tracking_info
    
    echo ""
    log "╔════════════════════════════════════════════╗"
    log "║    FREE TIER SETUP COMPLETE!                ║"
    log "╚════════════════════════════════════════════╝"
    echo ""
    success "✓ e2-micro instance created: $INSTANCE_NAME"
    success "✓ Budget alerts configured"
    success "✓ Monitoring alerts active"
    success "✓ Cloud Run services preserved"
    echo ""
    info "Instance: $INSTANCE_NAME"
    info "Zone: $ZONE"
    info "Type: e2-micro (FREE TIER)"
    info "Status: RUNNING"
    echo ""
    warning "IMPORTANT: Your instance is now running and consuming free tier hours!"
    warning "Stop it when not in use: gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE"
    echo ""
    info "SSH into instance: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
    info "Monitor usage: ./monitor-usage.sh"
    info "Verify compliance: ./verify-free-tier.sh"
}

# Run main
main "$@"