export interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileNode[]
  content?: string
  language?: string
  isOpen?: boolean
}

export interface FileSystemAPI {
  readDirectory: (path: string) => Promise<FileNode[]>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  createFile: (path: string) => Promise<void>
  createFolder: (path: string) => Promise<void>
  deleteFile: (path: string) => Promise<void>
  deleteFolder: (path: string) => Promise<void>
  renameFile: (oldPath: string, newPath: string) => Promise<void>
  searchFiles: (query: string, path?: string) => Promise<FileNode[]>
}

// Mock implementation for now - can be replaced with actual API calls
export class MockFileSystem implements FileSystemAPI {
  private files: Map<string, string> = new Map()

  constructor() {
    // Initialize with some sample files
    this.files.set("/src/App.tsx", `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React</h1>
        <p>Edit <code>src/App.tsx</code> and save to reload.</p>
      </header>
    </div>
  )
}

export default App`)

    this.files.set("/src/index.tsx", `import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`)

    this.files.set("/src/components/Button.tsx", `import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <button
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}`)

    this.files.set("/src/utils/helpers.ts", `export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}`)

    this.files.set("/package.json", `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}`)

    this.files.set("/README.md", `# My Application

This is a sample React application with TypeScript.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Features

- React 18
- TypeScript
- Modern development environment`)
  }

  async readDirectory(path: string): Promise<FileNode[]> {
    const structure: FileNode[] = [
      {
        name: "src",
        path: "/src",
        type: "folder",
        isOpen: true,
        children: [
          {
            name: "components",
            path: "/src/components",
            type: "folder",
            isOpen: true,
            children: [
              { name: "Button.tsx", path: "/src/components/Button.tsx", type: "file", language: "typescript" },
              { name: "Card.tsx", path: "/src/components/Card.tsx", type: "file", language: "typescript" },
              { name: "Modal.tsx", path: "/src/components/Modal.tsx", type: "file", language: "typescript" },
            ]
          },
          {
            name: "utils",
            path: "/src/utils",
            type: "folder",
            children: [
              { name: "helpers.ts", path: "/src/utils/helpers.ts", type: "file", language: "typescript" },
              { name: "constants.ts", path: "/src/utils/constants.ts", type: "file", language: "typescript" },
            ]
          },
          { name: "App.tsx", path: "/src/App.tsx", type: "file", language: "typescript" },
          { name: "index.tsx", path: "/src/index.tsx", type: "file", language: "typescript" },
          { name: "App.css", path: "/src/App.css", type: "file", language: "css" },
          { name: "index.css", path: "/src/index.css", type: "file", language: "css" },
        ]
      },
      {
        name: "public",
        path: "/public",
        type: "folder",
        children: [
          { name: "index.html", path: "/public/index.html", type: "file", language: "html" },
          { name: "favicon.ico", path: "/public/favicon.ico", type: "file" },
        ]
      },
      { name: "package.json", path: "/package.json", type: "file", language: "json" },
      { name: "tsconfig.json", path: "/tsconfig.json", type: "file", language: "json" },
      { name: "README.md", path: "/README.md", type: "file", language: "markdown" },
      { name: ".gitignore", path: "/.gitignore", type: "file" },
    ]
    
    return structure
  }

  async readFile(path: string): Promise<string> {
    return this.files.get(path) || `// File: ${path}\n// Content not found`
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content)
  }

  async createFile(path: string): Promise<void> {
    this.files.set(path, "")
  }

  async createFolder(path: string): Promise<void> {
    // Mock implementation
    console.log(`Created folder: ${path}`)
  }

  async deleteFile(path: string): Promise<void> {
    this.files.delete(path)
  }

  async deleteFolder(path: string): Promise<void> {
    // Delete all files in the folder
    for (const [filePath] of this.files) {
      if (filePath.startsWith(path)) {
        this.files.delete(filePath)
      }
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const content = this.files.get(oldPath)
    if (content !== undefined) {
      this.files.delete(oldPath)
      this.files.set(newPath, content)
    }
  }

  async searchFiles(query: string, path?: string): Promise<FileNode[]> {
    const results: FileNode[] = []
    for (const [filePath, content] of this.files) {
      if (path && !filePath.startsWith(path)) continue
      
      if (filePath.toLowerCase().includes(query.toLowerCase()) || 
          content.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          name: filePath.split("/").pop() || filePath,
          path: filePath,
          type: "file",
        })
      }
    }
    return results
  }
}

// Export a singleton instance
export const fileSystem = new MockFileSystem()