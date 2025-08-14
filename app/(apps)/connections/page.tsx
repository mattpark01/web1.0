"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Link2,
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
  Loader2,
  AlertCircle,
  ExternalLink,
  Key,
} from "lucide-react";
import { AppSidebar, type AppSidebarItem } from "@/components/layout/app-sidebar";
import { Superellipse } from "@/components/ui/superellipse/superellipse";
import { cn } from "@/lib/utils";
import { useIntegrations } from "@/hooks/use-integrations";
import { Integration, AppPlatform, agentRuntimeAPI } from "@/lib/agent-runtime-api";
import { IntegrationManager } from "@/components/connections/integration-manager";
import { CachedImage } from "@/components/ui/cached-image";
import { PermissionDisplay } from "@/components/connections/permission-display";
import { PermissionConsentModal } from "@/components/connections/permission-consent-modal";


export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "installed">("marketplace");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "newest" | "name">("popular");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [platforms, setPlatforms] = useState<AppPlatform[]>([]);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [apiKeyIntegrationId, setApiKeyIntegrationId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [allIntegrations, setAllIntegrations] = useState<Integration[]>([]);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [pendingInstallation, setPendingInstallation] = useState<Integration | null>(null);

  // Fetch integrations with filters
  const { 
    integrations, 
    loading, 
    error, 
    installIntegration, 
    uninstallIntegration,
    toggleFavorite 
  } = useIntegrations({
    platform: selectedPlatform !== "all" ? selectedPlatform : undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    searchTerm: searchQuery || undefined,
    sortBy: sortBy,
  });

  // Fetch platforms and all integrations for counts on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCounts(true);
        const [platformsData, integrationsData] = await Promise.all([
          agentRuntimeAPI.getPlatforms(),
          agentRuntimeAPI.getIntegrations() // Fetch all integrations for counts
        ]);
        setPlatforms(platformsData);
        setAllIntegrations(integrationsData);
        console.log("Fetched all integrations:", integrationsData.length); // Debug log
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoadingCounts(false);
      }
    };
    fetchData();
  }, []);

  const handleInstall = async (integration: Integration) => {
    // Show permission consent modal first
    setPendingInstallation(integration);
    setPermissionModalOpen(true);
  };

  const handlePermissionConfirm = async () => {
    if (!pendingInstallation) return;
    
    setPermissionModalOpen(false);
    setInstallingId(pendingInstallation.id);
    
    try {
      const response = await installIntegration(pendingInstallation.id);
      
      if (response.requiresApiKey) {
        setApiKeyIntegrationId(pendingInstallation.id);
        setApiKeyModalOpen(true);
      } else if (response.authUrl) {
        // OAuth flow handled in hook
      }
    } catch (err) {
      console.error("Installation failed:", err);
    } finally {
      setInstallingId(null);
      setPendingInstallation(null);
    }
  };

  const handlePermissionCancel = () => {
    setPermissionModalOpen(false);
    setPendingInstallation(null);
  };

  const handleApiKeySubmit = async () => {
    if (!apiKeyIntegrationId || !apiKey) return;
    
    try {
      await agentRuntimeAPI.provideApiKey(apiKeyIntegrationId, apiKey);
      setApiKeyModalOpen(false);
      setApiKey("");
      setApiKeyIntegrationId(null);
    } catch (err) {
      console.error("Failed to configure API key:", err);
    }
  };

  // Get unique categories from integrations
  const categories = Array.from(new Set(integrations.map(i => i.category)));
  
  const sidebarItems: AppSidebarItem[] = [
    {
      id: "all",
      label: "All Integrations",
      icon: Server,
      count: loadingCounts ? undefined : allIntegrations.length,
      isActive: selectedPlatform === "all",
      onClick: () => setSelectedPlatform("all"),
    },
    ...platforms.map(platform => ({
      id: platform.id,
      label: platform.name,
      icon: getPlatformIcon(platform.id),
      count: loadingCounts ? undefined : allIntegrations.filter(i => i.platformId === platform.id).length,
      isActive: selectedPlatform === platform.id,
      onClick: () => setSelectedPlatform(platform.id),
    })),
  ];

  // Helper function to get platform icon
  function getPlatformIcon(platformId: string) {
    const iconMap: Record<string, any> = {
      bank: Zap,
      tasks: Package,
      calendar: Activity,
      messages: Network,
      portfolio: TrendingUp,
      docs: FileCode,
      code: Code,
      quant: Brain,
      sheets: Database,
    };
    return iconMap[platformId] || Server;
  }

  // Helper function to get badge color
  function getBadgeColor(status: string) {
    switch (status) {
      case "beta":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "deprecated":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
  }

  return (
    <div className="flex h-full">
      {activeTab === "marketplace" && (
        <AppSidebar items={sidebarItems} />
      )}

      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">
                {activeTab === "marketplace" ? "Integration Marketplace" : "Your Connections"}
              </h1>
              {activeTab === "marketplace" && loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : activeTab === "marketplace" ? (
                <span className="text-sm text-muted-foreground">
                  {integrations.length} integrations available
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-muted/10 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("marketplace")}
                  className={cn(
                    "px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                    activeTab === "marketplace"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Store className="h-4 w-4" />
                  Marketplace
                </button>
                <button
                  onClick={() => setActiveTab("installed")}
                  className={cn(
                    "px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2",
                    activeTab === "installed"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  Installed
                </button>
              </div>
            </div>
          </div>

          {activeTab === "marketplace" && (
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
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
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeTab === "installed" ? (
            <IntegrationManager className="mt-4" />
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : integrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Integrations Available</h3>
                  <p className="text-muted-foreground max-w-md">
                    {selectedPlatform === "all" 
                      ? "No integrations are currently available in the marketplace."
                      : `No integrations are currently available for the ${
                          platforms.find(p => p.id === selectedPlatform)?.name || selectedPlatform
                        } platform.`}
                  </p>
                </div>
              ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {integrations.map((integration) => (
                <Superellipse key={integration.id} cornerRadius={12} cornerSmoothing={1}>
                  <div 
                    className={cn(
                      "p-4 bg-muted/10 hover:bg-muted/20 cursor-pointer",
                      selectedIntegration?.id === integration.id && "bg-primary/10"
                    )}
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">
                        <CachedImage
                          src={integration.iconUrl}
                          alt={integration.name}
                          className="w-12 h-12 object-contain"
                          fallback={<span>{integration.icon}</span>}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        {integration.isFavorite && (
                          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                        )}
                        {integration.status !== "available" && (
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              getBadgeColor(integration.status)
                            )}
                          >
                            {integration.status}
                          </span>
                        )}
                        {integration.pricingType !== "free" && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            {integration.pricingType}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm mb-1">{integration.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">by {integration.provider}</p>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {integration.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      {integration.averageRating && (
                        <>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs font-medium">{integration.averageRating.toFixed(1)}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({integration.reviewCount})
                          </span>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {integration.installCount.toLocaleString()} installs
                      </span>
                    </div>

                    {integration.permissions && integration.permissions.length > 0 && (
                      <div className="mb-3">
                        <PermissionDisplay
                          permissions={integration.permissions}
                          compact={true}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        v{integration.version}
                      </span>
                      {integration.isInstalled ? (
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
                            handleInstall(integration);
                          }}
                          disabled={installingId === integration.id}
                          className="px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-50"
                        >
                          {installingId === integration.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : integration.authType === "api_key" ? (
                            <Key className="h-3 w-3" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
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
              {integrations.map((integration) => (
                <Superellipse key={integration.id} cornerRadius={12} cornerSmoothing={1}>
                  <div 
                    className={cn(
                      "p-4 bg-muted/10 hover:bg-muted/20 cursor-pointer",
                      selectedIntegration?.id === integration.id && "bg-primary/10"
                    )}
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">
                        <CachedImage
                          src={integration.iconUrl}
                          alt={integration.name}
                          className="w-10 h-10 object-contain"
                          fallback={<span>{integration.icon}</span>}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-sm mb-1">
                              {integration.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-1">
                              by {integration.provider}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {integration.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {integration.isFavorite && (
                              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                            )}
                            {integration.status !== "available" && (
                              <span
                                className={cn(
                                  "text-xs px-2 py-1 rounded-full",
                                  getBadgeColor(integration.status)
                                )}
                              >
                                {integration.status}
                              </span>
                            )}
                            {integration.pricingType !== "free" && (
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                {integration.pricingType}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {integration.averageRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span className="text-xs font-medium">
                                {integration.averageRating.toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({integration.reviewCount})
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {integration.installCount.toLocaleString()} installs
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            v{integration.version}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {integration.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                        {integration.isInstalled ? (
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
                              handleInstall(integration);
                            }}
                            disabled={installingId === integration.id}
                            className="px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-50"
                          >
                            {installingId === integration.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : integration.authType === "api_key" ? (
                              <Key className="h-4 w-4" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
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
            </>
          )}
        </div>
      </div>

      {selectedIntegration && activeTab === "marketplace" && (
        <div className="w-96 border-l flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-2xl">
                  <CachedImage
                    src={selectedIntegration.iconUrl}
                    alt={selectedIntegration.name}
                    className="w-8 h-8 object-contain"
                    fallback={<span>{selectedIntegration.icon}</span>}
                  />
                </div>
                <h2 className="font-semibold">{selectedIntegration.name}</h2>
              </div>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="p-1 hover:bg-muted/50 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">by {selectedIntegration.provider}</p>
              <p className="text-sm">{selectedIntegration.description}</p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              {selectedIntegration.averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{selectedIntegration.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({selectedIntegration.reviewCount})</span>
                </div>
              )}
              <span className="text-muted-foreground">
                {selectedIntegration.installCount.toLocaleString()} installs
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">{selectedIntegration.version}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auth Type</span>
                <span className="font-medium capitalize">{selectedIntegration.authType.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pricing</span>
                <span className="font-medium capitalize">{selectedIntegration.pricingType}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-medium">{selectedIntegration.lastUpdated}</span>
              </div>
            </div>

            {selectedIntegration.pricingDetails && (
              <div className="p-3 bg-muted/10 rounded-lg">
                <p className="text-xs">{selectedIntegration.pricingDetails}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-2">Capabilities</h3>
              <div className="flex flex-wrap gap-1">
                {selectedIntegration.capabilities.map((cap, i) => (
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
              <h3 className="text-sm font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {selectedIntegration.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-muted/10 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {selectedIntegration.permissions && selectedIntegration.permissions.length > 0 && (
              <div className="border rounded-lg p-3">
                <PermissionDisplay
                  permissions={selectedIntegration.permissions}
                  dataAccess={selectedIntegration.dataAccess}
                  showAll={false}
                />
              </div>
            )}

            {(selectedIntegration.documentationUrl || selectedIntegration.websiteUrl || selectedIntegration.supportUrl) && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold mb-2">Resources</h3>
                {selectedIntegration.documentationUrl && (
                  <a
                    href={selectedIntegration.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <FileCode className="h-3 w-3" />
                    Documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {selectedIntegration.websiteUrl && (
                  <a
                    href={selectedIntegration.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <Globe className="h-3 w-3" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {selectedIntegration.supportUrl && (
                  <a
                    href={selectedIntegration.supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <Heart className="h-3 w-3" />
                    Support
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="border-t p-4 space-y-3">
            {selectedIntegration.isInstalled ? (
              <>
                <button 
                  onClick={() => uninstallIntegration(selectedIntegration.id)}
                  className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Uninstall
                </button>
                <button 
                  onClick={() => toggleFavorite(selectedIntegration.id)}
                  className="w-full py-2 bg-muted/10 hover:bg-muted/20 text-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Heart className={cn("h-4 w-4", selectedIntegration.isFavorite && "fill-current")} />
                  {selectedIntegration.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleInstall(selectedIntegration)}
                  disabled={installingId === selectedIntegration.id}
                  className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {installingId === selectedIntegration.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : selectedIntegration.authType === "api_key" ? (
                    <Key className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Install Integration
                </button>
                {selectedIntegration.documentationUrl && (
                  <a
                    href={selectedIntegration.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-muted/10 hover:bg-muted/20 text-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FileCode className="h-4 w-4" />
                    View Documentation
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Permission Consent Modal */}
      {pendingInstallation && (
        <PermissionConsentModal
          integration={pendingInstallation}
          open={permissionModalOpen}
          onOpenChange={setPermissionModalOpen}
          onConfirm={handlePermissionConfirm}
          onCancel={handlePermissionCancel}
        />
      )}

      {/* API Key Modal */}
      {apiKeyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">API Key Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This integration requires an API key to connect. Please enter your API key below.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 bg-muted/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setApiKeyModalOpen(false);
                  setApiKey("");
                  setApiKeyIntegrationId(null);
                }}
                className="flex-1 py-2 bg-muted/10 hover:bg-muted/20 text-foreground rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApiKeySubmit}
                disabled={!apiKey}
                className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}