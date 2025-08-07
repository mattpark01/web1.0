import { BookOpen } from "lucide-react"

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notes</h1>
        <p className="text-sm text-muted-foreground">Capture and organize your thoughts</p>
      </div>
      
      <div className="grid gap-4">
        <div className="rounded-lg border p-6">
          <div className="space-y-4">
            <div className="text-center py-12">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-muted p-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Write, organize, and share your notes and ideas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}