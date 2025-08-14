#!/bin/bash

###############################################################################
# GCP Free Tier Verification Script
# This script verifies that your setup is eligible for free tier
# and lists all active protections and current usage
###############################################################################

set -euo pipefail

# Load environment variables from .env file
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
    set -a  # Mark all new variables for export
    source "$ENV_FILE"
    set +a  # Turn off auto-export
fi

# Configuration (from .env or defaults)
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
INSTANCE_NAME="${INSTANCE_NAME:-free-tier-vm}"
ZONE="${ZONE:-us-central1-a}"

# Free tier requirements
REQUIRED_MACHINE_TYPE="e2-micro"
REQUIRED_REGIONS=("us-west1" "us-central1" "us-east1")
MAX_DISK_SIZE=30
REQUIRED_DISK_TYPE="pd-standard"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Status tracking
ELIGIBLE=true
WARNINGS=()
ERRORS=()

# Logging functions
success() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ERRORS+=("$1")
    ELIGIBLE=false
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS+=("$1")
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check gcloud configuration
check_gcloud_config() {
    header "GCLOUD CONFIGURATION"
    
    # Check authentication
    local account=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || echo "")
    if [ -n "$account" ]; then
        success "Authenticated as: $account"
    else
        fail "Not authenticated with gcloud"
    fi
    
    # Check project
    if [ -n "$PROJECT_ID" ]; then
        success "Project configured: $PROJECT_ID"
    else
        fail "No project configured"
    fi
    
    # Check default region/zone
    local region=$(gcloud config get-value compute/region 2>/dev/null || echo "")
    local zone=$(gcloud config get-value compute/zone 2>/dev/null || echo "")
    
    if [ -n "$region" ]; then
        success "Default region: $region"
    else
        warning "No default region set"
    fi
    
    if [ -n "$zone" ]; then
        success "Default zone: $zone"
    else
        warning "No default zone set"
    fi
}

# Check instance configuration
check_instance_config() {
    header "INSTANCE CONFIGURATION"
    
    # Get instance details
    local instance_info=$(gcloud compute instances describe "$INSTANCE_NAME" \
        --zone="$ZONE" \
        --format="csv[no-heading](machineType.scope(machineTypes),disks[0].diskSizeGb,disks[0].type,status,zone.scope(zones))" \
        --project="$PROJECT_ID" 2>/dev/null || echo "")
    
    if [ -z "$instance_info" ]; then
        fail "Instance $INSTANCE_NAME not found in zone $ZONE"
        return
    fi
    
    # Parse instance info
    IFS=',' read -r machine_type disk_size disk_type status instance_zone <<< "$instance_info"
    
    # Extract just the machine type name
    machine_type=$(echo "$machine_type" | rev | cut -d'/' -f1 | rev)
    disk_type=$(echo "$disk_type" | rev | cut -d'/' -f1 | rev)
    instance_zone=$(echo "$instance_zone" | rev | cut -d'/' -f1 | rev)
    
    info "Instance: $INSTANCE_NAME"
    info "Status: $status"
    
    # Check machine type
    if [ "$machine_type" = "$REQUIRED_MACHINE_TYPE" ]; then
        success "Machine type: $machine_type (FREE TIER ELIGIBLE)"
    else
        fail "Machine type: $machine_type (NOT FREE TIER - requires $REQUIRED_MACHINE_TYPE)"
    fi
    
    # Check region
    local region=$(echo "$instance_zone" | rev | cut -d'-' -f2- | rev)
    local region_eligible=false
    for req_region in "${REQUIRED_REGIONS[@]}"; do
        if [ "$region" = "$req_region" ]; then
            region_eligible=true
            break
        fi
    done
    
    if [ "$region_eligible" = true ]; then
        success "Region: $region (FREE TIER ELIGIBLE)"
    else
        fail "Region: $region (NOT FREE TIER - requires one of: ${REQUIRED_REGIONS[*]})"
    fi
    
    # Check disk size
    if [ "$disk_size" -le "$MAX_DISK_SIZE" ]; then
        success "Boot disk size: ${disk_size}GB (within ${MAX_DISK_SIZE}GB limit)"
    else
        fail "Boot disk size: ${disk_size}GB (EXCEEDS ${MAX_DISK_SIZE}GB limit)"
    fi
    
    # Check disk type
    if [ "$disk_type" = "$REQUIRED_DISK_TYPE" ]; then
        success "Disk type: $disk_type (FREE TIER ELIGIBLE)"
    else
        fail "Disk type: $disk_type (NOT FREE TIER - requires $REQUIRED_DISK_TYPE)"
    fi
    
    # Check for external IP
    local external_ip=$(gcloud compute instances describe "$INSTANCE_NAME" \
        --zone="$ZONE" \
        --format="value(networkInterfaces[0].accessConfigs[0].natIP)" \
        --project="$PROJECT_ID" 2>/dev/null || echo "")
    
    if [ -n "$external_ip" ]; then
        info "External IP: $external_ip (1 ephemeral IP is free)"
    else
        info "No external IP assigned"
    fi
}

