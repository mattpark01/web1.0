import CalendarMonthClient from "./calendar-month-client"

interface PageProps {
  params: Promise<{
    year: string
    month: string
  }>
}

export default async function CalendarMonthPage({ params }: PageProps) {
  const { year, month } = await params
  
  // Parse and validate the year and month
  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)
  
  // Validate the values
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    // Redirect to current month if invalid
    const now = new Date()
    return (
      <CalendarMonthClient 
        year={now.getFullYear()} 
        month={now.getMonth() + 1} 
      />
    )
  }
  
  return <CalendarMonthClient year={yearNum} month={monthNum} />
}