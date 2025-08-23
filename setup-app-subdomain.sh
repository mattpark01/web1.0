#!/bin/bash

echo "🚀 Quick Setup for app.spatiolabs.org"
echo ""
echo "Please get your Cloudflare API token from:"
echo "https://dash.cloudflare.com/profile/api-tokens"
echo "(Create token with 'Edit zone DNS' template for spatiolabs.org)"
echo ""
read -p "Paste your Cloudflare API Token: " CF_API_TOKEN

# Export for the Node script
export CF_API_TOKEN=$CF_API_TOKEN

# Run the DNS setup
echo ""
node scripts/setup-cloudflare-dns.js

# Add to Vercel
echo ""
echo "📝 Adding domain to Vercel..."
cd /Users/matt/Development/spatiolabs/web1.0
vercel domains add app.spatiolabs.org 2>/dev/null || echo "Domain might already be added"

echo ""
echo "✅ Done! Deploy with: vercel --prod"