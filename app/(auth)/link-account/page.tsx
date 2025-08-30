"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Link2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

function LinkAccountContent() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [linkingData, setLinkingData] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Invalid linking token')
      return
    }

    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
      setLinkingData(decoded)
    } catch (err) {
      setError('Invalid linking data')
    }
  }, [searchParams])

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/link-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          linkingData
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link account')
      }

      // Success - redirect to return URL or home
      router.push(linkingData?.returnUrl || '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/signin')
  }

  if (!linkingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md border-neutral-800 bg-black">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Loading...'}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-neutral-800 bg-black">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-neutral-900 rounded-full">
              <Link2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-medium text-center text-white">
            Link Your Google Account
          </CardTitle>
          <CardDescription className="text-center text-neutral-400">
            We found an existing account with <br />
            <span className="text-white font-medium">{linkingData.email}</span>
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLinkAccount}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="bg-neutral-900 p-4 rounded-lg space-y-2">
                <p className="text-sm text-neutral-400">
                  To link your Google account for faster sign-in, please verify your password.
                </p>
                <p className="text-xs text-neutral-500">
                  This is a one-time verification for security purposes.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-300 text-sm">
                  Enter your password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:ring-0"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="flex-1 bg-transparent border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-white"
                disabled={isLoading}
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-white text-black hover:bg-neutral-200"
                disabled={isLoading || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  'Link Account'
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}

export default function LinkAccountPage() {
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
      <LinkAccountContent />
    </Suspense>
  )
}