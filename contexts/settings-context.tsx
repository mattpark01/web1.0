"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserSettings, DEFAULT_SETTINGS } from '@/types/settings'
import { useAuth } from './auth-context'

interface SettingsContextType {
  settings: UserSettings | null
  isLoading: boolean
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadSettings()
    } else {
      setSettings(null)
      setIsLoading(false)
    }
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    try {
      const res = await fetch('/api/settings', {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      } else if (res.status === 404) {
        const defaultSettings: UserSettings = {
          ...DEFAULT_SETTINGS,
          userId: user.id,
        }
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      const defaultSettings: UserSettings = {
        ...DEFAULT_SETTINGS,
        userId: user.id,
      }
      setSettings(defaultSettings)
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return

    const updatedSettings = { ...settings, ...updates }
    setSettings(updatedSettings)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to save settings')
      }

      const data = await res.json()
      setSettings(data.settings)

      if (updates.theme) {
        applyTheme(updates.theme)
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      setSettings(settings)
      throw error
    }
  }

  const resetSettings = async () => {
    if (!user) return

    const defaultSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      userId: user.id,
    }

    await updateSettings(defaultSettings)
  }

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.toggle('dark', systemTheme === 'dark')
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }

  useEffect(() => {
    if (settings?.theme) {
      applyTheme(settings.theme)
    }
  }, [settings?.theme])

  const value = {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}