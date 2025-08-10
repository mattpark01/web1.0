"use client"

import { useState } from "react"
import { AppSidebar, AppSidebarItem } from "@/components/layout/app-sidebar"
import { 
  Terminal, 
  History, 
  FileText, 
  Settings, 
  Share2,
  FolderOpen,
  Key,
  Wifi,
  HardDrive,
  Activity
} from "lucide-react"

interface TerminalSidebarProps {
  onItemSelect?: (itemId: string) => void
}

export function TerminalSidebar({ onItemSelect }: TerminalSidebarProps) {
  const [activeItem, setActiveItem] = useState("sessions")

  const sidebarItems: AppSidebarItem[] = [
    {
      id: "sessions",
      label: "Active Sessions",
      icon: Terminal,
      count: 2,
      isActive: activeItem === "sessions",
      onClick: () => {
        setActiveItem("sessions")
        onItemSelect?.("sessions")
      }
    },
    {
      id: "history",
      label: "Command History",
      icon: History,
      isActive: activeItem === "history",
      onClick: () => {
        setActiveItem("history")
        onItemSelect?.("history")
      }
    },
    {
      id: "snippets",
      label: "Snippets",
      icon: FileText,
      count: 12,
      isActive: activeItem === "snippets",
      onClick: () => {
        setActiveItem("snippets")
        onItemSelect?.("snippets")
      }
    },
    {
      id: "filesystem",
      label: "File System",
      icon: FolderOpen,
      isActive: activeItem === "filesystem",
      onClick: () => {
        setActiveItem("filesystem")
        onItemSelect?.("filesystem")
      }
    },
    {
      id: "ssh-keys",
      label: "SSH Keys",
      icon: Key,
      count: 3,
      isActive: activeItem === "ssh-keys",
      onClick: () => {
        setActiveItem("ssh-keys")
        onItemSelect?.("ssh-keys")
      }
    },
    {
      id: "connections",
      label: "Connections",
      icon: Share2,
      isActive: activeItem === "connections",
      onClick: () => {
        setActiveItem("connections")
        onItemSelect?.("connections")
      }
    },
    {
      id: "network",
      label: "Network",
      icon: Wifi,
      isActive: activeItem === "network",
      onClick: () => {
        setActiveItem("network")
        onItemSelect?.("network")
      }
    },
    {
      id: "resources",
      label: "VM Resources",
      icon: HardDrive,
      isActive: activeItem === "resources",
      onClick: () => {
        setActiveItem("resources")
        onItemSelect?.("resources")
      }
    },
    {
      id: "monitoring",
      label: "Monitoring",
      icon: Activity,
      isActive: activeItem === "monitoring",
      onClick: () => {
        setActiveItem("monitoring")
        onItemSelect?.("monitoring")
      }
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      isActive: activeItem === "settings",
      onClick: () => {
        setActiveItem("settings")
        onItemSelect?.("settings")
      }
    }
  ]

  return <AppSidebar items={sidebarItems} />
}