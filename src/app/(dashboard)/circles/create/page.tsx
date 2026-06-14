"use client"

import React from "react"
import { PageHeader } from "@/components/shared/page-header"
import CreateCircleWizard from "@/components/circles/create-circle-wizard"

export default function CreateCirclePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Circle" description="Set up your savings circle in 2 minutes"
        breadcrumbs={[{ label: "Circles", href: "/circles" }, { label: "Create" }]} />
      <CreateCircleWizard />
    </div>
  )
}
