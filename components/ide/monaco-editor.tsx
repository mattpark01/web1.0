"use client"

import { useRef, useEffect } from "react"
import Editor, { OnMount, Monaco } from "@monaco-editor/react"
import { useTheme } from "next-themes"

interface MonacoEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  language?: string
  readOnly?: boolean
  path?: string
  theme?: "vs-dark" | "light"
  height?: string
  onMount?: OnMount
}

export function MonacoEditor({
  value,
  onChange,
  language = "typescript",
  readOnly = false,
  path = "file.tsx",
  theme,
  height = "100%",
  onMount: onMountProp
}: MonacoEditorProps) {
  const { resolvedTheme } = useTheme()
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure Monaco theme
    monaco.editor.defineTheme("spatiolabs-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A737D" },
        { token: "keyword", foreground: "61AFEF" },
        { token: "string", foreground: "98C379" },
        { token: "number", foreground: "D19A66" },
        { token: "type", foreground: "E06C75" },
        { token: "function", foreground: "C678DD" },
        { token: "variable", foreground: "ABB2BF" },
      ],
      colors: {
        "editor.background": "#09090B",
        "editor.foreground": "#ABB2BF",
        "editor.lineHighlightBackground": "#18181B",
        "editor.selectionBackground": "#3B3B3B",
        "editor.inactiveSelectionBackground": "#2B2B2B",
        "editorLineNumber.foreground": "#52525B",
        "editorLineNumber.activeForeground": "#A1A1AA",
        "editorCursor.foreground": "#61AFEF",
        "editor.wordHighlightBackground": "#2B2B2B",
        "editor.wordHighlightStrongBackground": "#3B3B3B",
        "editorBracketMatch.background": "#3B3B3B",
        "editorBracketMatch.border": "#61AFEF",
        "editorIndentGuide.background": "#27272A",
        "editorIndentGuide.activeBackground": "#3F3F46",
        "editorRuler.foreground": "#27272A",
        "scrollbar.shadow": "#000000",
        "scrollbarSlider.background": "#3F3F4680",
        "scrollbarSlider.hoverBackground": "#52525B80",
        "scrollbarSlider.activeBackground": "#71717A80",
      },
    })

    monaco.editor.setTheme("spatiolabs-dark")

    // Configure TypeScript/JavaScript language features
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      lib: ["es2020", "dom"],
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      resolveJsonModule: true,
      isolatedModules: true,
    })

    // Enable JavaScript language features
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      lib: ["es2020", "dom"],
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      noEmit: true,
      skipLibCheck: true,
    })

    // Add diagnostic options
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })

    // Call user's onMount if provided
    if (onMountProp) {
      onMountProp(editor, monaco)
    }
  }

  const getLanguageFromPath = (filePath: string): string => {
    const ext = filePath.split(".").pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript", 
      tsx: "typescript",
      json: "json",
      html: "html",
      css: "css",
      scss: "scss",
      less: "less",
      md: "markdown",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      cs: "csharp",
      go: "go",
      rs: "rust",
      php: "php",
      rb: "ruby",
      swift: "swift",
      kt: "kotlin",
      yaml: "yaml",
      yml: "yaml",
      xml: "xml",
      sql: "sql",
      sh: "shell",
      bash: "shell",
      ps1: "powershell",
      dockerfile: "dockerfile",
      gitignore: "plaintext",
      env: "plaintext",
      txt: "plaintext",
    }
    return languageMap[ext || ""] || "plaintext"
  }

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      language={getLanguageFromPath(path)}
      defaultValue={value}
      value={value}
      theme={theme || (resolvedTheme === "dark" ? "spatiolabs-dark" : "light")}
      onChange={onChange}
      onMount={handleEditorMount}
      path={path}
      options={{
        readOnly,
        fontSize: 13,
        fontFamily: '"JetBrains Mono", "SF Mono", Monaco, "Courier New", monospace',
        fontLigatures: true,
        minimap: {
          enabled: true,
          autohide: true,
        },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        lineNumbers: "on",
        renderLineHighlight: "all",
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: "on",
        tabCompletion: "on",
        contextmenu: true,
        formatOnPaste: true,
        formatOnType: true,
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        autoSurround: "languageDefined",
        automaticLayout: true,
        codeLens: true,
        colorDecorators: true,
        folding: true,
        foldingStrategy: "indentation",
        renderWhitespace: "selection",
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
        parameterHints: {
          enabled: true,
        },
        bracketPairColorization: {
          enabled: true,
        },
        guides: {
          indentation: true,
          bracketPairs: true,
        },
        stickyScroll: {
          enabled: true,
        },
      }}
    />
  )
}