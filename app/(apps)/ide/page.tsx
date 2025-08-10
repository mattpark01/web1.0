"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { EnhancedFileTree } from "@/components/ide/enhanced-file-tree"
import { EnhancedEditorTabs, EditorTab } from "@/components/ide/enhanced-editor-tabs"
import { MonacoEditor } from "@/components/ide/monaco-editor-wrapper"
import { TerminalPanel } from "@/components/ide/terminal-panel"
import { SearchPanel, SearchOptions, SearchResult } from "@/components/ide/search-panel"
import { FileCode, Terminal, Search, PanelBottomOpen, PanelBottomClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { fileSystem } from "@/lib/ide/file-system"
import { useToast } from "@/hooks/use-toast"
import { useStatusBar } from "@/contexts/status-bar-context"

export default function IdePage() {
  const [tabs, setTabs] = useState<EditorTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>("")
  const [showTerminal, setShowTerminal] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [selectedText, setSelectedText] = useState("")
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const { toast } = useToast()
  const { registerItem, unregisterItem, updateItem } = useStatusBar()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (activeTabId) {
          handleTabSave(activeTabId)
        }
      }
      // Cmd/Ctrl + F to search
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault()
        setShowSearch(true)
      }
      // Cmd/Ctrl + H to search and replace
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault()
        setShowSearch(true)
      }
      // Cmd/Ctrl + ` to toggle terminal
      if ((e.metaKey || e.ctrlKey) && e.key === "`") {
        e.preventDefault()
        setShowTerminal(!showTerminal)
      }
      // Cmd/Ctrl + W to close tab
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault()
        if (activeTabId) {
          handleTabClose(activeTabId)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeTabId, showTerminal])

  const handleFileSelect = useCallback(async (path: string, content: string) => {
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.path === path)
    
    if (existingTab) {
      setActiveTabId(existingTab.id)
    } else {
      const newTab: EditorTab = {
        id: Date.now().toString(),
        title: path.split("/").pop() || path,
        path,
        content,
        language: getLanguageFromPath(path),
        isDirty: false,
      }
      setTabs([...tabs, newTab])
      setActiveTabId(newTab.id)
    }
  }, [tabs])

  const handleTabClose = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id)
    if (tab?.isDirty) {
      if (!confirm(`"${tab.title}" has unsaved changes. Close anyway?`)) {
        return
      }
    }
    
    const newTabs = tabs.filter(tab => tab.id !== id)
    setTabs(newTabs)
    
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id)
    } else if (newTabs.length === 0) {
      setActiveTabId("")
    }
  }, [tabs, activeTabId])

  const handleTabSave = useCallback(async (id: string) => {
    const tab = tabs.find(t => t.id === id)
    if (!tab) return
    
    try {
      await fileSystem.writeFile(tab.path, tab.content)
      setTabs(tabs.map(t => 
        t.id === id ? { ...t, isDirty: false } : t
      ))
      toast({
        title: "File saved",
        description: `${tab.title} has been saved successfully.`,
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: `Failed to save ${tab.title}.`,
        variant: "destructive",
      })
    }
  }, [tabs, toast])

  const handleContentChange = useCallback((value: string | undefined) => {
    if (!activeTabId || value === undefined) return
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, content: value, isDirty: true }
        : tab
    ))
  }, [activeTabId, tabs])

  const handleSearch = useCallback(async (query: string, options: SearchOptions) => {
    // Simple search implementation
    const results: SearchResult[] = []
    
    for (const tab of tabs) {
      const lines = tab.content.split("\n")
      lines.forEach((line, lineIndex) => {
        let searchText = options.caseSensitive ? line : line.toLowerCase()
        let searchQuery = options.caseSensitive ? query : query.toLowerCase()
        
        if (searchText.includes(searchQuery)) {
          const column = searchText.indexOf(searchQuery)
          results.push({
            file: tab.path,
            line: lineIndex + 1,
            column: column + 1,
            text: line.trim(),
            match: query,
          })
        }
      })
    }
    
    setSearchResults(results)
  }, [tabs])

  const handleReplace = useCallback(async (search: string, replace: string, options: SearchOptions) => {
    if (!activeTabId) return
    
    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab) return
    
    let newContent = tab.content
    
    if (options.regex) {
      try {
        const regex = new RegExp(search, options.caseSensitive ? "g" : "gi")
        newContent = newContent.replace(regex, replace)
      } catch (e) {
        toast({
          title: "Invalid regex",
          description: "The search pattern is not a valid regular expression.",
          variant: "destructive",
        })
        return
      }
    } else {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        options.caseSensitive ? "g" : "gi"
      )
      newContent = newContent.replace(searchRegex, replace)
    }
    
    setTabs(tabs.map(t => 
      t.id === activeTabId 
        ? { ...t, content: newContent, isDirty: true }
        : t
    ))
    
    toast({
      title: "Replace completed",
      description: `Replaced all occurrences of "${search}" with "${replace}".`,
    })
  }, [activeTabId, tabs, toast])

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco
    
    // Update cursor position
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      })
    })
    
    // Update selection
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = editor.getSelection()
      if (selection && !selection.isEmpty()) {
        const text = editor.getModel()?.getValueInRange(selection)
        setSelectedText(text || "")
      } else {
        setSelectedText("")
      }
    })
  }, [])

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      json: "json",
      html: "html",
      css: "css",
      scss: "scss",
      md: "markdown",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rs: "rust",
    }
    return languageMap[ext || ""] || "plaintext"
  }

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  // Register IDE status bar items
  useEffect(() => {
    const language = activeTab ? getLanguageFromPath(activeTab.path) : ""
    const fileName = activeTab ? activeTab.title : "No file open"
    
    // Register cursor position
    registerItem({
      id: "ide-cursor",
      content: (
        <span className="text-muted-foreground">
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
      ),
      position: "right",
      priority: 10
    })

    // Register language
    if (language) {
      registerItem({
        id: "ide-language",
        content: <span className="text-muted-foreground">{language}</span>,
        position: "right",
        priority: 20
      })
    }

    // Register file name
    registerItem({
      id: "ide-file",
      content: <span className="text-muted-foreground">{fileName}</span>,
      position: "left",
      priority: 10
    })

    // Register selection count
    if (selectedText) {
      registerItem({
        id: "ide-selection",
        content: (
          <span className="text-muted-foreground">
            {selectedText.length} selected
          </span>
        ),
        position: "right",
        priority: 15
      })
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      unregisterItem("ide-cursor")
      unregisterItem("ide-language")
      unregisterItem("ide-file")
      unregisterItem("ide-selection")
    }
  }, [activeTab, cursorPosition, selectedText, registerItem, unregisterItem])

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Search Panel */}
      {showSearch && (
        <SearchPanel
          onSearch={handleSearch}
          onReplace={handleReplace}
          onClose={() => {
            setShowSearch(false)
            setSearchResults([])
          }}
          results={searchResults}
        />
      )}

      {/* Main IDE area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File explorer sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
            <EnhancedFileTree 
              onFileSelect={handleFileSelect}
              selectedFile={activeTab?.path}
            />
          </ResizablePanel>
          
          <ResizableHandle className="bg-zinc-800" />
          
          {/* Editor area */}
          <ResizablePanel defaultSize={80}>
            <div className="h-full flex flex-col">
              {/* Tabs */}
              <EnhancedEditorTabs
                tabs={tabs}
                activeTabId={activeTabId}
                onTabSelect={setActiveTabId}
                onTabClose={handleTabClose}
                onTabSave={handleTabSave}
              />
              
              {/* Editor and Terminal */}
              <ResizablePanelGroup direction="vertical" className="flex-1">
                <ResizablePanel defaultSize={showTerminal ? 70 : 100}>
                  {activeTab ? (
                    <MonacoEditor
                      value={activeTab.content}
                      onChange={handleContentChange}
                      language={activeTab.language}
                      path={activeTab.path}
                      onMount={handleEditorMount}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-zinc-950">
                      <div className="text-center">
                        <FileCode className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-600">No file open</p>
                        <p className="text-zinc-700 text-sm mt-2">
                          Select a file from the explorer to start coding
                        </p>
                        <div className="mt-4 space-y-2 text-xs text-zinc-600">
                          <p>Cmd/Ctrl + S: Save file</p>
                          <p>Cmd/Ctrl + F: Search</p>
                          <p>Cmd/Ctrl + `: Toggle terminal</p>
                        </div>
                      </div>
                    </div>
                  )}
                </ResizablePanel>
                
                {showTerminal && (
                  <>
                    <ResizableHandle className="bg-zinc-800" />
                    <ResizablePanel defaultSize={30} minSize={20}>
                      <TerminalPanel />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-10 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowSearch(!showSearch)}
          title="Search (Cmd/Ctrl + F)"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowTerminal(!showTerminal)}
          title="Terminal (Cmd/Ctrl + `)"
        >
          {showTerminal ? <PanelBottomClose className="h-4 w-4" /> : <PanelBottomOpen className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}