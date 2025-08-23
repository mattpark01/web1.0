"use client"

import { Superellipse } from "@/components/ui/superellipse/superellipse"
import { cn } from "@/lib/utils"

interface PlaceholderLogoProps {
  name: string
  size?: number
  className?: string
}

export function PlaceholderLogo({ name, size = 48, className }: PlaceholderLogoProps) {
  const firstLetter = name.charAt(0).toUpperCase()
  
  // Generate a consistent color based on the name
  const colors = [
    "bg-red-500",
    "bg-orange-500", 
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500"
  ]
  
  const colorIndex = name.charCodeAt(0) % colors.length
  const backgroundColor = colors[colorIndex]
  
  return (
    <Superellipse
      cornerRadius={12}
      cornerSmoothing={1}
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <div className={cn(
        "w-full h-full flex items-center justify-center text-white font-semibold",
        backgroundColor
      )}>
        <span style={{ fontSize: size * 0.4 }}>
          {firstLetter}
        </span>
      </div>
    </Superellipse>
  )
}