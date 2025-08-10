"use client"

import { useState } from "react"
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp,
  CaseSensitive,
  WholeWord,
  Regex,
  Replace
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchPanelProps {
  onSearch: (query: string, options: SearchOptions) => void
  onReplace: (search: string, replace: string, options: SearchOptions) => void
  onClose: () => void
  results?: SearchResult[]
}

export interface SearchOptions {
  caseSensitive: boolean
  wholeWord: boolean
  regex: boolean
}

export interface SearchResult {
  file: string
  line: number
  column: number
  text: string
  match: string
}

export function SearchPanel({ onSearch, onReplace, onClose, results = [] }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [replaceQuery, setReplaceQuery] = useState("")
  const [showReplace, setShowReplace] = useState(false)
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  })

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery, options)
    }
  }

  const handleReplace = () => {
    if (searchQuery.trim()) {
      onReplace(searchQuery, replaceQuery, options)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 p-2 space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setShowReplace(!showReplace)}
        >
          {showReplace ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search"
              className="h-8 pl-8 text-sm bg-zinc-950 border-zinc-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          
          <div className="flex items-center gap-1 border-l border-zinc-700 pl-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                options.caseSensitive && "bg-zinc-700"
              )}
              onClick={() => setOptions(o => ({ ...o, caseSensitive: !o.caseSensitive }))}
              title="Match Case"
            >
              <CaseSensitive className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                options.wholeWord && "bg-zinc-700"
              )}
              onClick={() => setOptions(o => ({ ...o, wholeWord: !o.wholeWord }))}
              title="Match Whole Word"
            >
              <WholeWord className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                options.regex && "bg-zinc-700"
              )}
              onClick={() => setOptions(o => ({ ...o, regex: !o.regex }))}
              title="Use Regular Expression"
            >
              <Regex className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {showReplace && (
        <div className="flex items-center gap-2 pl-8">
          <div className="relative flex-1">
            <Replace className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Replace"
              className="h-8 pl-8 text-sm bg-zinc-950 border-zinc-700"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReplace}
            className="h-8"
          >
            Replace All
          </Button>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="max-h-32 overflow-auto border-t border-zinc-800 pt-2">
          <div className="text-xs text-zinc-400 mb-1">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
          <div className="space-y-1">
            {results.map((result, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-800/50 cursor-pointer text-xs"
              >
                <span className="text-blue-400">{result.file}</span>
                <span className="text-zinc-500">:{result.line}:{result.column}</span>
                <span className="text-zinc-300 truncate flex-1">{result.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

