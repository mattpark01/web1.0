"use client"

import { useState } from "react"
import { 
  Folder, 
  File, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileAudio,
  FileCode,
  FileArchive,
  Download,
  Upload,
  Trash2,
  Copy,
  Move,
  Share2,
  Grid,
  List,
  SortAsc,
  Filter,
  Search,
  Home,
  ChevronRight,
  MoreVertical,
  FolderPlus,
  Star,
  Clock,
  HardDrive,
  Cloud,
  Users,
  Eye,
  Edit3,
  Link2,
  Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface FileItem {
  id: string
  name: string
  type: 'folder' | 'file'
  size?: string
  modified: string
  fileType?: 'text' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'pdf' | 'other'
  isStarred?: boolean
  isShared?: boolean
  isLocked?: boolean
  items?: number
}

const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "Documents",
    type: "folder",
    modified: "2 hours ago",
    items: 24,
    isStarred: true,
  },
  {
    id: "2",
    name: "Images",
    type: "folder",
    modified: "Yesterday",
    items: 156,
    isShared: true,
  },
  {
    id: "3",
    name: "Videos",
    type: "folder",
    modified: "3 days ago",
    items: 8,
  },
  {
    id: "4",
    name: "project-report.pdf",
    type: "file",
    size: "2.4 MB",
    modified: "1 hour ago",
    fileType: "pdf",
    isStarred: true,
  },
  {
    id: "5",
    name: "presentation.pptx",
    type: "file",
    size: "12.5 MB",
    modified: "2 hours ago",
    fileType: "other",
    isShared: true,
  },
  {
    id: "6",
    name: "budget-2024.xlsx",
    type: "file",
    size: "854 KB",
    modified: "5 hours ago",
    fileType: "other",
    isLocked: true,
  },
  {
    id: "7",
    name: "meeting-notes.txt",
    type: "file",
    size: "12 KB",
    modified: "Yesterday",
    fileType: "text",
  },
  {
    id: "8",
    name: "logo-final.png",
    type: "file",
    size: "245 KB",
    modified: "2 days ago",
    fileType: "image",
  },
  {
    id: "9",
    name: "app.js",
    type: "file",
    size: "68 KB",
    modified: "3 days ago",
    fileType: "code",
  },
  {
    id: "10",
    name: "backup.zip",
    type: "file",
    size: "1.8 GB",
    modified: "1 week ago",
    fileType: "archive",
  },
]

