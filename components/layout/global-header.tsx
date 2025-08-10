"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Search,
  MoreHorizontal,
  User,
  Sun,
  Moon,
  Settings,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Types
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
  store: "Store",
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

// Helper functions
const getPageTitle = (pathname: string): string => {
  const segments = pathname.split("/").filter(Boolean);
  const page = (segments[0] || "home") as AppPage;
  return PAGE_TITLES[page] || PAGE_TITLES.home;
};

interface GlobalHeaderProps {
  onToggleFocusMode?: () => void;
}

export function GlobalHeader({ onToggleFocusMode }: GlobalHeaderProps = {}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-12 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-medium">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              App Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" onClick={onToggleFocusMode}>
          <Menu className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
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