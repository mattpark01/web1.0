import { Settings } from "lucide-react"
import { Superellipse } from "@/components/ui/superellipse/superellipse"

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
        
        {/* Test superellipse borders */}
        <div className="border p-6">
          <h2 className="text-xl font-semibold mb-4">Superellipse Border Tests</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Solid border */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Solid Border</h3>
              <Superellipse
                width={120}
                height={80}
                cornerRadius={16}
                cornerSmoothing={0.8}
                className="bg-blue-100 border-2 border-blue-600"
              >
                <div className="flex items-center justify-center h-full text-sm">
                  Solid
                </div>
              </Superellipse>
            </div>
            
            {/* Dashed border */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Dashed Border</h3>
              <Superellipse
                width={120}
                height={80}
                cornerRadius={16}
                cornerSmoothing={0.8}
                className="bg-green-100 border-3 border-dashed border-green-500"
              >
                <div className="flex items-center justify-center h-full text-sm">
                  Dashed
                </div>
              </Superellipse>
            </div>
            
            {/* Thick border */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Thick Border</h3>
              <Superellipse
                width={120}
                height={80}
                cornerRadius={20}
                cornerSmoothing={1}
                className="bg-red-100 border-4 border-red-500"
              >
                <div className="flex items-center justify-center h-full text-sm">
                  Thick
                </div>
              </Superellipse>
            </div>
            
            {/* Custom dash pattern */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Custom Dash</h3>
              <Superellipse
                width={120}
                height={80}
                cornerRadius={12}
                cornerSmoothing={0.6}
                className="bg-purple-100 border-2 border-dashed border-purple-500"
              >
                <div className="flex items-center justify-center h-full text-sm">
                  Custom
                </div>
              </Superellipse>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}