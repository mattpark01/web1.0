"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  username?: string
  firstName?: string
  lastName?: string
  name?: string
  tier: string
  emailVerified: boolean
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  resendVerification: (email: string) => Promise<void>
  linkGoogleAccount: (password: string, linkingData: any) => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  username?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        
        // Fetch and store the user's API key
        const apiKeyRes = await fetch('/api/auth/api-key', {
          credentials: 'include',
        })
        
        if (apiKeyRes.ok) {
          const apiKeyData = await apiKeyRes.json()
          if (apiKeyData.apiKey) {
            localStorage.setItem('spatio_api_key', apiKeyData.apiKey)
          }
        }
      } else {
        setUser(null)
        localStorage.removeItem('spatio_api_key')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      localStorage.removeItem('spatio_api_key')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Login failed')
    }

    setUser(data.user)
    
    // Fetch and store the user's API key
    const apiKeyRes = await fetch('/api/auth/api-key', {
      credentials: 'include',
    })
    
    if (apiKeyRes.ok) {
      const apiKeyData = await apiKeyRes.json()
      if (apiKeyData.apiKey) {
        localStorage.setItem('spatio_api_key', apiKeyData.apiKey)
      }
    }
    
    router.push('/')
    router.refresh()
    return true
  }


  const register = async (userData: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    setUser(data.user)
    router.push('/')
    router.refresh()
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    }

    setUser(null)
    localStorage.removeItem('spatio_api_key')
    router.push('/signin')
    router.refresh()
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const resendVerification = async (email: string) => {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend verification email')
    }
  }

  const linkGoogleAccount = async (password: string, linkingData: any) => {
    const res = await fetch('/api/auth/link-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, linkingData }),
      credentials: 'include',
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to link Google account')
    }

    // Refresh user data after linking
    await checkAuth()
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    resendVerification,
    linkGoogleAccount,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}