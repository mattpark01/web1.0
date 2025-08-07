"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Search,
  MoreHorizontal,
  User,
  Sun,
  Moon,
  Calendar,
  Terminal,
  Store,
  FileText,
  Settings,
  Bot,
  Home,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  Share,
  CheckSquare,
  Table,
  Code,
  BookOpen,
  Mail,
  MessageSquare,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SpawnAgentDialog } from "@/components/dialogs/spawn-agent-dialog";

// Types
interface AppItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "app";
}

interface DialogConfig {
  title: string;
  component: React.ComponentType<any>;
  width?: "compact" | "normal" | "wide";
}

interface CommandItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "command";
  actionType: "immediate" | "dialog";
  action?: () => void;
  dialogConfig?: DialogConfig;
  sourceApp?: AppPage;
}

interface SettingsItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "settings";
  actionType: "immediate" | "dialog";
  action?: () => void;
  dialogConfig?: DialogConfig;
  keepDialogOpen?: boolean;
}

type AppPage =
  | "home"
  | "agent"
  | "editor"
  | "calendar"
  | "terminal"
  | "store"
  | "files"
  | "tasks"
  | "sheets"
  | "ide"
  | "notes"
  | "mail"
  | "settings";

// Constants
const PAGE_TITLES: Record<AppPage, string> = {
  agent: "Agent Inbox",
  editor: "Editor",
  calendar: "Calendar",
  terminal: "Terminal",
  store: "Store",
  files: "Files",
  tasks: "Tasks",
  sheets: "Sheets",
  ide: "IDE",
  notes: "Notes",
  mail: "Mail",
  settings: "Settings",
  home: "Dashboard",
};

const SEARCHABLE_APPS: AppItem[] = [
  { name: "Dashboard", path: "/", icon: Home, type: "app" },
  { name: "Agent Inbox", path: "/agent", icon: Bot, type: "app" },
  { name: "Editor", path: "/editor", icon: FileText, type: "app" },
  { name: "Calendar", path: "/calendar", icon: Calendar, type: "app" },
  { name: "Terminal", path: "/terminal", icon: Terminal, type: "app" },
  { name: "Store", path: "/store", icon: Store, type: "app" },
  { name: "Files", path: "/files", icon: FileText, type: "app" },
  { name: "Tasks", path: "/tasks", icon: CheckSquare, type: "app" },
  { name: "Sheets", path: "/sheets", icon: Table, type: "app" },
  { name: "IDE", path: "/ide", icon: Code, type: "app" },
  { name: "Notes", path: "/notes", icon: BookOpen, type: "app" },
  { name: "Mail", path: "/mail", icon: Mail, type: "app" },
  { name: "Settings", path: "/settings", icon: Settings, type: "app" },
];

const COMMAND_SEARCH_DELAY = 150; // Reduce delay from 1000ms to 150ms
const SLASH_COMMAND_PREFIX = "/";
const BACKSLASH_COMMAND_PREFIX = "\\";

// System settings will be created in the component with access to setTheme
const createSystemSettings = (
  setTheme: (theme: string) => void,
  currentTheme: string | undefined,
  onToggleSidebar?: () => void,
): SettingsItem[] => [
  {
    name: "Toggle Sidebar",
    icon: Menu,
    type: "settings",
    actionType: "immediate",
    action: onToggleSidebar || (() => console.log("Toggle Sidebar")),
  },
  {
    name: "Toggle System Appearance",
    icon: currentTheme === "dark" ? Sun : Moon,
    type: "settings",
    actionType: "immediate",
    keepDialogOpen: true,
    action: () => {
      setTheme(currentTheme === "dark" ? "light" : "dark");
    },
  },
  {
    name: "Copy Current URL",
    icon: Share,
    type: "settings",
    actionType: "immediate",
    action: () => {
      navigator.clipboard.writeText(window.location.href);
      console.log("URL copied to clipboard");
    },
  },
  {
    name: "Reload Page",
    icon: Plus,
    type: "settings",
    actionType: "immediate",
    action: () => {
      window.location.reload();
    },
  },
  {
    name: "Clear Browser Cache",
    icon: Trash2,
    type: "settings",
    actionType: "immediate",
    action: () => {
      if ("caches" in window) {
        caches
          .keys()
          .then((names) => names.forEach((name) => caches.delete(name)));
        console.log("Browser cache cleared");
      }
    },
  },
];

// Helper functions
const getPageTitle = (pathname: string): string => {
  const segments = pathname.split("/").filter(Boolean);
  const page = (segments[0] || "home") as AppPage;
  return PAGE_TITLES[page] || PAGE_TITLES.home;
};

const getAppPage = (pathname: string): AppPage => {
  const segments = pathname.split("/").filter(Boolean);
  return (segments[0] || "home") as AppPage;
};

