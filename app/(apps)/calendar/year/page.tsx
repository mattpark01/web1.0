import { redirect } from 'next/navigation'

export default function CalendarYearIndexPage() {
  // Redirect to current year
  const now = new Date()
  const year = now.getFullYear()
  
  redirect(`/calendar/year/${year}`)
}