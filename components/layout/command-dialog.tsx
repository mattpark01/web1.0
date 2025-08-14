"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Search,
  Sun,
  Moon,
  Calendar,
  Terminal,
  Link2,
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
  TrendingUp,
  CreditCard,
  Activity,
  Inbox,
  Star,
  Send,
  Archive,
  BarChart3,
  Users,
  Clock,
  Bell,
  AlertCircle,
  Video,
  Package,
  Zap,
  Shield,
  Target,
  LineChart,
  PlayCircle,
  Database,
  Wallet,
  ArrowUpRight,
  PiggyBank,
  Grid3X3,
  List,
} from "lucide-react";
import { SpawnAgentDialog } from "@/components/dialogs/spawn-agent-dialog";
import { useCommandRegistry } from "@/contexts/command-registry";

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
}

type AppPage =
  | "home"
  | "agent"
  | "editor"
  | "calendar"
  | "terminal"
  | "connections"
  | "files"
  | "tasks"
  | "sheets"
  | "ide"
  | "notes"
  | "mail"
  | "portfolio"
  | "quant"
  | "bank"
  | "settings";

// Constants
const PAGE_TITLES: Record<AppPage, string> = {
  agent: "Agent Inbox",
  editor: "Editor",
  calendar: "Calendar",
  terminal: "Terminal",
  connections: "Connections",
  files: "Files",
  tasks: "Tasks",
  sheets: "Sheets",
  ide: "IDE",
  notes: "Notes",
  mail: "Mail",
  portfolio: "Portfolio",
  quant: "Quant",
  bank: "Bank",
  settings: "Settings",
  home: "Home",
};

const SEARCHABLE_APPS: AppItem[] = [
  { name: "Home", path: "/", icon: Home, type: "app" },
  { name: "Agent Inbox", path: "/agent", icon: Bot, type: "app" },
  { name: "Editor", path: "/editor", icon: FileText, type: "app" },
  { name: "Calendar", path: "/calendar", icon: Calendar, type: "app" },
  { name: "Terminal", path: "/terminal", icon: Terminal, type: "app" },
  { name: "Connections", path: "/connections", icon: Link2, type: "app" },
  { name: "Files", path: "/files", icon: FileText, type: "app" },
  { name: "Tasks", path: "/tasks", icon: CheckSquare, type: "app" },
  { name: "Sheets", path: "/sheets", icon: Table, type: "app" },
  { name: "IDE", path: "/ide", icon: Code, type: "app" },
  { name: "Notes", path: "/notes", icon: BookOpen, type: "app" },
  { name: "Mail", path: "/mail", icon: Mail, type: "app" },
  { name: "Portfolio", path: "/portfolio", icon: TrendingUp, type: "app" },
  { name: "Quant", path: "/quant", icon: Activity, type: "app" },
  { name: "Bank", path: "/bank", icon: CreditCard, type: "app" },
  { name: "Settings", path: "/settings", icon: Settings, type: "app" },
];

const COMMAND_SEARCH_DELAY = 100; // Wait 100ms before showing results for cmd+k
const SLASH_SEARCH_DELAY = 1000; // Wait 1000ms before showing results for slash commands
const SLASH_COMMAND_PREFIX = "/";
const BACKSLASH_COMMAND_PREFIX = "\\";

