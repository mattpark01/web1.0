"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { LucideIcon } from "lucide-react";

// Types
export interface CommandSection {
  id: string;
  name: string;
  icon: LucideIcon;
  action?: () => void;
  description?: string;
}

export interface CommandViewMode {
  id: string;
  name: string;
  icon: LucideIcon;
  action: () => void;
}

export interface AppCommand {
  id: string;
  name: string;
  icon: LucideIcon;
  action: () => void;
  description?: string;
  shortcut?: string;
}

export interface AppRegistration {
  appId: string;
  appName: string;
  sections?: CommandSection[];
  viewModes?: CommandViewMode[];
  commands?: AppCommand[];
}

// Context
interface CommandRegistryContextType {
  registrations: Map<string, AppRegistration>;
  registerApp: (registration: AppRegistration) => void;
  unregisterApp: (appId: string) => void;
  getAppRegistration: (appId: string) => AppRegistration | undefined;
  getAllSections: () => Array<CommandSection & { appId: string; appName: string }>;
  getAllViewModes: () => Array<CommandViewMode & { appId: string; appName: string }>;
  getAllCommands: () => Array<AppCommand & { appId: string; appName: string }>;
}

const CommandRegistryContext = createContext<CommandRegistryContextType | undefined>(undefined);

// Provider
export function CommandRegistryProvider({ children }: { children: React.ReactNode }) {
  const [registrations, setRegistrations] = useState<Map<string, AppRegistration>>(new Map());

  const registerApp = useCallback((registration: AppRegistration) => {
    setRegistrations((prev) => {
      const next = new Map(prev);
      next.set(registration.appId, registration);
      return next;
    });
  }, []);

  const unregisterApp = useCallback((appId: string) => {
    setRegistrations((prev) => {
      const next = new Map(prev);
      next.delete(appId);
      return next;
    });
  }, []);

  const getAppRegistration = useCallback(
    (appId: string) => {
      return registrations.get(appId);
    },
    [registrations]
  );

  const getAllSections = useCallback(() => {
    const allSections: Array<CommandSection & { appId: string; appName: string }> = [];
    registrations.forEach((registration) => {
      if (registration.sections) {
        registration.sections.forEach((section) => {
          allSections.push({
            ...section,
            appId: registration.appId,
            appName: registration.appName,
          });
        });
      }
    });
    return allSections;
  }, [registrations]);

  const getAllViewModes = useCallback(() => {
    const allViewModes: Array<CommandViewMode & { appId: string; appName: string }> = [];
    registrations.forEach((registration) => {
      if (registration.viewModes) {
        registration.viewModes.forEach((viewMode) => {
          allViewModes.push({
            ...viewMode,
            appId: registration.appId,
            appName: registration.appName,
          });
        });
      }
    });
    return allViewModes;
  }, [registrations]);

  const getAllCommands = useCallback(() => {
    const allCommands: Array<AppCommand & { appId: string; appName: string }> = [];
    registrations.forEach((registration) => {
      if (registration.commands) {
        registration.commands.forEach((command) => {
          allCommands.push({
            ...command,
            appId: registration.appId,
            appName: registration.appName,
          });
        });
      }
    });
    return allCommands;
  }, [registrations]);

  const value: CommandRegistryContextType = {
    registrations,
    registerApp,
    unregisterApp,
    getAppRegistration,
    getAllSections,
    getAllViewModes,
    getAllCommands,
  };

  return (
    <CommandRegistryContext.Provider value={value}>
      {children}
    </CommandRegistryContext.Provider>
  );
}

// Hook
export function useCommandRegistry() {
  const context = useContext(CommandRegistryContext);
  if (!context) {
    throw new Error("useCommandRegistry must be used within a CommandRegistryProvider");
  }
  return context;
}

// Hook for apps to register themselves
export function useAppRegistration(registration: AppRegistration) {
  const { registerApp, unregisterApp } = useCommandRegistry();

  useEffect(() => {
    // Only register if we have a valid registration
    if (registration && registration.appId) {
      registerApp(registration);
      return () => {
        unregisterApp(registration.appId);
      };
    }
  }, [registration, registerApp, unregisterApp]); // Include full registration object for proper updates
}