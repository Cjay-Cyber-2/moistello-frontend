"use client"

import { Sparkles, Globe } from "lucide-react"

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "pt", label: "Português" },
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
    <div className="relative">
      {/* Decorative background blobs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-aurora-violet/8 to-aurora-indigo/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-tr from-aurora-cyan/6 to-aurora-violet/4 blur-3xl pointer-events-none" />

      <div className="relative space-y-8">
        {/* Header section — no card, just centered content */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-aurora-violet/20 to-aurora-indigo/20">
            <Sparkles className="h-6 w-6 text-aurora-violet" />
          </div>
          <div>
            <p className="text-sm font-heading font-medium text-muted-foreground tracking-wide">
              You just joined the fun!
            </p>
          </div>
        </div>

        {/* Full-bleed gradient strip for the name */}
        <div className="relative mx-[-1.5rem] sm:mx-[-2rem]">
          <div className="absolute inset-0 bg-gradient-to-r from-aurora-violet/10 via-aurora-indigo/8 to-transparent" />
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-aurora-violet to-aurora-indigo" />
          <div className="relative px-8 py-8 sm:py-10">
            <p className="text-2xs font-heading font-medium text-muted-foreground uppercase tracking-[0.2em] mb-3">
              Your unique identity
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl font-black tracking-tight select-none pointer-events-none bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              {displayName}
            </h2>
          </div>
        </div>

        {/* Language — inline pill selector, no card */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-aurora-violet" />
            <span className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
              Language
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => onUpdateLanguage(lang.value)}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  language === lang.value
                    ? "bg-aurora-violet text-white shadow-[0_0_16px_rgb(var(--aurora-violet)/0.3)]"
                    : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 border border-white/10"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Continue — animated gradient button with glow */}
        <div className="relative pt-2">
          <div className="absolute -inset-4 bg-gradient-to-r from-aurora-violet/5 via-aurora-indigo/5 to-aurora-cyan/5 blur-2xl rounded-full pointer-events-none" />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="relative w-full h-13 rounded-full bg-gradient-to-r from-aurora-violet to-aurora-indigo text-white text-sm font-heading font-bold tracking-wide transition-all duration-300 hover:shadow-[0_0_32px_rgb(var(--aurora-violet)/0.35)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubmitting ? "Setting up..." : "Continue to Moistello"}
              {!isSubmitting && (
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              )}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </div>
      </div>
    </div>
  )
}
