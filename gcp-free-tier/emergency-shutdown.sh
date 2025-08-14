#!/bin/bash

###############################################################################
# GCP Emergency Shutdown Script
# This script performs emergency shutdown of all GCP resources
# to prevent billing charges when limits are exceeded
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
FORCE_SHUTDOWN="${FORCE_SHUTDOWN:-false}"
CREATE_BACKUP="${CREATE_BACKUP:-true}"

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

# Create backup of current state
backup_current_state() {
    local backup_dir="backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    log "Creating backup of current state in $backup_dir..."
    
    # Backup instance configurations
    gcloud compute instances list \
        --project="$PROJECT_ID" \
        --format=json > "$backup_dir/instances.json" 2>/dev/null || true
    
    # Backup disk configurations
    gcloud compute disks list \
        --project="$PROJECT_ID" \
        --format=json > "$backup_dir/disks.json" 2>/dev/null || true
    
    # Backup firewall rules
    gcloud compute firewall-rules list \
        --project="$PROJECT_ID" \
        --format=json > "$backup_dir/firewall-rules.json" 2>/dev/null || true
    
    # Backup networks
    gcloud compute networks list \
        --project="$PROJECT_ID" \
        --format=json > "$backup_dir/networks.json" 2>/dev/null || true
    
    # Backup static IPs
    gcloud compute addresses list \
        --project="$PROJECT_ID" \
        --format=json > "$backup_dir/addresses.json" 2>/dev/null || true
    
    log "Backup created in $backup_dir"
}

# Stop all compute instances
stop_all_instances() {
    log "Stopping all compute instances..."
    
    local instances=$(gcloud compute instances list \
        --project="$PROJECT_ID" \
        --filter="status:RUNNING" \
        --format="csv[no-heading](name,zone)" 2>/dev/null || echo "")
    
    if [ -z "$instances" ]; then
        info "No running instances found"
        return 0
    fi
    
    local count=0
    while IFS=',' read -r name zone; do
        if [ -n "$name" ] && [ -n "$zone" ]; then
            log "Stopping instance: $name in zone $zone"
            gcloud compute instances stop "$name" \
                --zone="$zone" \
                --project="$PROJECT_ID" \
                --async \
                2>/dev/null || warning "Failed to stop $name"
            ((count++))
        fi
    done <<< "$instances"
    
    log "Initiated shutdown for $count instance(s)"
    
    # Wait for instances to stop
    log "Waiting for instances to stop..."
    sleep 10
    
    # Verify all stopped
    local still_running=$(gcloud compute instances list \
        --project="$PROJECT_ID" \
        --filter="status:RUNNING" \
        --format="value(name)" 2>/dev/null | wc -l || echo "0")
    
    if [ "$still_running" -gt 0 ]; then
        warning "$still_running instance(s) still running"
    else
        success "All instances stopped"
    fi
}

# Release external IPs (except free tier single ephemeral)
release_external_ips() {
    log "Checking external IP addresses..."
    
    # List all reserved (static) external IPs
    local static_ips=$(gcloud compute addresses list \
        --project="$PROJECT_ID" \
        --filter="addressType:EXTERNAL" \
        --format="csv[no-heading](name,region)" 2>/dev/null || echo "")
    
    if [ -z "$static_ips" ]; then
        info "No static external IPs found (ephemeral IPs are free)"
        return 0
    fi
    
    warning "Found static IP addresses (these cost money when not attached):"
    echo "$static_ips"
    
    if [ "$FORCE_SHUTDOWN" = "true" ]; then
        while IFS=',' read -r name region; do
            if [ -n "$name" ] && [ -n "$region" ]; then
                log "Releasing static IP: $name in region $region"
                gcloud compute addresses delete "$name" \
                    --region="$region" \
                    --project="$PROJECT_ID" \
                    --quiet \
                    2>/dev/null || warning "Failed to release $name"
            fi
        done <<< "$static_ips"
    else
        warning "Static IPs not released (use FORCE_SHUTDOWN=true to release)"
    fi
}

