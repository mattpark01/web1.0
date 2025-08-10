"use client"

import { Clock, MapPin, Users, Video, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Superellipse } from "@/components/ui/superellipse/superellipse"

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

interface DayViewProps {
  date: Date
  events: CalendarEvent[]
}

export function DayView({ date, events }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  const getEventPosition = (event: CalendarEvent) => {
    const [startHour, startMinute] = event.startTime.split(':').map(Number)
    const [endHour, endMinute] = event.endTime.split(':').map(Number)
    
    const top = (startHour * 60 + startMinute) * (60 / 60)
    const height = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) * (60 / 60)
    
    return { top, height }
  }

  const getEventDuration = (event: CalendarEvent) => {
    const [startHour, startMinute] = event.startTime.split(':').map(Number)
    const [endHour, endMinute] = event.endTime.split(':').map(Number)
    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
  }

  const sortEventsByDuration = (events: CalendarEvent[]) => {
    return [...events].sort((a, b) => getEventDuration(b) - getEventDuration(a))
  }

  const currentTime = new Date()
  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const currentTimePosition = (currentHour * 60 + currentMinute) * (60 / 60)
  const isToday = date.toDateString() === currentTime.toDateString()

  return (
    <div className="flex h-full">
      {/* Time column */}
      <div className="w-20 flex-shrink-0 border-r">
        <div className="h-10 border-b" />
        {hours.map(hour => (
          <div key={hour} className="h-[60px] border-b text-xs text-muted-foreground text-right pr-2 pt-1">
            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
          </div>
        ))}
      </div>

      {/* Events column */}
      <div className="flex-1 relative">
        <div className="h-10 border-b px-4 flex items-center">
          <h3 className="font-medium">
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>
        
        <div className="relative">
          {/* Hour grid lines */}
          {hours.map(hour => (
            <div key={hour} className="h-[60px] border-b" />
          ))}
          
          {/* Current time indicator */}
          {isToday && (
            <div 
              className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <Superellipse cornerRadius={1.5} className="absolute -left-2 -top-2 w-3 h-3 bg-red-500" />
            </div>
          )}
          
          {/* Events */}
          <div className="absolute inset-0 mx-4">
            {sortEventsByDuration(events).map((event, eventIndex) => {
              const { top, height } = getEventPosition(event)
              const duration = getEventDuration(event)
              // Shorter events get higher z-index
              const zIndex = 100 - Math.floor(duration / 30)
              return (
                <Superellipse
                  key={event.id}
                  cornerRadius={6}
                  className={`absolute left-0 right-0 ${event.color} text-white p-2 cursor-pointer hover:opacity-90 overflow-hidden`}
                  style={{ 
                    top: `${top}px`, 
                    height: `${height}px`,
                    minHeight: '30px',
                    zIndex: zIndex
                  }}
                >
                  <div className="text-xs font-medium truncate">{event.title}</div>
                  <div className="text-xs opacity-90">
                    {event.startTime} - {event.endTime}
                  </div>
                  {height > 50 && event.location && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs truncate">{event.location}</span>
                    </div>
                  )}
                </Superellipse>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right sidebar - all day events or details */}
      <div className="w-64 border-l">
        <div className="p-4 border-b">
          <h4 className="font-medium text-sm">All Day Events</h4>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">No all-day events</p>
        </div>
      </div>
    </div>
  )
}