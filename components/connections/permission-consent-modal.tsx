"use client";

import { useState } from "react";
import { Integration } from "@/lib/agent-runtime-api";
import { PermissionDisplay } from "./permission-display";
import { CachedImage } from "@/components/ui/cached-image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionConsentModalProps {
  integration: Integration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PermissionConsentModal({
  integration,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: PermissionConsentModalProps) {
  const [understood, setUnderstood] = useState(false);
  
  const hasHighRiskPermissions = integration.permissions?.some(p => p.risk === 'high');
  const totalPermissions = integration.permissions?.length || 0;
  const requiredPermissions = integration.permissions?.filter(p => p.required).length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            Review Permissions
          </DialogTitle>
          <DialogDescription>
            {integration.name} is requesting access to your data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Integration Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <CachedImage
              src={integration.iconUrl}
              alt={integration.name}
              className="w-12 h-12 object-contain"
              fallback={<span className="text-2xl">{integration.icon}</span>}
            />
            <div className="flex-1">
              <h3 className="font-semibold">{integration.name}</h3>
              <p className="text-sm text-muted-foreground">by {integration.provider}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{totalPermissions} permissions</div>
              <div className="text-xs text-muted-foreground">
                {requiredPermissions} required
              </div>
            </div>
          </div>

          {/* Warning for high-risk permissions */}
          {hasHighRiskPermissions && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  This integration requests sensitive permissions
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                  Review carefully before granting access. These permissions allow significant access to your data.
                </p>
              </div>
            </div>
          )}

          {/* Permissions Display */}
          <div className="border rounded-lg p-4">
            <PermissionDisplay
              permissions={integration.permissions}
              dataAccess={integration.dataAccess}
              showAll={true}
            />
          </div>

          {/* Important Information */}
          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-medium text-blue-600 dark:text-blue-400">
                  Important Information:
                </p>
                <ul className="space-y-1 text-blue-600/80 dark:text-blue-400/80">
                  <li>• You can revoke access at any time from your Connections settings</li>
                  <li>• {integration.provider} will handle your data according to their privacy policy</li>
                  <li>• Only grant access to integrations you trust</li>
                  {integration.authType === 'oauth2' && (
                    <li>• You'll be redirected to {integration.provider} to complete authorization</li>
                  )}
                  {integration.authType === 'api_key' && (
                    <li>• You'll need to provide an API key from {integration.provider}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="consent"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
            />
            <label
              htmlFor="consent"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand and agree to grant {integration.name} the requested permissions
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setUnderstood(false);
              onCancel();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setUnderstood(false);
              onConfirm();
            }}
            disabled={!understood}
            className={cn(
              hasHighRiskPermissions && "bg-red-600 hover:bg-red-700"
            )}
          >
            {hasHighRiskPermissions ? "Grant Access" : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}