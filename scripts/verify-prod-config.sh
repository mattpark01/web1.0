#!/bin/bash

# Production Configuration Verification Script
# This script verifies that all required environment variables are set for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Production Configuration Verification${NC}"
echo "=========================================="
echo ""

# Track if all checks pass
ALL_GOOD=true

# Function to check environment variable
check_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    local required=$2
    local description=$3
    
    if [ -z "$var_value" ]; then
        if [ "$required" = "required" ]; then
            echo -e "${RED}❌ $var_name${NC} - $description"
            echo -e "   ${YELLOW}Status: NOT SET (Required)${NC}"
            ALL_GOOD=false
        else
            echo -e "${YELLOW}⚠️  $var_name${NC} - $description"
            echo -e "   Status: NOT SET (Optional)"
        fi
    else
        if [[ "$var_value" == *"CHANGE_ME"* ]] || [[ "$var_value" == *"your_"* ]] || [[ "$var_value" == *"generate_"* ]]; then
            echo -e "${YELLOW}⚠️  $var_name${NC} - $description"
            echo -e "   ${YELLOW}Status: SET but appears to be placeholder value${NC}"
            ALL_GOOD=false
        else
            echo -e "${GREEN}✓ $var_name${NC} - $description"
            if [ "$var_name" != "DATABASE_URL" ] && [ "$var_name" != "DIRECT_URL" ]; then
                echo -e "   Value: ${var_value:0:20}..."
            else
                echo -e "   Value: [HIDDEN]"
            fi
        fi
    fi
    echo ""
}

# Check web1.0 environment variables
echo -e "${BLUE}📦 Web1.0 Frontend Configuration:${NC}"
echo "---------------------------------"

check_env_var "NEXT_PUBLIC_AGENT_RUNTIME_URL" "required" "Agent Runtime Service URL"
check_env_var "NEXT_PUBLIC_BASE_URL" "required" "Production domain URL"
check_env_var "DATABASE_URL" "required" "PostgreSQL connection string"
check_env_var "DIRECT_URL" "required" "Direct database connection"
check_env_var "NEXTAUTH_SECRET" "required" "NextAuth encryption secret"
check_env_var "SESSION_SECRET" "required" "Session encryption secret"
check_env_var "CONNECTION_ENCRYPTION_KEY" "required" "Connection encryption key"

# OAuth providers (optional)
echo -e "${BLUE}🔐 OAuth Providers (Optional):${NC}"
echo "------------------------------"
check_env_var "GOOGLE_CLIENT_ID" "optional" "Google OAuth client ID"
check_env_var "GOOGLE_CLIENT_SECRET" "optional" "Google OAuth client secret"

# Verify agent-runtime Cloud Run configuration
echo -e "${BLUE}☁️  Agent Runtime (Cloud Run) Configuration:${NC}"
echo "-------------------------------------------"

# Check if gcloud is available
if command -v gcloud &> /dev/null; then
    GCP_PROJECT_ID="${GCP_PROJECT_ID:-kinetic-road-425815-k1}"
    GCP_REGION="${GCP_REGION:-us-east1}"
    
    echo "Checking Cloud Run service configuration..."
    
    # Get ALLOWED_ORIGINS from Cloud Run
    ALLOWED_ORIGINS=$(gcloud run services describe agent-runtime \
        --region=$GCP_REGION \
        --project=$GCP_PROJECT_ID \
        --format="value(spec.template.spec.containers[0].env[?key=='ALLOWED_ORIGINS'].value)" 2>/dev/null || echo "")
    
    if [ -z "$ALLOWED_ORIGINS" ]; then
        echo -e "${YELLOW}⚠️  ALLOWED_ORIGINS not set in Cloud Run${NC}"
        echo -e "   You need to set this to include your production domain"
        ALL_GOOD=false
    else
        echo -e "${GREEN}✓ ALLOWED_ORIGINS is configured${NC}"
        echo -e "   Value: $ALLOWED_ORIGINS"
    fi
else
    echo -e "${YELLOW}⚠️  gcloud CLI not found - cannot verify Cloud Run settings${NC}"
    echo "   Please ensure ALLOWED_ORIGINS is set in Cloud Run to include your production domain"
fi

echo ""

# Production readiness checks
echo -e "${BLUE}🚀 Production Readiness Checks:${NC}"
echo "-------------------------------"

# Check if dev API key is NOT set
if [ -n "$NEXT_PUBLIC_DEV_SPATIO_API_KEY" ]; then
    echo -e "${RED}❌ Development API key should NOT be set in production${NC}"
    echo -e "   Found: NEXT_PUBLIC_DEV_SPATIO_API_KEY"
    ALL_GOOD=false
else
    echo -e "${GREEN}✓ No development API key found (correct for production)${NC}"
fi

# Check agent runtime URL is using HTTPS
if [[ "$NEXT_PUBLIC_AGENT_RUNTIME_URL" == https://* ]]; then
    echo -e "${GREEN}✓ Agent Runtime URL uses HTTPS${NC}"
elif [ットB "$NEXT_PUBLIC_AGENT_RUNTIME_URL" == http://localhost* ]]; then
    echo -e "${RED}❌ Agent Runtime URL is using localhost (not suitable for production)${NC}"
    ALL_GOOD=false
else
    echo -e "${YELLOW}⚠️  Agent Runtime URL should use HTTPS in production${NC}"
fi

# Check base URL is using HTTPS
if [[ "$NEXT_PUBLIC_BASE_URL" == https://* ]]; then
    echo -e "${GREEN}✓ Base URL uses HTTPS${NC}"
elif [[ "$NEXT_PUBLIC_BASE_URL" == http://localhost* ]]; then
    echo -e "${RED}❌ Base URL is using localhost (not suitable for production)${NC}"
    ALL_GOOD=false
fi

echo ""
echo "=========================================="

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✅ All production checks passed!${NC}"
    echo "Your application is ready for deployment."
else
    echo -e "${RED}❌ Some issues need to be addressed${NC}"
    echo ""
    echo "Required actions:"
    echo "1. Set all required environment variables in your CI/CD platform"
    echo "2. Ensure ALLOWED_ORIGINS in Cloud Run includes your production domain"
    echo "3. Remove any development-only variables (like NEXT_PUBLIC_DEV_SPATIO_API_KEY)"
    echo "4. Generate secure secrets for all authentication keys"
fi

echo ""
echo "To set environment variables in Vercel:"
echo "  vercel env add VARIABLE_NAME production"
echo ""
echo "To set environment variables in Cloud Run:"
echo "  gcloud run services update agent-runtime --update-env-vars KEY=VALUE"