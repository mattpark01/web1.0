"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
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
} from "lucide-react";

const getPageTitle = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const page = segments[0] || "home";

  const titles: Record<string, string> = {
    agent: "Agent Inbox",
    editor: "Editor",
    calendar: "Calendar",
    terminal: "Terminal",
    store: "Store",
    files: "Files",
    settings: "Settings",
    home: "Dashboard",
  };

  return titles[page] || "Dashboard";
};

const searchableItems = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Agent Inbox", path: "/agent", icon: Bot },
  { name: "Editor", path: "/editor", icon: FileText },
  { name: "Calendar", path: "/calendar", icon: Calendar },
  { name: "Terminal", path: "/terminal", icon: Terminal },
  { name: "Store", path: "/store", icon: Store },
  { name: "Files", path: "/files", icon: FileText },
  { name: "Settings", path: "/settings", icon: Settings },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (search.length > 0) {
      setShowResults(false); // Reset results first
      const timer = setTimeout(() => {
        setShowResults(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [search]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    setSearch("");
    router.push(path);
  };

  const handleTabAccept = () => {
    if (topHit && search.length > 0 && topHit.name.toLowerCase().startsWith(search.toLowerCase())) {
      setSearch(topHit.name);
    }
  };

  const filteredItems = searchableItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const shouldShowResults = filteredItems.length > 0 && showResults;
  const topHit = filteredItems.length > 0 ? filteredItems[0] : null;

  return (
    <header className="flex h-12 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-medium">{title}</h1>
      </div>

      <div className="flex flex-1 items-center justify-center px-8">
        <div className="relative w-full max-w-md">
          {/* <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> */}
          <Input
            placeholder="Search or ask a question..."
            className="h-8 bg-muted/50 border-0 focus-visible:ring-1 cursor-pointer"
            onClick={() => setOpen(true)}
            readOnly
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-[12px] mt-[2px] -mr-[1px]">⌘</span> k
          </kbd>
        </div>
      </div>

      {open && (
        <CommandDialog
          open={true}
          onOpenChange={setOpen}
          className="overflow-hidden p-0 [&_[data-slot=command-input-wrapper]]:border-b-0"
          isRounded={!shouldShowResults}
        >
          {shouldShowResults && (
            <CommandList className="p-1">
              <CommandGroup heading="Apps">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.path}
                      value={item.name}
                      onSelect={() => handleSelect(item.path)}
                      className="cursor-pointer flex items-center justify-between rounded-lg"
                    >
                      <span>{item.name}</span>
                      <Icon className="h-4 w-4 ml-2" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          )}
          <div className="relative">
            <CommandInput
              placeholder="Search or ask a question..."
              value={search}
              onValueChange={setSearch}
              className="[&>div]:border-b-0 [&>div]:bg-transparent p-2 text-lg relative z-10 bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Tab' && topHit && search.length > 0 && topHit.name.toLowerCase().startsWith(search.toLowerCase())) {
                  e.preventDefault();
                  handleTabAccept();
                } else if (e.key === 'Enter' && topHit && search.length > 0 && !showResults) {
                  e.preventDefault();
                  handleSelect(topHit.path);
                } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !showResults) {
                  e.preventDefault();
                  setShowResults(true);
                }
              }}
            />
            {/* Autocomplete preview */}
            {topHit && search.length > 0 && topHit.name.toLowerCase().startsWith(search.toLowerCase()) && (
              <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center pointer-events-none" style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem" }}>
                <div className="flex items-center w-full text-lg py-3">
                  <span className="invisible select-none">
                    {search}
                  </span>
                  <div className="flex items-center w-full" style={{ marginLeft: '0.75rem' }}>
                    <div className="flex items-center rounded pr-2 pl-1 py-0.5" style={{ backgroundColor: 'rgba(128, 128, 128, 0.05)' }}>
                      <span className="select-none" style={{ color: 'rgba(128, 128, 128, 0.9)' }}>
                        {topHit.name.slice(search.length)}
                      </span>
                    </div>
                    <div className="ml-auto pr-2">
                      <topHit.icon className="h-4 w-4" style={{ color: 'rgba(128, 128, 128, 1.0)' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CommandDialog>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
