"use client"

import { useState, useEffect } from "react"
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  File, 
  FileText, 
  FileCode,
  FileImage,
  Plus,
  Trash2,
  Edit2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { fileSystem, FileNode } from "@/lib/ide/file-system"

interface FileTreeProps {
  onFileSelect: (path: string, content: string) => void
  selectedFile?: string
}

export function FileTree({ onFileSelect, selectedFile }: FileTreeProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/src"]))

  useEffect(() => {
    loadFileTree()
  }, [])

  const loadFileTree = async () => {
    const tree = await fileSystem.readDirectory("/")
    setFileTree(tree)
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const handleFileClick = async (node: FileNode) => {
    if (node.type === "file") {
      const content = await fileSystem.readFile(node.path)
      onFileSelect(node.path, content)
    } else {
      toggleFolder(node.path)
    }
  }

  const getFileIcon = (node: FileNode) => {
    if (node.type === "folder") {
      return expandedFolders.has(node.path) ? FolderOpen : Folder
    }
    
    const ext = node.path.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "ts":
      case "tsx":
      case "js":
      case "jsx":
      case "json":
      case "html":
      case "css":
      case "scss":
        return FileCode
      case "md":
      case "txt":
        return FileText
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "svg":
        return FileImage
      default:
        return File
    }
  }

  const renderNode = (node: FileNode, depth: number = 0) => {
    const Icon = getFileIcon(node)
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFile === node.path

    return (
      <div key={node.path}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 hover:bg-muted/50 cursor-pointer text-sm",
                isSelected && "bg-muted"
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => handleFileClick(node)}
            >
              {node.type === "folder" && (
                <button
                  className="p-0 h-4 w-4"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFolder(node.path)
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              )}
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{node.name}</span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {node.type === "folder" && (
              <>
                <ContextMenuItem>
                  <Plus className="mr-2 h-3 w-3" />
                  New File
                </ContextMenuItem>
                <ContextMenuItem>
                  <Plus className="mr-2 h-3 w-3" />
                  New Folder
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem>
              <Edit2 className="mr-2 h-3 w-3" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {node.type === "folder" && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full bg-background border-r border-border">
      <div className="p-2 border-b border-border">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Explorer
        </h3>
      </div>
      <div className="overflow-auto">
        {fileTree.map(node => renderNode(node))}
      </div>
    </div>
  )
}