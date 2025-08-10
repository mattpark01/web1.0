"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, FileCode, FileJson, Image, GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileNode {
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  icon?: "code" | "json" | "image" | "text"
  isOpen?: boolean
}

const mockFileTree: FileNode[] = [
  {
    name: "src",
    type: "folder",
    isOpen: true,
    children: [
      {
        name: "components",
        type: "folder",
        isOpen: true,
        children: [
          { name: "Button.tsx", type: "file", icon: "code" },
          { name: "Card.tsx", type: "file", icon: "code" },
          { name: "Modal.tsx", type: "file", icon: "code" },
        ]
      },
      {
        name: "utils",
        type: "folder",
        children: [
          { name: "helpers.ts", type: "file", icon: "code" },
          { name: "constants.ts", type: "file", icon: "code" },
        ]
      },
      { name: "App.tsx", type: "file", icon: "code" },
      { name: "index.tsx", type: "file", icon: "code" },
      { name: "styles.css", type: "file", icon: "text" },
    ]
  },
  {
    name: "public",
    type: "folder",
    children: [
      { name: "favicon.ico", type: "file", icon: "image" },
      { name: "logo.png", type: "file", icon: "image" },
    ]
  },
  { name: "package.json", type: "file", icon: "json" },
  { name: "tsconfig.json", type: "file", icon: "json" },
  { name: "README.md", type: "file", icon: "text" },
  { name: ".gitignore", type: "file", icon: "text" },
]

interface FileTreeProps {
  onFileSelect?: (fileName: string) => void
  selectedFile?: string
}

export function FileTree({ onFileSelect, selectedFile }: FileTreeProps) {
  const [tree, setTree] = useState(mockFileTree)

  const toggleFolder = (path: string[]) => {
    const newTree = [...tree]
    let current = newTree
    
    for (let i = 0; i < path.length - 1; i++) {
      const folder = current.find(item => item.name === path[i])
      if (folder && folder.children) {
        current = folder.children
      }
    }
    
    const folder = current.find(item => item.name === path[path.length - 1])
    if (folder) {
      folder.isOpen = !folder.isOpen
    }
    
    setTree(newTree)
  }

  const getFileIcon = (node: FileNode) => {
    if (node.type === "folder") {
      return node.isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />
    }
    
    switch (node.icon) {
      case "code":
        return <FileCode className="h-4 w-4" />
      case "json":
        return <FileJson className="h-4 w-4" />
      case "image":
        return <Image className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const renderNode = (node: FileNode, depth: number = 0, path: string[] = []) => {
    const currentPath = [...path, node.name]
    const isSelected = selectedFile === currentPath.join("/")
    
    return (
      <div key={node.name}>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 hover:bg-muted/50 cursor-pointer text-sm",
            isSelected && "bg-muted"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder(currentPath)
            } else {
              onFileSelect?.(currentPath.join("/"))
            }
          }}
        >
          {node.type === "folder" && (
            node.isOpen ? 
              <ChevronDown className="h-3 w-3" /> : 
              <ChevronRight className="h-3 w-3" />
          )}
          <span className={cn(
            "flex items-center gap-2",
            node.type === "folder" ? "text-blue-400" : "text-muted-foreground"
          )}>
            {getFileIcon(node)}
            {node.name}
          </span>
        </div>
        {node.type === "folder" && node.isOpen && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1, currentPath))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-background border-r">
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase">Explorer</span>
        <GitBranch className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="py-1">
        {tree.map(node => renderNode(node))}
      </div>
    </div>
  )
}