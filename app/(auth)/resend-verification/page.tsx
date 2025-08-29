"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setMessage(data.message || 'Verification email sent successfully!')
      } else {
        setError(data.error || 'Failed to send verification email')
      }
    } catch (err) {
      setError('Network error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md border-neutral-800 bg-black">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-medium text-white">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-neutral-400">
              We've sent a new verification link
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-green-500 bg-green-900/20 text-green-200">
              <AlertDescription className="text-center">
                {message}
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-4">
              <p className="text-neutral-400 text-sm">
                We've sent a verification email to <strong>{email}</strong>
              </p>
              <p className="text-neutral-500 text-xs">
                Please check your email and click the verification link.
              </p>
            </div>

            <div className="space-y-2">
              <Button 
                asChild
                className="w-full bg-white text-black hover:bg-neutral-200"
              >
                <Link href="/signin">Continue to Sign In</Link>
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => setSuccess(false)}
                className="w-full text-neutral-400 hover:text-white"
              >
                Resend to different email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-neutral-800 bg-black">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-medium text-center text-white">
            Resend Verification
          </CardTitle>
          <CardDescription className="text-center text-neutral-400">
            Enter your email to receive a new verification link
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300 text-sm">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:ring-0"
                required
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-neutral-200 transition-colors"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Email
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <Link 
                href="/signin" 
                className="inline-flex items-center text-neutral-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}