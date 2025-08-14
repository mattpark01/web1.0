import { refreshExpiringTokens } from '@/lib/integrations/middleware/token-refresh'

/**
 * Background job to refresh expiring OAuth2 tokens
 * Should be run every 15 minutes via cron job or similar scheduler
 */

export async function refreshTokensJob(): Promise<void> {
  console.log('[RefreshTokensJob] Starting token refresh job...')
  
  try {
    await refreshExpiringTokens()
    console.log('[RefreshTokensJob] Token refresh job completed successfully')
  } catch (error) {
    console.error('[RefreshTokensJob] Token refresh job failed:', error)
    // Could send error to monitoring service here
  }
}

// If running as a standalone script
if (require.main === module) {
  refreshTokensJob()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}