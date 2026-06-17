"use client"

import { useEffect, useState } from "react"
import { PublicLayout } from "@/components/layout/public-layout"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LandingContent } from "@/components/landing/landing-content"
import DashboardContent from "@/components/dashboard/dashboard-content"
import { useAuthStore } from "@/stores/auth-store"

export function HomeContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    if (!isLoading) setResolved(true)
  }, [isLoading])

  // SSR / initial load: show nothing while auth resolves
  if (!resolved) return null

  // Once resolved, show the right layout
  if (isAuthenticated) {
    return (
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    )
  }

  return (
    <PublicLayout>
      <LandingContent />
    </PublicLayout>
  )
}
