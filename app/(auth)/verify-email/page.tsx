"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'invalid'>('loading')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    // Check URL params first (from email redirects)
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    
    if (success === 'true') {
      setStatus('success')
      setMessage('Email verified successfully!')
      setTimeout(() => {
        router.push('/signin')
      }, 3000)
      return
    }
    
    if (error) {
      if (error === 'expired') {
        setStatus('expired')
        setMessage('Verification link has expired. Please request a new one.')
      } else if (error === 'invalid') {
        setStatus('invalid')
        setMessage('Invalid verification token')
      } else {
        setStatus('error')
        setMessage('Failed to verify email')
      }
      return
    }

    if (!token) {
      setStatus('invalid')
      setMessage('No verification token provided')
      return
    }

    verifyToken(token)
  }, [token, searchParams])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: 'GET',
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Email verified successfully!')
        // Redirect to signin after 3 seconds
        setTimeout(() => {
          router.push('/signin')
        }, 3000)
      } else if (response.status === 410) {
        setStatus('expired')
        setMessage(data.error || 'Verification token has expired')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to verify email')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Network error occurred while verifying email')
    }
  }

  const resendVerification = async () => {
    // We'll need the email address - for now, redirect to a resend page
    router.push('/resend-verification')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-neutral-800 bg-black">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-neutral-400" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-400" />}
            {(status === 'error' || status === 'expired' || status === 'invalid') && <XCircle className="h-12 w-12 text-red-400" />}
          </div>
          
          <CardTitle className="text-2xl font-medium text-white">
            {status === 'loading' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
            {status === 'expired' && 'Link Expired'}
            {status === 'invalid' && 'Invalid Link'}
          </CardTitle>
          
          <CardDescription className="text-neutral-400">
            {status === 'loading' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your account has been successfully verified'}
            {status === 'error' && 'There was a problem verifying your email'}
            {status === 'expired' && 'Your verification link has expired'}
            {status === 'invalid' && 'The verification link is invalid'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {message && (
            <Alert className={`${
              status === 'success' 
                ? 'border-green-500 bg-green-900/20 text-green-200' 
                : 'border-red-500 bg-red-900/20 text-red-200'
            }`}>
              <AlertDescription className="text-center">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-center text-neutral-400 text-sm">
                You will be redirected to sign in automatically...
              </p>
              <Button 
                asChild
                className="w-full bg-white text-black hover:bg-neutral-200"
              >
                <Link href="/signin">Continue to Sign In</Link>
              </Button>
            </div>
          )}

          {(status === 'expired' || status === 'error') && (
            <div className="space-y-4">
              <p className="text-center text-neutral-400 text-sm">
                Need a new verification link?
              </p>
              <Button 
                onClick={resendVerification}
                disabled={isResending}
                className="w-full bg-white text-black hover:bg-neutral-200"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>
          )}

          {status === 'invalid' && (
            <Button 
              asChild
              className="w-full bg-white text-black hover:bg-neutral-200"
            >
              <Link href="/signin">Go to Sign In</Link>
            </Button>
          )}

          <div className="text-center">
            <Link 
              href="/signin" 
              className="text-neutral-400 hover:text-white transition-colors text-sm"
            >
              ← Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}