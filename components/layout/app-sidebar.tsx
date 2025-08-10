"use client"

import { cn } from "@/lib/utils"
import { Superellipse } from "@/components/ui/superellipse/superellipse"
import { LucideIcon } from "lucide-react"

export interface AppSidebarItem {
  id: string
  label: string
  icon: LucideIcon
  count?: number
  isActive?: boolean
  onClick?: () => void
}

interface AppSidebarProps {
  items: AppSidebarItem[]
  className?: string
}

export function AppSidebar({ items, className }: AppSidebarProps) {
  return (
    <div className={cn("w-64 border-r border-border/50", className)}>
      <div className="space-y-2 w-full p-4">
        {items.map((item) => (
          <Superellipse key={item.id} cornerRadius={8} cornerSmoothing={1}>
            <div
              className={cn(
                "flex items-center gap-2 p-2 cursor-pointer transition-all",
                item.isActive 
                  ? "bg-muted/20" 
                  : "bg-muted/5 hover:bg-muted/10"
              )}
              onClick={item.onClick}
            >
              <item.icon className="h-4 w-4" />
              <span className={cn(
                "text-sm",
                item.isActive ? "font-medium" : "font-normal"
              )}>
                {item.label}
              </span>
              {item.count !== undefined && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.count}
                </span>
              )}
            </div>
          </Superellipse>
        ))}
      </div>
    </div>
  )
}