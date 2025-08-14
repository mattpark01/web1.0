#!/bin/bash

###############################################################################
# Environment Loader Script
# Sources .env file and validates required variables
###############################################################################

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Find the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: .env file not found at $ENV_FILE${NC}"
    echo "Please create a .env file with your configuration."
    exit 1
fi

# Load environment variables from .env file
set -a  # Mark all new variables for export
source "$ENV_FILE"
set +a  # Turn off auto-export

# Validate required variables
validate_env() {
    local missing=()
    
    # Check required variables
    [ -z "$GCP_BILLING_ACCOUNT_ID" ] && missing+=("GCP_BILLING_ACCOUNT_ID")
    [ -z "$NOTIFICATION_EMAIL" ] && missing+=("NOTIFICATION_EMAIL")
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}Missing required environment variables:${NC}"
        for var in "${missing[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please update your .env file with these values."
        return 1
    fi
    
    echo -e "${GREEN}✓ Environment loaded successfully${NC}"
    echo "  Project ID: $GCP_PROJECT_ID"
    echo "  Billing Account: ${GCP_BILLING_ACCOUNT_ID:0:7}..."
    echo "  Notification Email: $NOTIFICATION_EMAIL"
    echo "  Region/Zone: $REGION/$ZONE"
    
    return 0
}

# Validate the environment
if ! validate_env; then
    exit 1
fi

echo -e "${GREEN}Environment ready!${NC}"