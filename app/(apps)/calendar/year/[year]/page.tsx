import CalendarYearClient from "./calendar-year-client"

interface PageProps {
  params: Promise<{
    year: string
  }>
}

export default async function CalendarYearPage({ params }: PageProps) {
  const { year } = await params
  
  // Parse and validate the year
  const yearNum = parseInt(year, 10)
  
  // Validate the value
  if (isNaN(yearNum)) {
    // Redirect to current year if invalid
    const now = new Date()
    return <CalendarYearClient year={now.getFullYear()} />
  }
  
  return <CalendarYearClient year={yearNum} />
}