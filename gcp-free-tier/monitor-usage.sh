#!/bin/bash

###############################################################################
# GCP Free Tier Usage Monitoring Script
# This script monitors current usage and compares against free tier limits
# Can trigger emergency shutdown if limits are approached
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
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"

# Free tier limits
FREE_TIER_EGRESS_GB=1  # 1GB network egress per month (excluding China and Australia)
FREE_TIER_HOURS=744  # 744 hours per month (e2-micro)
FREE_TIER_DISK_GB=30  # 30GB persistent disk
FREE_TIER_SNAPSHOT_GB=5  # 5GB snapshot storage

# Warning thresholds (percentage of free tier limit, from .env or defaults)
WARNING_THRESHOLD="${WARNING_THRESHOLD:-80}"
CRITICAL_THRESHOLD="${CRITICAL_THRESHOLD:-95}"

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
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Get current billing period dates
get_billing_period() {
    local current_date=$(date +%Y-%m-%d)
    local start_date=$(date +%Y-%m-01)
    local end_date=$(date -d "$start_date +1 month -1 day" +%Y-%m-%d)
    
    echo "$start_date $end_date"
}

# Check instance hours usage
check_instance_hours() {
    log "Checking instance hours usage..."
    
    local billing_period=($(get_billing_period))
    local start_date="${billing_period[0]}"
    local current_date=$(date +%Y-%m-%d)
    
    # Get instance creation time
    local instance_info=$(gcloud compute instances describe "$INSTANCE_NAME" \
        --zone="$ZONE" \
        --format="value(creationTimestamp,status)" \
        --project="$PROJECT_ID" 2>/dev/null || echo "")
    
    if [ -z "$instance_info" ]; then
        error "Instance $INSTANCE_NAME not found"
        return 1
    fi
    
    local status=$(echo "$instance_info" | awk '{print $2}')
    
    # Calculate hours since start of month
    local hours_this_month=$(( ($(date +%s) - $(date -d "$start_date" +%s)) / 3600 ))
    
    # Check if instance is running
    if [ "$status" = "RUNNING" ]; then
        local usage_percent=$(( hours_this_month * 100 / FREE_TIER_HOURS ))
        
        info "Instance Status: RUNNING"
        info "Hours used this month: $hours_this_month / $FREE_TIER_HOURS"
        info "Usage: ${usage_percent}%"
        
        if [ $usage_percent -ge $CRITICAL_THRESHOLD ]; then
            error "CRITICAL: Instance hours usage at ${usage_percent}%!"
            return 2
        elif [ $usage_percent -ge $WARNING_THRESHOLD ]; then
            warning "Instance hours usage at ${usage_percent}%"
            return 1
        else
            log "Instance hours usage OK (${usage_percent}%)"
        fi
    else
        info "Instance Status: $status"
    fi
    
    return 0
}

