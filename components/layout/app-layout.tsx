"use client"

import { useState, useEffect } from "react"
import { GlobalSidebar } from "./global-sidebar"
import { GlobalHeader } from "./global-header"
import { CommandDialogWrapper } from "./command-dialog"
import { StatusBar } from "./status-bar"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { StatusBarProvider } from "@/contexts/status-bar-context"
import { CommandRegistryProvider } from "@/contexts/command-registry"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [focusMode, setFocusMode] = useState(true)

  const toggleFocusMode = () => {
    setFocusMode(prev => !prev)
  }

  // Handle cmd + . keyboard shortcut for focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for cmd + . (period) on Mac or ctrl + . on Windows/Linux
      if (e.key === "." && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleFocusMode()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <CommandRegistryProvider>
      <StatusBarProvider>
        <div className="flex h-screen w-full flex-col bg-background">
          {focusMode && <GlobalHeader onToggleFocusMode={toggleFocusMode} />}
          <CommandDialogWrapper onToggleFocusMode={toggleFocusMode} />
          
          <div className="flex flex-1 overflow-hidden">
            {focusMode && <GlobalSidebar />}
            
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
          {focusMode && <StatusBar />}
        </div>
      </StatusBarProvider>
    </CommandRegistryProvider>
  )
}