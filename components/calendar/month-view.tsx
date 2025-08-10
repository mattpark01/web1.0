"use client"

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

interface MonthViewProps {
  date: Date
  events: CalendarEvent[]
  onDateSelect?: (date: Date) => void
  selectedDate?: Date | null
}

export function MonthView({ date, events, onDateSelect, selectedDate }: MonthViewProps) {
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    )
  }

  const isSameDay = (date1: Date, date2: Date | null) => {
    if (!date2) return false
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return isSameDay(date, today)
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(date)
    const firstDay = getFirstDayOfMonth(date)
    const days = []
    const totalCells = Math.ceil((daysInMonth + firstDay) / 7) * 7

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - firstDay + 1
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth
      const currentDate = isCurrentMonth 
        ? new Date(date.getFullYear(), date.getMonth(), dayNumber)
        : null

      const dayEvents = currentDate ? getEventsForDate(currentDate) : []

      days.push(
        <div
          key={i}
          className={`
            min-h-[120px] border-r border-b p-2 cursor-pointer transition-colors
            ${!isCurrentMonth ? 'bg-muted/20' : 'hover:bg-muted/30'}
            ${currentDate && isSameDay(currentDate, selectedDate) ? 'bg-muted/50' : ''}
            ${currentDate && isToday(currentDate) ? 'bg-primary/5' : ''}
          `}
          onClick={() => currentDate && onDateSelect?.(currentDate)}
        >
          {isCurrentMonth && (
            <>
              <div className={`
                text-sm font-medium mb-2 ${isToday(currentDate!) ? 'text-primary' : ''}
              `}>
                {dayNumber}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <Superellipse
                    key={event.id}
                    cornerRadius={4}
                    className={`text-xs px-1.5 py-0.5 truncate ${event.color} text-white`}
                    title={`${event.startTime} - ${event.title}`}
                  >
                    <span className="opacity-75">{event.startTime}</span> {event.title}
                  </Superellipse>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )
    }

    return days
  }

  return (
    <div className="h-full flex flex-col">
      {/* Day labels */}
      <div className="grid grid-cols-7 border-b">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="text-sm font-medium text-muted-foreground p-3 text-center border-r">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 overflow-auto">
        {renderCalendarGrid()}
      </div>
    </div>
  )
}