# Check billing configuration
check_billing_config() {
    header "BILLING CONFIGURATION"
    
    # Check if billing is enabled
    local billing_enabled=$(gcloud billing projects describe "$PROJECT_ID" \
        --format="value(billingEnabled)" 2>/dev/null || echo "false")
    
    if [ "$billing_enabled" = "True" ]; then
        success "Billing enabled for project"
    else
        fail "Billing not enabled for project"
    fi
    
    # Check billing account
    local billing_account=$(gcloud billing projects describe "$PROJECT_ID" \
        --format="value(billingAccountName)" 2>/dev/null || echo "")
    
    if [ -n "$billing_account" ]; then
        info "Billing account: ${billing_account##*/}"
    else
        warning "No billing account linked"
    fi
    
    # List budgets
    if [ -n "$billing_account" ]; then
        local budgets=$(gcloud billing budgets list \
            --billing-account="${billing_account##*/}" \
            --filter="projects/$PROJECT_ID" \
            --format="table(displayName,amount.specifiedAmount.units,thresholdRules[].thresholdPercent.size())" \
            2>/dev/null || echo "")
        
        if [ -n "$budgets" ]; then
            success "Budget alerts configured:"
            echo "$budgets" | sed 's/^/  /'
        else
            warning "No budget alerts configured"
        fi
    fi
}

# Check monitoring alerts
check_monitoring_alerts() {
    header "MONITORING ALERTS"
    
    # List alert policies
    local policies=$(gcloud alpha monitoring policies list \
        --project="$PROJECT_ID" \
        --format="table(displayName,enabled)" \
        2>/dev/null || echo "")
    
    if [ -n "$policies" ] && [ "$(echo "$policies" | wc -l)" -gt 1 ]; then
        success "Monitoring alerts configured:"
        echo "$policies" | sed 's/^/  /'
    else
        warning "No monitoring alerts configured"
    fi
    
    # Check notification channels
    local channels=$(gcloud alpha monitoring channels list \
        --project="$PROJECT_ID" \
        --format="table(displayName,type,enabled)" \
        2>/dev/null || echo "")
    
    if [ -n "$channels" ] && [ "$(echo "$channels" | wc -l)" -gt 1 ]; then
        info "Notification channels:"
        echo "$channels" | sed 's/^/  /'
    else
        warning "No notification channels configured"
    fi
}

# Check current usage
check_current_usage() {
    header "CURRENT USAGE (This Month)"
    
    # Get billing period
    local start_date=$(date +%Y-%m-01)
    local current_date=$(date +%Y-%m-%d)
    local days_in_month=$(date -d "$start_date +1 month -1 day" +%d)
    local current_day=$(date +%d)
    
    info "Billing period: $start_date to $(date -d "$start_date +1 month -1 day" +%Y-%m-%d)"
    info "Current day: $current_day of $days_in_month"
    
    # Calculate instance hours
    local hours_elapsed=$(( current_day * 24 ))
    local max_hours=744
    local hours_percent=$(( hours_elapsed * 100 / max_hours ))
    
    info "Instance hours used: ~$hours_elapsed of $max_hours (${hours_percent}%)"
    
    # Check if instance is currently running
    local instance_status=$(gcloud compute instances describe "$INSTANCE_NAME" \
        --zone="$ZONE" \
        --format="value(status)" \
        --project="$PROJECT_ID" 2>/dev/null || echo "")
    
    if [ "$instance_status" = "RUNNING" ]; then
        warning "Instance is currently RUNNING (consuming hours)"
    else
        success "Instance is $instance_status (not consuming hours)"
    fi
    
    # Estimate network egress (this is approximate)
    info "Network egress: Check with 'gcloud monitoring' for accurate data"
    info "Free tier limit: 1GB/month (excluding China & Australia)"
    
    # Check snapshots
    local snapshot_count=$(gcloud compute snapshots list \
        --filter="sourceDisk:$INSTANCE_NAME" \
        --format="value(name)" \
        --project="$PROJECT_ID" 2>/dev/null | wc -l || echo "0")
    
    if [ "$snapshot_count" -gt 0 ]; then
        warning "Snapshots found: $snapshot_count (5GB total free)"
    else
        success "No snapshots (5GB free available)"
    fi
}