// System settings will be created in the component with access to setTheme
const createSystemSettings = (
  setTheme: (theme: string) => void,
  currentTheme: string | undefined,
  onToggleFocusMode?: () => void,
): SettingsItem[] => [
  {
    name: "Toggle Focus Mode",
    icon: Menu,
    type: "settings",
    actionType: "immediate",
    action: onToggleFocusMode || (() => console.log("Toggle Focus Mode")),
  },
  {
    name: "Toggle System Appearance",
    icon: currentTheme === "dark" ? Sun : Moon,
    type: "settings",
    actionType: "immediate",
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
const getGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Good morning, Matthew";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon, Matthew";
  } else if (hour >= 17 && hour < 21) {
    return "Good evening, Matthew";
  } else {
    return "Good night, Matthew";
  }
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

const getAppCommands = (
  pathname: string,
  onToggleFocusMode?: () => void,
): CommandItem[] => {
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
    portfolio: [
      {
        name: "View Holdings",
        icon: TrendingUp,
        action: () => console.log("View Holdings"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Add Investment",
        icon: Plus,
        action: () => console.log("Add Investment"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Portfolio",
        icon: Download,
        action: () => console.log("Export Portfolio"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Portfolio Analytics",
        icon: TrendingUp,
        action: () => console.log("Portfolio Analytics"),
        type: "command",
        actionType: "immediate",
      },
    ],
    quant: [
      {
        name: "New Algorithm",
        icon: Plus,
        action: () => console.log("New Algorithm"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Backtest Strategy",
        icon: Activity,
        action: () => console.log("Backtest Strategy"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Live Trading",
        icon: TrendingUp,
        action: () => console.log("Live Trading"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Risk Analysis",
        icon: Activity,
        action: () => console.log("Risk Analysis"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Performance Metrics",
        icon: TrendingUp,
        action: () => console.log("Performance Metrics"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Market Data",
        icon: Activity,
        action: () => console.log("Market Data"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Model",
        icon: Download,
        action: () => console.log("Export Model"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Import Dataset",
        icon: Upload,
        action: () => console.log("Import Dataset"),
        type: "command",
        actionType: "immediate",
      },
    ],
    bank: [
      {
        name: "Transfer Money",
        icon: CreditCard,
        action: () => console.log("Transfer Money"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Pay Bills",
        icon: CreditCard,
        action: () => console.log("Pay Bills"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "View Statements",
        icon: FileText,
        action: () => console.log("View Statements"),
        type: "command",
        actionType: "immediate",
      },
      {
        name: "Export Transactions",
        icon: Download,
        action: () => console.log("Export Transactions"),
        type: "command",
        actionType: "immediate",
      },
    ],
    settings: [
      {
        name: "Toggle Focus Mode",
        icon: Menu,
        action: onToggleFocusMode || (() => console.log("Toggle Focus Mode")),
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

// Get app sections (previously sidebar items)
const getAppSections = (pathname: string): CommandItem[] => {
  const page = getAppPage(pathname);
  
  const sections: Record<AppPage, CommandItem[]> = {
    mail: [
      {
        name: "Inbox",
        icon: Inbox,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Inbox"),
      },
      {
        name: "Starred",
        icon: Star,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Starred"),
      },
      {
        name: "Sent",
        icon: Send,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Sent"),
      },
      {
        name: "Archive",
        icon: Archive,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Archive"),
      },
      {
        name: "Trash",
        icon: Trash2,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Trash"),
      },
    ],
    tasks: [
      {
        name: "All Tasks",
        icon: BarChart3,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to All Tasks"),
      },
      {
        name: "My Tasks",
        icon: Users,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to My Tasks"),
      },
      {
        name: "Recent",
        icon: Calendar,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Recent"),
      },
      {
        name: "Search Tasks",
        icon: Search,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Search Tasks"),
      },
    ],
    notes: [
      {
        name: "All Notes",
        icon: FileText,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to All Notes"),
      },
      {
        name: "Starred Notes",
        icon: Star,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Starred"),
      },
      {
        name: "Recent Notes",
        icon: Clock,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Recent"),
      },
      {
        name: "Archive",
        icon: Archive,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Archive"),
      },
    ],
    agent: [
      {
        name: "All Messages",
        icon: Bell,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to All Messages"),
      },
      {
        name: "Alerts",
        icon: AlertCircle,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Alerts"),
      },
      {
        name: "Agent Tasks",
        icon: MessageSquare,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Agent Tasks"),
      },
      {
        name: "Starred Messages",
        icon: Star,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Starred"),
      },
      {
        name: "Switch to Grid View",
        icon: Grid3X3,
        type: "command",
        actionType: "immediate",
        action: () => {
          console.log("Switch to Grid View")
        },
      },
      {
        name: "Switch to List View",
        icon: List,
        type: "command",
        actionType: "immediate",
        action: () => {
          console.log("Switch to List View")
        },
      },
    ],
    calendar: [
      {
        name: "Year View",
        icon: Calendar,
        type: "command",
        actionType: "immediate",
        action: () => window.location.href = "/calendar/year",
      },
      {
        name: "Month View",
        icon: Calendar,
        type: "command",
        actionType: "immediate",
        action: () => window.location.href = "/calendar/month",
      },
      {
        name: "Week View",
        icon: Calendar,
        type: "command",
        actionType: "immediate",
        action: () => window.location.href = "/calendar/week",
      },
      {
        name: "Day View",
        icon: Calendar,
        type: "command",
        actionType: "immediate",
        action: () => window.location.href = "/calendar/day",
      },
      {
        name: "Meetings",
        icon: Video,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Meetings"),
      },
      {
        name: "Calendar Tasks",
        icon: Clock,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Tasks"),
      },
      {
        name: "Reminders",
        icon: Bell,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Reminders"),
      },
    ],
    store: [
      {
        name: "All Servers",
        icon: Package,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to All Servers"),
      },
      {
        name: "Core Servers",
        icon: Activity,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Core"),
      },
      {
        name: "Development",
        icon: Code,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Development"),
      },
      {
        name: "Database",
        icon: Database,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Database"),
      },
      {
        name: "Productivity",
        icon: Zap,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Productivity"),
      },
      {
        name: "Cloud Services",
        icon: Shield,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Cloud"),
      },
    ],
    quant: [
      {
        name: "Dashboard",
        icon: BarChart3,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Dashboard"),
      },
      {
        name: "Strategies",
        icon: Target,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Strategies"),
      },
      {
        name: "Backtesting",
        icon: LineChart,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Backtesting"),
      },
      {
        name: "Live Trading",
        icon: PlayCircle,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Live Trading"),
      },
      {
        name: "Market Data",
        icon: Database,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Market Data"),
      },
      {
        name: "Risk Analysis",
        icon: AlertCircle,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Risk Analysis"),
      },
    ],
    bank: [
      {
        name: "Accounts",
        icon: Wallet,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Accounts"),
      },
      {
        name: "Cards",
        icon: CreditCard,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Cards"),
      },
      {
        name: "Transfers",
        icon: ArrowUpRight,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Transfers"),
      },
      {
        name: "Savings",
        icon: PiggyBank,
        type: "command",
        actionType: "immediate",
        action: () => console.log("Navigate to Savings"),
      },
    ],
    home: [],
    editor: [],
    terminal: [],
    files: [],
    sheets: [],
    ide: [],
    portfolio: [],
    settings: [],
  };
  
  return (sections[page] || []).map((section) => ({
    ...section,
    sourceApp: page,
  }));
};

// Custom hooks
const useCommandDialog = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [forceShowGreetingList, setForceShowGreetingList] = useState(false);

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
      }
    }
  };

  const closeDialog = () => {
    setOpen(false);
    setSearch("");
    setShowResults(false);
    setForceShowGreetingList(false);
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
    viewMode,
    setViewMode,
    isSlashCommand,
    isBackslashCommand,
    isJustSlash,
    isJustBackslash,
    forceShowGreetingList,
    setForceShowGreetingList,
    dialogLevel,
    dialogHistory,
    currentDialogData,
    navigateToDialog,
    navigateBack,
    closeDialog,
  };
};

interface CommandDialogWrapperProps {
  onToggleFocusMode?: () => void;
}

export function CommandDialogWrapper({ onToggleFocusMode }: CommandDialogWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { getAllSections, getAllViewModes, getAllCommands } = useCommandRegistry();

  const {
    open,
    setOpen,
    search,
    setSearch,
    showResults,
    setShowResults,
    viewMode,
    setViewMode,
    isSlashCommand,
    isBackslashCommand,
    isJustSlash,
    isJustBackslash,
    forceShowGreetingList,
    setForceShowGreetingList,
    dialogLevel,
    currentDialogData,
    navigateToDialog,
    navigateBack,
    closeDialog,
  } = useCommandDialog();

  // Computed values
  const getPlaceholder = () => {
    if (isSlashCommand) {
      return getGreeting();
    } else if (isBackslashCommand) {
      return "Search Global Settings...";
    }
    // Regular cmd+k
    const page = getAppPage(pathname);
    const appName = PAGE_TITLES[page] || "App";
    return `Search ${appName} Sections & Actions...`;
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

  const filteredItems = isSlashCommand
    ? SEARCHABLE_APPS.filter((item) => {
        const searchTerm = search.slice(1).toLowerCase(); // Remove the "/" prefix
        return searchTerm === "" || item.name.toLowerCase().includes(searchTerm);
      })
    : [];

  const allAppCommands = useMemo(() => 
    getAppCommands(pathname, onToggleFocusMode),
    [pathname, onToggleFocusMode]
  );
  const appSections = useMemo(() =>
    getAppSections(pathname),
    [pathname]
  );
  
  // Get all sections from all apps for slash command
  const allAppSections = useMemo(() => {
    const allPages: AppPage[] = ['mail', 'tasks', 'notes', 'agent', 'calendar', 'store', 'quant', 'bank'];
    return allPages.flatMap(page => {
      const sections = getAppSections(`/${page}`);
      return sections.map(section => ({
        ...section,
        name: `${section.name} (${PAGE_TITLES[page]})`,
        sourceApp: page,
      }));
    });
  }, []);
  
  const filteredSections = isSlashCommand
    ? allAppSections.filter((section) => {
        const searchTerm = search.slice(1).toLowerCase(); // Remove the "/" prefix
        return searchTerm === "" || section.name.toLowerCase().includes(searchTerm);
      })
    : appSections.filter((section) => {
        const searchTerm = search.toLowerCase();
        return searchTerm === "" || section.name.toLowerCase().includes(searchTerm);
      });

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
          command.sourceApp === getAppPage(pathname) &&
          (search === "" ||
            command.name.toLowerCase().includes(search.toLowerCase())),
      );

  const systemSettings = createSystemSettings(setTheme, theme, onToggleFocusMode);

  const filteredSettings = isBackslashCommand
    ? systemSettings.filter((setting) => {
        const searchTerm = search.slice(1).toLowerCase(); // Remove the "\" prefix
        return (
          setting.type === "settings" &&
          (searchTerm === "" || setting.name.toLowerCase().includes(searchTerm))
        );
      })
    : isSlashCommand
    ? systemSettings.filter((setting) => {
        const searchTerm = search.slice(1).toLowerCase(); // Remove the "/" prefix
        return (
          setting.type === "settings" &&
          (searchTerm === "" || setting.name.toLowerCase().includes(searchTerm))
        );
      })
    : []; // Settings only shown with / or \ commands

  // Get dynamic registrations - must be at top level for hooks consistency
  const currentApp = getAppPage(pathname);
  const dynamicSections = useMemo(() => getAllSections(), [getAllSections]);
  const dynamicViewModes = useMemo(() => getAllViewModes(), [getAllViewModes]);
  const dynamicCommands = useMemo(() => getAllCommands(), [getAllCommands]);
  
  // Filter dynamic content based on current app
  const appDynamicSections = useMemo(() => 
    dynamicSections.filter(s => s.appId === currentApp),
    [dynamicSections, currentApp]
  );
  const appDynamicViewModes = useMemo(() =>
    dynamicViewModes.filter(v => v.appId === currentApp),
    [dynamicViewModes, currentApp]
  );
  const appDynamicCommands = useMemo(() =>
    dynamicCommands.filter(c => c.appId === currentApp),
    [dynamicCommands, currentApp]
  );

  const shouldShowResults =
    ((isSlashCommand && (search.length > 1 || (isJustSlash && forceShowGreetingList)) && (filteredItems.length > 0 || filteredSections.length > 0 || filteredCommands.length > 0 || filteredSettings.length > 0)) ||
     (isBackslashCommand && filteredSettings.length > 0) ||
     (!isSlashCommand && !isBackslashCommand && (filteredSections.length > 0 || filteredCommands.length > 0))) &&
    (showResults || (!isSlashCommand && !isBackslashCommand));

  // Smooth spring animation for corner radius (SwiftUI-style)
  const [cornerRadius, setCornerRadius] = useState(10);

  // Animated width for smooth Superellipse transitions
  const animatedWidth = useMotionValue(512);
  
  const animatedWidthSpring = useSpring(animatedWidth, {
    stiffness: 700,
    damping: 35,
    mass: 0.2,
  });

  // Set initial dimensions when dialog opens
  useEffect(() => {
    if (open) {
      if (isSlashCommand) {
        // Slash command starts as compact pill
        setCornerRadius(100);
        animatedWidth.set(320);
      } else if (isBackslashCommand) {
        // Backslash starts with square corners
        setCornerRadius(10);
        animatedWidth.set(400);
      } else {
        // Regular cmd+k starts full size
        setCornerRadius(10);
        animatedWidth.set(512);
      }
    }
  }, [open]); // Only run when dialog opens/closes

  // Update corner radius and width when state changes
  useEffect(() => {
    if (!open) return; // Don't update if dialog is closed
    
    let targetCornerRadius = 10;
    let targetWidth = 512;

    if (isSlashCommand) {
      // Slash command mode - compact pill when just slash, expand for results
      if (isJustSlash && !forceShowGreetingList && (!shouldShowResults && search.length <= 1)) {
        targetWidth = 320;
        targetCornerRadius = 100; // Full rounded for pill shape
      } else if (shouldShowResults) {
        targetWidth = 512;
        targetCornerRadius = 10;
      } else if (!isJustSlash && !shouldShowResults) {
        // Typing but no results yet - stay compact
        targetWidth = 380;
        targetCornerRadius = 50;
      } else {
        // Default to normal when forced showing
        targetWidth = 512;
        targetCornerRadius = 10;
      }
    } else if (isBackslashCommand) {
      // Backslash command mode - always square corners
      targetWidth = 400;
      targetCornerRadius = 10;
    } else {
      // Regular cmd+k mode - always full size
      targetWidth = 512;
      targetCornerRadius = 10;
    }

    // Override for dialog levels
    if (dialogLevel > 0) {
      targetCornerRadius = 10;
      targetWidth = 512;
    }

    setCornerRadius(targetCornerRadius);
    animatedWidth.set(targetWidth);
  }, [search, shouldShowResults, dialogLevel, isSlashCommand, isBackslashCommand, isJustSlash, isJustBackslash, open, forceShowGreetingList]);

  const topHit = isSlashCommand
    ? filteredItems.length > 0
      ? filteredItems[0]
      : filteredSections.length > 0
      ? filteredSections[0]
      : filteredCommands.length > 0
      ? filteredCommands[0]
      : filteredSettings.length > 0
      ? filteredSettings[0]
      : null
    : isBackslashCommand
      ? filteredSettings.length > 0
        ? filteredSettings[0]
        : null
      : filteredSections.length > 0
        ? filteredSections[0]
        : filteredCommands.length > 0
        ? filteredCommands[0]
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
        // Always close immediately when clicking outside
        closeDialog();
      } else {
        setOpen(true);
      }
    },
    [
      closeDialog,
      setOpen,
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
      } else if (
        topHit.name.toLowerCase().startsWith(getDisplayValue().toLowerCase())
      ) {
        setSearch(topHit.name);
      }
    }
  }, [topHit, getDisplayValue, setSearch, isSlashCommand, isBackslashCommand]);

  // Effects
  useEffect(() => {
    if (search.length > 0) {
      // For slash and backslash commands, handle delay
      if (isSlashCommand || isBackslashCommand) {
        setShowResults(false);
        const delay = search.length === 1 ? 0 : SLASH_SEARCH_DELAY;
        const timer = setTimeout(() => setShowResults(true), delay);
        return () => clearTimeout(timer);
      }
      // For regular cmd+k, don't apply delay when there's search text
    } else if (!open) {
      // Only hide results when dialog is closed
      setShowResults(false);
    }
    // When search is empty but dialog is open (cmd+k case), keep showResults as is
  }, [search, isSlashCommand, isBackslashCommand, setShowResults, open]);

  // Ensure command input always maintains focus when dialog is open
  useEffect(() => {
    if (open) {
      // Immediately blur any active element to prevent it from stealing events
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }

      // Force focus to command input immediately
      setTimeout(() => {
        const input = document.querySelector('[data-slot="command-input"]') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 0);

      const focusInterval = setInterval(() => {
        const input = document.querySelector('[data-slot="command-input"]') as HTMLInputElement;
        if (input && document.activeElement !== input) {
          // Only focus if not already focused on dialog elements
          const dialog = document.querySelector('[role="dialog"]');
          if (!dialog?.contains(document.activeElement)) {
            input.focus();
          }
        }
      }, 100);

      // Prevent focus from being stolen by external elements
      const preventFocusSteal = (e: FocusEvent) => {
        const input = document.querySelector('[data-slot="command-input"]');
        const dialog = document.querySelector('[role="dialog"]');
        
        // If focus is going outside the dialog, prevent it
        if (input && dialog && e.target && !dialog.contains(e.target as Node)) {
          e.preventDefault();
          e.stopPropagation();
          (input as HTMLInputElement).focus();
        }
      };

      // Add focus listeners
      document.addEventListener('focus', preventFocusSteal, true);
      document.addEventListener('focusin', preventFocusSteal, true);

      return () => {
        clearInterval(focusInterval);
        document.removeEventListener('focus', preventFocusSteal, true);
        document.removeEventListener('focusin', preventFocusSteal, true);
      };
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if dialog is already open
      if (open) return;
      
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearch("");  // Clear search for regular cmd+k
        setShowResults(true);  // Show results immediately for cmd+k
        setOpen(true);
      } else if (
        e.key === "/" && (e.metaKey || e.ctrlKey)
      ) {
        // Handle cmd+/ or ctrl+/
        e.preventDefault();
        setSearch("/");  // Set search directly
        setShowResults(true);
        setOpen(true);
      } else if (
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        !isValidInputTarget(document.activeElement)
      ) {
        // Handle just / (when not in input)
        e.preventDefault();
        setSearch("/");  // Set search directly
        setShowResults(true);
        setOpen(true);
      } else if (
        e.key === "\\" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        !isValidInputTarget(document.activeElement)
      ) {
        e.preventDefault();
        setSearch("\\");  // Set search directly
        setShowResults(true);
        setOpen(true);
      }
    };

    // Capture phase to intercept events before other handlers
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [setOpen, setSearch, setShowResults, open]);

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
        <>
          {filteredItems.length > 0 && (
            <CommandGroup heading="Apps">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.path}
                    value={`/${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    onSelect={() => handleSelect(item.path)}
                    className="cursor-pointer flex items-center justify-between"
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

          {filteredSections.length > 0 && (
            <CommandGroup heading="Sections">
              {filteredSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <CommandItem
                    key={`section-${section.sourceApp}-${section.name.toLowerCase().replace(/\s+/g, "-")}-${index}`}
                    value={`/${section.name.toLowerCase().replace(/\s+/g, "-")}`}
                    onSelect={() => {
                      section.action?.();
                      closeDialog();
                    }}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{section.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Section</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {filteredCommands.length > 0 && (
            <CommandGroup heading="Actions">
              {filteredCommands.map((action) => {
                const Icon = action.icon;
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
                    className="cursor-pointer flex items-center justify-between"
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
                    value={`/${setting.name.toLowerCase().replace(/\s+/g, "-")}`}
                    onSelect={() => {
                      if (setting.actionType === "dialog") {
                        navigateToDialog(setting);
                      } else {
                        setting.action?.();
                        closeDialog();
                      }
                    }}
                    className="cursor-pointer flex items-center justify-between"
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
                    closeDialog();
                  }
                }}
                className="cursor-pointer flex items-center justify-between"
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

    // Regular cmd+k search - show current app's sections and actions
    return (
      <>
        {/* Dynamic View Modes */}
        {appDynamicViewModes.length > 0 && (
          <CommandGroup heading="View Modes">
            {appDynamicViewModes.map((viewMode) => {
              const Icon = viewMode.icon;
              return (
                <CommandItem
                  key={viewMode.id}
                  value={viewMode.name}
                  onSelect={() => {
                    viewMode.action();
                    closeDialog();
                  }}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{viewMode.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">View</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        
        {/* Dynamic Sections */}
        {appDynamicSections.length > 0 && (
          <CommandGroup heading="Sections">
            {appDynamicSections.map((section) => {
              const Icon = section.icon;
              return (
                <CommandItem
                  key={section.id}
                  value={section.name}
                  onSelect={() => {
                    section.action?.();
                    closeDialog();
                  }}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{section.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Section</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        
        
        {/* Dynamic Commands */}
        {appDynamicCommands.length > 0 && (
          <CommandGroup heading="Commands">
            {appDynamicCommands.map((command) => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={command.id}
                  value={command.name}
                  onSelect={() => {
                    command.action();
                    closeDialog();
                  }}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{command.name}</span>
                    {command.shortcut && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {command.shortcut}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Command</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        
        {/* Static Commands (legacy) */}
        {filteredCommands.length > 0 && (
          <CommandGroup heading="Actions">
            {filteredCommands.map((action) => {
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
                  className="cursor-pointer flex items-center justify-between"
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
      </>
    );
  };

  if (!open) return null;

  return (
    <CommandDialog
      open={true}
      onOpenChange={handleOpenChange}
      className="overflow-hidden p-0 [&_[data-slot=command-input-wrapper]]:border-b-0"
      cornerRadius={cornerRadius}
      animatedWidth={animatedWidthSpring}
      isCompact={
        isSlashCommand && (isJustSlash || (!shouldShowResults && search.length <= 1))
      }
      dialogWidth={
        dialogLevel > 0 && currentDialogData?.dialogConfig?.width
          ? currentDialogData.dialogConfig.width
          : "normal"
      }
      style={{ zIndex: 9999 }}
    >
      <div
        className="relative [&_*]:!outline-none [&_*]:focus:!outline-none [&_*]:focus-visible:!outline-none [&_*]:!ring-0 [&_*]:!shadow-none [&_*]:!box-shadow-none [&_*]:focus:!ring-0 [&_*]:focus-visible:!ring-0 [&_*]:focus:!shadow-none [&_*]:focus-visible:!shadow-none [&_*]:focus:!border-transparent [&_*]:focus-visible:!border-transparent [&_*]:focus:!animate-none [&_*]:focus-visible:!animate-none"
        tabIndex={-1}
        style={{ outline: "none !important" }}
      >
        <motion.div
          key={dialogLevel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
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
                // Reset force show flag when typing
                if (forceShowGreetingList && value !== "") {
                  setForceShowGreetingList(false);
                }
              }}
              className="[&>div]:border-b-0 [&>div]:bg-transparent p-2 text-lg relative z-10 bg-transparent"
              autoFocus
              onFocus={(e) => {
                // Prevent focus from being stolen
                e.stopPropagation();
              }}
              onBlur={(e) => {
                // Keep focus on the input unless dialog is closing
                if (open && !e.relatedTarget?.closest('[role="dialog"]')) {
                  setTimeout(() => {
                    (e.target as HTMLInputElement).focus();
                  }, 0);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  // If greeting list is forced shown, hide it first
                  if (isJustSlash && forceShowGreetingList) {
                    setForceShowGreetingList(false);
                    setShowResults(false);
                  } else if (search === "" || search.length === 0 || search === "/") {
                    // If search is empty or just a slash (greeting mode), close immediately
                    closeDialog();
                  } else if (showResults || isSlashCommand || isBackslashCommand) {
                    // Go directly to regular state - hide results and clear any command modes
                    setShowResults(false);
                    setSearch("");
                  } else {
                    // Close the dialog completely if already in regular state
                    closeDialog();
                  }
                } else if (
                  e.key === "/" &&
                  !isSlashCommand
                ) {
                  // Switch to slash command mode
                  e.preventDefault();
                  setSearch("/");
                  setShowResults(true);
                } else if (
                  e.key === "\\" &&
                  (isSlashCommand ||
                    (!isSlashCommand && !isBackslashCommand))
                ) {
                  // Switch to backslash command mode or enter it
                  e.preventDefault();
                  setSearch("\\");
                  setShowResults(true);
                } else if (
                  e.key === "Tab" &&
                  e.shiftKey
                ) {
                  // Shift+Tab cycles through modes
                  e.preventDefault();
                  if (!isSlashCommand && !isBackslashCommand) {
                    // From regular mode to slash command
                    setSearch("/");
                    setShowResults(false);
                  } else if (isSlashCommand) {
                    // From slash command to backslash command
                    setSearch("\\");
                    setShowResults(false);
                  } else if (isBackslashCommand) {
                    // From backslash command to regular mode
                    setSearch("");
                    setShowResults(true);
                  }
                } else if (
                  e.key === "Tab" &&
                  !e.shiftKey &&
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
                  isJustSlash &&
                  !forceShowGreetingList
                ) {
                  // Show results when arrow keys are pressed in greeting mode
                  e.preventDefault();
                  setForceShowGreetingList(true);
                  setShowResults(true);
                } else if (
                  (e.key === "ArrowDown" || e.key === "ArrowUp") &&
                  !showResults &&
                  !isJustSlash
                ) {
                  // Show results when arrow keys are pressed and results are hidden
                  e.preventDefault();
                  setShowResults(true);
                }
              }}
            />
            {/* Autocomplete preview */}
            {topHit &&
              getDisplayValue().length > 0 &&
              !shouldShowResults &&
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
                          className="h-4 w-4 text-muted-foreground"
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
  );
}