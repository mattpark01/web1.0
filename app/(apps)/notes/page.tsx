"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AppSidebar, AppSidebarItem } from "@/components/layout/app-sidebar"
import { 
  Plus, 
  Search, 
  FileText, 
  Hash, 
  Star, 
  Archive, 
  Trash2,
  MoreVertical,
  Clock,
  Edit3,
  X,
  Check
} from "lucide-react"

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  isPinned: boolean
  isArchived: boolean
}

const mockNotes: Note[] = [
  {
    id: "1",
    title: "Project Ideas",
    content: "- Build a real-time collaboration tool\n- Create a mobile app for habit tracking\n- Develop an AI-powered code reviewer\n- Design a decentralized social network",
    tags: ["ideas", "projects"],
    createdAt: new Date('2024-08-06'),
    updatedAt: new Date('2024-08-06'),
    isPinned: true,
    isArchived: false
  },
  {
    id: "2",
    title: "Meeting Notes - Product Roadmap",
    content: "Discussed Q3 priorities:\n\n1. Launch new dashboard features\n2. Improve performance metrics\n3. User onboarding flow redesign\n\nAction items:\n- Review competitor analysis\n- Schedule user interviews\n- Create technical specifications",
    tags: ["meetings", "product"],
    createdAt: new Date('2024-08-05'),
    updatedAt: new Date('2024-08-05'),
    isPinned: false,
    isArchived: false
  },
  {
    id: "3",
    title: "API Documentation Notes",
    content: "REST API endpoints:\n\nGET /api/users - List all users\nPOST /api/users - Create new user\nPUT /api/users/:id - Update user\nDELETE /api/users/:id - Delete user\n\nAuthentication: Bearer token required\nRate limiting: 100 requests per minute",
    tags: ["technical", "api", "documentation"],
    createdAt: new Date('2024-08-04'),
    updatedAt: new Date('2024-08-04'),
    isPinned: false,
    isArchived: false
  },
  {
    id: "4",
    title: "Book Recommendations",
    content: "- Clean Code by Robert Martin\n- The Pragmatic Programmer\n- Design Patterns: Elements of Reusable Object-Oriented Software\n- Refactoring by Martin Fowler",
    tags: ["reading", "books"],
    createdAt: new Date('2024-08-03'),
    updatedAt: new Date('2024-08-03'),
    isPinned: false,
    isArchived: false
  }
]

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(mockNotes)
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0])
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSidebarItem, setActiveSidebarItem] = useState("all-notes")

  const filteredNotes = notes.filter(note => {
    if (activeSidebarItem === "starred" && !note.isPinned) return false
    if (activeSidebarItem === "archive" && !note.isArchived) return false
    if (activeSidebarItem === "all-notes" && note.isArchived) return false
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return note.title.toLowerCase().includes(query) || 
             note.content.toLowerCase().includes(query) ||
             note.tags.some(tag => tag.toLowerCase().includes(query))
    }
    return true
  })

  const sidebarItems: AppSidebarItem[] = [
    {
      id: "all-notes",
      label: "All Notes",
      icon: FileText,
      count: notes.filter(n => !n.isArchived).length,
      isActive: activeSidebarItem === "all-notes",
      onClick: () => setActiveSidebarItem("all-notes")
    },
    {
      id: "starred",
      label: "Starred",
      icon: Star,
      count: notes.filter(n => n.isPinned).length,
      isActive: activeSidebarItem === "starred",
      onClick: () => setActiveSidebarItem("starred")
    },
    {
      id: "recent",
      label: "Recent",
      icon: Clock,
      isActive: activeSidebarItem === "recent",
      onClick: () => setActiveSidebarItem("recent")
    },
    {
      id: "archive",
      label: "Archive",
      icon: Archive,
      count: notes.filter(n => n.isArchived).length,
      isActive: activeSidebarItem === "archive",
      onClick: () => setActiveSidebarItem("archive")
    },
    {
      id: "trash",
      label: "Trash",
      icon: Trash2,
      isActive: activeSidebarItem === "trash",
      onClick: () => setActiveSidebarItem("trash")
    }
  ]

  const handleStartEdit = () => {
    if (selectedNote) {
      setEditTitle(selectedNote.title)
      setEditContent(selectedNote.content)
      setIsEditing(true)
    }
  }

  const handleSaveEdit = () => {
    if (selectedNote) {
      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id 
          ? { ...note, title: editTitle, content: editContent, updatedAt: new Date() }
          : note
      )
      setNotes(updatedNotes)
      setSelectedNote({ ...selectedNote, title: editTitle, content: editContent })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle("")
    setEditContent("")
  }

  const handleTogglePin = () => {
    if (selectedNote) {
      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id 
          ? { ...note, isPinned: !note.isPinned }
          : note
      )
      setNotes(updatedNotes)
      setSelectedNote({ ...selectedNote, isPinned: !selectedNote.isPinned })
    }
  }

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "New Note",
      content: "",
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
      isArchived: false
    }
    setNotes([newNote, ...notes])
    setSelectedNote(newNote)
    setEditTitle(newNote.title)
    setEditContent(newNote.content)
    setIsEditing(true)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {/* <AppSidebar items={sidebarItems} /> */}
      
      {/* Notes List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Notes</h2>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              onClick={handleCreateNote}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search notes..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedNote?.id === note.id ? 'bg-muted/50' : ''
              }`}
              onClick={() => setSelectedNote(note)}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-sm truncate flex-1">{note.title}</h3>
                {note.isPinned && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {note.content || "No content"}
              </p>
              <div className="flex items-center gap-2">
                {note.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs py-0 h-5">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDate(note.updatedAt)}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Note Editor/Viewer */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="font-semibold text-lg border-0 p-0 h-auto focus-visible:ring-0"
                    placeholder="Note title..."
                  />
                ) : (
                  <h1 className="font-semibold text-lg">{selectedNote.title}</h1>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSaveEdit}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={handleStartEdit}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={handleTogglePin}
                    >
                      <Star className={`h-4 w-4 ${selectedNote.isPinned ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-auto">
              {isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[400px] resize-none border-0 p-0 focus-visible:ring-0 text-sm"
                  placeholder="Start typing..."
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {selectedNote.content || "No content"}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Created: {formatDate(selectedNote.createdAt)}</span>
                <span>Modified: {formatDate(selectedNote.updatedAt)}</span>
                {selectedNote.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {selectedNote.tags.join(", ")}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No note selected</h3>
              <p className="text-sm text-muted-foreground mb-4">Create a new note or select an existing one</p>
              <Button onClick={handleCreateNote}>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}