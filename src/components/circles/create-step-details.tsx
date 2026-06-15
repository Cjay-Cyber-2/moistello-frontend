"use client"

import React from "react"

import { Users, Shield, Award, Calendar, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/cn"
import { useAuth } from "@/hooks/use-auth"
import type { CircleFormData, CircleType } from "@/types"

interface CreateStepDetailsProps {
  formData: CircleFormData
  setFormData: React.Dispatch<React.SetStateAction<CircleFormData>>
  errors: Record<string, string>
}

const CIRCLE_TYPES: {
  value: CircleType
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  { value: "public", label: "Public", description: "Anyone can discover and join", icon: <Users className="h-5 w-5" /> },
  { value: "private", label: "Private", description: "Invite-only access", icon: <Shield className="h-5 w-5" /> },
  { value: "premium", label: "Premium", description: "High-trust circles", icon: <Award className="h-5 w-5" /> },
]

export function CreateStepDetails({ formData, setFormData, errors }: CreateStepDetailsProps) {
  const { user } = useAuth()
  const userMoiScore = user?.moiScore ?? 0
  const showPremiumWarning = formData.circleType === "premium" && userMoiScore < 50

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-lg font-semibold text-foreground dark:text-white">
        Circle Details
      </h3>
      <div className="space-y-4">
        <Input
          label="Circle Name"
          placeholder="e.g., Neighborhood Savings Circle"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          error={errors.name}
        />
        <Input
          label="Description (optional)"
          placeholder="Briefly describe the purpose of this circle"
          value={formData.description ?? ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div>
        <label className="mb-3 block font-heading text-sm text-muted-foreground">
          Circle Type
        </label>
        {showPremiumWarning && (
          <div className="mb-3 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Premium circles require at least <strong>50 MoiScore</strong>. Your score is <strong>{userMoiScore}</strong>.</span>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CIRCLE_TYPES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, circleType: ct.value }))}
              
              
              className={cn(
                "glass rounded-xl p-4 text-left transition-all duration-300",
                formData.circleType === ct.value
                  ? "glass-strong holo-border"
                  : "hover:glass-strong",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    formData.circleType === ct.value ? "gradient-text" : "text-muted-foreground",
                  )}
                >
                  {ct.icon}
                </span>
                <span className="font-heading font-semibold text-foreground dark:text-white text-sm">
                  {ct.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{ct.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Max Members"
          type="number"
          min={2}
          max={100}
          value={String(formData.maxMembers)}
          onChange={(e) => setFormData((prev) => ({ ...prev, maxMembers: Number(e.target.value) }))}
          error={errors.maxMembers}
        />
        <Input
          label="Start Date"
          type="datetime-local"
          value={formData.startDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
          leftIcon={<Calendar className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}
