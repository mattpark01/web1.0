"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { GoogleButton } from '@/components/ui/google-button'

export default function SignUpPage() {
  const [error, setError] = useState('')
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    console.log('Form submission started with data:', formData)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    try {
      setIsLoading(true)
      const { confirmPassword, ...submitData } = formData
      console.log('About to call register with:', submitData)
      
      // Call register and handle response
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Redirect to OTP verification page
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`)

    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
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
            Create account
          </CardTitle>
          <CardDescription className="text-center text-neutral-400">
            Get started with your free account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* OAuth Signup */}
          <GoogleButton 
            text="Sign up with Google"
            intent="signup"
            isLoading={isLoading}
          />
          
          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-neutral-500">or sign up with email</span>
            </div>
          </div>
        </CardContent>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-neutral-300 text-sm">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:ring-0"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-neutral-300 text-sm">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:ring-0"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300 text-sm">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
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
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={handleChange}
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:ring-0"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-neutral-300 text-sm">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:ring-0"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="mt-6">
              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-neutral-200 transition-colors mb-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-0">
            <div className="text-center text-sm text-neutral-400">
              Already have an account?{' '}
              <Link 
                href="/signin" 
                className="text-white hover:text-neutral-300 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}