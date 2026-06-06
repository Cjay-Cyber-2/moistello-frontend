"use client"

import { Sparkles, Globe } from "lucide-react"
import { Select, type SelectOption } from "@/components/ui/select"

const LANGUAGES: SelectOption[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "pt", label: "Português" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "sw", label: "Kiswahili" },
  { value: "ha", label: "Hausa" },
  { value: "yo", label: "Yoruba" },
  { value: "ig", label: "Igbo" },
]

interface ProfileStepProps {
  displayName: string
  language: string
  onUpdateLanguage: (lang: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export function ProfileStep({
  displayName,
  language,
  onUpdateLanguage,
  onSubmit,
  isSubmitting = false,
}: ProfileStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
        </div>
        <p className="font-heading text-base font-medium text-muted-foreground">
          Just joined the fun!
        </p>
      </div>

      {/* Generated Name */}
      <div className="glass-premium rounded-2xl p-6 text-center">
        <div className="font-heading text-2xl font-black gradient-text-extended tracking-tight select-none pointer-events-none">
          {displayName}
        </div>
      </div>

      {/* Language Select */}
      <div className="glass-premium rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-aurora-violet" />
          <h3 className="font-heading text-sm font-semibold text-foreground">Language</h3>
        </div>
        <Select
          label="Preferred Language"
          options={LANGUAGES}
          value={language}
          onChange={onUpdateLanguage}
          placeholder="Select language"
          disabled={isSubmitting}
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full h-12 rounded-xl gradient-bg text-white text-sm font-heading font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isSubmitting ? "Setting up..." : "Continue"}
      </button>
    </div>
  )
}
