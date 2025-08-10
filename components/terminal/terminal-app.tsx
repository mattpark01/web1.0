"use client"

import { useState, useEffect, useRef } from "react"
import { Terminal as XTerm } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import { WebLinksAddon } from "xterm-addon-web-links"
import { io, Socket } from "socket.io-client"
import { 
  Terminal, 
  Plus, 
  X, 
  Maximize2, 
  Minimize2,
  Copy,
  Clipboard,
  Settings,
  Menu
} from "lucide-react"
import "xterm/css/xterm.css"

interface TerminalSession {
  id: string
  name: string
  terminal: XTerm | null
  socket: Socket | null
  fitAddon: FitAddon | null
}

export function TerminalApp() {
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected")
  
  const terminalRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const sessionsRef = useRef<TerminalSession[]>([])
  const initRef = useRef(false)
  const [workspace, setWorkspace] = useState<any>(null)

  // Keep sessionsRef in sync
  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  // Initialize workspace on mount
  useEffect(() => {
    fetchWorkspace()
  }, [])

  const fetchWorkspace = async () => {
    try {
      const res = await fetch('/api/workspace', {
        headers: {
          'x-user-id': 'test-user' // Replace with actual auth
        }
      })
      const data = await res.json()
      setWorkspace(data.workspace)
      setConnectionStatus('disconnected')
    } catch (error) {
      console.error('Failed to fetch workspace:', error)
    }
  }

  const initializeWorkspaceConnection = async (session: TerminalSession, terminal: XTerm) => {
    if (!workspace) return
    
    try {
      setConnectionStatus('connecting')
      
      // Create workspace session
      const res = await fetch('/api/workspace/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user'
        },
        body: JSON.stringify({
          workspaceId: workspace.workspace_id
        })
      })
      
      const { wsUrl, cloudRunUrl } = await res.json()
      
      if (cloudRunUrl) {
        // Connect directly to Cloud Run WebSocket
        const ws = new WebSocket(`${cloudRunUrl}/ws`)
        
        ws.onopen = () => {
          setConnectionStatus('connected')
          terminal.writeln('Connected to workspace')
          terminal.write('$ ')
        }
        
        ws.onmessage = (event) => {
          terminal.write(event.data)
        }
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setConnectionStatus('disconnected')
        }
        
        ws.onclose = () => {
          terminal.writeln('\r\nDisconnected from workspace')
          setConnectionStatus('disconnected')
        }
        
        // Send terminal input to workspace
        terminal.onData((data: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data)
          }
        })
        
        // Store WebSocket reference
        session.socket = ws as any
      }
    } catch (error) {
      console.error('Failed to connect to workspace:', error)
      setConnectionStatus('disconnected')
    }
  }

  // Initialize terminal for a session
  useEffect(() => {
    sessions.forEach(session => {
      if (!session.terminal && terminalRefs.current[session.id]) {
        const container = terminalRefs.current[session.id]
        if (!container) return

        // Create terminal instance
        const terminal = new XTerm({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          theme: {
            background: '#09090b',
            foreground: '#f4f4f5',
            cursor: '#f4f4f5',
            black: '#18181b',
            red: '#ef4444',
            green: '#22c55e',
            yellow: '#eab308',
            blue: '#3b82f6',
            magenta: '#a855f7',
            cyan: '#06b6d4',
            white: '#f4f4f5',
            brightBlack: '#52525b',
            brightRed: '#f87171',
            brightGreen: '#4ade80',
            brightYellow: '#facc15',
            brightBlue: '#60a5fa',
            brightMagenta: '#c084fc',
            brightCyan: '#22d3ee',
            brightWhite: '#fafafa'
          },
          allowTransparency: true,
          scrollback: 10000
        })

        // Add addons
        const fitAddon = new FitAddon()
        const webLinksAddon = new WebLinksAddon()
        
        terminal.loadAddon(fitAddon)
        terminal.loadAddon(webLinksAddon)
        
        // Open terminal in container
        terminal.open(container)
        fitAddon.fit()

        // Initialize workspace connection
        initializeWorkspaceConnection(session, terminal)
        
        // Temporary demo mode fallback
        if (!session.socket) {
          terminal.writeln('Welcome to SpatioLabs Terminal v1.0')
          terminal.writeln('')
          terminal.writeln('Initializing workspace connection...')
          terminal.writeln('')
          terminal.write('$ ')
          
          // Demo mode - just echo input locally
          terminal.onData((data: string) => {
            if (data === '\r') {
              terminal.write('\r\n$ ')
            } else if (data === '\u007F') { // Backspace
              terminal.write('\b \b')
            } else {
              terminal.write(data)
            }
          })
        }

        // Update session with terminal instance
        setSessions(prev => prev.map(s => 
          s.id === session.id 
            ? { ...s, terminal, fitAddon }
            : s
        ))

        // Handle window resize
        const handleResize = () => {
          fitAddon.fit()
        }
        window.addEventListener('resize', handleResize)

        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize)
        }
      }
    })
  }, [sessions])

  const createNewSession = () => {
    const sessionId = Date.now().toString()
    const sessionName = `Terminal ${sessionsRef.current.length + 1}`
    
    const newSession: TerminalSession = {
      id: sessionId,
      name: sessionName,
      terminal: null,
      socket: null,
      fitAddon: null
    }

    setSessions(prev => [...prev, newSession])
    setActiveSessionId(sessionId)
  }

  const closeSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      session.socket?.disconnect()
      session.terminal?.dispose()
    }

    const newSessions = sessions.filter(s => s.id !== sessionId)
    setSessions(newSessions)
    
    if (activeSessionId === sessionId && newSessions.length > 0) {
      setActiveSessionId(newSessions[newSessions.length - 1].id)
    } else if (newSessions.length === 0) {
      setActiveSessionId(null)
    }
  }

  const copyToClipboard = () => {
    const activeSession = sessions.find(s => s.id === activeSessionId)
    if (activeSession?.terminal) {
      const selection = activeSession.terminal.getSelection()
      if (selection) {
        navigator.clipboard.writeText(selection)
      }
    }
  }

  const pasteFromClipboard = async () => {
    const activeSession = sessions.find(s => s.id === activeSessionId)
    if (activeSession?.terminal) {
      const text = await navigator.clipboard.readText()
      activeSession.terminal.write(text)
    }
  }

  // Create initial session on mount (only once)
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      createNewSession()
    }
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      sessionsRef.current.forEach(session => {
        session.socket?.disconnect()
        session.terminal?.dispose()
      })
    }
  }, [])

  return (
    <div className={`h-full flex bg-zinc-950 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Main terminal area */}
      <div className="flex-1 flex flex-col">
        {/* Terminal container */}
        <div className="flex-1 relative bg-zinc-950">
          {sessions.length > 0 && (
            <div
              ref={el => terminalRefs.current[sessions[0].id] = el}
              className="absolute inset-0"
              style={{ padding: '8px' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}