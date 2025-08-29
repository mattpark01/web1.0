'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export function EmailVerificationBanner() {
  const { user, resendVerification } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!user || user.emailVerified) {
    return null
  }

  const handleResendVerification = async () => {
    if (!user?.email) return

    setIsResending(true)
    setError('')
    setResendSuccess(false)

    try {
      await resendVerification(user.email)
      setResendSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  if (resendSuccess) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle className="h-4 w-4 text-green-400" />
        <AlertDescription className="text-green-400">
          Verification email sent! Please check your inbox.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-orange-500/50 bg-orange-500/10">
      <Mail className="h-4 w-4 text-orange-400" />
      <AlertDescription className="flex items-center justify-between text-orange-400">
        <span>Please verify your email address to access all features.</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendVerification}
          disabled={isResending}
          className="ml-4 border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Sending...
            </>
          ) : (
            'Resend Email'
          )}
        </Button>
      </AlertDescription>
      {error && (
        <AlertDescription className="mt-2 text-red-400 text-sm">
          {error}
        </AlertDescription>
      )}
    </Alert>
  )
}