import { ActionDefinition } from '../../types'

export const calendarActions: ActionDefinition[] = [
  {
    id: 'calendar.create_event',
    actionId: 'calendar.create_event',
    platform: 'calendar',
    provider: 'native',
    name: 'Create Event',
    description: 'Create a new calendar event',
    icon: 'Calendar',
    category: 'primary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title' },
        description: { type: 'string', description: 'Event description' },
        startTime: { type: 'string', format: 'date-time', description: 'Start time' },
        endTime: { type: 'string', format: 'date-time', description: 'End time' },
        location: { type: 'string', description: 'Event location' },
        allDay: { type: 'boolean', description: 'All day event' },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of attendee emails'
        },
        reminders: {
          type: 'array',
          items: { type: 'number' },
          description: 'Reminder times in minutes before event'
        }
      },
      required: ['title', 'startTime', 'endTime']
    },
    outputSchema: {
      type: 'object',
      properties: {
        eventId: { type: 'string' },
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  },
  {
    id: 'calendar.list_events',
    actionId: 'calendar.list_events',
    platform: 'calendar',
    provider: 'native',
    name: 'List Events',
    description: 'List calendar events within a date range',
    icon: 'Calendar',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', format: 'date', description: 'Start date' },
        endDate: { type: 'string', format: 'date', description: 'End date' },
        limit: { type: 'number', description: 'Maximum number of events', default: 50 }
      },
      required: ['startDate', 'endDate']
    },
    outputSchema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              startTime: { type: 'string' },
              endTime: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        count: { type: 'number' }
      }
    }
  },
  {
    id: 'calendar.update_event',
    actionId: 'calendar.update_event',
    platform: 'calendar',
    provider: 'native',
    name: 'Update Event',
    description: 'Update an existing calendar event',
    icon: 'Calendar',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Event ID to update' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        startTime: { type: 'string', format: 'date-time', description: 'New start time' },
        endTime: { type: 'string', format: 'date-time', description: 'New end time' },
        location: { type: 'string', description: 'New location' }
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
    id: 'calendar.delete_event',
    actionId: 'calendar.delete_event',
    platform: 'calendar',
    provider: 'native',
    name: 'Delete Event',
    description: 'Delete a calendar event',
    icon: 'Calendar',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'Event ID to delete' }
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
    id: 'calendar.find_time',
    actionId: 'calendar.find_time',
    platform: 'calendar',
    provider: 'native',
    name: 'Find Available Time',
    description: 'Find available time slots for a meeting',
    icon: 'Calendar',
    category: 'primary',
    executionType: 'agentic',
    requiresAuth: true,
    requiresLLM: true,
    isActive: true,
    agenticConfig: {
      requiresPlanning: true,
      requiresConfirmation: false,
      maxSteps: 5,
      systemPrompt: 'Find optimal meeting times based on calendar availability and preferences.',
      tools: ['calendar.list_events'],
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.3
    },
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', description: 'Meeting duration in minutes' },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email addresses of participants'
        },
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' }
          }
        },
        preferences: {
          type: 'object',
          properties: {
            preferredTimes: { type: 'array', items: { type: 'string' } },
            avoidTimes: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['duration', 'dateRange']
    },
    outputSchema: {
      type: 'object',
      properties: {
        availableSlots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              start: { type: 'string' },
              end: { type: 'string' },
              score: { type: 'number', description: 'Preference score 0-1' }
            }
          }
        }
      }
    }
  },
  {
    id: 'calendar.check_availability',
    actionId: 'calendar.check_availability',
    platform: 'calendar',
    provider: 'native',
    name: 'Check Availability',
    description: 'Check if a specific time slot is available',
    icon: 'Calendar',
    category: 'secondary',
    executionType: 'direct',
    requiresAuth: true,
    requiresLLM: false,
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time' }
      },
      required: ['startTime', 'endTime']
    },
    outputSchema: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string' },
              title: { type: 'string' },
              startTime: { type: 'string' },
              endTime: { type: 'string' }
            }
          }
        }
      }
    }
  }
]