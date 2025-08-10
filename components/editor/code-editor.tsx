"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  className?: string
  readOnly?: boolean
  onCursorChange?: (position: { line: number; column: number }) => void
}

export function CodeEditor({ 
  value, 
  onChange, 
  language = "plaintext",
  className,
  readOnly = false,
  onCursorChange
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [lineNumbers, setLineNumbers] = useState<number[]>([1])
  const [highlightedContent, setHighlightedContent] = useState("")

  useEffect(() => {
    const lines = value.split("\n").length
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1))
    setHighlightedContent(highlightCode(value, language))
  }, [value, language])

  const highlightCode = (code: string, lang: string): string => {
    if (lang === "plaintext") return code

    const keywords = {
      javascript: /\b(const|let|var|function|return|if|else|for|while|break|continue|switch|case|default|new|this|class|extends|import|export|from|async|await|try|catch|finally|throw|typeof|instanceof|void|delete|in|of)\b/g,
      typescript: /\b(const|let|var|function|return|if|else|for|while|break|continue|switch|case|default|new|this|class|extends|import|export|from|async|await|try|catch|finally|throw|typeof|instanceof|void|delete|in|of|interface|type|enum|namespace|module|declare|abstract|implements|private|public|protected|readonly|static)\b/g,
      python: /\b(def|class|if|elif|else|for|while|break|continue|return|import|from|as|try|except|finally|raise|with|lambda|yield|assert|pass|del|and|or|not|in|is|True|False|None)\b/g,
    }

    const stringPattern = /(['"`])(?:(?=(\\?))\2.)*?\1/g
    const commentPattern = /\/\/.*$|\/\*[\s\S]*?\*\//gm
    const numberPattern = /\b\d+\.?\d*\b/g

    let highlighted = code
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

    highlighted = highlighted.replace(stringPattern, '<span class="text-green-400">$&</span>')
    highlighted = highlighted.replace(commentPattern, '<span class="text-zinc-500">$&</span>')
    highlighted = highlighted.replace(numberPattern, '<span class="text-cyan-400">$&</span>')

    const keywordPattern = keywords[lang as keyof typeof keywords] || keywords.javascript
    highlighted = highlighted.replace(keywordPattern, '<span class="text-purple-400">$&</span>')

    return highlighted
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newValue = value.substring(0, start) + "  " + value.substring(end)
      onChange(newValue)
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2
          textareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    }
  }

  const handleCursorChange = () => {
    if (!textareaRef.current || !onCursorChange) return
    
    const pos = textareaRef.current.selectionStart
    const lines = value.substring(0, pos).split("\n")
    const line = lines.length
    const column = lines[lines.length - 1].length + 1
    
    onCursorChange({ line, column })
  }

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  return (
    <div className={cn("flex h-full bg-zinc-950 font-mono text-sm relative", className)}>
      <div className="flex flex-col items-end px-3 py-2 text-zinc-600 bg-zinc-900 select-none min-w-[3rem]">
        {lineNumbers.map(num => (
          <div key={num} className="leading-6 text-right">
            {num}
          </div>
        ))}
      </div>
      
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={highlightRef}
          className="absolute inset-0 px-4 py-2 pointer-events-none overflow-auto whitespace-pre leading-6"
          dangerouslySetInnerHTML={{ __html: highlightedContent }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          onScroll={syncScroll}
          className="absolute inset-0 px-4 py-2 bg-transparent text-transparent caret-white resize-none outline-none leading-6 overflow-auto"
          spellCheck={false}
          readOnly={readOnly}
          style={{
            tabSize: 2,
            caretColor: "white",
          }}
        />
      </div>
    </div>
  )
}