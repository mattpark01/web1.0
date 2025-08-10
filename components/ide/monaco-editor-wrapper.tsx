"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const MonacoEditor = dynamic(
  () => import("./monaco-editor").then(mod => mod.MonacoEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
      </div>
    ),
  }
)

export { MonacoEditor }