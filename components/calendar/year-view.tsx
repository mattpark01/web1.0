"use client"

import React from "react"
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

interface YearViewProps {
  date: Date
  events: CalendarEvent[]
  onMonthSelect?: (date: Date) => void
}

export function YearView({ date, events, onMonthSelect }: YearViewProps) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const getEventsForDate = (checkDate: Date) => {
    return events.filter(event => 
      event.date.getDate() === checkDate.getDate() &&
      event.date.getMonth() === checkDate.getMonth() &&
      event.date.getFullYear() === checkDate.getFullYear()
    )
  }

  const getMonthEventCount = (year: number, month: number) => {
    return events.filter(event => 
      event.date.getMonth() === month &&
      event.date.getFullYear() === year
    ).length
  }

  const isToday = (checkDate: Date) => {
    const today = new Date()
    return checkDate.getDate() === today.getDate() &&
           checkDate.getMonth() === today.getMonth() &&
           checkDate.getFullYear() === today.getFullYear()
  }

  const isCurrentMonth = (year: number, month: number) => {
    const today = new Date()
    return month === today.getMonth() && year === today.getFullYear()
  }

  const renderMiniMonth = (month: number) => {
    const year = date.getFullYear()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const days = []
    const totalCells = 42 // Always show 6 weeks for consistent layout

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - firstDay + 1
      const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth
      const currentDate = isValidDay 
        ? new Date(year, month, dayNumber)
        : null

      const hasEvents = currentDate ? getEventsForDate(currentDate).length > 0 : false

      days.push(
        <div key={i} className="flex items-center justify-center">
          {isValidDay ? (
            <Superellipse
              cornerRadius={3}
              className={`
                w-6 h-6 flex items-center justify-center cursor-pointer text-[11px] transition-colors
                ${currentDate && isToday(currentDate) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}
                ${hasEvents ? 'font-bold' : ''}
              `}
            >
              {dayNumber}
            </Superellipse>
          ) : (
            <div className="w-6 h-6" />
          )}
        </div>
      )
    }

    return days
  }

  return (
    <div className="h-full p-6 overflow-auto flex items-center">
      <div className="grid grid-cols-4 gap-6 w-full grid-rows-3 h-full">
        {monthNames.map((monthName, monthIndex) => {
          const eventCount = getMonthEventCount(date.getFullYear(), monthIndex)
          const isCurrent = isCurrentMonth(date.getFullYear(), monthIndex)
          
          return (
            <Superellipse
              key={monthIndex}
              cornerRadius={8}
              className={`
                bg-muted/10 p-4 cursor-pointer transition-colors hover:bg-muted/30 flex flex-col h-full
                ${isCurrent ? 'ring-2 ring-primary' : ''}
              `}
              onClick={() => onMonthSelect?.(new Date(date.getFullYear(), monthIndex, 1))}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-medium text-sm ${isCurrent ? 'text-primary' : ''}`}>
                  {monthName}
                </h3>
                {eventCount > 0 && (
                  <Superellipse cornerRadius={4} className="text-xs bg-muted px-2 py-0.5 inline-block">
                    {eventCount} events
                  </Superellipse>
                )}
              </div>
              
              {/* Mini calendar */}
              <div className="text-xs text-muted-foreground flex-1 flex flex-col">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="w-6 h-6 flex items-center justify-center text-[11px] font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderMiniMonth(monthIndex).map((day, index) => (
                    <React.Fragment key={`month-${monthIndex}-day-${index}`}>
                      {day}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </Superellipse>
          )
        })}
      </div>
    </div>
  )
}