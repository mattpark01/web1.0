"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  UserCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

// Types
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
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const title = getPageTitle(pathname);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/signin");
    } catch (error) {
      toast.error("Failed to logout. Please try again.");
    }
  };

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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name || user.firstName || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem 
              onClick={() => router.push("/settings")}
              className="cursor-pointer"
            >
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push("/settings")}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer text-red-600 dark:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}