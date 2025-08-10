import { redirect } from "next/navigation"

export default function CalendarPage() {
  // Get current date
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  
  // Redirect to current month view by default
  redirect(`/calendar/month/${year}/${month}`)
}