# Delete snapshots over free tier limit
cleanup_snapshots() {
    log "Checking snapshots..."
    
    local snapshots=$(gcloud compute snapshots list \
        --project="$PROJECT_ID" \
        --sort-by="~creationTimestamp" \
        --format="csv[no-heading](name,diskSizeGb)" 2>/dev/null || echo "")
    
    if [ -z "$snapshots" ]; then
        info "No snapshots found"
        return 0
    fi
    
    local total_size=0
    local snapshot_count=0
    
    while IFS=',' read -r name size; do
        if [ -n "$name" ] && [ -n "$size" ]; then
            total_size=$(echo "$total_size + $size" | bc)
            ((snapshot_count++))
        fi
    done <<< "$snapshots"
    
    info "Found $snapshot_count snapshot(s) using ${total_size}GB (5GB free)"
    
    if (( $(echo "$total_size > 5" | bc -l) )); then
        warning "Snapshot storage exceeds free tier!"
        
        if [ "$FORCE_SHUTDOWN" = "true" ]; then
            # Delete oldest snapshots until under 5GB
            local current_size="$total_size"
            while IFS=',' read -r name size; do
                if (( $(echo "$current_size > 5" | bc -l) )); then
                    log "Deleting snapshot: $name (${size}GB)"
                    gcloud compute snapshots delete "$name" \
                        --project="$PROJECT_ID" \
                        --quiet \
                        2>/dev/null || warning "Failed to delete $name"
                    current_size=$(echo "$current_size - $size" | bc)
                fi
            done <<< "$snapshots"
        else
            warning "Snapshots not deleted (use FORCE_SHUTDOWN=true to delete)"
        fi
    fi
}

# Stop all App Engine services
stop_app_engine() {
    log "Checking App Engine services..."
    
    local services=$(gcloud app services list \
        --project="$PROJECT_ID" \
        --format="value(id)" 2>/dev/null || echo "")
    
    if [ -z "$services" ]; then
        info "No App Engine services found"
        return 0
    fi
    
    warning "App Engine services found. These cannot be stopped, only deleted."
    echo "$services"
    
    if [ "$FORCE_SHUTDOWN" = "true" ]; then
        warning "App Engine deletion must be done manually to prevent data loss"
    fi
}

# Disable Cloud Functions
disable_cloud_functions() {
    log "Checking Cloud Functions..."
    
    local functions=$(gcloud functions list \
        --project="$PROJECT_ID" \
        --format="csv[no-heading](name,region)" 2>/dev/null || echo "")
    
    if [ -z "$functions" ]; then
        info "No Cloud Functions found"
        return 0
    fi
    
    warning "Cloud Functions found:"
    echo "$functions"
    
    if [ "$FORCE_SHUTDOWN" = "true" ]; then
        while IFS=',' read -r name region; do
            if [ -n "$name" ] && [ -n "$region" ]; then
                log "Deleting function: $name in region $region"
                gcloud functions delete "$name" \
                    --region="$region" \
                    --project="$PROJECT_ID" \
                    --quiet \
                    2>/dev/null || warning "Failed to delete $name"
            fi
        done <<< "$functions"
    else
        warning "Functions not deleted (use FORCE_SHUTDOWN=true to delete)"
    fi
}

# Check for other costly resources
check_other_resources() {
    log "Checking for other potentially costly resources..."
    
    # Check Cloud SQL instances
    local sql_instances=$(gcloud sql instances list \
        --project="$PROJECT_ID" \
        --format="value(name)" 2>/dev/null || echo "")
    
    if [ -n "$sql_instances" ]; then
        error "Cloud SQL instances found (THESE ARE NOT FREE TIER):"
        echo "$sql_instances"
        
        if [ "$FORCE_SHUTDOWN" = "true" ]; then
            for instance in $sql_instances; do
                log "Stopping Cloud SQL instance: $instance"
                gcloud sql instances patch "$instance" \
                    --activation-policy=NEVER \
                    --project="$PROJECT_ID" \
                    2>/dev/null || warning "Failed to stop $instance"
            done
        fi
    fi
    
    # Check Kubernetes clusters
    local gke_clusters=$(gcloud container clusters list \
        --project="$PROJECT_ID" \
        --format="value(name)" 2>/dev/null || echo "")
    
    if [ -n "$gke_clusters" ]; then
        error "GKE clusters found (THESE ARE NOT FREE TIER):"
        echo "$gke_clusters"
    fi
    
    # Check Cloud Storage buckets
    local buckets=$(gsutil ls -p "$PROJECT_ID" 2>/dev/null || echo "")
    
    if [ -n "$buckets" ]; then
        warning "Cloud Storage buckets found (5GB free):"
        echo "$buckets"
    fi
}

# Create shutdown flag
create_shutdown_flag() {
    local flag_file="/tmp/gcp-emergency-shutdown.flag"
    local flag_content=$(cat <<EOF
EMERGENCY SHUTDOWN EXECUTED
Time: $(date)
Project: $PROJECT_ID
Reason: Free tier limit protection

To re-enable monitoring, delete this file:
rm $flag_file

To restart instances:
gcloud compute instances start INSTANCE_NAME --zone=ZONE
EOF
)
    
    echo "$flag_content" > "$flag_file"
    log "Shutdown flag created at $flag_file"
}

