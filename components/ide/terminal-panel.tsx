"use client"

import { useState, useRef, useEffect } from "react"
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TerminalPanelProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export function TerminalPanel({ isOpen = true, onClose, className }: TerminalPanelProps) {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>([
    "$ npm install",
    "> added 234 packages in 12.3s",
    "$ npm run dev",
    "> Next.js 14.0.0",
    "> Local: http://localhost:3000",
    "> Ready in 2.1s",
  ])
  const [isMaximized, setIsMaximized] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      setHistory([...history, `$ ${input}`, `> Command executed: ${input}`])
      setInput("")
    }
  }

  if (!isOpen) return null

  return (
    <div className={cn(
      "border-t bg-zinc-950 text-gray-300 font-mono text-sm flex flex-col",
      isMaximized ? "h-[400px]" : "h-[200px]",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-xs">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="hover:bg-zinc-800 p-1 rounded"
          >
            {isMaximized ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </button>
          <button
            onClick={onClose}
            className="hover:bg-zinc-800 p-1 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {history.map((line, i) => (
          <div 
            key={i} 
            className={cn(
              "leading-relaxed",
              line.startsWith("$") ? "text-green-400" : "text-gray-400"
            )}
          >
            {line}
          </div>
        ))}
        <div ref={historyEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-2">
        <div className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            placeholder="Type a command..."
            autoFocus
          />
        </div>
      </form>
    </div>
  )
}