"use client"

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
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      {/* Thin vertical accent bar */}
      <div className="w-px h-16 bg-gradient-to-b from-aurora-violet/60 to-transparent mb-10" />

      {/* Name — giant, alone, centered */}
      <p className="font-heading text-4xl sm:text-5xl font-black tracking-tight text-center leading-none select-none pointer-events-none mb-14">
        {displayName}
      </p>

      {/* Language — minimal inline row */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground uppercase tracking-[0.15em] font-medium">
          Language
        </label>
        <div className="relative">
          <select
            value={language}
            onChange={(e) => onUpdateLanguage(e.target.value)}
            disabled={isSubmitting}
            className="appearance-none bg-transparent border-b border-white/20 text-sm text-foreground py-1 pr-8 pl-1 focus:outline-none focus:border-aurora-violet transition-colors cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value} className="bg-background">
                {l.label}
              </option>
            ))}
          </select>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
            ▼
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Continue — minimal ghost button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="group relative text-sm font-heading font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 disabled:opacity-30"
      >
        <span className="relative">
          {isSubmitting ? "Setting up..." : "Continue"}
          <span className="absolute -bottom-1 left-0 right-0 h-px bg-current scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </span>
      </button>
    </div>
  )
}