export default function FilesPage() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [currentPath, setCurrentPath] = useState<string[]>(['Home'])
  const [files] = useState<FileItem[]>(mockFiles)

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return Folder
    switch (file.fileType) {
      case 'text': return FileText
      case 'image': return FileImage
      case 'video': return FileVideo
      case 'audio': return FileAudio
      case 'code': return FileCode
      case 'archive': return FileArchive
      default: return File
    }
  }

  const handleFileSelect = (fileId: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      setSelectedFiles(prev => 
        prev.includes(fileId) 
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      )
    } else {
      setSelectedFiles([fileId])
    }
  }

  const FileListItem = ({ file }: { file: FileItem }) => {
    const Icon = getFileIcon(file)
    const isSelected = selectedFiles.includes(file.id)

    return (
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 hover:bg-muted/30 cursor-pointer",
          isSelected && "bg-muted/50"
        )}
        onClick={(e) => handleFileSelect(file.id, e.metaKey || e.ctrlKey)}
        onDoubleClick={() => file.type === 'folder' && setCurrentPath([...currentPath, file.name])}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate">{file.name}</span>
          <div className="flex items-center gap-1">
            {file.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
            {file.isShared && <Users className="h-3 w-3 text-blue-500" />}
            {file.isLocked && <Lock className="h-3 w-3 text-red-500" />}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {file.type === 'folder' ? (
            <span>{file.items} items</span>
          ) : (
            <span>{file.size}</span>
          )}
          <span>{file.modified}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-3 w-3" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit3 className="mr-2 h-3 w-3" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-3 w-3" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Move className="mr-2 h-3 w-3" />
                Move
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Share2 className="mr-2 h-3 w-3" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-3 w-3" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  const FileGridItem = ({ file }: { file: FileItem }) => {
    const Icon = getFileIcon(file)
    const isSelected = selectedFiles.includes(file.id)

    return (
      <div
        className={cn(
          "flex flex-col items-center p-4 rounded-lg hover:bg-muted/30 cursor-pointer",
          isSelected && "bg-muted/50"
        )}
        onClick={(e) => handleFileSelect(file.id, e.metaKey || e.ctrlKey)}
        onDoubleClick={() => file.type === 'folder' && setCurrentPath([...currentPath, file.name])}
      >
        <Icon className="h-12 w-12 text-muted-foreground mb-2" />
        <span className="text-xs text-center truncate w-full">{file.name}</span>
        <div className="flex items-center gap-1 mt-1">
          {file.isStarred && <Star className="h-2 w-2 text-yellow-500 fill-yellow-500" />}
          {file.isShared && <Users className="h-2 w-2 text-blue-500" />}
          {file.isLocked && <Lock className="h-2 w-2 text-red-500" />}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-border/50 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm">
                <Home className="h-3 w-3 text-muted-foreground" />
                {currentPath.map((path, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <button
                      className="hover:underline"
                      onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                    >
                      {path}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm">
                <SortAsc className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-4" />

              <div className="flex items-center">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-4" />

              <Button variant="ghost" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
              <Button variant="ghost" size="sm">
                <FolderPlus className="h-4 w-4 mr-1" />
                New Folder
              </Button>
            </div>
          </div>
        </div>

        {/* File list/grid */}
        <ScrollArea className="flex-1">
          {viewMode === 'list' ? (
            <div className="divide-y divide-border/50">
              <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-4"></span>
                  <span>Name</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="w-16">Size</span>
                  <span className="w-24">Modified</span>
                  <span className="w-6"></span>
                </div>
              </div>

              {files.map(file => (
                <FileListItem key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-2 p-4">
              {files.map(file => (
                <FileGridItem key={file.id} file={file} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Status bar */}
        <div className="border-t border-border/50 px-4 py-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{files.length} items</span>
            {selectedFiles.length > 0 && (
              <span>{selectedFiles.length} selected</span>
            )}
            <span>2.3 GB used of 10 GB</span>
          </div>
        </div>
      </div>

      {/* Details panel */}
      {selectedFiles.length === 1 && (
        <div className="w-80 border-l border-border/50 p-4">
          <div className="space-y-4">
            {(() => {
              const selectedFile = files.find(f => f.id === selectedFiles[0])
              if (!selectedFile) return null
              const Icon = getFileIcon(selectedFile)
              
              return (
                <>
                  <div className="flex flex-col items-center py-8 border-b border-border/50">
                    <Icon className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-sm">{selectedFile.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedFile.type === 'folder' ? 'Folder' : selectedFile.size}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium mb-1">Type</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedFile.type === 'folder' ? 'Folder' : `${selectedFile.fileType} file`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium mb-1">Modified</p>
                      <p className="text-xs text-muted-foreground">{selectedFile.modified}</p>
                    </div>

                    {selectedFile.type === 'folder' && (
                      <div>
                        <p className="text-xs font-medium mb-1">Contains</p>
                        <p className="text-xs text-muted-foreground">{selectedFile.items} items</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium mb-1">Properties</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedFile.isStarred && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-2 w-2 mr-1" />
                            Starred
                          </Badge>
                        )}
                        {selectedFile.isShared && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-2 w-2 mr-1" />
                            Shared
                          </Badge>
                        )}
                        {selectedFile.isLocked && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-2 w-2 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Share2 className="mr-2 h-3 w-3" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Link2 className="mr-2 h-3 w-3" />
                      Copy Link
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Download className="mr-2 h-3 w-3" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-destructive">
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}