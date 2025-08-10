import { redirect } from 'next/navigation'

export default function CalendarMonthIndexPage() {
  // Redirect to current month
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  
  redirect(`/calendar/month/${year}/${month}`)
}