const isValidInputTarget = (element: Element | null): boolean => {
  if (!element) return false;

  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.getAttribute("contenteditable") === "true"
  );
};

const getAppCommands = (pathname: string, onToggleSidebar?: () => void): CommandItem[] => {
  const page = getAppPage(pathname);

  const commands: Record<AppPage, CommandItem[]> = {
    home: [
      {
        name: "New Dashboard Project",
        icon: Plus,
        type: "command",
        actionType: "immediate",
        action: () => console.log("New Project"),
      },
      {
        name: "Import Dashboard Data",
        icon: Upload,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Import Data"),
      },
      {
        name: "Export Dashboard",
        icon: Download,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Export Dashboard"),
      },
    ],
    agent: [
      {
        name: "Spawn Agent",
        icon: Bot,
        type: "command",
        actionType: "dialog",
        dialogConfig: {
          title: "Spawn Agent",
          component: SpawnAgentDialog,
          width: "normal",
        },
      },
      {
        name: "New Conversation",
        icon: Plus,
        type: "command",
        actionType: "immediate",
        action: () => console.log("New Conversation"),
      },
      {
        name: "Clear History",
        icon: Trash2,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Clear History"),
      },
      {
        name: "Export Chat",
        icon: Download,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Export Chat"),
      },
    ],
    editor: [
      {
        name: "New Editor Document",
        icon: Plus,
        action: () => console.log("New Document"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Editor Template",
        icon: FileText,
        action: () => console.log("New Template"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Document",
        icon: Upload,
        action: () => console.log("Import Document"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Save As",
        icon: Download,
        action: () => console.log("Save As"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Share Document",
        icon: Share,
        action: () => console.log("Share Document"),
        type: "command",
        actionType: "immediate",
      },
    ],
    calendar: [
      {
        name: "New Event",
        icon: Plus,
        action: () => console.log("New Event"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Meeting",
        icon: Calendar,
        action: () => console.log("New Meeting"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Calendar",
        icon: Download,
        action: () => console.log("Export Calendar"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Share Calendar",
        icon: Share,
        action: () => console.log("Share Calendar"),
        type: "command",
        actionType: "immediate",
      },
    ],
    terminal: [
      {
        name: "New Session",
        icon: Plus,
        action: () => console.log("New Session"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Tab",
        icon: Plus,
        action: () => console.log("New Tab"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Clear Terminal",
        icon: Trash2,
        action: () => console.log("Clear Terminal"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Output",
        icon: Download,
        action: () => console.log("Export Output"),
        type: "command",
        actionType: "immediate",
      },
    ],
    store: [
      {
        name: "Publish Agent",
        icon: Plus,
        action: () => console.log("Publish Agent"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Extension",
        icon: Plus,
        action: () => console.log("New Extension"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Browse Marketplace",
        icon: Search,
        action: () => console.log("Browse Marketplace"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "My Published Agents",
        icon: Edit,
        action: () => console.log("My Published Agents"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Install Extension",
        icon: Download,
        action: () => console.log("Install Extension"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Share Agent",
        icon: Share,
        action: () => console.log("Share Agent"),
        type: "command",
        actionType: "immediate",
      },
    ],
    files: [
      {
        name: "Upload File",
        icon: Upload,
        action: () => console.log("Upload File"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New File Folder",
        icon: Plus,
        action: () => console.log("New Folder"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New File Document",
        icon: FileText,
        action: () => console.log("New Document"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Create Archive",
        icon: Download,
        action: () => console.log("Create Archive"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Share Files",
        icon: Share,
        action: () => console.log("Share Files"),
        type: "command",
        actionType: "immediate",
      },
    ],
    tasks: [
      {
        name: "New Task",
        icon: Plus,
        action: () => console.log("New Task"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Task Project",
        icon: Plus,
        action: () => console.log("New Project"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New List",
        icon: CheckSquare,
        action: () => console.log("New List"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Tasks",
        icon: Download,
        action: () => console.log("Export Tasks"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Tasks",
        icon: Upload,
        action: () => console.log("Import Tasks"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Archive Completed",
        icon: Trash2,
        action: () => console.log("Archive Completed"),
        type: "command",
        actionType: "immediate",
      },
    ],
    sheets: [
      {
        name: "New Spreadsheet",
        icon: Plus,
        action: () => console.log("New Spreadsheet"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Sheet Template",
        icon: Table,
        action: () => console.log("New Template"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Chart",
        icon: Plus,
        action: () => console.log("New Chart"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import CSV",
        icon: Upload,
        action: () => console.log("Import CSV"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Excel",
        icon: Download,
        action: () => console.log("Export Excel"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Share Spreadsheet",
        icon: Share,
        action: () => console.log("Share Spreadsheet"),
        type: "command",
        actionType: "immediate",
      },
    ],
    ide: [
      {
        name: "New Project",
        icon: Plus,
        action: () => console.log("New Project"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New File",
        icon: FileText,
        action: () => console.log("New File"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Workspace",
        icon: Code,
        action: () => console.log("New Workspace"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Clone Repository",
        icon: Download,
        action: () => console.log("Clone Repository"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Open Project",
        icon: Upload,
        action: () => console.log("Open Project"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Save All",
        icon: Download,
        action: () => console.log("Save All"),
        type: "command",
        actionType: "immediate",
      },
    ],
    notes: [
      {
        name: "New Note",
        icon: Plus,
        action: () => console.log("New Note"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Notebook",
        icon: BookOpen,
        action: () => console.log("New Notebook"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Tag",
        icon: Plus,
        action: () => console.log("New Tag"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Notes",
        icon: Upload,
        action: () => console.log("Import Notes"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Notes",
        icon: Download,
        action: () => console.log("Export Notes"),
        type: "command",
        actionType: "immediate",
      },
    ],
    mail: [
      {
        name: "Compose",
        icon: Edit,
        action: () => console.log("Compose"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Mail Folder",
        icon: Plus,
        action: () => console.log("New Folder"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Contacts",
        icon: Upload,
        action: () => console.log("Import Contacts"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Mailbox",
        icon: Download,
        action: () => console.log("Export Mailbox"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Empty Trash",
        icon: Trash2,
        action: () => console.log("Empty Trash"),
        type: "command",
        actionType: "immediate",
      },
    ],
    settings: [
      {
        name: "Toggle Sidebar",
        icon: Menu,
        action: onToggleSidebar || (() => console.log("Toggle Sidebar")),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Settings",
        icon: Download,
        action: () => console.log("Export Settings"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Settings",
        icon: Upload,
        action: () => console.log("Import Settings"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Reset to Default",
        icon: Trash2,
        action: () => console.log("Reset to Default"),
        type: "command",
        actionType: "immediate",
      },
    ],
  };

  // Return current app's commands first, then all other apps' commands with source app info
  const currentAppCommands = (commands[page] || []).map((cmd) => ({
    ...cmd,
    sourceApp: page,
  }));
  const otherAppsCommands = Object.keys(commands)
    .filter((key) => key !== page)
    .flatMap((appKey) => {
      const appCommands = commands[appKey as AppPage] || [];
      return appCommands.map((cmd) => ({
        ...cmd,
        sourceApp: appKey as AppPage,
      }));
    });

  return [...currentAppCommands, ...otherAppsCommands];
};

const getCurrentAppCommands = (pathname: string, onToggleSidebar?: () => void): CommandItem[] => {
  const page = getAppPage(pathname);

  const commands: Record<AppPage, CommandItem[]> = {
    home: [
      {
        name: "New Dashboard Project",
        icon: Plus,
        type: "command",
        actionType: "immediate",
        action: () => console.log("New Project"),
      },
      {
        name: "Import Dashboard Data",
        icon: Upload,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Import Data"),
      },
      {
        name: "Export Dashboard",
        icon: Download,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Export Dashboard"),
      },
    ],
    agent: [
      {
        name: "Spawn Agent",
        icon: Plus,
        type: "dialog",
        actionType: "dialog",
        action: () => console.log("Spawn Agent"),
        dialog: "spawn-agent",
      },
      {
        name: "New Conversation",
        icon: MessageSquare,
        action: () => console.log("New Conversation"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Clear History",
        icon: Trash2,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Clear History"),
      },
      {
        name: "Export Chat",
        icon: Download,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Export Chat"),
      },
    ],
    editor: [
      {
        name: "New Editor Document",
        icon: Plus,
        action: () => console.log("New Document"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Editor Template",
        icon: FileText,
        action: () => console.log("New Template"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Document",
        icon: Upload,
        action: () => console.log("Import Document"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Save As",
        icon: Download,
        action: () => console.log("Save As"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Share Document",
        icon: Share,
        action: () => console.log("Share Document"),
        type: "command",
        actionType: "immediate",
      },
    ],
    calendar: [
      {
        name: "New Event",
        icon: Plus,
        action: () => console.log("New Event"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Meeting",
        icon: Calendar,
        action: () => console.log("New Meeting"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Calendar",
        icon: Download,
        action: () => console.log("Export Calendar"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Share Calendar",
        icon: Share,
        action: () => console.log("Share Calendar"),
        type: "command",
        actionType: "immediate",
      },
    ],
    terminal: [
      {
        name: "New Session",
        icon: Plus,
        action: () => console.log("New Session"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Tab",
        icon: Plus,
        action: () => console.log("New Tab"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Clear Terminal",
        icon: Trash2,
        action: () => console.log("Clear Terminal"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Output",
        icon: Download,
        action: () => console.log("Export Output"),
        type: "command",
        actionType: "immediate",
      },
    ],
    store: [
      {
        name: "Publish Agent",
        icon: Plus,
        action: () => console.log("Publish Agent"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Extension",
        icon: Plus,
        action: () => console.log("New Extension"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Browse Marketplace",
        icon: Search,
        action: () => console.log("Browse Marketplace"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "My Published Agents",
        icon: Edit,
        action: () => console.log("My Published Agents"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Install Extension",
        icon: Download,
        action: () => console.log("Install Extension"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Share Agent",
        icon: Share,
        action: () => console.log("Share Agent"),
        type: "command",
        actionType: "immediate",
      },
    ],
    files: [
      {
        name: "Upload File",
        icon: Upload,
        action: () => console.log("Upload File"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New File Folder",
        icon: Plus,
        action: () => console.log("New Folder"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New File Document",
        icon: FileText,
        action: () => console.log("New Document"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Create Archive",
        icon: Download,
        action: () => console.log("Create Archive"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Share Files",
        icon: Share,
        action: () => console.log("Share Files"),
        type: "command",
        actionType: "immediate",
      },
    ],
    tasks: [
      {
        name: "New Task",
        icon: Plus,
        action: () => console.log("New Task"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Task Project",
        icon: Plus,
        action: () => console.log("New Project"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New List",
        icon: CheckSquare,
        action: () => console.log("New List"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Tasks",
        icon: Download,
        action: () => console.log("Export Tasks"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Tasks",
        icon: Upload,
        action: () => console.log("Import Tasks"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Archive Completed",
        icon: Trash2,
        action: () => console.log("Archive Completed"),
        type: "command",
        actionType: "immediate",
      },
    ],
    sheets: [
      {
        name: "New Spreadsheet",
        icon: Plus,
        action: () => console.log("New Spreadsheet"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Sheet Template",
        icon: Table,
        action: () => console.log("New Template"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Chart",
        icon: Plus,
        action: () => console.log("New Chart"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import CSV",
        icon: Upload,
        action: () => console.log("Import CSV"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Excel",
        icon: Download,
        action: () => console.log("Export Excel"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Share Spreadsheet",
        icon: Share,
        action: () => console.log("Share Spreadsheet"),
        type: "command",
        actionType: "immediate",
      },
    ],
    ide: [
      {
        name: "New Project",
        icon: Plus,
        action: () => console.log("New Project"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New File",
        icon: FileText,
        action: () => console.log("New File"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Workspace",
        icon: Code,
        action: () => console.log("New Workspace"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Clone Repository",
        icon: Download,
        action: () => console.log("Clone Repository"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Open Project",
        icon: Upload,
        action: () => console.log("Open Project"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Save All",
        icon: Download,
        action: () => console.log("Save All"),
        type: "command",
        actionType: "immediate",
      },
    ],
    notes: [
      {
        name: "New Note",
        icon: Plus,
        action: () => console.log("New Note"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Notebook",
        icon: BookOpen,
        action: () => console.log("New Notebook"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Tag",
        icon: Plus,
        action: () => console.log("New Tag"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Notes",
        icon: Upload,
        action: () => console.log("Import Notes"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Notes",
        icon: Download,
        action: () => console.log("Export Notes"),
        type: "command",
        actionType: "immediate",
      },
    ],
    mail: [
      {
        name: "Compose",
        icon: Edit,
        action: () => console.log("Compose"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "New Mail Folder",
        icon: Plus,
        action: () => console.log("New Folder"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Contacts",
        icon: Upload,
        action: () => console.log("Import Contacts"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Mailbox",
        icon: Download,
        action: () => console.log("Export Mailbox"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Empty Trash",
        icon: Trash2,
        action: () => console.log("Empty Trash"),
        type: "command",
        actionType: "immediate",
      },
    ],
    settings: [
      {
        name: "Toggle Sidebar",
        icon: Menu,
        action: onToggleSidebar || (() => console.log("Toggle Sidebar")),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Settings",
        icon: Download,
        action: () => console.log("Export Settings"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Settings",
        icon: Upload,
        action: () => console.log("Import Settings"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Reset to Default",
        icon: Trash2,
        action: () => console.log("Reset to Default"),
        type: "command",
        actionType: "immediate",
      },
    ],
  };

  return (commands[page] || []).map((cmd) => ({
    ...cmd,
    sourceApp: page,
  }));
};

// Custom hooks
const useCommandDialog = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [openWithSlash, setOpenWithSlash] = useState(false);
  const [openWithBackslash, setOpenWithBackslash] = useState(false);

  // Multi-level dialog state
  const [dialogLevel, setDialogLevel] = useState(0);
  const [dialogHistory, setDialogHistory] = useState<any[]>([]);
  const [currentDialogData, setCurrentDialogData] = useState<any>(null);

  const isSlashCommand = search.startsWith(SLASH_COMMAND_PREFIX);
  const isBackslashCommand = search.startsWith(BACKSLASH_COMMAND_PREFIX);
  const isJustSlash = search === SLASH_COMMAND_PREFIX;
  const isJustBackslash = search === BACKSLASH_COMMAND_PREFIX;

  const navigateToDialog = (item: CommandItem | SettingsItem) => {
    if (item.actionType === "dialog" && item.dialogConfig) {
      // Prevent focus changes during transition by blurring active element
      if (document.activeElement && "blur" in document.activeElement) {
        (document.activeElement as HTMLElement).blur();
      }

      // Add temporary class to suppress all focus outlines during transition
      document.body.classList.add("transitioning-dialog");

      setDialogHistory((prev) => [
        ...prev,
        { level: dialogLevel, search, showResults },
      ]);
      setCurrentDialogData(item);
      setDialogLevel(1);
      setShowResults(false);
      setSearch("");

      // Remove the transition class after animation completes
      setTimeout(() => {
        document.body.classList.remove("transitioning-dialog");
      }, 500);
    }
  };

  const navigateBack = () => {
    if (dialogLevel > 0) {
      const previousState = dialogHistory[dialogHistory.length - 1];
      if (previousState) {
        setDialogLevel(previousState.level);
        setSearch(previousState.search);
        setShowResults(previousState.showResults);
        setDialogHistory((prev) => prev.slice(0, -1));
        setCurrentDialogData(null);

        // Focus the CommandInput when going back to level 0 (no timeout needed)
        if (previousState.level === 0) {
          // Focus will be handled by the CommandInput when it renders
        }
      }
    }
  };

  const closeDialog = () => {
    setOpen(false);
    setSearch("");
    setShowResults(false);
    setDialogLevel(0);
    setDialogHistory([]);
    setCurrentDialogData(null);
  };

  return {
    open,
    setOpen,
    search,
    setSearch,
    showResults,
    setShowResults,
    openWithSlash,
    setOpenWithSlash,
    openWithBackslash,
    setOpenWithBackslash,
    isSlashCommand,
    isBackslashCommand,
    isJustSlash,
    isJustBackslash,
    dialogLevel,
    dialogHistory,
    currentDialogData,
    navigateToDialog,
    navigateBack,
    closeDialog,
  };
};

interface GlobalHeaderProps {
  onToggleSidebar?: () => void;
}

export function GlobalHeader({ onToggleSidebar }: GlobalHeaderProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const title = getPageTitle(pathname);
  const {
    open,
    setOpen,
    search,
    setSearch,
    showResults,
    setShowResults,
    openWithSlash,
    setOpenWithSlash,
    openWithBackslash,
    setOpenWithBackslash,
    isSlashCommand,
    isBackslashCommand,
    isJustSlash,
    isJustBackslash,
    dialogLevel,
    currentDialogData,
    navigateToDialog,
    navigateBack,
    closeDialog,
  } = useCommandDialog();

  // Computed values
  const getPlaceholder = () => {
    if (isSlashCommand) {
      return "Search core actions...";
    } else if (isBackslashCommand) {
      return "Search settings...";
    }
    return "Search or ask a question...";
  };

  const getDisplayValue = () => {
    if (isJustSlash || isJustBackslash) {
      return ""; // Hide the slash/backslash and show placeholder instead
    }
    if (isSlashCommand) {
      return search.slice(1); // Remove the "/" prefix for display
    }
    if (isBackslashCommand) {
      return search.slice(1); // Remove the "\" prefix for display  
    }
    return search;
  };

  const filteredItems = SEARCHABLE_APPS.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const allAppCommands = getAppCommands(pathname, onToggleSidebar);
  const currentAppCommands = getCurrentAppCommands(pathname, onToggleSidebar);

  const filteredCommands = isSlashCommand
    ? allAppCommands.filter((command) => {
        const searchTerm = search.slice(1).toLowerCase(); // Remove the "/" prefix
        return (
          command.type === "command" && 
          (searchTerm === "" || command.name.toLowerCase().includes(searchTerm))
        );
      })
    : allAppCommands.filter(
        (command) =>
          command.type === "command" &&
          (search === "" ||
          command.name.toLowerCase().includes(search.toLowerCase())),
      );

  // Duplicate detection removed to prevent render loops

  // Removed console.log to prevent render loops

  const systemSettings = createSystemSettings(setTheme, theme, onToggleSidebar);
  
  // Duplicate detection removed to prevent render loops

  const filteredSettings = isBackslashCommand
    ? systemSettings.filter((setting) => {
        const searchTerm = search.slice(1).toLowerCase(); // Remove the "\" prefix
        return (
          setting.type === "settings" && 
          (searchTerm === "" || setting.name.toLowerCase().includes(searchTerm))
        );
      })
    : systemSettings.filter(
        (setting) =>
          setting.type === "settings" &&
          (search === "" ||
          setting.name.toLowerCase().includes(search.toLowerCase())),
      );

  const shouldShowResults = useMemo(() => 
    (filteredItems.length > 0 ||
      filteredCommands.length > 0 ||
      filteredSettings.length > 0 ||
      isSlashCommand ||
      isBackslashCommand) &&
    (showResults || isSlashCommand || isBackslashCommand || dialogLevel > 0),
    [filteredItems.length, filteredCommands.length, filteredSettings.length, isSlashCommand, isBackslashCommand, showResults, dialogLevel]
  );

  // Simplified: Only manage width, let Superellipse auto-determine corner radius
  const animatedWidth = useMotionValue(320); // Start with compact width
  const animatedWidthSpring = useSpring(animatedWidth, {
    stiffness: 400,
    damping: 40,
    mass: 0.5,
  });
  
  // Update width when state changes
  useEffect(() => {
    const shouldExpand = dialogLevel > 0 || shouldShowResults;
    const targetWidth = shouldExpand ? 512 : 320;
    
    animatedWidth.set(targetWidth);
  }, [shouldShowResults, dialogLevel]);

  const topHit = isSlashCommand
    ? filteredCommands.length > 0
      ? filteredCommands[0]
      : null
    : isBackslashCommand
      ? filteredSettings.length > 0
        ? filteredSettings[0]
        : null
      : filteredItems.length > 0
        ? filteredItems[0]
        : filteredCommands.length > 0
          ? filteredCommands[0]
          : filteredSettings.length > 0
            ? filteredSettings[0]
            : null;

  // Handlers
  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      setSearch("");
      router.push(path);
    },
    [router, setOpen, setSearch],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        if (dialogLevel > 0) {
          navigateBack();
          return;
        } else if (showResults) {
          setShowResults(false);
          return;
        } else {
          closeDialog();
        }
      } else {
        setOpen(true);
      }
    },
    [
      showResults,
      dialogLevel,
      navigateBack,
      closeDialog,
      setOpen,
      setShowResults,
    ],
  );

  const handleTabAccept = useCallback(() => {
    if (topHit && getDisplayValue().length > 0) {
      if (isSlashCommand) {
        const searchTerm = getDisplayValue().toLowerCase();
        if (topHit.name.toLowerCase().startsWith(searchTerm)) {
          setSearch("/" + topHit.name);
        }
      } else if (isBackslashCommand) {
        const searchTerm = getDisplayValue().toLowerCase();
        if (topHit.name.toLowerCase().startsWith(searchTerm)) {
          setSearch("\\" + topHit.name);
        }
      } else if (topHit.name.toLowerCase().startsWith(getDisplayValue().toLowerCase())) {
        setSearch(topHit.name);
      }
    }
  }, [topHit, getDisplayValue, setSearch, isSlashCommand, isBackslashCommand]);

  // Effects
  useEffect(() => {
    if (search.length > 0) {
      setShowResults(false);
      const delay = isJustSlash || isJustBackslash ? 0 : COMMAND_SEARCH_DELAY;
      const timer = setTimeout(() => setShowResults(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [search, isJustSlash, isJustBackslash, setShowResults]);

  useEffect(() => {
    if (openWithSlash) {
      setSearch(SLASH_COMMAND_PREFIX);
      setShowResults(true);
      setOpenWithSlash(false);
      // Prevent text selection on the slash character
      setTimeout(() => {
        const input = document.querySelector(
          '[data-slot="command-input"]',
        ) as HTMLInputElement;
        if (input) {
          input.setSelectionRange(1, 1); // Move cursor to end of slash
        }
      }, 0);
    }
  }, [openWithSlash, setSearch, setShowResults, setOpenWithSlash]);

  useEffect(() => {
    if (openWithBackslash) {
      setSearch(BACKSLASH_COMMAND_PREFIX);
      setShowResults(true);
      setOpenWithBackslash(false);
      // Prevent text selection on the backslash character
      setTimeout(() => {
        const input = document.querySelector(
          '[data-slot="command-input"]',
        ) as HTMLInputElement;
        if (input) {
          input.setSelectionRange(1, 1); // Move cursor to end of backslash
        }
      }, 0);
    }
  }, [openWithBackslash, setSearch, setShowResults, setOpenWithBackslash]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      } else if (
        e.key === SLASH_COMMAND_PREFIX &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        !isValidInputTarget(document.activeElement)
      ) {
        e.preventDefault();
        setOpen(true);
        setOpenWithSlash(true);
      } else if (
        e.key === BACKSLASH_COMMAND_PREFIX &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        !isValidInputTarget(document.activeElement)
      ) {
        e.preventDefault();
        setOpen(true);
        setOpenWithBackslash(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen, setOpenWithSlash, setOpenWithBackslash]);

  // Render dialog content based on level
  const renderDialogContent = () => {
    if (dialogLevel === 1 && currentDialogData) {
      const DialogComponent = currentDialogData.dialogConfig.component;
      return <DialogComponent onBack={navigateBack} onComplete={closeDialog} />;
    }

    return renderCommandList();
  };

  // Render command list items
  const renderCommandList = () => {
    if (!shouldShowResults) return null;

    if (isSlashCommand) {
      return (
        <CommandGroup heading="Actions">
          {filteredCommands.map((action, index) => {
            const Icon = action.icon;
            const keyValue = `action-${index}`;
            const itemValue = `/${action.name.toLowerCase().replace(/\s+/g, "-")}`;
            console.log(
              `Rendering slash command: ${action.name}, key: ${keyValue}, value: ${itemValue}`,
            );
            return (
              <CommandItem
                key={`${action.sourceApp}-${action.name.toLowerCase().replace(/\s+/g, "-")}`}
                value={`/${action.name.toLowerCase().replace(/\s+/g, "-")}`}
                onSelect={() => {
                  if (action.actionType === "dialog") {
                    navigateToDialog(action);
                  } else {
                    action.action?.();
                    closeDialog();
                  }
                }}
                className="cursor-pointer flex items-center justify-between rounded-sm"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{action.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">Action</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      );
    }

    if (isBackslashCommand) {
      return (
        <CommandGroup heading="System Settings">
          {filteredSettings.map((setting, index) => {
            const Icon = setting.icon;
            return (
              <CommandItem
                key={`setting-${index}`}
                value={`\\${setting.name.toLowerCase().replace(/\s+/g, "-")}`}
                onSelect={() => {
                  if (setting.actionType === "dialog") {
                    navigateToDialog(setting);
                  } else {
                    setting.action?.();
                    if (!setting.keepDialogOpen) {
                      closeDialog();
                    }
                  }
                }}
                className="cursor-pointer flex items-center justify-between rounded-sm"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{setting.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">Setting</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      );
    }

    // Regular search - show all types
    return (
      <>
        {filteredItems.length > 0 && (
          <CommandGroup heading="Apps">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.path}
                  value={item.name}
                  onSelect={() => handleSelect(item.path)}
                  className="cursor-pointer flex items-center justify-between rounded-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">App</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {filteredCommands.length > 0 && (
          <CommandGroup heading="Actions">
            {filteredCommands.map((action, index) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={`${action.sourceApp}-${action.name.toLowerCase().replace(/\s+/g, "-")}`}
                  value={action.name}
                  onSelect={() => {
                    if (action.actionType === "dialog") {
                      navigateToDialog(action);
                    } else {
                      action.action?.();
                      closeDialog();
                    }
                  }}
                  className="cursor-pointer flex items-center justify-between rounded-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{action.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Action</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {filteredSettings.length > 0 && (
          <CommandGroup heading="Settings">
            {filteredSettings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <CommandItem
                  key={`setting-${index}`}
                  value={setting.name}
                  onSelect={() => {
                    if (setting.actionType === "dialog") {
                      navigateToDialog(setting);
                    } else {
                      setting.action?.();
                      if (!setting.keepDialogOpen) {
                        closeDialog();
                      }
                    }
                  }}
                  className="cursor-pointer flex items-center justify-between rounded-sm"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{setting.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Setting</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </>
    );
  };

  return (
    <header className="flex h-12 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-medium">{title}</h1>
      </div>

      {open && (
        <CommandDialog
          open={true}
          onOpenChange={handleOpenChange}
          className="overflow-hidden p-0 [&_[data-slot=command-input-wrapper]]:border-b-0"
          cornerRadius={(shouldShowResults || dialogLevel > 0) ? 8 : 100}
          animatedWidth={animatedWidthSpring}
          isCompact={!shouldShowResults && dialogLevel === 0}
          dialogWidth={
            dialogLevel > 0 && currentDialogData?.dialogConfig?.width
              ? currentDialogData.dialogConfig.width
              : "normal"
          }
          style={{ outline: "none !important" }}
        >
          <div
            className="relative [&_*]:!outline-none [&_*]:focus:!outline-none [&_*]:focus-visible:!outline-none [&_*]:!ring-0 [&_*]:!shadow-none [&_*]:!box-shadow-none [&_*]:focus:!ring-0 [&_*]:focus-visible:!ring-0 [&_*]:focus:!shadow-none [&_*]:focus-visible:!shadow-none [&_*]:focus:!border-transparent [&_*]:focus-visible:!border-transparent [&_*]:focus:!animate-none [&_*]:focus-visible:!animate-none"
            tabIndex={-1}
            style={{ outline: "none !important" }}
          >
            <motion.div
              key={dialogLevel}
              initial={{ opacity: 0, filter: "blur(8px)", y: 12 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(8px)", y: -12 }}
              transition={{ duration: 0.25, ease: [0.4, 0.0, 0.2, 1] }}
              className="[&_*]:!outline-none [&_*]:focus:!outline-none [&_*]:focus-visible:!outline-none"
              style={{ outline: "none !important" }}
            >
              {dialogLevel === 0 ? (
                shouldShowResults && (
                  <CommandList className="px-1 pt-2 pb-0">
                    {renderCommandList()}
                  </CommandList>
                )
              ) : (
                <div>{renderDialogContent()}</div>
              )}
            </motion.div>

            {dialogLevel === 0 && (
              <div className="relative">
                <CommandInput
                  placeholder={getPlaceholder()}
                  value={getDisplayValue()}
                  onValueChange={(value) => {
                    if (isSlashCommand) {
                      setSearch("/" + value);
                    } else if (isBackslashCommand) {
                      setSearch("\\" + value);
                    } else {
                      setSearch(value);
                    }
                  }}
                  className="[&>div]:border-b-0 [&>div]:bg-transparent p-2 text-lg relative z-10 bg-transparent focus:outline-none focus-visible:outline-none [&:focus]:outline-none [&:focus-visible]:outline-none [&_input]:focus:outline-none [&_input]:focus-visible:outline-none"
                  style={{ outline: "none !important" }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      if (showResults || isSlashCommand || isBackslashCommand) {
                        // Go directly to regular state - hide results and clear any command modes
                        setShowResults(false);
                        setSearch("");
                      } else {
                        // Close the dialog completely if already in regular state
                        closeDialog();
                      }
                    } else if (e.key === "/" && (isBackslashCommand || (!isSlashCommand && !isBackslashCommand))) {
                      // Switch to slash command mode or enter it
                      e.preventDefault();
                      setSearch("/");
                      setShowResults(true);
                    } else if (e.key === "\\" && (isSlashCommand || (!isSlashCommand && !isBackslashCommand))) {
                      // Switch to backslash command mode or enter it
                      e.preventDefault();
                      setSearch("\\");
                      setShowResults(true);
                    } else if (
                      e.key === "Tab" &&
                      topHit &&
                      getDisplayValue().length > 0 &&
                      topHit.name
                        .toLowerCase()
                        .startsWith(getDisplayValue().toLowerCase())
                    ) {
                      e.preventDefault();
                      handleTabAccept();
                    } else if (
                      e.key === "Enter" &&
                      topHit &&
                      getDisplayValue().length > 0 &&
                      !showResults
                    ) {
                      e.preventDefault();
                      if (topHit.type === "app") {
                        handleSelect(topHit.path);
                      } else if (topHit.type === "command") {
                        if (topHit.actionType === "dialog") {
                          navigateToDialog(topHit);
                        } else {
                          topHit.action?.();
                          closeDialog();
                        }
                      } else if (topHit.type === "settings") {
                        if (topHit.actionType === "dialog") {
                          navigateToDialog(topHit);
                        } else {
                          topHit.action?.();
                          closeDialog();
                        }
                      }
                    } else if (
                      (e.key === "ArrowDown" || e.key === "ArrowUp") &&
                      !showResults
                    ) {
                      e.preventDefault();
                      setShowResults(true);
                    }
                  }}
                />
                {/* Autocomplete preview */}
                {topHit &&
                  getDisplayValue().length > 0 &&
                  !isSlashCommand &&
                  !isBackslashCommand &&
                  topHit.name
                    .toLowerCase()
                    .startsWith(getDisplayValue().toLowerCase()) && (
                    <div
                      className="absolute left-0 right-0 top-0 bottom-0 flex items-center pointer-events-none"
                      style={{
                        paddingLeft: "0.75rem",
                        paddingRight: "0.75rem",
                      }}
                    >
                      <div className="flex items-center w-full text-lg py-3">
                        <span
                          className="invisible select-none"
                          style={{ whiteSpace: "pre" }}
                        >
                          {getDisplayValue()}
                        </span>
                        <div
                          className="flex items-center w-full"
                          style={{ marginLeft: "0.75rem" }}
                        >
                          <div
                            className="flex items-center rounded pr-2 pl-1 py-0.5"
                            style={{
                              backgroundColor: "rgba(128, 128, 128, 0.05)",
                            }}
                          >
                            <span className="select-none text-foreground/80">
                              {topHit.name.slice(getDisplayValue().length)}
                            </span>
                          </div>
                          <div className="ml-auto pr-2">
                            <topHit.icon
                              className="h-4 w-4"
                              style={{ color: "rgba(128, 128, 128, 1.0)" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </CommandDialog>
      )}

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {currentAppCommands.map((action, index) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={index}
                  onClick={() => {
                    if (action.actionType === "dialog") {
                      setOpen(true);
                      navigateToDialog(action);
                    } else {
                      action.action?.();
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {action.name}
                </DropdownMenuItem>
              );
            })}
            {currentAppCommands.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              App Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
