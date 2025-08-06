"use client"

import { AppSidebar } from "./app-sidebar"
import { GlobalHeader } from "./global-header"
import { StatusBar } from "./status-bar"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <GlobalHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={75} minSize={30} className="flex flex-col">
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="border-l">
            <div className="h-full p-4">
              <div className="text-sm text-muted-foreground">
                Secondary Panel
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      <StatusBar />
    </div>
  )
}