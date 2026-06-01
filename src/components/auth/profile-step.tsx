"use client"

import { useCallback, useMemo, useState } from "react"
import { ArrowLeft, User } from "lucide-react"
import { AuthInput } from "./auth-input"
import { Select, type SelectOption } from "@/components/ui/select"

const COUNTRIES: SelectOption[] = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
  { value: "NG", label: "Nigeria" },
  { value: "KE", label: "Kenya" },
  { value: "ZA", label: "South Africa" },
  { value: "MX", label: "Mexico" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "SG", label: "Singapore" },
]

const LANGUAGES: SelectOption[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "pt", label: "Português" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "sw", label: "Kiswahili" },
]

interface ProfileData {
  displayName: string
  email: string
  countryCode: string
  language: string
  fieldErrors: Record<string, string>
}

interface ProfileStepProps {
  profile: ProfileData
  onUpdateField: (field: keyof ProfileData, value: string) => void
  onSetFieldError: (field: string, error: string | null) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export function ProfileStep({
  profile,
  onUpdateField,
  onSetFieldError,
  onBack,
  onSubmit,
  isSubmitting = false,
}: ProfileStepProps) {
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const validateField = useCallback(
    (field: "displayName" | "email", value: string) => {
      if (field === "displayName") {
        const trimmed = value.trim()
        if (!trimmed) {
          onSetFieldError("displayName", "Display name is required")
        } else if (trimmed.length < 2) {
          onSetFieldError("displayName", "Display name must be at least 2 characters")
        } else if (trimmed.length > 64) {
          onSetFieldError("displayName", "Display name must be 64 characters or less")
        } else {
          onSetFieldError("displayName", null)
        }
      }
      if (field === "email" && value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          onSetFieldError("email", "Invalid email address")
        } else {
          onSetFieldError("email", null)
        }
      }
    },
    [onSetFieldError]
  )

  const handleBlur = useCallback(
    (field: "displayName" | "email") => {
      setTouched((prev) => new Set(prev).add(field))
      validateField(field, profile[field])
    },
    [profile, validateField]
  )

  const canSubmit = useMemo(() => {
    return profile.displayName.trim().length >= 2
  }, [profile.displayName])

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aurora-violet/20">
            <User className="h-6 w-6 text-aurora-violet" />
          </div>
        </div>
        <p className="font-heading text-lg font-medium text-foreground">Complete your profile</p>
        <p className="text-sm text-muted-foreground">
          This information helps others recognize you in circles.
        </p>
      </div>

      <div className="space-y-4">
        <AuthInput
          label="Display name"
          type="text"
          autoCompleteType="name"
          placeholder="Your name"
          value={profile.displayName}
          onChange={(e) => onUpdateField("displayName", e.target.value)}
          onBlur={() => handleBlur("displayName")}
          error={touched.has("displayName") ? profile.fieldErrors.displayName : null}
          disabled={isSubmitting}
          maxLength={64}
        />

        <AuthInput
          label="Email (optional)"
          type="email"
          autoCompleteType="email"
          placeholder="you@example.com"
          value={profile.email}
          onChange={(e) => onUpdateField("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          error={touched.has("email") ? profile.fieldErrors.email : null}
          disabled={isSubmitting}
        />

        <Select
          label="Country (optional)"
          options={COUNTRIES}
          value={profile.countryCode}
          onChange={(value) => onUpdateField("countryCode", value)}
          placeholder="Select country"
          disabled={isSubmitting}
        />

        <Select
          label="Language"
          options={LANGUAGES}
          value={profile.language}
          onChange={(value) => onUpdateField("language", value)}
          placeholder="Select language"
          disabled={isSubmitting}
        />
      </div>

      {profile.fieldErrors.displayName && !touched.has("displayName") && (
        <p className="text-xs text-red-400" role="alert">
          {profile.fieldErrors.displayName}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className="w-full h-11 rounded-xl gradient-bg text-white text-sm font-heading font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isSubmitting ? "Saving..." : "Continue"}
      </button>
    </div>
  )
}
