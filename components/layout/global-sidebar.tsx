"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Superellipse } from "@/components/ui/superellipse/superellipse"
import {
  Bot,
  FileText,
  CalendarDays,
  Terminal,
  Link2,
  FolderOpen,
  CheckSquare,
  Table,
  BookOpen,
  Mail,
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
    id: "calendar",
    label: "Calendar", 
    icon: CalendarDays,
    href: "/calendar",
  },
  {
    id: "terminal",
    label: "Terminal",
    icon: Terminal,
    href: "/terminal",
  },
  {
    id: "connections",
    label: "Connections",
    icon: Link2,
    href: "/connections",
  },
  {
    id: "files",
    label: "Files",
    icon: FolderOpen,
    href: "/files",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    href: "/tasks",
  },
  {
    id: "sheets",
    label: "Sheets",
    icon: Table,
    href: "/sheets",
  },
  {
    id: "notes",
    label: "Notes",
    icon: BookOpen,
    href: "/notes",
  },
  {
    id: "mail",
    label: "Mail",
    icon: Mail,
    href: "/mail",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function GlobalSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-12 flex-col border-r border-border/40">
      <div className="flex flex-1 flex-col items-center gap-1 py-2">
        {sidebarItems.map((item) => {
          const isActive = pathname?.startsWith(item.href) || false
          const Icon = item.icon

          return (
            <Superellipse key={item.id} cornerRadius={6} cornerSmoothing={1} asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={cn(
                  "h-10 w-8 transition-colors",
                  isActive
                    ? "bg-primary/5 hover:bg-primary/30"
                    : "hover:bg-muted"
                )}
              >
                <Link href={item.href} className="flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </Button>
            </Superellipse>
          )
        })}
      </div>
    </div>
  )
}