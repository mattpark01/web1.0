"use client"

import { X, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EditorTab {
  id: string
  title: string
  path: string
  content: string
  language?: string
  isDirty?: boolean
}

interface EditorTabsProps {
  tabs: EditorTab[]
  activeTabId: string
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
  onTabSave?: (id: string) => void
}

export function EditorTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabSave,
}: EditorTabsProps) {
  if (tabs.length === 0) return null

  return (
    <div className="flex items-center border-b border-border bg-background overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 border-r border-border cursor-pointer hover:bg-muted/50",
            activeTabId === tab.id && "bg-muted"
          )}
          onClick={() => onTabSelect(tab.id)}
        >
          <span className="text-sm truncate max-w-[150px]">
            {tab.isDirty && <span className="text-yellow-500 mr-1">•</span>}
            {tab.title}
          </span>
          <div className="flex items-center gap-1">
            {tab.isDirty && onTabSave && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onTabSave(tab.id)
                }}
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onTabClose(tab.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}