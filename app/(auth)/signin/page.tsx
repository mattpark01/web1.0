"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { GoogleButton } from '@/components/ui/google-button'

function SignInContent() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const { login, isLoading } = useAuth()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verified = searchParams.get('verified')
    const errorParam = searchParams.get('error')
    
    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now sign in.')
    } else if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        'missing-token': 'Invalid verification link',
        'verification-failed': 'Verification failed. Please try again.',
      }
      setError(errorMessages[errorParam] || decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(formData.email, formData.password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-neutral-800 bg-black">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-medium text-center text-white">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-neutral-400">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <AlertDescription className="text-green-400">{success}</AlertDescription>
            </Alert>
          )}
          
          {/* OAuth Login */}
          <GoogleButton 
            text="Continue with Google"
            intent="signin"
            isLoading={isLoading}
          />
          
          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-neutral-500">or continue with email</span>
            </div>
          </div>
        </CardContent>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300 text-sm">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:ring-0"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300 text-sm">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:ring-0"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="mt-6">
              <Button 
                type="submit" 
                className="w-full h-11 bg-white text-black hover:bg-neutral-200 transition-colors mb-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-0">
            <div className="text-center text-sm text-neutral-400">
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                className="text-white hover:text-neutral-300 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md border-neutral-800 bg-black">
          <CardContent className="p-8">
            <div className="text-center text-white">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}