# Generate shutdown report
generate_report() {
    local report_file="shutdown-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "EMERGENCY SHUTDOWN REPORT"
        echo "========================="
        echo "Time: $(date)"
        echo "Project: $PROJECT_ID"
        echo ""
        echo "Actions Taken:"
        echo "- Stopped all compute instances"
        echo "- Checked external IPs"
        echo "- Checked snapshots"
        echo "- Checked App Engine"
        echo "- Checked Cloud Functions"
        echo "- Checked other resources"
        echo ""
        echo "To restart services:"
        echo "1. Review this report"
        echo "2. Check current billing"
        echo "3. Remove shutdown flag: rm /tmp/gcp-emergency-shutdown.flag"
        echo "4. Start instances manually"
    } > "$report_file"
    
    log "Report saved to: $report_file"
}

# Confirmation prompt
confirm_shutdown() {
    if [ "$FORCE_SHUTDOWN" != "true" ]; then
        echo ""
        warning "╔════════════════════════════════════════╗"
        warning "║         EMERGENCY SHUTDOWN WARNING        ║"
        warning "╚════════════════════════════════════════╝"
        echo ""
        warning "This will stop all running GCP resources!"
        warning "Some resources may only be stopped, not deleted."
        echo ""
        echo "Resources to be affected:"
        echo "• All compute instances will be STOPPED"
        echo "• Static IPs will be checked (deleted if FORCE_SHUTDOWN=true)"
        echo "• Snapshots over 5GB will be checked (deleted if FORCE_SHUTDOWN=true)"
        echo "• Other resources will be listed"
        echo ""
        
        read -p "Are you sure you want to proceed? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
            error "Shutdown cancelled by user"
            exit 1
        fi
    else
        warning "FORCE_SHUTDOWN enabled - proceeding without confirmation"
    fi
}

# Main shutdown sequence
main() {
    log "╔════════════════════════════════════════╗"
    log "║    GCP EMERGENCY SHUTDOWN INITIATED      ║"
    log "╚════════════════════════════════════════╝"
    
    # Verify project
    if [ -z "$PROJECT_ID" ]; then
        error "No project ID specified"
        exit 1
    fi
    
    info "Project: $PROJECT_ID"
    info "Force shutdown: $FORCE_SHUTDOWN"
    
    # Confirmation
    confirm_shutdown
    
    # Create backup if requested
    if [ "$CREATE_BACKUP" = "true" ]; then
        backup_current_state
    fi
    
    # Execute shutdown sequence
    stop_all_instances
    release_external_ips
    cleanup_snapshots
    stop_app_engine
    disable_cloud_functions
    check_other_resources
    
    # Create shutdown flag
    create_shutdown_flag
    
    # Generate report
    generate_report
    
    echo ""
    log "╔════════════════════════════════════════╗"
    log "║    EMERGENCY SHUTDOWN COMPLETED          ║"
    log "╚════════════════════════════════════════╝"
    echo ""
    success "All stoppable resources have been stopped"
    info "Review the shutdown report for details"
    warning "Some resources may still incur charges if not fully deleted"
    warning "Check your billing dashboard: https://console.cloud.google.com/billing"
    echo ""
    info "To restart services:"
    info "1. Remove flag: rm /tmp/gcp-emergency-shutdown.flag"
    info "2. Start instances: gcloud compute instances start INSTANCE_NAME --zone=ZONE"
}

# Handle command line arguments
case "${1:-}" in
    --help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help          Show this help message"
        echo "  --force         Skip confirmation and delete resources"
        echo "  --no-backup     Skip creating backup"
        echo "  --dry-run       Show what would be done without doing it"
        echo ""
        echo "Environment variables:"
        echo "  GCP_PROJECT_ID   Project ID to shutdown"
        echo "  FORCE_SHUTDOWN   Set to 'true' to force deletion"
        echo "  CREATE_BACKUP    Set to 'false' to skip backup"
        exit 0
        ;;
    --force)
        FORCE_SHUTDOWN=true
        main
        ;;
    --no-backup)
        CREATE_BACKUP=false
        main
        ;;
    --dry-run)
        warning "DRY RUN MODE - No actions will be taken"
        check_other_resources
        exit 0
        ;;
    *)
        main
        ;;
esac