"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Superellipse } from "@/components/ui/superellipse/superellipse"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { CalendarCommands } from "./calendar-commands"

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 8))
  
  // Extract view mode from pathname
  const getViewMode = () => {
    if (pathname.includes('/year')) return 'year'
    if (pathname.includes('/month')) return 'month'
    if (pathname.includes('/week')) return 'week'
    if (pathname.includes('/day')) return 'day'
    return 'month' // default
  }
  
  const viewMode = getViewMode()
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  const navigate = (direction: number) => {
    let newDate = new Date(currentDate)
    
    if (viewMode === 'year') {
      newDate.setFullYear(currentDate.getFullYear() + direction)
    } else if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction)
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction * 7))
    } else if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + direction)
    }
    
    setCurrentDate(newDate)
  }
  
  const getHeaderTitle = () => {
    if (viewMode === 'year') {
      return currentDate.getFullYear().toString()
    } else if (viewMode === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate)
      const weekEnd = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
  }
  
  const handleViewChange = (view: string) => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    
    switch(view) {
      case 'year':
        router.push(`/calendar/year/${year}`)
        break
      case 'month':
        router.push(`/calendar/month/${year}/${month}`)
        break
      case 'week':
        router.push(`/calendar/week/${year}/${month}/${day}`)
        break
      case 'day':
        router.push(`/calendar/day/${year}/${month}/${day}`)
        break
      default:
        router.push(`/calendar/month/${year}/${month}`)
    }
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {getHeaderTitle()}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Superellipse cornerRadius={6} className="flex items-center gap-1 bg-muted/20">
            <Button
              variant={viewMode === 'year' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('year')}
              className="h-8"
            >
              Year
            </Button>
            <Button
              variant={viewMode === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('month')}
              className="h-8"
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('week')}
              className="h-8"
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('day')}
              className="h-8"
            >
              Day
            </Button>
          </Superellipse>
          <Button size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            New Event
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      
      {/* Register calendar commands */}
      <CalendarCommands />
    </div>
  )
}