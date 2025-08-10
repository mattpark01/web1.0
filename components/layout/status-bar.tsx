"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Wifi, 
  Database,
  Clock,
  Users,
  CircleDot
} from "lucide-react"
import { useStatusBar } from "@/contexts/status-bar-context"

export function StatusBar() {
  const { items } = useStatusBar()
  
  const leftItems = items.filter(item => item.position === "left")
  const rightItems = items.filter(item => item.position === "right")
  return (
    <footer className="flex h-6 items-center justify-between border-t bg-muted/30 px-4 text-xs">
      <div className="flex items-center gap-4">
        {/* Default left items */}
        <div className="flex items-center gap-1">
          <CircleDot className="h-3 w-3 text-green-500" />
          <span className="text-muted-foreground">0 Agents Online</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">0 Active Threads</span>
        </div>

        <div className="flex items-center gap-1">
          <Database className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Connected</span>
        </div>
        
        {/* Dynamic left items */}
        {leftItems.map(item => (
          <div key={item.id} className="flex items-center">
            {item.content}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {/* Dynamic right items */}
        {rightItems.map(item => (
          <div key={item.id} className="flex items-center">
            {item.content}
          </div>
        ))}
        
        {/* Default right items */}
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">2.1GB</span>
        </div>

        <div className="flex items-center gap-1">
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-muted-foreground">Good</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">4h 23m</span>
        </div>

        <Badge variant="secondary" className="h-4 px-1.5 text-xs">
          Claude 4 Sonnet
        </Badge>
      </div>
    </footer>
  )
}