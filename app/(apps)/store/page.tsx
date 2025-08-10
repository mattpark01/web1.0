"use client";

import { useState } from "react";
import {
  Store,
  ShoppingCart,
  Search,
  Filter,
  Star,
  TrendingUp,
  Package,
  Zap,
  Shield,
  Code,
  Palette,
  Heart,
  Download,
  Check,
  X,
  ChevronRight,
  Grid,
  List,
  SortAsc,
  Bot,
  Server,
  Database,
  FileCode,
  Globe,
  Terminal,
  Brain,
  Sparkles,
  GitBranch,
  Cloud,
  Lock,
  Cpu,
  Network,
  Layers,
  Activity,
  Play,
  Settings,
  Trash2,
} from "lucide-react";
import { AppSidebar, type AppSidebarItem } from "@/components/layout/app-sidebar";
import { Superellipse } from "@/components/ui/superellipse/superellipse";
import { cn } from "@/lib/utils";

interface MCPServer {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  rating: number;
  reviews: number;
  icon: string;
  installs: number;
  badge?: string;
  installed?: boolean;
  version: string;
  capabilities: string[];
  compatibility: string[];
  lastUpdated: string;
  size: string;
}

const mcpServers: MCPServer[] = [
  {
    id: "1",
    name: "GitHub MCP Server",
    description: "Complete GitHub integration with repository management, issues, PRs, and Actions",
    author: "Anthropic",
    category: "development",
    rating: 4.9,
    reviews: 1324,
    icon: "🐙",
    installs: 45200,
    badge: "Official",
    version: "2.1.0",
    capabilities: ["Repository Management", "Pull Requests", "Issues", "Actions", "Webhooks"],
    compatibility: ["Claude", "GPT-4", "Gemini"],
    lastUpdated: "2 days ago",
    size: "12.4 MB",
  },
  {
    id: "2",
    name: "Filesystem Server",
    description: "Advanced file system operations with secure sandboxing and permissions",
    author: "Anthropic",
    category: "core",
    rating: 4.8,
    reviews: 892,
    icon: "📁",
    installs: 38900,
    badge: "Essential",
    installed: true,
    version: "1.5.3",
    capabilities: ["Read/Write Files", "Directory Management", "File Search", "Permissions"],
    compatibility: ["Claude", "GPT-4", "Gemini", "Llama"],
    lastUpdated: "1 week ago",
    size: "8.2 MB",
  },
  {
    id: "3",
    name: "PostgreSQL Server",
    description: "Full PostgreSQL database access with query builder and schema management",
    author: "Community",
    category: "database",
    rating: 4.7,
    reviews: 456,
    icon: "🐘",
    installs: 23400,
    version: "3.0.1",
    capabilities: ["Query Execution", "Schema Management", "Migrations", "Backups"],
    compatibility: ["Claude", "GPT-4"],
    lastUpdated: "3 days ago",
    size: "15.8 MB",
  },
  {
    id: "4",
    name: "Slack Integration",
    description: "Send messages, manage channels, and interact with Slack workspaces",
    author: "SlackHQ",
    category: "communication",
    rating: 4.6,
    reviews: 203,
    icon: "💬",
    installs: 18700,
    badge: "Verified",
    version: "2.2.0",
    capabilities: ["Send Messages", "Channel Management", "User Lookup", "File Sharing"],
    compatibility: ["Claude", "GPT-4", "Gemini"],
    lastUpdated: "5 days ago",
    size: "9.6 MB",
  },
  {
    id: "5",
    name: "AWS Services",
    description: "Comprehensive AWS integration with S3, Lambda, EC2, and more",
    author: "AWS Team",
    category: "cloud",
    rating: 4.9,
    reviews: 567,
    icon: "☁️",
    installs: 31200,
    badge: "Premium",
    version: "4.1.2",
    capabilities: ["S3 Operations", "Lambda Functions", "EC2 Management", "CloudWatch"],
    compatibility: ["Claude", "GPT-4"],
    lastUpdated: "1 day ago",
    size: "24.3 MB",
  },
  {
    id: "6",
    name: "Linear API",
    description: "Create and manage Linear issues, projects, and workflows",
    author: "Linear",
    category: "productivity",
    rating: 4.8,
    reviews: 89,
    icon: "📋",
    installs: 12400,
    badge: "New",
    version: "1.0.0",
    capabilities: ["Issue Creation", "Project Management", "Workflow Automation"],
    compatibility: ["Claude"],
    lastUpdated: "1 week ago",
    size: "6.8 MB",
  },
  {
    id: "7",
    name: "Memory Server",
    description: "Persistent memory and context management across conversations",
    author: "Anthropic",
    category: "core",
    rating: 4.7,
    reviews: 412,
    icon: "🧠",
    installs: 28300,
    badge: "Essential",
    version: "1.8.0",
    capabilities: ["Context Storage", "Memory Retrieval", "Session Management"],
    compatibility: ["Claude"],
    lastUpdated: "4 days ago",
    size: "5.2 MB",
  },
  {
    id: "8",
    name: "Code Interpreter",
    description: "Execute Python, JavaScript, and other languages in sandboxed environments",
    author: "Community",
    category: "development",
    rating: 4.8,
    reviews: 734,
    icon: "⚡",
    installs: 35600,
    badge: "Popular",
    version: "2.5.1",
    capabilities: ["Code Execution", "Package Management", "Output Streaming", "Debugging"],
    compatibility: ["Claude", "GPT-4", "Gemini"],
    lastUpdated: "6 days ago",
    size: "18.9 MB",
  },
  {
    id: "9",
    name: "Brave Search",
    description: "Web search integration with Brave's privacy-focused search engine",
    author: "Brave",
    category: "web",
    rating: 4.5,
    reviews: 234,
    icon: "🔍",
    installs: 14200,
    version: "1.2.0",
    capabilities: ["Web Search", "Image Search", "News", "Privacy Protection"],
    compatibility: ["Claude", "GPT-4"],
    lastUpdated: "2 weeks ago",
    size: "4.6 MB",
  },
  {
    id: "10",
    name: "Docker Manager",
    description: "Manage Docker containers, images, and compose configurations",
    author: "Docker Inc",
    category: "infrastructure",
    rating: 4.6,
    reviews: 156,
    icon: "🐳",
    installs: 19800,
    badge: "Verified",
    version: "3.1.0",
    capabilities: ["Container Management", "Image Building", "Compose", "Registry Access"],
    compatibility: ["Claude", "GPT-4"],
    lastUpdated: "1 week ago",
    size: "11.2 MB",
  },
  {
    id: "11",
    name: "Jira Integration",
    description: "Complete Jira integration for issue tracking and project management",
    author: "Atlassian",
    category: "productivity",
    rating: 4.4,
    reviews: 432,
    icon: "🎯",
    installs: 21300,
    badge: "Enterprise",
    version: "2.8.3",
    capabilities: ["Issue Management", "Sprint Planning", "Reports", "Automation"],
    compatibility: ["Claude", "GPT-4"],
    lastUpdated: "3 days ago",
    size: "13.7 MB",
  },
  {
    id: "12",
    name: "Notion API",
    description: "Read and write to Notion databases, pages, and workspaces",
    author: "Notion",
    category: "productivity",
    rating: 4.7,
    reviews: 278,
    icon: "📝",
    installs: 16900,
    version: "2.0.1",
    capabilities: ["Database Operations", "Page Creation", "Block Management", "Search"],
    compatibility: ["Claude", "GPT-4", "Gemini"],
    lastUpdated: "5 days ago",
    size: "7.4 MB",
  },
];

