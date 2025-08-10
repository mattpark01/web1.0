"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  content?: string
  language?: string
  readOnly?: boolean
  onChange?: (value: string) => void
  className?: string
}

const mockCode = `import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function Dashboard() {
  const [count, setCount] = useState(0)
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    role: 'developer'
  })

  const handleIncrement = () => {
    setCount(prev => prev + 1)
    console.log('Count incremented:', count + 1)
  }

  const handleDecrement = () => {
    setCount(prev => prev - 1)
    console.log('Count decremented:', count - 1)
  }

  return (
    <div className="p-6 space-y-4">
      <Card className="p-4">
        <h2 className="text-2xl font-bold mb-4">
          Welcome, {user.name}!
        </h2>
        <p className="text-muted-foreground">
          You are logged in as {user.email}
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleIncrement}>
            Increment
          </Button>
          <Button onClick={handleDecrement} variant="outline">
            Decrement
          </Button>
        </div>
        <p className="mt-4 text-lg">
          Current count: <span className="font-bold">{count}</span>
        </p>
      </Card>
    </div>
  )
}`

export function CodeEditor({ 
  content = mockCode, 
  language = "typescript",
  readOnly = false,
  onChange,
  className 
}: CodeEditorProps) {
  const [code, setCode] = useState(content)
  const [lineNumbers, setLineNumbers] = useState<number[]>([])

  useEffect(() => {
    const lines = code.split('\n').length
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1))
  }, [code])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setCode(newValue)
    onChange?.(newValue)
  }

  const highlightSyntax = (text: string) => {
    return text
      .replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while)\b/g, '<span class="text-blue-400">$1</span>')
      .replace(/\b(useState|useEffect|console|log|prev)\b/g, '<span class="text-purple-400">$1</span>')
      .replace(/('.*?'|".*?")/g, '<span class="text-green-400">$1</span>')
      .replace(/(\d+)/g, '<span class="text-orange-400">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
  }

  return (
    <div className={cn("flex h-full bg-zinc-950 font-mono text-sm", className)}>
      <div className="flex-shrink-0 bg-zinc-900 text-gray-500 select-none px-3 py-4">
        {lineNumbers.map(num => (
          <div key={num} className="leading-6">
            {num}
          </div>
        ))}
      </div>
      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={handleChange}
          readOnly={readOnly}
          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white resize-none p-4 leading-6 outline-none"
          spellCheck={false}
        />
        <div 
          className="p-4 text-gray-300 pointer-events-none whitespace-pre-wrap break-all leading-6"
          dangerouslySetInnerHTML={{ __html: highlightSyntax(code) }}
        />
      </div>
    </div>
  )
}