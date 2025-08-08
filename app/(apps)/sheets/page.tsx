import { Table } from "lucide-react"

export default function SheetsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sheets</h1>
        <p className="text-sm text-muted-foreground">Create and manage spreadsheets</p>
      </div>
      
      <div className="grid gap-4">
        <div className=" border p-6">
          <div className="space-y-4">
            <div className="text-center py-12">
              <div className="mb-4 flex justify-center">
                <div className=" bg-muted p-4">
                  <Table className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Sheets</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Build powerful spreadsheets and analyze your data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}