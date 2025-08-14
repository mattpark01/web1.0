"use client";

import React from "react";
import { IntegrationPermission } from "@/lib/agent-runtime-api";
import { cn } from "@/lib/utils";
import {
  Shield,
  Eye,
  Edit,
  Trash2,
  Lock,
  AlertTriangle,
  CheckCircle,
  Info,
  Database,
  Mail,
  Calendar,
  FileText,
  Users,
  CreditCard,
  Globe,
  Camera,
  Mic,
  MapPin,
  Phone,
  MessageSquare,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PermissionDisplayProps {
  permissions?: IntegrationPermission[];
  dataAccess?: {
    read: string[];
    write: string[];
    delete?: string[];
  };
  compact?: boolean;
  showAll?: boolean;
}

const PERMISSION_ICONS = {
  read: Eye,
  write: Edit,
  delete: Trash2,
  admin: Lock,
};

const CATEGORY_COLORS = {
  read: "text-blue-600 dark:text-blue-400",
  write: "text-purple-600 dark:text-purple-400",
  delete: "text-orange-600 dark:text-orange-400",
  admin: "text-indigo-600 dark:text-indigo-400",
};

const DATA_TYPE_ICONS: Record<string, any> = {
  emails: Mail,
  calendar: Calendar,
  contacts: Users,
  files: FileText,
  photos: Camera,
  location: MapPin,
  microphone: Mic,
  camera: Camera,
  phone: Phone,
  messages: MessageSquare,
  "financial data": CreditCard,
  "bank accounts": CreditCard,
  transactions: CreditCard,
  repositories: Database,
  "source code": FileText,
  issues: AlertTriangle,
  "pull requests": GitBranch,
  analytics: Activity,
  "user data": Users,
  profile: Users,
  posts: MessageSquare,
  comments: MessageSquare,
  "browser history": Globe,
  bookmarks: Globe,
  passwords: Lock,
};

// Import these from lucide-react
import { GitBranch, Activity } from "lucide-react";

export function PermissionDisplay({
  permissions = [],
  dataAccess,
  compact = false,
  showAll = false,
}: PermissionDisplayProps) {
  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, IntegrationPermission[]>);


  if (compact) {
    // Compact view for cards
    const totalPermissions = permissions.length;

    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted/20 text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span className="font-medium">
                  {totalPermissions} permission{totalPermissions !== 1 ? 's' : ''}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                {permissions.slice(0, 3).map((perm) => (
                  <div key={perm.id} className="text-xs">
                    • {perm.name}
                  </div>
                ))}
                {permissions.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{permissions.length - 3} more...
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  // Full view for detail panel
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Required Permissions</h3>
      </div>

      {/* Permission Categories */}
      <div className="space-y-3">
        {Object.entries(groupedPermissions).map(([category, perms]) => {
          const Icon = PERMISSION_ICONS[category as keyof typeof PERMISSION_ICONS];
          const displayPerms = showAll ? perms : perms.filter(p => p.required);
          
          if (displayPerms.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon className="h-3 w-3" />
                {category.charAt(0).toUpperCase() + category.slice(1)} Access
              </div>
              <div className="space-y-1 ml-5">
                {displayPerms.map((perm) => (
                  <div
                    key={perm.id}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-md text-xs",
                      "bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5",
                      CATEGORY_COLORS[perm.category]
                    )}>
                      {perm.required ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Info className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{perm.name}</div>
                      <div className="text-muted-foreground mt-0.5">
                        {perm.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Access Summary */}
      {dataAccess && (
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-xs font-semibold text-muted-foreground">Data Access</h4>
          <div className="space-y-2">
            {dataAccess.read.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <Eye className="h-3 w-3 text-blue-500 mt-0.5" />
                <div>
                  <span className="font-medium">Can view:</span>{" "}
                  {dataAccess.read.join(", ")}
                </div>
              </div>
            )}
            {dataAccess.write.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <Edit className="h-3 w-3 text-yellow-500 mt-0.5" />
                <div>
                  <span className="font-medium">Can modify:</span>{" "}
                  {dataAccess.write.join(", ")}
                </div>
              </div>
            )}
            {dataAccess.delete && dataAccess.delete.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <Trash2 className="h-3 w-3 text-red-500 mt-0.5" />
                <div>
                  <span className="font-medium">Can delete:</span>{" "}
                  {dataAccess.delete.join(", ")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!showAll && permissions.filter(p => !p.required).length > 0 && (
        <button className="text-xs text-primary hover:underline">
          Show {permissions.filter(p => !p.required).length} optional permissions
        </button>
      )}
    </div>
  );
}