export default function StorePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);

  const categories: AppSidebarItem[] = [
    {
      id: "all",
      label: "All Servers",
      icon: Server,
      count: mcpServers.length,
      isActive: selectedCategory === "all",
      onClick: () => setSelectedCategory("all"),
    },
    {
      id: "core",
      label: "Core",
      icon: Cpu,
      count: mcpServers.filter((s) => s.category === "core").length,
      isActive: selectedCategory === "core",
      onClick: () => setSelectedCategory("core"),
    },
    {
      id: "development",
      label: "Development",
      icon: Code,
      count: mcpServers.filter((s) => s.category === "development").length,
      isActive: selectedCategory === "development",
      onClick: () => setSelectedCategory("development"),
    },
    {
      id: "database",
      label: "Database",
      icon: Database,
      count: mcpServers.filter((s) => s.category === "database").length,
      isActive: selectedCategory === "database",
      onClick: () => setSelectedCategory("database"),
    },
    {
      id: "productivity",
      label: "Productivity",
      icon: Zap,
      count: mcpServers.filter((s) => s.category === "productivity").length,
      isActive: selectedCategory === "productivity",
      onClick: () => setSelectedCategory("productivity"),
    },
    {
      id: "cloud",
      label: "Cloud",
      icon: Cloud,
      count: mcpServers.filter((s) => s.category === "cloud").length,
      isActive: selectedCategory === "cloud",
      onClick: () => setSelectedCategory("cloud"),
    },
    {
      id: "communication",
      label: "Communication",
      icon: Network,
      count: mcpServers.filter((s) => s.category === "communication").length,
      isActive: selectedCategory === "communication",
      onClick: () => setSelectedCategory("communication"),
    },
    {
      id: "infrastructure",
      label: "Infrastructure",
      icon: Layers,
      count: mcpServers.filter((s) => s.category === "infrastructure").length,
      isActive: selectedCategory === "infrastructure",
      onClick: () => setSelectedCategory("infrastructure"),
    },
    {
      id: "web",
      label: "Web & Search",
      icon: Globe,
      count: mcpServers.filter((s) => s.category === "web").length,
      isActive: selectedCategory === "web",
      onClick: () => setSelectedCategory("web"),
    },
  ];

  const filteredServers = mcpServers.filter((server) => {
    const matchesCategory =
      selectedCategory === "all" || server.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedServers = [...filteredServers].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return 0;
      case "rating":
        return b.rating - a.rating;
      case "popular":
      default:
        return b.installs - a.installs;
    }
  });

  return (
    <div className="flex h-full">
      {/* <AppSidebar items={categories} /> */}

      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">MCP Server Store</h1>
              <span className="text-sm text-muted-foreground">
                {sortedServers.length} servers available
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg transition-colors flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Configure MCP
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search MCP servers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-muted/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>

            <div className="flex items-center gap-1 bg-muted/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "grid" ? "bg-muted/30" : "hover:bg-muted/20"
                )}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "list" ? "bg-muted/30" : "hover:bg-muted/20"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedServers.map((server) => (
                <Superellipse key={server.id} cornerRadius={12} cornerSmoothing={1}>
                  <div 
                    className="p-4 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer"
                    onClick={() => setSelectedServer(server)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{server.icon}</div>
                      {server.badge && (
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            server.badge === "Official"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : server.badge === "Essential"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : server.badge === "Popular"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : server.badge === "New"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : server.badge === "Premium"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                              : server.badge === "Verified"
                              ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          )}
                        >
                          {server.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-sm mb-1">{server.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">by {server.author}</p>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {server.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-medium">{server.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({server.reviews})
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {server.installs.toLocaleString()} installs
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        v{server.version}
                      </span>
                      {server.installed ? (
                        <button
                          disabled
                          className="px-3 py-1.5 bg-muted/20 text-muted-foreground text-xs rounded-lg flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Installed
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary"
                        >
                          <Download className="h-3 w-3" />
                          Install
                        </button>
                      )}
                    </div>
                  </div>
                </Superellipse>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedServers.map((server) => (
                <Superellipse key={server.id} cornerRadius={12} cornerSmoothing={1}>
                  <div 
                    className="p-4 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer"
                    onClick={() => setSelectedServer(server)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{server.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-sm mb-1">
                              {server.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-1">
                              by {server.author}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {server.description}
                            </p>
                          </div>
                          {server.badge && (
                            <span
                              className={cn(
                                "text-xs px-2 py-1 rounded-full ml-4",
                                server.badge === "Official"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                  : server.badge === "Essential"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : server.badge === "Popular"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : server.badge === "New"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : server.badge === "Premium"
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                  : server.badge === "Verified"
                                  ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              )}
                            >
                              {server.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs font-medium">
                              {server.rating}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({server.reviews})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {server.installs.toLocaleString()} installs
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            v{server.version}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {server.size}
                        </span>
                        {server.installed ? (
                          <button
                            disabled
                            className="px-4 py-2 bg-muted/20 text-muted-foreground text-sm rounded-lg flex items-center gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Installed
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary"
                          >
                            <Download className="h-4 w-4" />
                            Install
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Superellipse>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedServer && (
        <div className="w-96 border-l flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedServer.icon}</span>
                <h2 className="font-semibold">{selectedServer.name}</h2>
              </div>
              <button
                onClick={() => setSelectedServer(null)}
                className="p-1 hover:bg-muted/50 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">by {selectedServer.author}</p>
              <p className="text-sm">{selectedServer.description}</p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium">{selectedServer.rating}</span>
                <span className="text-muted-foreground">({selectedServer.reviews})</span>
              </div>
              <span className="text-muted-foreground">
                {selectedServer.installs.toLocaleString()} installs
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">{selectedServer.version}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Size</span>
                <span className="font-medium">{selectedServer.size}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-medium">{selectedServer.lastUpdated}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Capabilities</h3>
              <div className="flex flex-wrap gap-1">
                {selectedServer.capabilities.map((cap, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-muted/10 rounded-md"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Compatible With</h3>
              <div className="flex flex-wrap gap-1">
                {selectedServer.compatibility.map((compat, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-muted/10 rounded-md"
                  >
                    {compat}
                  </span>
                ))}
              </div>
            </div>

            {selectedServer.badge && (
              <div className="p-3 bg-muted/10 rounded-lg">
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    selectedServer.badge === "Official"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      : selectedServer.badge === "Essential"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : selectedServer.badge === "Popular"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : selectedServer.badge === "New"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : selectedServer.badge === "Premium"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : selectedServer.badge === "Verified"
                      ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  )}
                >
                  {selectedServer.badge}
                </span>
              </div>
            )}
          </div>

          <div className="border-t p-4 space-y-3">
            {selectedServer.installed ? (
              <>
                <button className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Uninstall
                </button>
                <button className="w-full py-2 bg-muted/10 hover:bg-muted/20 text-foreground rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configure
                </button>
              </>
            ) : (
              <>
                <button className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  Install Server
                </button>
                <button className="w-full py-2 bg-muted/10 hover:bg-muted/20 text-foreground rounded-lg transition-colors flex items-center justify-center gap-2">
                  <FileCode className="h-4 w-4" />
                  View Documentation
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}