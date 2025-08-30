# Deployment Setup for app.spatiolabs.org

## Required Environment Variables

### 1. Google OAuth Setup

You need to add these environment variables to Vercel:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### Steps to get Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - Production: `https://app.spatiolabs.org/api/auth/google/callback`
   - Development: `http://localhost:3000/api/auth/google/callback`
7. Copy the Client ID and Client Secret

#### Add to Vercel:

```bash
# Using Vercel CLI
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production

# Or through Vercel Dashboard:
# 1. Go to your project settings
# 2. Navigate to Environment Variables
# 3. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
# 4. Make sure they're available for Production environment
```

### 2. Database Configuration

```bash
DATABASE_URL=postgresql://[connection_string]
```

### 3. Agent Runtime Configuration

```bash
AGENT_RUNTIME_URL=https://agent-runtime-565753126849.us-east1.run.app
```

### 4. Optional: Email Service (Resend)

```bash
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=hello@yourdomain.com
```

## Verify Deployment

After adding environment variables:

1. Redeploy the application:
   ```bash
   vercel --prod
   ```

2. Check the logs:
   ```bash
   vercel logs app.spatiolabs.org
   ```

3. Test Google OAuth:
   - Visit https://app.spatiolabs.org/signin
   - Click "Continue with Google"
   - Should redirect to Google sign-in

## Troubleshooting

### "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET"
- Environment variables are not set in Vercel
- Check: `vercel env ls`

### "Invalid redirect_uri"
- Make sure the redirect URI in Google Console matches exactly:
  `https://app.spatiolabs.org/api/auth/google/callback`

### Blank screen on OAuth
- Check browser console for errors
- Check server logs: `vercel logs app.spatiolabs.org`
- Verify all environment variables are set