"use client"

import { MonthView } from "@/components/calendar/month-view"
import { useState } from "react"
import { Calendar, Clock, MapPin, Users, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Superellipse } from "@/components/ui/superellipse/superellipse"

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
  
  // Generate events based on the year and month
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

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter(event => 
      event.date.getFullYear() === date.getFullYear() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getDate() === date.getDate()
    )
  }

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
          events={mockEvents}
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
          </div>
        </div>
      )}
    </div>
  )
}