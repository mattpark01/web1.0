"use client"

import { useState } from "react"
import { AppSidebar } from "./app-sidebar"
import { GlobalHeader } from "./global-header"
import { StatusBar } from "./status-bar"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true)

  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev)
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <GlobalHeader onToggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && <AppSidebar />}
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      
      <StatusBar />
    </div>
  )
}