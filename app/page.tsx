import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function Home() {
  // Check authentication before redirecting
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sessionId')?.value
  
  if (!sessionId) {
    redirect("/signin")
  }
  
  // User is authenticated, redirect to agent
  redirect("/agent")
}