# Check network egress usage
check_network_egress() {
    log "Checking network egress usage..."
    
    local billing_period=($(get_billing_period))
    local start_date="${billing_period[0]}T00:00:00Z"
    local end_date="$(date +%Y-%m-%dT%H:%M:%S)Z"
    
    # Query metrics for network egress
    local egress_bytes=$(gcloud monitoring read \
        "compute.googleapis.com/instance/network/sent_bytes_count" \
        --project="$PROJECT_ID" \
        --filter="resource.instance_id=\"$INSTANCE_NAME\"" \
        --start-time="$start_date" \
        --end-time="$end_date" \
        --format="value(point.value.int64_value)" \
        2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
    
    if [ -z "$egress_bytes" ] || [ "$egress_bytes" = "0" ]; then
        info "No network egress data available yet"
        return 0
    fi
    
    local egress_gb=$(echo "scale=2; $egress_bytes / 1073741824" | bc)
    local usage_percent=$(echo "scale=0; $egress_gb * 100 / $FREE_TIER_EGRESS_GB" | bc)
    
    info "Network egress this month: ${egress_gb}GB / ${FREE_TIER_EGRESS_GB}GB"
    info "Usage: ${usage_percent}%"
    
    if [ $(echo "$usage_percent >= $CRITICAL_THRESHOLD" | bc) -eq 1 ]; then
        error "CRITICAL: Network egress usage at ${usage_percent}%!"
        return 2
    elif [ $(echo "$usage_percent >= $WARNING_THRESHOLD" | bc) -eq 1 ]; then
        warning "Network egress usage at ${usage_percent}%"
        return 1
    else
        log "Network egress usage OK (${usage_percent}%)"
    fi
    
    return 0
}

# Check disk usage
check_disk_usage() {
    log "Checking disk usage..."
    
    # Get disk information
    local disk_info=$(gcloud compute disks describe "$INSTANCE_NAME" \
        --zone="$ZONE" \
        --format="value(sizeGb)" \
        --project="$PROJECT_ID" 2>/dev/null || echo "")
    
    if [ -z "$disk_info" ]; then
        warning "Could not get disk information"
        return 0
    fi
    
    local disk_size="$disk_info"
    local usage_percent=$(( disk_size * 100 / FREE_TIER_DISK_GB ))
    
    info "Disk size: ${disk_size}GB / ${FREE_TIER_DISK_GB}GB"
    info "Usage: ${usage_percent}%"
    
    if [ $disk_size -gt $FREE_TIER_DISK_GB ]; then
        error "CRITICAL: Disk size exceeds free tier limit!"
        return 2
    else
        log "Disk usage OK (${disk_size}GB)"
    fi
    
    return 0
}

# Check snapshot usage
check_snapshot_usage() {
    log "Checking snapshot usage..."
    
    # List all snapshots
    local snapshot_sizes=$(gcloud compute snapshots list \
        --filter="sourceDisk:$INSTANCE_NAME" \
        --format="value(diskSizeGb)" \
        --project="$PROJECT_ID" 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
    
    if [ -z "$snapshot_sizes" ] || [ "$snapshot_sizes" = "0" ]; then
        info "No snapshots found"
        return 0
    fi
    
    local usage_percent=$(( snapshot_sizes * 100 / FREE_TIER_SNAPSHOT_GB ))
    
    info "Snapshot storage: ${snapshot_sizes}GB / ${FREE_TIER_SNAPSHOT_GB}GB"
    info "Usage: ${usage_percent}%"
    
    if [ $snapshot_sizes -gt $FREE_TIER_SNAPSHOT_GB ]; then
        warning "Snapshot storage exceeds free tier limit!"
        return 1
    else
        log "Snapshot usage OK (${snapshot_sizes}GB)"
    fi
    
    return 0
}

# Check current billing amount
check_billing() {
    log "Checking current billing amount..."
    
    local billing_account=$(gcloud billing projects describe "$PROJECT_ID" \
        --format="value(billingAccountName)" 2>/dev/null || echo "")
    
    if [ -z "$billing_account" ]; then
        warning "No billing account linked"
        return 0
    fi
    
    # Note: Getting actual billing data requires BigQuery export setup
    # This is a placeholder for the billing check
    info "Billing account: $billing_account"
    info "For detailed billing, enable billing export to BigQuery"
    
    # Check if any budgets are configured
    local budgets=$(gcloud billing budgets list \
        --billing-account="${billing_account##*/}" \
        --filter="projects/$PROJECT_ID" \
        --format="table(displayName,amount.specifiedAmount.currencyCode,amount.specifiedAmount.units)" \
        2>/dev/null || echo "")
    
    if [ -n "$budgets" ]; then
        info "Active budgets:"
        echo "$budgets"
    fi
    
    return 0
}

# Send alert notification
send_alert() {
    local severity="$1"
    local message="$2"
    
    warning "Alert [$severity]: $message"
    
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        # Send email using gcloud logging (creates a log entry that can trigger alerts)
        gcloud logging write "free-tier-monitor" \
            "$message" \
            --severity="$severity" \
            --project="$PROJECT_ID" \
            2>/dev/null || true
    fi
    
    # Log to file
    echo "[$(date)] [$severity] $message" >> /var/log/gcp-free-tier-monitor.log
}

# Emergency shutdown function
emergency_shutdown() {
    error "EMERGENCY SHUTDOWN TRIGGERED!"
    error "Free tier limits exceeded or about to be exceeded"
    
    send_alert "CRITICAL" "Emergency shutdown triggered for instance $INSTANCE_NAME"
    
    # Stop the instance
    log "Stopping instance $INSTANCE_NAME..."
    gcloud compute instances stop "$INSTANCE_NAME" \
        --zone="$ZONE" \
        --project="$PROJECT_ID" \
        || error "Failed to stop instance"
    
    # Create a flag file to prevent auto-restart
    echo "$(date): Emergency shutdown due to free tier limit" > /tmp/gcp-emergency-shutdown.flag
    
    log "Instance stopped. Manual intervention required to restart."
    exit 1
}

# Generate usage report
generate_report() {
    local report_file="usage-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "====================================="
        echo "GCP FREE TIER USAGE REPORT"
        echo "====================================="
        echo "Generated: $(date)"
        echo "Project: $PROJECT_ID"
        echo "Instance: $INSTANCE_NAME"
        echo "Zone: $ZONE"
        echo ""
        echo "USAGE SUMMARY:"
        echo "-------------------------------------"
    } > "$report_file"
    
    # Capture all check outputs
    {
        check_instance_hours
        echo ""
        check_network_egress
        echo ""
        check_disk_usage
        echo ""
        check_snapshot_usage
        echo ""
        check_billing
    } >> "$report_file" 2>&1
    
    echo "" >> "$report_file"
    echo "Report saved to: $report_file"
    
    cat "$report_file"
}

# Main monitoring function
main() {
    log "Starting GCP Free Tier usage monitoring..."
    
    # Check for emergency shutdown flag
    if [ -f /tmp/gcp-emergency-shutdown.flag ]; then
        error "Emergency shutdown flag detected. Clear the flag to resume monitoring."
        error "rm /tmp/gcp-emergency-shutdown.flag"
        exit 1
    fi
    
    local critical_count=0
    local warning_count=0
    
    # Run all checks
    if ! check_instance_hours; then
        [ $? -eq 2 ] && ((critical_count++)) || ((warning_count++))
    fi
    
    if ! check_network_egress; then
        [ $? -eq 2 ] && ((critical_count++)) || ((warning_count++))
    fi
    
    if ! check_disk_usage; then
        [ $? -eq 2 ] && ((critical_count++)) || ((warning_count++))
    fi
    
    if ! check_snapshot_usage; then
        ((warning_count++))
    fi
    
    check_billing
    
    # Summary
    echo ""
    echo "====================================="
    echo "MONITORING SUMMARY"
    echo "====================================="
    
    if [ $critical_count -gt 0 ]; then
        error "Critical issues found: $critical_count"
        send_alert "CRITICAL" "Critical free tier limit issues detected on $INSTANCE_NAME"
        
        # Trigger emergency shutdown if critical
        read -p "Do you want to trigger emergency shutdown? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            emergency_shutdown
        fi
    elif [ $warning_count -gt 0 ]; then
        warning "Warnings found: $warning_count"
        send_alert "WARNING" "Free tier usage warnings on $INSTANCE_NAME"
    else
        log "All checks passed ✓"
        info "Your usage is within free tier limits"
    fi
    
    # Generate report if requested
    if [ "${1:-}" = "--report" ]; then
        generate_report
    fi
    
    log "Monitoring complete"
}

# Handle command line arguments
case "${1:-}" in
    --help)
        echo "Usage: $0 [OPTIONS]"
        echo "Options:"
        echo "  --help      Show this help message"
        echo "  --report    Generate detailed usage report"
        echo "  --shutdown  Trigger emergency shutdown"
        echo "  --check-only Run checks without alerts"
        exit 0
        ;;
    --shutdown)
        emergency_shutdown
        ;;
    --check-only)
        generate_report
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac