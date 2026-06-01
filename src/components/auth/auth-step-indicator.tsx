"use client"

import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/cn"

interface Step {
  key: string
  label: string
  number: number
  optional?: boolean
}

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

  const isStepCompleted = (step: Step): boolean => {
    if (completedSteps?.has(step.key)) return true
    const stepIndex = steps.findIndex((s) => s.key === step.key)
    return stepIndex < currentStepIndex
  }

  const isStepCurrent = (step: Step): boolean => step.key === currentStep

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-0",
        className
      )}
    >
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                isStepCompleted(step)
                  ? "bg-emerald-500 text-white"
                  : isStepCurrent(step)
                    ? "gradient-bg text-white shadow-[0_0_16px_rgb(var(--aurora-violet)/0.4)]"
                    : "bg-white/10 text-muted-foreground"
              )}
            >
              {isStepCompleted(step) ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                step.number
              )}
            </span>
            <span className="text-2xs text-muted-foreground font-heading">
              {step.label}
              {step.optional && (
                <span className="block text-[10px] italic opacity-60">(optional)</span>
              )}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-8 h-px bg-gradient-to-r from-aurora-violet/50 to-aurora-cyan/30 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}