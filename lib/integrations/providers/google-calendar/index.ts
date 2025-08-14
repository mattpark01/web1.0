import { IntegrationProvider } from "../../core/types";
import { GoogleCalendarAdapter } from "./adapter";

export const googleCalendarProvider: IntegrationProvider = {
  slug: "google-calendar",
  name: "Google Calendar",
  description: "Sync and manage your Google Calendar events",
  iconUrl: "/icons/google-calendar.svg",
  category: "calendar",

  auth: {
    type: "oauth2",
    config: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      responseType: "code",
      accessType: "offline",
      grantType: "authorization_code",
    },
  },

  api: {
    baseUrl: "https://www.googleapis.com/calendar/v3",
    version: "v3",
    headers: {
      Accept: "application/json",
    },
    rateLimit: {
      requests: 1000000, // Daily quota
      period: 86400, // 24 hours in seconds
    },
  },

  features: ["sync", "webhooks", "create", "update", "delete", "realtime"],

  endpoints: {
    calendars: {
      method: "GET",
      path: "/users/me/calendarList",
      description: "List all calendars",
    },
    events: {
      method: "GET",
      path: "/calendars/{calendarId}/events",
      description: "List events from a calendar",
      paginated: true,
    },
    createEvent: {
      method: "POST",
      path: "/calendars/{calendarId}/events",
      description: "Create a new event",
    },
    updateEvent: {
      method: "PATCH",
      path: "/calendars/{calendarId}/events/{eventId}",
      description: "Update an existing event",
    },
    deleteEvent: {
      method: "DELETE",
      path: "/calendars/{calendarId}/events/{eventId}",
      description: "Delete an event",
    },
    watch: {
      method: "POST",
      path: "/calendars/{calendarId}/events/watch",
      description: "Watch for changes to events",
    },
  },

  dataMappings: {
    event: {
      externalField: "summary",
      internalField: "title",
    },
    startTime: {
      externalField: "start.dateTime",
      internalField: "startTime",
      transform: (value: string) => new Date(value),
    },
    endTime: {
      externalField: "end.dateTime",
      internalField: "endTime",
      transform: (value: string) => new Date(value),
    },
  },

  documentationUrl: "https://developers.google.com/calendar/api/v3/reference",
  isVerified: true,
};

// Create and export the adapter instance
export const googleCalendarAdapter = new GoogleCalendarAdapter(
  googleCalendarProvider,
);
