"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCreateCircle } from "@/hooks/use-circles"
import { createCircleSchema, safeParse, type CreateCircleInput } from "@/lib/validators"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { CreateStepIndicator } from "@/components/circles/create-step-indicator"
import { CreateStepDetails } from "@/components/circles/create-step-details"
import { CreateStepFinancials } from "@/components/circles/create-step-financials"
import { CreateStepPayout } from "@/components/circles/create-step-payout"
import { CreateStepReview } from "@/components/circles/create-step-review"
import { useUIStore } from "@/stores/ui-store"
import type { CircleFormData } from "@/types"

const STEP_LABELS = ["Details", "Financials", "Payout", "Review"]

const INITIAL_FORM: CircleFormData = {
  name: "", description: "", circleType: "public", payoutType: "random",
  contributionAmount: 100, currency: "USDC", frequency: "monthly", maxMembers: 10,
  minMoiScore: 0, collateralPercent: 10, lateFeePercent: 5, gracePeriodHours: 24,
  maxStrikes: 3, startDate: "",
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
}

const ANIM = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }

const STEPS = [CreateStepDetails, CreateStepFinancials, CreateStepPayout, CreateStepReview] as const

export default function CreateCirclePage() {
  const router = useRouter()
  const createCircle = useCreateCircle()
  const addToast = useUIStore((s) => s.addToast)

  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<CircleFormData>(INITIAL_FORM)

  const buildFormData = useCallback((): CreateCircleInput => {
    const d = formData
    return {
      name: d.name, description: d.description || undefined, circleType: d.circleType,
      payoutType: d.payoutType, contributionAmount: d.contributionAmount, currency: d.currency,
      frequency: d.frequency, maxMembers: d.maxMembers,
      minMoiScore: d.minMoiScore ?? undefined, collateralPercent: d.collateralPercent ?? undefined,
      lateFeePercent: d.lateFeePercent, gracePeriodHours: d.gracePeriodHours,
      maxStrikes: d.maxStrikes, startDate: d.startDate || new Date().toISOString(),
    }
  }, [formData])

  const validateStep = useCallback((step: number): boolean => {
    setErrors({})
    const d = formData
    if (step === 1) {
      if (d.name.length < 3) { setErrors({ name: "Name must be at least 3 characters" }); return false }
      if (d.maxMembers < 2) { setErrors({ maxMembers: "Must have at least 2 members" }); return false }
      return true
    }
    if (step === 2) {
      if (d.contributionAmount <= 0) { setErrors({ contributionAmount: "Contribution must be positive" }); return false }
      return true
    }
    if (step === 3) return true
    const result = safeParse(createCircleSchema, buildFormData())
    if (!result.success) {
      setErrors(result.errors)
      return false
    }
    return true
  }, [formData, buildFormData])

  const go = (dir: number, step: number) => { setDirection(dir); setCurrentStep(step) }

  const handleNext = () => { if (validateStep(currentStep)) go(1, Math.min(4, currentStep + 1)) }
  const handleBack = () => { setErrors({}); go(-1, Math.max(1, currentStep - 1)) }
  const handleSubmit = () => {
    if (!validateStep(4)) return
    const payload = buildFormData()
    setErrors({})
    createCircle.mutate(payload as unknown as Parameters<typeof createCircle.mutate>[0], {
      onSuccess: (res: unknown) => {
        const data = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined
        const circle = data?.circle as Record<string, unknown> | undefined
        const rawId = circle?.id
        const circleId = typeof rawId === "string" ? rawId : undefined
        addToast({ type: "success", title: "Circle created!", description: "Your savings circle is ready." })
        setTimeout(() => router.push(circleId ? `/circles/${circleId}` : "/circles"), 500)
      },
      onError: (err: unknown) => {
        const raw = (err as { response?: { data?: Record<string, unknown> } })?.response?.data?.error
        const msg = typeof raw === "string" ? raw
          : err instanceof Error ? err.message
          : "Failed to create circle. Please try again."
        setErrors({ submit: msg })
      },
    })
  }

  const StepC = STEPS[currentStep - 1]
  const stepProps = currentStep === 4
    ? { formData, isPending: createCircle.isPending, errors }
    : { formData, setFormData, errors }

  return (
    <div className="space-y-6">
      <PageHeader title="Create Circle" description="Set up your savings circle in 2 minutes"
        breadcrumbs={[{ label: "Circles", href: "/circles" }, { label: "Create" }]} />
      <div className="mx-auto max-w-2xl">
        <CreateStepIndicator currentStep={currentStep} steps={STEP_LABELS} />
        <div className="glass-premium rounded-2xl p-6 md:p-8 holo-border">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={`step-${currentStep}`} custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit" transition={ANIM}>
              <StepC
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...(stepProps as any)} />
            </motion.div>
          </AnimatePresence>
        </div>
        {errors.submit && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {errors.submit}
          </div>
        )}
        <div className="mt-6 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button variant="outline" size="md" onClick={handleBack}
              leftIcon={<ChevronLeft className="h-4 w-4" />}>Previous</Button>
          ) : <div />}
          {currentStep < 4 ? (
            <Button variant="primary" size="md" onClick={handleNext}
              rightIcon={<ChevronRight className="h-4 w-4" />}>Next</Button>
          ) : (
            <Button variant="premium" size="lg" onClick={handleSubmit}
              isLoading={createCircle.isPending}>Create Circle</Button>
          )}
        </div>
      </div>
    </div>
  )
}
