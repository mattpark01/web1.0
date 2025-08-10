"use client"

import { WeekView } from "@/components/calendar/week-view"

interface CalendarWeekClientProps {
  year: number
  month: number
  day: number
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

export default function CalendarWeekClient({ year, month, day }: CalendarWeekClientProps) {
  // Calculate the week that contains the given date
  const currentDate = new Date(year, month - 1, day)
  
  // Generate mock events for the week
  const mockEvents: CalendarEvent[] = [
    {
      id: "1",
      title: "Team Standup",
      date: new Date(year, month - 1, day),
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
      date: new Date(year, month - 1, day),
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
      date: new Date(year, month - 1, day + 1),
      startTime: "09:00",
      endTime: "11:00",
      type: "task",
      color: "bg-green-500"
    },
    {
      id: "4",
      title: "Design Sprint",
      date: new Date(year, month - 1, day + 2),
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
      date: new Date(year, month - 1, day + 3),
      startTime: "09:00",
      endTime: "12:00",
      type: "meeting",
      location: "Main Conference Room",
      attendees: ["All Hands"],
      color: "bg-orange-500"
    }
  ]
  
  return (
    <WeekView date={currentDate} events={mockEvents} />
  )
}