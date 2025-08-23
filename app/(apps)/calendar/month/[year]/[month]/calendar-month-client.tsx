"use client"

import { MonthView } from "@/components/calendar/month-view"
import { useState, useEffect, useMemo } from "react"
import { Calendar, Clock, MapPin, Users, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Superellipse } from "@/components/ui/superellipse/superellipse"
import { useCalendarIntegration } from "@/hooks/use-calendar-integration"

interface CalendarMonthClientProps {
  year: number
  month: number
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  startTime: string
  endTime: string
  type: 'meeting' | 'task' | 'reminder' | 'personal'
  location?: string
  attendees?: string[]
  color: string
}

export default function CalendarMonthClient({ year, month }: CalendarMonthClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const { events: integrationEvents, loading, error, syncEvents } = useCalendarIntegration()
  
  // Fallback mock events for when no integrations are connected
  const mockEvents: CalendarEvent[] = [
    {
      id: "1",
      title: "Team Standup",
      date: new Date(year, month - 1, 12),
      startTime: "10:00",
      endTime: "10:30",
      type: "meeting",
      location: "Zoom",
      attendees: ["Team"],
      color: "bg-blue-500"
    },
    {
      id: "2",
      title: "Product Review",
      date: new Date(year, month - 1, 12),
      startTime: "14:00",
      endTime: "15:00",
      type: "meeting",
      location: "Conference Room A",
      attendees: ["Product Team", "Design Team"],
      color: "bg-purple-500"
    },
    {
      id: "3",
      title: "Deploy v2.0",
      date: new Date(year, month - 1, 15),
      startTime: "09:00",
      endTime: "11:00",
      type: "task",
      color: "bg-green-500"
    },
    {
      id: "4",
      title: "Design Sprint",
      date: new Date(year, month - 1, 20),
      startTime: "10:00",
      endTime: "16:00",
      type: "meeting",
      location: "Design Studio",
      attendees: ["Design Team", "Product Team"],
      color: "bg-pink-500"
    },
    {
      id: "5",
      title: "Quarterly Planning",
      date: new Date(year, month - 1, 25),
      startTime: "09:00",
      endTime: "12:00",
      type: "meeting",
      location: "Main Conference Room",
      attendees: ["All Hands"],
      color: "bg-orange-500"
    },
    {
      id: "6",
      title: "Code Review",
      date: new Date(year, month - 1, 8),
      startTime: "15:00",
      endTime: "16:00",
      type: "task",
      color: "bg-cyan-500"
    },
    {
      id: "7",
      title: "Birthday Lunch",
      date: new Date(year, month - 1, 18),
      startTime: "12:00",
      endTime: "13:00",
      type: "personal",
      location: "Downtown Restaurant",
      color: "bg-yellow-500"
    }
  ]

  // Use integration events if available, otherwise fall back to mock events
  const displayEvents = useMemo(() => {
    if (integrationEvents && integrationEvents.length > 0) {
      // Convert integration events to our calendar event format
      return integrationEvents.map((event, index) => ({
        id: event.id || `int-${index}`,
        title: event.title || event.summary || 'Untitled Event',
        date: new Date(event.startTime || event.start?.dateTime || event.start?.date),
        startTime: event.startTime ? new Date(event.startTime).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: false 
        }) : '09:00',
        endTime: event.endTime ? new Date(event.endTime).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: false 
        }) : '10:00',
        type: 'meeting' as const,
        location: event.location,
        attendees: event.attendees?.map(a => a.email || a.name).filter(Boolean),
        color: event.colorId ? `bg-${event.colorId}-500` : 'bg-blue-500'
      })).filter(event => {
        // Only show events for the current month
        const eventDate = event.date
        return eventDate.getFullYear() === year && eventDate.getMonth() === month - 1
      })
    }
    return mockEvents
  }, [integrationEvents, year, month])

  const getEventsForDate = useMemo(() => {
    // Create a map for fast lookups
    const eventMap = new Map<string, CalendarEvent[]>()
    displayEvents.forEach(event => {
      const dateKey = `${event.date.getFullYear()}-${event.date.getMonth()}-${event.date.getDate()}`
      if (!eventMap.has(dateKey)) {
        eventMap.set(dateKey, [])
      }
      eventMap.get(dateKey)!.push(event)
    })
    
    return (date: Date) => {
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      return eventMap.get(dateKey) || []
    }
  }, [displayEvents])

  // Sync events in background when component mounts or month changes
  useEffect(() => {
    // Sync silently in background - don't wait for it
    syncEvents().catch(err => {
      // Silently fail - we'll show mock data instead
    })
  }, [year, month])

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting':
        return Users
      case 'task':
        return Calendar
      case 'reminder':
        return Clock
      case 'personal':
        return MapPin
      default:
        return Calendar
    }
  }

  const getEventTypeBadgeVariant = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting':
        return "default"
      case 'task':
        return "secondary"
      case 'reminder':
        return "outline"
      case 'personal':
        return "destructive"
      default:
        return "default"
    }
  }

  const currentDate = new Date(year, month - 1, 1)
  const monthName = currentDate.toLocaleString('default', { month: 'long' })


  return (
    <div className="flex h-full">
      {/* Main Calendar View */}
      <div className="flex-1">
        <MonthView 
          date={currentDate}
          events={displayEvents}
          onDateSelect={setSelectedDate}
        />
      </div>

      {/* Sidebar - Event Details */}
      {selectedDate && (
        <div className="w-96 border-l p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getEventsForDate(selectedDate).length} events scheduled
              </p>
            </div>

            <div className="space-y-3">
              {getEventsForDate(selectedDate).map(event => {
                const Icon = getEventTypeIcon(event.type)
                return (
                  <Superellipse key={event.id} cornerRadius={8} className="bg-muted/10 p-3 hover:bg-muted/30 cursor-pointer transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${event.color}`} />
                          <div className="space-y-1">
                            <h3 className="font-medium text-sm">{event.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{event.startTime} - {event.endTime}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{event.attendees.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getEventTypeBadgeVariant(event.type)} className="text-xs capitalize">
                          <Icon className="h-3 w-3 mr-1" />
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </Superellipse>
                )
              })}
            </div>

            {getEventsForDate(selectedDate).length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No events scheduled</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Add Event
                </Button>
              </div>
            )}
            
            {error && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Failed to load calendar events
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => syncEvents()}
                  disabled={loading}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}