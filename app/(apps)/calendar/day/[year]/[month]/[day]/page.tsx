"use client"

import { DayView } from "@/components/calendar/day-view"
import { useState } from "react"

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

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Team Standup",
    date: new Date(2025, 7, 12),
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
    date: new Date(2025, 7, 12),
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
    date: new Date(2025, 7, 15),
    startTime: "09:00",
    endTime: "11:00",
    type: "task",
    color: "bg-green-500"
  },
  {
    id: "4",
    title: "Client Presentation",
    date: new Date(2025, 7, 20),
    startTime: "15:00",
    endTime: "16:30",
    type: "meeting",
    location: "Client Office",
    attendees: ["Sales Team", "Client"],
    color: "bg-orange-500"
  },
  {
    id: "5",
    title: "Code Review",
    date: new Date(2025, 7, 8),
    startTime: "11:00",
    endTime: "12:00",
    type: "task",
    color: "bg-cyan-500"
  },
  {
    id: "6",
    title: "Lunch Break",
    date: new Date(2025, 7, 8),
    startTime: "12:30",
    endTime: "13:30",
    type: "personal",
    color: "bg-gray-500"
  }
]

export default function CalendarDayPage() {
  const [currentDate] = useState(new Date(2025, 7, 8))
  
  return (
    <DayView 
      date={currentDate} 
      events={mockEvents}
    />
  )
}