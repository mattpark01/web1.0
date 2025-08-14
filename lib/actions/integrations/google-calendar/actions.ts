import { ActionDefinition } from '../../types'

export const googleCalendarActions: ActionDefinition[] = [
  {
    id: 'calendar.google.create_event',
    actionId: 'calendar.google.create_event',
    platform: 'calendar',
    provider: 'google',
    name: 'Create Google Calendar Event',
    description: 'Create an event in Google Calendar',
    icon: 'Calendar',
    category: 'primary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    requiresIntegration: 'google-calendar',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        calendarId: { 
          type: 'string', 
          default: 'primary',
          description: 'Calendar ID (default: primary)' 
        },
        summary: { type: 'string', description: 'Event title' },
        description: { type: 'string', description: 'Event description' },
        start: {
          type: 'object',
          properties: {
            dateTime: { type: 'string', format: 'date-time' },
            timeZone: { type: 'string' }
          }
        },
        end: {
          type: 'object',
          properties: {
            dateTime: { type: 'string', format: 'date-time' },
            timeZone: { type: 'string' }
          }
        },
        location: { type: 'string', description: 'Event location' },
        attendees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              displayName: { type: 'string' },
              optional: { type: 'boolean' }
            }
          }
        },
        reminders: {
          type: 'object',
          properties: {
            useDefault: { type: 'boolean' },
            overrides: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  method: { type: 'string', enum: ['email', 'popup'] },
                  minutes: { type: 'number' }
                }
              }
            }
          }
        },
        recurrence: {
          type: 'array',
          items: { type: 'string' },
          description: 'RRULE strings for recurring events'
        },
        conferenceData: {
          type: 'object',
          description: 'Google Meet conference details'
        }
      },
      required: ['summary', 'start', 'end']
    },
    outputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        htmlLink: { type: 'string' },
        created: { type: 'string' },
        summary: { type: 'string' },
        start: { type: 'object' },
        end: { type: 'object' },
        hangoutLink: { type: 'string' }
      }
    }
  },
  {
    id: 'calendar.google.list_events',
    actionId: 'calendar.google.list_events',
    platform: 'calendar',
    provider: 'google',
    name: 'List Google Calendar Events',
    description: 'List events from Google Calendar',
    icon: 'Calendar',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    requiresIntegration: 'google-calendar',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        calendarId: { 
          type: 'string', 
          default: 'primary',
          description: 'Calendar ID (default: primary)' 
        },
        timeMin: { type: 'string', format: 'date-time', description: 'Lower bound for event start time' },
        timeMax: { type: 'string', format: 'date-time', description: 'Upper bound for event start time' },
        maxResults: { type: 'number', default: 250, description: 'Maximum events to return' },
        orderBy: { 
          type: 'string', 
          enum: ['startTime', 'updated'],
          default: 'startTime'
        },
        q: { type: 'string', description: 'Search query' },
        singleEvents: { type: 'boolean', default: true, description: 'Expand recurring events' }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              summary: { type: 'string' },
              description: { type: 'string' },
              start: { type: 'object' },
              end: { type: 'object' },
              location: { type: 'string' },
              attendees: { type: 'array' },
              hangoutLink: { type: 'string' }
            }
          }
        },
        nextPageToken: { type: 'string' },
        nextSyncToken: { type: 'string' }
      }
    }
  },
  {
    id: 'calendar.google.update_event',
    actionId: 'calendar.google.update_event',
    platform: 'calendar',
    provider: 'google',
    name: 'Update Google Calendar Event',
    description: 'Update an event in Google Calendar',
    icon: 'Calendar',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    requiresIntegration: 'google-calendar',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        calendarId: { 
          type: 'string', 
          default: 'primary',
          description: 'Calendar ID (default: primary)' 
        },
        eventId: { type: 'string', description: 'Event ID to update' },
        summary: { type: 'string', description: 'Event title' },
        description: { type: 'string', description: 'Event description' },
        start: {
          type: 'object',
          properties: {
            dateTime: { type: 'string', format: 'date-time' },
            timeZone: { type: 'string' }
          }
        },
        end: {
          type: 'object',
          properties: {
            dateTime: { type: 'string', format: 'date-time' },
            timeZone: { type: 'string' }
          }
        },
        location: { type: 'string' },
        attendees: { type: 'array' }
      },
      required: ['eventId']
    },
    outputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        updated: { type: 'string' },
        summary: { type: 'string' }
      }
    }
  },
  {
    id: 'calendar.google.delete_event',
    actionId: 'calendar.google.delete_event',
    platform: 'calendar',
    provider: 'google',
    name: 'Delete Google Calendar Event',
    description: 'Delete an event from Google Calendar',
    icon: 'Trash',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    requiresIntegration: 'google-calendar',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        calendarId: { 
          type: 'string', 
          default: 'primary',
          description: 'Calendar ID (default: primary)' 
        },
        eventId: { type: 'string', description: 'Event ID to delete' },
        sendNotifications: { 
          type: 'boolean', 
          default: false,
          description: 'Send notifications to attendees' 
        }
      },
      required: ['eventId']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  },
  {
    id: 'calendar.google.list_calendars',
    actionId: 'calendar.google.list_calendars',
    platform: 'calendar',
    provider: 'google',
    name: 'List Google Calendars',
    description: 'List all accessible Google Calendars',
    icon: 'Calendar',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    requiresIntegration: 'google-calendar',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        minAccessRole: {
          type: 'string',
          enum: ['freeBusyReader', 'reader', 'writer', 'owner'],
          description: 'Filter by minimum access role'
        },
        showHidden: { type: 'boolean', default: false }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              summary: { type: 'string' },
              description: { type: 'string' },
              primary: { type: 'boolean' },
              accessRole: { type: 'string' },
              backgroundColor: { type: 'string' },
              foregroundColor: { type: 'string' }
            }
          }
        }
      }
    }
  },
  {
    id: 'calendar.google.sync',
    actionId: 'calendar.google.sync',
    platform: 'calendar',
    provider: 'google',
    name: 'Sync Google Calendar',
    description: 'Sync events from Google Calendar to local database',
    icon: 'RefreshCw',
    category: 'primary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    requiresIntegration: 'google-calendar',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        calendarId: { 
          type: 'string', 
          default: 'primary',
          description: 'Calendar ID to sync (default: primary)' 
        },
        syncToken: { 
          type: 'string', 
          description: 'Token for incremental sync' 
        },
        fullSync: { 
          type: 'boolean', 
          default: false,
          description: 'Perform full sync instead of incremental' 
        }
      }
    },
    outputSchema: {
      type: 'object',
      properties: {
        synced: { type: 'number' },
        created: { type: 'number' },
        updated: { type: 'number' },
        deleted: { type: 'number' },
        nextSyncToken: { type: 'string' }
      }
    }
  }
]