"use client"

import { useState, useEffect } from "react"
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileJson, 
  Image, 
  GitBranch,
  Plus,
  RefreshCw,
  Search,
  MoreVertical,
  Trash2,
  Edit3,
  FilePlus,
  FolderPlus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FileNode, fileSystem } from "@/lib/ide/file-system"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface EnhancedFileTreeProps {
  onFileSelect?: (path: string, content: string) => void
  selectedFile?: string
}

export function EnhancedFileTree({ onFileSelect, selectedFile }: EnhancedFileTreeProps) {
  const [tree, setTree] = useState<FileNode[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<FileNode[]>([])
  const [contextMenuPath, setContextMenuPath] = useState<string | null>(null)

  useEffect(() => {
    loadFileTree()
  }, [])

  const loadFileTree = async () => {
    const files = await fileSystem.readDirectory("/")
    setTree(files)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false)
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const results = await fileSystem.searchFiles(searchQuery)
    setSearchResults(results)
  }

  const toggleFolder = (node: FileNode) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(n => {
        if (n.path === node.path) {
          return { ...n, isOpen: !n.isOpen }
        }
        if (n.children) {
          return { ...n, children: updateNode(n.children) }
        }
        return n
      })
    }
    setTree(updateNode(tree))
  }

  const handleFileClick = async (node: FileNode) => {
    if (node.type === "folder") {
      toggleFolder(node)
    } else {
      const content = await fileSystem.readFile(node.path)
      onFileSelect?.(node.path, content)
    }
  }

  const handleCreateFile = async (parentPath: string) => {
    const fileName = prompt("Enter file name:")
    if (!fileName) return
    
    const filePath = `${parentPath}/${fileName}`
    await fileSystem.createFile(filePath)
    await loadFileTree()
  }

  const handleCreateFolder = async (parentPath: string) => {
    const folderName = prompt("Enter folder name:")
    if (!folderName) return
    
    const folderPath = `${parentPath}/${folderName}`
    await fileSystem.createFolder(folderPath)
    await loadFileTree()
  }

  const handleRename = async (path: string) => {
    const parts = path.split("/")
    const oldName = parts.pop()
    const newName = prompt("Enter new name:", oldName)
    if (!newName || newName === oldName) return
    
    const newPath = [...parts, newName].join("/")
    await fileSystem.renameFile(path, newPath)
    await loadFileTree()
  }

  const handleDelete = async (node: FileNode) => {
    if (!confirm(`Delete ${node.name}?`)) return
    
    if (node.type === "folder") {
      await fileSystem.deleteFolder(node.path)
    } else {
      await fileSystem.deleteFile(node.path)
    }
    await loadFileTree()
  }

  const getFileIcon = (node: FileNode) => {
    if (node.type === "folder") {
      return node.isOpen ? 
        <FolderOpen className="h-4 w-4 text-blue-400" /> : 
        <Folder className="h-4 w-4 text-blue-400" />
    }
    
    const ext = node.name.split(".").pop()?.toLowerCase()
    const iconMap: Record<string, JSX.Element> = {
      ts: <FileCode className="h-4 w-4 text-blue-500" />,
      tsx: <FileCode className="h-4 w-4 text-blue-500" />,
      js: <FileCode className="h-4 w-4 text-yellow-500" />,
      jsx: <FileCode className="h-4 w-4 text-yellow-500" />,
      json: <FileJson className="h-4 w-4 text-yellow-600" />,
      html: <FileCode className="h-4 w-4 text-orange-500" />,
      css: <FileCode className="h-4 w-4 text-blue-400" />,
      scss: <FileCode className="h-4 w-4 text-pink-400" />,
      png: <Image className="h-4 w-4 text-green-500" />,
      jpg: <Image className="h-4 w-4 text-green-500" />,
      jpeg: <Image className="h-4 w-4 text-green-500" />,
      gif: <Image className="h-4 w-4 text-green-500" />,
      svg: <Image className="h-4 w-4 text-purple-500" />,
    }
    
    return iconMap[ext || ""] || <FileText className="h-4 w-4 text-gray-400" />
  }

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isSelected = selectedFile === node.path
    
    return (
      <div key={node.path}>
        <div
          className={cn(
            "group flex items-center gap-1 px-2 py-1 hover:bg-muted/50 cursor-pointer text-sm relative",
            isSelected && "bg-muted text-white"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleFileClick(node)}
          onContextMenu={(e) => {
            e.preventDefault()
            setContextMenuPath(node.path)
          }}
        >
          {node.type === "folder" && (
            node.isOpen ? 
              <ChevronDown className="h-3 w-3" /> : 
              <ChevronRight className="h-3 w-3" />
          )}
          <span className="flex items-center gap-2 flex-1">
            {getFileIcon(node)}
            <span className={cn(
              "truncate",
              !isSelected && "text-muted-foreground"
            )}>
              {node.name}
            </span>
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {node.type === "folder" && (
                <>
                  <DropdownMenuItem onClick={() => handleCreateFile(node.path)}>
                    <FilePlus className="h-4 w-4 mr-2" />
                    New File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateFolder(node.path)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => handleRename(node.path)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete(node)}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {node.type === "folder" && node.isOpen && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      <div className="p-2 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">Explorer</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => handleCreateFile("/")}
            >
              <FilePlus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => handleCreateFolder("/")}
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={loadFileTree}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search files..."
            className="h-7 pl-8 text-xs bg-zinc-900 border-zinc-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {isSearching && searchResults.length > 0 ? (
          <div className="py-1">
            <div className="px-2 py-1 text-xs text-zinc-500">Search Results</div>
            {searchResults.map(node => renderNode(node))}
          </div>
        ) : (
          <div className="py-1">
            {tree.map(node => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  )
}