# Check APIs enabled
check_apis() {
    header "ENABLED APIs"
    
    local required_apis=(
        "compute.googleapis.com"
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "billingbudgets.googleapis.com"
    )
    
    for api in "${required_apis[@]}"; do
        if gcloud services list --enabled --filter="name:$api" --format="value(name)" --project="$PROJECT_ID" 2>/dev/null | grep -q "$api"; then
            success "$api"
        else
            warning "$api not enabled"
        fi
    done
}

# Generate eligibility summary
generate_summary() {
    header "FREE TIER ELIGIBILITY SUMMARY"
    
    echo ""
    echo "REQUIREMENTS CHECK:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ "$ELIGIBLE" = true ]; then
        echo -e "${GREEN}✓ YOUR INSTANCE IS FREE TIER ELIGIBLE!${NC}"
        echo ""
        echo "You are using:"
        echo "• 1 e2-micro instance (744 hours/month free)"
        echo "• 30GB standard persistent disk"
        echo "• 1GB network egress/month"
        echo "• 5GB snapshot storage"
    else
        echo -e "${RED}✗ YOUR INSTANCE IS NOT FREE TIER ELIGIBLE${NC}"
        echo ""
        echo "Issues found:"
        for error in "${ERRORS[@]}"; do
            echo "  • $error"
        done
    fi
    
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}WARNINGS:${NC}"
        for warning in "${WARNINGS[@]}"; do
            echo "  ⚠ $warning"
        done
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Provide recommendations
    if [ "$ELIGIBLE" = false ]; then
        echo "RECOMMENDED ACTIONS:"
        echo "1. Stop the current instance: gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE"
        echo "2. Delete non-compliant resources"
        echo "3. Re-run setup.sh to create a compliant instance"
    else
        echo "RECOMMENDATIONS:"
        echo "1. Set up budget alerts if not configured"
        echo "2. Run monitor-usage.sh regularly"
        echo "3. Enable billing export to BigQuery for detailed tracking"
        echo "4. Set resource quotas in the console"
    fi
}

# Main verification
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════╗"
    echo "║   GCP FREE TIER VERIFICATION SCRIPT       ║"
    echo "║   Checking your setup for compliance...   ║"
    echo "╚═══════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_gcloud_config
    check_instance_config
    check_billing_config
    check_monitoring_alerts
    check_apis
    check_current_usage
    generate_summary
    
    # Save verification report
    local report_file="verification-report-$(date +%Y%m%d-%H%M%S).txt"
    {
        echo "GCP Free Tier Verification Report"
        echo "Generated: $(date)"
        echo "Project: $PROJECT_ID"
        echo ""
        echo "Eligible: $ELIGIBLE"
        [ ${#ERRORS[@]} -gt 0 ] && echo "Errors: ${#ERRORS[@]}"
        [ ${#WARNINGS[@]} -gt 0 ] && echo "Warnings: ${#WARNINGS[@]}"
    } > "$report_file"
    
    echo "Report saved to: $report_file"
    
    # Exit with appropriate code
    if [ "$ELIGIBLE" = false ]; then
        exit 1
    elif [ ${#WARNINGS[@]} -gt 0 ]; then
        exit 0  # Warnings don't fail the check
    else
        exit 0
    fi
}

# Run verification
main "$@"