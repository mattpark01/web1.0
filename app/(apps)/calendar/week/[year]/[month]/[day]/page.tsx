import CalendarWeekClient from "./calendar-week-client"

interface PageProps {
  params: Promise<{
    year: string
    month: string
    day: string
  }>
}

export default async function CalendarWeekPage({ params }: PageProps) {
  const { year, month, day } = await params
  
  // Parse and validate the parameters
  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)
  const dayNum = parseInt(day, 10)
  
  // Validate the values
  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum) || 
      monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    // Redirect to current week if invalid
    const now = new Date()
    return (
      <CalendarWeekClient 
        year={now.getFullYear()} 
        month={now.getMonth() + 1}
        day={now.getDate()}
      />
    )
  }
  
  return <CalendarWeekClient year={yearNum} month={monthNum} day={dayNum} />
}