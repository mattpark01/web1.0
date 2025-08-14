"use client"

import { Superellipse } from "@/components/ui/superellipse/superellipse"
import { getGridBorderClasses } from "@/lib/utils/grid-borders"

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

interface WeekViewProps {
  date: Date
  events: CalendarEvent[]
}

export function WeekView({ date, events }: WeekViewProps) {
  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)
    
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek)
      weekDay.setDate(startOfWeek.getDate() + i)
      week.push(weekDay)
    }
    return week
  }

  const weekDates = getWeekDates(date)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  const getEventPosition = (event: CalendarEvent) => {
    const [startHour, startMinute] = event.startTime.split(':').map(Number)
    const [endHour, endMinute] = event.endTime.split(':').map(Number)
    
    const top = (startHour * 60 + startMinute) * (60 / 60)
    const height = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) * (60 / 60)
    
    return { top, height }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    )
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header row with empty corner and day headers */}
      <div className="flex h-20 sticky top-0 bg-background z-10">
        <div className={`w-20 flex-shrink-0 ${getGridBorderClasses({
          row: 0,
          col: 0,
          totalRows: 1,
          totalCols: 8,
          borderStyle: 'all'
        })}`} />
        {weekDates.map((weekDate, index) => {
          const isToday = weekDate.toDateString() === currentTime.toDateString()
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          const borderClasses = getGridBorderClasses({
            row: 0,
            col: index + 1,
            totalRows: 1,
            totalCols: 8,
            borderStyle: 'all'
          })
          return (
            <div key={index} className={`flex-1 p-2 text-center ${borderClasses} ${isToday ? 'bg-primary/5' : ''}`}>
              <div className="text-xs text-muted-foreground">{dayNames[weekDate.getDay()]}</div>
              <div className={`text-lg font-medium ${isToday ? 'text-primary' : ''}`}>
                {weekDate.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scrollable content area with time column and day columns */}
      <div className="flex-1 overflow-auto">
        <div className="flex" style={{ minHeight: `${hours.length * 60}px` }}>
          {/* Time column */}
          <div className="w-20 flex-shrink-0">
            {hours.map((hour, hourIndex) => {
              const borderClasses = getGridBorderClasses({
                row: hourIndex,
                col: 0,
                totalRows: hours.length,
                totalCols: 8,
                borderStyle: 'all'
              })
              return (
                <div key={hour} className={`h-[60px] text-xs text-muted-foreground text-right pr-2 pt-1 ${borderClasses}`}>
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              )
            })}
          </div>

          {/* Days columns */}
          {weekDates.map((weekDate, dayIndex) => {
            const dayEvents = getEventsForDate(weekDate)
            const isToday = weekDate.toDateString() === currentTime.toDateString()
            
            return (
              <div key={dayIndex} className="flex-1">
                {/* Hours grid and events */}
                <div className="relative" style={{ height: `${hours.length * 60}px` }}>
                  {/* Hour grid lines */}
                  {hours.map((hour, hourIndex) => {
                    const borderClasses = getGridBorderClasses({
                      row: hourIndex,
                      col: dayIndex + 1,
                      totalRows: hours.length,
                      totalCols: 8,
                      borderStyle: 'all'
                    })
                    return (
                      <div key={hour} className={`h-[60px] ${borderClasses}`} />
                    )
                  })}
                  
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
                  <div className="absolute inset-0 mx-1">
                    {sortEventsByDuration(dayEvents).map((event, eventIndex) => {
                      const { top, height } = getEventPosition(event)
                      const duration = getEventDuration(event)
                      // Shorter events get higher z-index (inversely proportional to duration)
                      // This ensures shorter events always appear above longer ones
                      const zIndex = 1000 - duration
                      return (
                        <Superellipse
                          key={event.id}
                          cornerRadius={4}
                          className={`absolute left-0 right-0 ${event.color} text-white p-1 cursor-pointer hover:opacity-90 overflow-hidden`}
                          style={{ 
                            top: `${top}px`, 
                            height: `${height}px`,
                            minHeight: '25px',
                            fontSize: '11px',
                            zIndex: zIndex
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {height > 30 && (
                            <div className="opacity-90">{event.startTime}</div>
                          )}
                        </Superellipse>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}