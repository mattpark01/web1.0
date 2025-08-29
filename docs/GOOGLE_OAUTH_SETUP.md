# Google OAuth Setup Guide

## Prerequisites

Make sure you have the following environment variables set in your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
APP_URL=http://localhost:3000  # Optional - will auto-detect if not set
```

## Setting up Google OAuth

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

### 2. Configure OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Configure the OAuth consent screen if you haven't already:
   - Choose "External" for user type
   - Fill in the required fields (app name, support email, etc.)
   - Add scopes: `email`, `profile`, `openid`

### 3. Create OAuth Client ID

1. Application type: **Web application**
2. Name: Your app name (e.g., "SpatioLabs Web")
3. Authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://your-app-name.vercel.app` (if using Vercel)
   - `https://your-service-name.run.app` (if using Cloud Run)
   - Your custom domain (e.g., `https://app.spatiolabs.com`)
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (for development)
   - `https://your-app-name.vercel.app/api/auth/google/callback` (Vercel)
   - `https://your-service-name.run.app/api/auth/google/callback` (Cloud Run)
   - `https://app.spatiolabs.com/api/auth/google/callback` (custom domain)

### 4. Copy Credentials

After creating the OAuth client:
1. Copy the **Client ID**
2. Copy the **Client Secret**
3. Add them to your `.env.local` file

## How It Works

### New User Flow
1. User clicks "Sign up with Google"
2. Redirected to Google for authentication
3. Google redirects back with user info
4. New account created automatically
5. User is signed in

### Existing User Flow (Email Match)
1. User clicks "Continue with Google"
2. System detects existing account with same email
3. User is redirected to account linking page
4. User enters their password to confirm ownership
5. Google account is linked to existing account
6. Future logins can use Google or password

### Linked Account User Flow
1. User clicks "Continue with Google"
2. System finds linked Google account
3. User is signed in immediately

## Security Features

- **CSRF Protection**: State tokens prevent cross-site request forgery
- **Account Verification**: Requires password to link existing accounts
- **No Auto-Linking**: Never automatically links accounts without user consent
- **Provider Isolation**: Each OAuth provider stored separately
- **Token Security**: OAuth tokens stored securely in database

## Database Schema

The implementation uses a separate `OAuthAccount` table to store provider accounts:
- Supports multiple providers per user
- One account per provider per user
- Stores tokens for API access (if needed)
- Tracks last usage and linking date

## Testing

To test the OAuth flow:

1. Start your development server: `pnpm dev`
2. Navigate to `/signin` or `/signup`
3. Click "Continue with Google" or "Sign up with Google"
4. Select your Google account
5. You should be redirected back and signed in

## Troubleshooting

### "oauth_init_failed" Error
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Verify the redirect URI matches exactly in Google Console

### "oauth_callback_failed" Error
- Check the Google Cloud Console for any API restrictions
- Ensure the OAuth consent screen is properly configured

### Account Linking Issues
- Make sure the user's password is correct
- Check that the email addresses match exactly

## Production Deployment

### Automatic URL Detection

The OAuth implementation automatically detects the correct URL based on the host header:
- **Vercel**: Detects `*.vercel.app` domains
- **Cloud Run**: Detects `*.run.app` domains  
- **Custom domains**: Works with any HTTPS domain
- **No hardcoding needed**: The callback URL is built dynamically

### Deployment Steps

1. **Update Google Cloud Console**:
   - Add ALL your production URLs to authorized JavaScript origins
   - Add ALL callback URLs (one for each domain you use)
   - Example for Cloud Run:
     ```
     Origins:
     - https://your-service-name.run.app
     - https://app.spatiolabs.com (if using custom domain)
     
     Redirect URIs:
     - https://your-service-name.run.app/api/auth/google/callback
     - https://app.spatiolabs.com/api/auth/google/callback
     ```

2. **Environment Variables**:
   ```env
   # Required in production
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   
   # Optional - if not set, URL is auto-detected from request
   APP_URL=https://app.spatiolabs.com
   ```

3. **Deploy with CI/CD**:
   - The OAuth routes will automatically use HTTPS in production
   - Session cookies will be set with `secure` flag
   - No code changes needed between dev and prod

### Multi-Environment Support

The implementation supports multiple environments without code changes:

```javascript
// Automatically handles:
// - http://localhost:3000 (development)
// - https://preview-*.vercel.app (preview deployments)
// - https://your-app.vercel.app (staging)
// - https://your-service.run.app (Cloud Run)
// - https://app.spatiolabs.com (production)
```

### Security in Production

- **HTTPS Only**: OAuth redirects enforce HTTPS except for localhost
- **Secure Cookies**: Session cookies use `secure` flag in production
- **Dynamic URLs**: No hardcoded URLs that could leak between environments
- **CORS Ready**: Works with your existing agent-runtime CORS setup

## Next Steps

- Add GitHub OAuth following the same pattern
- Implement account unlinking in settings
- Add OAuth token refresh logic for API access