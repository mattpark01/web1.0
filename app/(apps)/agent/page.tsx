import { Bell } from "lucide-react"

export default function AgentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agent Inbox</h1>
        <p className="text-sm text-muted-foreground">Monitor and triage incoming alerts from all systems</p>
      </div>
      
      <div className="grid gap-4">
        <div className="rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-muted-foreground">All systems operating normally.</span>
          </div>
          
          <div className="space-y-4">
            <div className="text-center py-12">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-muted p-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">No alerts</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                All systems operating normally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}