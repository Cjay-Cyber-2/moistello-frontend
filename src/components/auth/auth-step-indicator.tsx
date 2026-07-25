"use client"

import { CreateStepIndicator, type Step } from "@/components/circles/create-step-indicator"
import { cn } from "@/lib/cn"

interface AuthStepIndicatorProps {
  steps: Step[]
  currentStep: string
  completedSteps?: Set<string>
  className?: string
}

export function AuthStepIndicator({
  steps,
  currentStep,
  completedSteps,
  className,
}: AuthStepIndicatorProps) {
  const currentStepIndex = steps.findIndex((s) => s.key === currentStep)
  const currentStepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : 1

  const normalizedSteps = steps.map((step, index) => ({
    key: step.key,
    label: step.label,
    number: step.number ?? index + 1,
    optional: step.optional,
  }))

  const completedCount = completedSteps ? normalizedSteps.filter((s) => completedSteps.has(s.key ?? "")).length : currentStepIndex

  return (
    <CreateStepIndicator
      currentStep={currentStepNumber}
      steps={normalizedSteps}
      variant="auth"
      className={className}
    />
  )
}
