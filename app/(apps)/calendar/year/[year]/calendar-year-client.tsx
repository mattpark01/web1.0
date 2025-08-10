"use client"

import { YearView } from "@/components/calendar/year-view"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface CalendarYearClientProps {
  year: number
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

export default function CalendarYearClient({ year }: CalendarYearClientProps) {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // Generate events based on the year
  const mockEvents: CalendarEvent[] = [
    {
      id: "1",
      title: "Team Standup",
      date: new Date(year, 7, 12),
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
      date: new Date(year, 7, 12),
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
      date: new Date(year, 7, 15),
      startTime: "09:00",
      endTime: "11:00",
      type: "task",
      color: "bg-green-500"
    },
    {
      id: "4",
      title: "Design Sprint",
      date: new Date(year, 7, 20),
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
      date: new Date(year, 7, 25),
      startTime: "09:00",
      endTime: "12:00",
      type: "meeting",
      location: "Main Conference Room",
      attendees: ["All Hands"],
      color: "bg-orange-500"
    }
  ]

  const handleMonthClick = (month: number) => {
    const monthStr = String(month + 1).padStart(2, '0')
    router.push(`/calendar/month/${year}/${monthStr}`)
  }

  return (
    <YearView 
      date={new Date(year, 0, 1)}
      events={mockEvents}
      onMonthSelect={(date) => handleMonthClick(date.getMonth())}
    />
  )
}