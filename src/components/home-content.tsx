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
  const [showDashboard, setShowDashboard] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setShowDashboard(true)
    }
  }, [isAuthenticated, isLoading])

  // Show landing page immediately for unauthenticated users.
  // SSR and initial client render both show the landing page.
  if (!showDashboard) {
    return (
      <PublicLayout>
        <LandingContent />
      </PublicLayout>
    )
  }

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  )
}
