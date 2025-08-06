import { Calendar } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">Schedule and manage your time</p>
      </div>
      
      <div className="grid gap-4">
        <div className="rounded-lg border p-6">
          <div className="space-y-4">
            <div className="text-center py-12">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-muted p-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Calendar</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Manage your schedule and upcoming events.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}