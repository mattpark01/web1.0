#!/bin/bash

# Setup app.spatiolabs.org subdomain
# This script configures both Cloudflare DNS and Vercel

echo "🚀 Setting up app.spatiolabs.org..."

# Check if required tools are installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Step 1: Get Cloudflare credentials
echo "📋 We need your Cloudflare credentials."
echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
echo "2. Create a token with 'Zone:DNS:Edit' permissions for spatiolabs.org"
echo ""
read -p "Enter your Cloudflare API Token: " CF_API_TOKEN
echo ""

# Get Zone ID
echo "🔍 Getting Zone ID for spatiolabs.org..."
ZONE_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=spatiolabs.org" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json")

ZONE_ID=$(echo $ZONE_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ZONE_ID" ]; then
    echo "❌ Failed to get Zone ID. Please check your API token and domain."
    exit 1
fi

echo "✅ Found Zone ID: $ZONE_ID"

# Step 2: Check if subdomain already exists
echo "🔍 Checking if app.spatiolabs.org already exists..."
EXISTING=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=app.spatiolabs.org" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json")

if echo "$EXISTING" | grep -q '"count":0'; then
    echo "📝 Creating DNS record for app.spatiolabs.org..."
    
    # Create CNAME record pointing to Vercel
    DNS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CF_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{
        "type": "CNAME",
        "name": "app",
        "content": "cname.vercel-dns.com",
        "ttl": 1,
        "proxied": false,
        "comment": "Vercel deployment for web1.0 app"
      }')
    
    if echo "$DNS_RESPONSE" | grep -q '"success":true'; then
        echo "✅ DNS record created successfully!"
    else
        echo "❌ Failed to create DNS record:"
        echo "$DNS_RESPONSE" | jq '.'
        exit 1
    fi
else
    echo "⚠️  app.spatiolabs.org already exists in Cloudflare"
    echo "Current record:"
    echo "$EXISTING" | jq '.result[0]'
fi

# Step 3: Add domain to Vercel
echo ""
echo "🔗 Adding domain to Vercel..."
echo "Please make sure you're logged into Vercel CLI"

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "📝 Please login to Vercel:"
    vercel login
fi

# Add domain to current project
echo "Adding app.spatiolabs.org to your Vercel project..."
cd /Users/matt/Development/spatiolabs/web1.0

# Add the domain
vercel domains add app.spatiolabs.org 2>/dev/null || echo "⚠️  Domain might already be added to Vercel"

# Link to project if not linked
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking to Vercel project..."
    vercel link
fi

# Step 4: Update production environment variables
echo ""
echo "📝 Updating production environment variables..."

# Set production URL
vercel env add NEXT_PUBLIC_BASE_URL production <<< "https://app.spatiolabs.org" 2>/dev/null || \
    echo "⚠️  NEXT_PUBLIC_BASE_URL already set or needs manual update"

# Step 5: Create production env file
echo ""
echo "📄 Creating .env.production file..."

cat > .env.production << 'EOF'
# Production environment
NEXT_PUBLIC_BASE_URL="https://app.spatiolabs.org"

# These will be set in Vercel dashboard
# DATABASE_URL, GOOGLE_CLIENT_ID, etc. should be configured there
EOF

echo "✅ Created .env.production"

# Step 6: Summary and next steps
echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "DNS Configuration:"
echo "  • app.spatiolabs.org → cname.vercel-dns.com"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update Google OAuth to include:"
echo "   https://app.spatiolabs.org/api/connections/oauth/callback"
echo "   "
echo "2. Set production environment variables in Vercel:"
echo "   vercel env add CONNECTION_ENCRYPTION_KEY production"
echo "   vercel env add GOOGLE_CLIENT_SECRET production"
echo "   (Add all sensitive vars from .env.local)"
echo ""
echo "3. Deploy to production:"
echo "   vercel --prod"
echo ""
echo "4. Your app will be live at:"
echo "   🌐 https://app.spatiolabs.org"
echo ""
echo "========================================="