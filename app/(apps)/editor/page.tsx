"use client"

import { useState, useCallback, useEffect } from "react"
import { FileTree } from "@/components/editor/file-tree"
import { EditorTabs, EditorTab } from "@/components/editor/editor-tabs"
import { CodeEditor } from "@/components/editor/code-editor"
import { fileSystem } from "@/lib/ide/file-system"
import { useToast } from "@/hooks/use-toast"
import { useStatusBar } from "@/contexts/status-bar-context"
import { 
  FileCode, 
  Save, 
  Search,
  FolderOpen,
  Terminal,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

export default function EditorPage() {
  const [tabs, setTabs] = useState<EditorTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>("")
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const { toast } = useToast()
  const { registerItem, unregisterItem } = useStatusBar()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (activeTabId) {
          handleTabSave(activeTabId)
        }
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault()
        if (activeTabId) {
          handleTabClose(activeTabId)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeTabId])

  const handleFileSelect = useCallback(async (path: string, content: string) => {
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

  const handleContentChange = useCallback((value: string) => {
    if (!activeTabId) return
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, content: value, isDirty: true }
        : tab
    ))
  }, [activeTabId, tabs])

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

  useEffect(() => {
    const language = activeTab ? getLanguageFromPath(activeTab.path) : ""
    const fileName = activeTab ? activeTab.title : "No file open"
    
    registerItem({
      id: "editor-cursor",
      content: (
        <span className="text-muted-foreground text-xs">
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
      ),
      position: "right",
      priority: 10
    })

    if (language) {
      registerItem({
        id: "editor-language",
        content: <span className="text-muted-foreground text-xs">{language}</span>,
        position: "right",
        priority: 20
      })
    }

    registerItem({
      id: "editor-file",
      content: <span className="text-muted-foreground text-xs">{fileName}</span>,
      position: "left",
      priority: 10
    })

    return () => {
      unregisterItem("editor-cursor")
      unregisterItem("editor-language")
      unregisterItem("editor-file")
    }
  }, [activeTab, cursorPosition, registerItem, unregisterItem])

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
            <FileTree 
              onFileSelect={handleFileSelect}
              selectedFile={activeTab?.path}
            />
          </ResizablePanel>
          
          <ResizableHandle className="bg-border" />
          
          <ResizablePanel defaultSize={80}>
            <div className="h-full flex flex-col">
              <EditorTabs
                tabs={tabs}
                activeTabId={activeTabId}
                onTabSelect={setActiveTabId}
                onTabClose={handleTabClose}
                onTabSave={handleTabSave}
              />
              
              <div className="flex-1 overflow-hidden">
                {activeTab ? (
                  <CodeEditor
                    value={activeTab.content}
                    onChange={handleContentChange}
                    language={activeTab.language}
                    onCursorChange={setCursorPosition}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-background">
                    <div className="text-center">
                      <FileCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No file open</p>
                      <p className="text-muted-foreground text-sm mt-2">
                        Select a file from the explorer to start editing
                      </p>
                      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <p>Cmd/Ctrl + S: Save file</p>
                        <p>Cmd/Ctrl + W: Close tab</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => handleTabSave(activeTabId)}
          disabled={!activeTab?.isDirty}
          title="Save (Cmd/Ctrl + S)"
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}