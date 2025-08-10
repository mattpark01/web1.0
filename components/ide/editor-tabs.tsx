"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Tab {
  id: string
  title: string
  content?: string
  language?: string
}

interface EditorTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
}

export function EditorTabs({ tabs, activeTab, onTabSelect, onTabClose }: EditorTabsProps) {
  if (tabs.length === 0) return null

  return (
    <div className="flex items-center border-b bg-background overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={cn(
            "flex items-center gap-2 px-3 py-2 border-r cursor-pointer hover:bg-muted/30 min-w-[120px] max-w-[200px]",
            activeTab === tab.id && "bg-muted"
          )}
          onClick={() => onTabSelect(tab.id)}
        >
          <span className="text-sm truncate flex-1">{tab.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTabClose(tab.id)
            }}
            className="hover:bg-muted-foreground/20 rounded p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}