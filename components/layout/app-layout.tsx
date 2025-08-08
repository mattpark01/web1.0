"use client"

import { useState } from "react"
import { GlobalSidebar } from "./global-sidebar"
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
        {sidebarVisible && <GlobalSidebar />}
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      
      <StatusBar />
    </div>
  )
}