import { AppLayout } from "@/components/layout/app-layout"

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}