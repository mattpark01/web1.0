"use client"

import { GitBranch, Check, AlertCircle, Info } from "lucide-react"

interface StatusBarProps {
  branch?: string
  language?: string
  line?: number
  column?: number
  status?: "ready" | "error" | "warning"
  encoding?: string
  lineEnding?: string
  selection?: number
}

export function StatusBar({ 
  branch = "main", 
  language = "TypeScript JSX",
  line = 42,
  column = 16,
  status = "ready",
  encoding = "UTF-8",
  lineEnding = "LF",
  selection = 0
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-1 bg-zinc-900 border-t text-xs text-gray-400">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>{branch}</span>
        </div>
        <div className="flex items-center gap-1">
          {status === "ready" && <Check className="h-3 w-3 text-green-500" />}
          {status === "error" && <AlertCircle className="h-3 w-3 text-red-500" />}
          {status === "warning" && <Info className="h-3 w-3 text-yellow-500" />}
          <span>No issues</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span>{language}</span>
        <span>Ln {line}, Col {column}</span>
        {selection > 0 && <span>({selection} selected)</span>}
        <span>{encoding}</span>
        <span>{lineEnding}</span>
      </div>
    </div>
  )
}