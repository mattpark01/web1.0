#!/usr/bin/env node

/**
 * Setup app.spatiolabs.org subdomain in Cloudflare
 * Requires: CF_API_TOKEN environment variable
 */

const https = require('https');

// Cloudflare API configuration
const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

async function makeRequest(method, path, data = null) {
  const token = process.env.CF_API_TOKEN;
  
  if (!token) {
    console.error('❌ Please set CF_API_TOKEN environment variable');
    console.log('Get token from: https://dash.cloudflare.com/profile/api-tokens');
    console.log('Need permissions: Zone:DNS:Edit for spatiolabs.org');
    process.exit(1);
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function setupSubdomain() {
  console.log('🚀 Setting up app.spatiolabs.org...\n');

  try {
    // Step 1: Get Zone ID
    console.log('🔍 Finding spatiolabs.org zone...');
    const zonesResponse = await makeRequest('GET', '/zones?name=spatiolabs.org');
    
    if (!zonesResponse.success || zonesResponse.result.length === 0) {
      throw new Error('Could not find spatiolabs.org zone');
    }
    
    const zoneId = zonesResponse.result[0].id;
    console.log(`✅ Found zone: ${zoneId}\n`);

    // Step 2: Check if record exists
    console.log('🔍 Checking for existing app.spatiolabs.org record...');
    const recordsResponse = await makeRequest('GET', `/zones/${zoneId}/dns_records?name=app.spatiolabs.org`);
    
    if (recordsResponse.result.length > 0) {
      console.log('⚠️  Record already exists:');
      const existing = recordsResponse.result[0];
      console.log(`   Type: ${existing.type}`);
      console.log(`   Content: ${existing.content}`);
      console.log(`   Proxied: ${existing.proxied}\n`);
      
      console.log('Would you like to update it to point to Vercel? (y/n)');
      // For automation, we'll skip
      return;
    }

    // Step 3: Create CNAME record
    console.log('📝 Creating CNAME record for app.spatiolabs.org...');
    const createResponse = await makeRequest('POST', `/zones/${zoneId}/dns_records`, {
      type: 'CNAME',
      name: 'app',
      content: 'cname.vercel-dns.com',
      ttl: 1,
      proxied: false, // Important: Keep false for Vercel
      comment: 'Vercel deployment for Spatiolabs app'
    });

    if (createResponse.success) {
      console.log('✅ DNS record created successfully!\n');
      console.log('Details:');
      console.log(`   Type: CNAME`);
      console.log(`   Name: app.spatiolabs.org`);
      console.log(`   Target: cname.vercel-dns.com`);
      console.log(`   Proxy: Disabled (required for Vercel)\n`);
    } else {
      throw new Error(`Failed to create record: ${JSON.stringify(createResponse.errors)}`);
    }

    // Step 4: Instructions
    console.log('========================================');
    console.log('✅ Cloudflare DNS Setup Complete!');
    console.log('========================================\n');
    console.log('📋 Next Steps:\n');
    console.log('1. Add domain to Vercel:');
    console.log('   vercel domains add app.spatiolabs.org\n');
    console.log('2. Update Google OAuth authorized redirects:');
    console.log('   https://app.spatiolabs.org/api/connections/oauth/callback\n');
    console.log('3. Deploy to production:');
    console.log('   vercel --prod\n');
    console.log('Your app will be available at:');
    console.log('🌐 https://app.spatiolabs.org\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupSubdomain();
}

module.exports = { setupSubdomain };