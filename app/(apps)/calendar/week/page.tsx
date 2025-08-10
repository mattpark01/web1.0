import { redirect } from 'next/navigation'

export default function CalendarWeekIndexPage() {
  // Redirect to current week
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  
  redirect(`/calendar/week/${year}/${month}/${day}`)
}