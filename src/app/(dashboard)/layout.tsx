"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useRequireAuth } from "@/hooks/use-auth"

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useRequireAuth()

  if (!isAuthenticated) return null

  return <DashboardLayout>{children}</DashboardLayout>
}
