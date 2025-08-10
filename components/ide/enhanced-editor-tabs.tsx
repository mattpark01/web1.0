"use client"

import { X, Save, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EditorTab {
  id: string
  title: string
  path: string
  content: string
  language?: string
  isDirty?: boolean
  isActive?: boolean
}

interface EnhancedEditorTabsProps {
  tabs: EditorTab[]
  activeTabId: string
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
  onTabSave?: (id: string) => void
}

export function EnhancedEditorTabs({ 
  tabs, 
  activeTabId, 
  onTabSelect, 
  onTabClose,
  onTabSave 
}: EnhancedEditorTabsProps) {
  if (tabs.length === 0) return null

  const getFileIcon = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase()
    const colorMap: Record<string, string> = {
      ts: "text-blue-500",
      tsx: "text-blue-500",
      js: "text-yellow-500",
      jsx: "text-yellow-500",
      json: "text-yellow-600",
      html: "text-orange-500",
      css: "text-blue-400",
      scss: "text-pink-400",
      md: "text-gray-400",
      py: "text-green-500",
      java: "text-red-500",
      cpp: "text-blue-600",
      c: "text-blue-700",
      go: "text-cyan-500",
      rs: "text-orange-600",
    }
    return colorMap[ext || ""] || "text-gray-400"
  }

  const handleMiddleClick = (e: React.MouseEvent, id: string) => {
    if (e.button === 1) {
      e.preventDefault()
      onTabClose(id)
    }
  }

  return (
    <div className="flex items-center bg-zinc-900 border-b border-zinc-800 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700">
      <div className="flex">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center gap-2 px-3 pb-2 border-r border-zinc-800 cursor-pointer hover:bg-zinc-800/50 min-w-[120px] max-w-[200px] relative",
              activeTabId === tab.id && "bg-zinc-950 border-t-2 border-t-blue-500 pt-0",
              activeTabId !== tab.id && "pt-1"
            )}
            onClick={() => onTabSelect(tab.id)}
            onMouseDown={(e) => handleMiddleClick(e, tab.id)}
          >
            {tab.isDirty && (
              <Circle className="absolute top-2 left-2 h-2 w-2 fill-current text-blue-400" />
            )}
            
            <span className={cn("text-xs", getFileIcon(tab.path))}>
              •
            </span>
            
            <span className={cn(
              "text-sm truncate flex-1",
              activeTabId === tab.id ? "text-white" : "text-zinc-400"
            )}>
              {tab.title}
            </span>
            
            <div className="flex items-center gap-1">
              {tab.isDirty && onTabSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover:opacity-100"
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
                className={cn(
                  "h-4 w-4",
                  tab.isDirty 
                    ? "opacity-100" 
                    : "opacity-0 group-hover:opacity-100"
                )}
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
    </div>
  )
}