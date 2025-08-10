"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppRegistration } from "@/contexts/command-registry";
import { 
  Calendar,
  CalendarDays,
  CalendarRange,
  Grid3X3,
  List,
  Plus,
  Clock,
  Users,
  Video,
  Bell,
  Settings,
  Download,
  Upload,
  Share
} from "lucide-react";

export function CalendarCommands() {
  const pathname = usePathname();
  const router = useRouter();

  // Memoize the registration object to prevent re-renders
  const registration = useMemo(() => ({
    appId: "calendar",
    appName: "Calendar",
    sections: [
      {
        id: "calendar-today",
        name: "Today",
        icon: CalendarDays,
        action: () => {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(today.getDate()).padStart(2, "0");
          router.push(`/calendar/day/${year}/${month}/${day}`);
        },
        description: "Go to today's view",
      },
      {
        id: "calendar-upcoming",
        name: "Upcoming Events",
        icon: Clock,
        action: () => {
          console.log("Show upcoming events");
        },
        description: "View upcoming events",
      },
      {
        id: "calendar-shared",
        name: "Shared Calendars",
        icon: Users,
        action: () => {
          console.log("Show shared calendars");
        },
        description: "View shared calendars",
      },
    ],
    viewModes: [
      {
        id: "calendar-year-view",
        name: "Year View",
        icon: Grid3X3,
        action: () => {
          const year = new Date().getFullYear();
          router.push(`/calendar/year/${year}`);
        },
      },
      {
        id: "calendar-month-view",
        name: "Month View",
        icon: CalendarRange,
        action: () => {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          router.push(`/calendar/month/${year}/${month}`);
        },
      },
      {
        id: "calendar-week-view",
        name: "Week View",
        icon: List,
        action: () => {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(today.getDate()).padStart(2, "0");
          router.push(`/calendar/week/${year}/${month}/${day}`);
        },
      },
      {
        id: "calendar-day-view",
        name: "Day View",
        icon: CalendarDays,
        action: () => {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(today.getDate()).padStart(2, "0");
          router.push(`/calendar/day/${year}/${month}/${day}`);
        },
      },
    ],
    commands: [
      {
        id: "calendar-new-event",
        name: "New Event",
        icon: Plus,
        action: () => {
          console.log("Create new event");
        },
        description: "Create a new calendar event",
        shortcut: "⌘N",
      },
      {
        id: "calendar-new-meeting",
        name: "New Meeting",
        icon: Video,
        action: () => {
          console.log("Create new meeting");
        },
        description: "Schedule a new meeting",
      },
      {
        id: "calendar-new-reminder",
        name: "New Reminder",
        icon: Bell,
        action: () => {
          console.log("Create new reminder");
        },
        description: "Set a new reminder",
      },
      {
        id: "calendar-import",
        name: "Import Calendar",
        icon: Upload,
        action: () => {
          console.log("Import calendar");
        },
        description: "Import events from file",
      },
      {
        id: "calendar-export",
        name: "Export Calendar",
        icon: Download,
        action: () => {
          console.log("Export calendar");
        },
        description: "Export calendar to file",
      },
      {
        id: "calendar-share",
        name: "Share Calendar",
        icon: Share,
        action: () => {
          console.log("Share calendar");
        },
        description: "Share calendar with others",
      },
      {
        id: "calendar-settings",
        name: "Calendar Settings",
        icon: Settings,
        action: () => {
          console.log("Open calendar settings");
        },
        description: "Configure calendar preferences",
      },
    ],
  }), [router]); // Only depend on router, not pathname

  useAppRegistration(registration);

  return null;
}