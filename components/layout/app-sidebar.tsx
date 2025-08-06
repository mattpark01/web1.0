"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Bot,
  FileText,
  Calendar,
  Terminal,
  Store,
  FolderOpen,
  Settings,
} from "lucide-react"

const sidebarItems = [
  {
    id: "agent",
    label: "Agent Inbox",
    icon: Bot,
    href: "/agent",
  },
  {
    id: "editor",
    label: "Editor",
    icon: FileText,
    href: "/editor",
  },
  {
    id: "calendar",
    label: "Calendar", 
    icon: Calendar,
    href: "/calendar",
  },
  {
    id: "terminal",
    label: "Terminal",
    icon: Terminal,
    href: "/terminal",
  },
  {
    id: "store",
    label: "Store",
    icon: Store,
    href: "/store",
  },
  {
    id: "files",
    label: "Files",
    icon: FolderOpen,
    href: "/files",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-12 flex-col border-r bg-muted/30">
      <div className="flex flex-1 flex-col items-center gap-1 py-2">
        {sidebarItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Button
              key={item.id}
              variant="ghost"
              size="icon"
              asChild
              className={cn(
                "h-10 w-8 rounded-md transition-colors",
                isActive
                  ? "bg-primary/5 hover:bg-primary/30"
                  : "hover:bg-muted"
              )}
            >
              <Link href={item.href}>
                <Icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </Button>
          )
        })}
      </div>
    </div>
  )
}