"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export interface StatusBarItem {
  id: string
  content: ReactNode
  position: "left" | "right"
  priority?: number
}

interface StatusBarContextType {
  items: StatusBarItem[]
  registerItem: (item: StatusBarItem) => void
  unregisterItem: (id: string) => void
  updateItem: (id: string, updates: Partial<StatusBarItem>) => void
}

const StatusBarContext = createContext<StatusBarContextType | undefined>(undefined)

export function StatusBarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StatusBarItem[]>([])

  const registerItem = useCallback((item: StatusBarItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? item : i)
      }
      return [...prev, item].sort((a, b) => (a.priority || 0) - (b.priority || 0))
    })
  }, [])

  const unregisterItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const updateItem = useCallback((id: string, updates: Partial<StatusBarItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }, [])

  return (
    <StatusBarContext.Provider value={{ items, registerItem, unregisterItem, updateItem }}>
      {children}
    </StatusBarContext.Provider>
  )
}

export function useStatusBar() {
  const context = useContext(StatusBarContext)
  if (!context) {
    throw new Error("useStatusBar must be used within a StatusBarProvider")
  }
  return context
}