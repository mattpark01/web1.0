import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your preferences</p>
      </div>
      
      <div className="grid gap-4">
        <div className=" border p-6">
          <div className="space-y-4">
            <div className="text-center py-12">
              <div className="mb-4 flex justify-center">
                <div className=" bg-muted p-4">
                  <Settings className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Settings</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Customize your experience and preferences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}