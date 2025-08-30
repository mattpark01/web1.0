import { AppLayout } from "@/components/layout/app-layout"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function AppsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side authentication check - runs before ANY rendering
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sessionId')?.value
  
  if (!sessionId) {
    console.log('[AppsLayout] No session found, redirecting to signin')
    redirect('/signin')
  }
  
  // Verify the session is valid in the database
  const user = await prisma.user.findUnique({
    where: { sessionId },
    select: { id: true }
  })
  
  if (!user) {
    console.log('[AppsLayout] Invalid session, redirecting to signin')
    redirect('/signin')
  }
  
  // User is authenticated, render the app
  return <AppLayout>{children}</AppLayout>
}