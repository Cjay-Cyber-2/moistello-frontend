"use client"

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "pt", label: "Português" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "sw", label: "Kiswahili" },
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

      {/* Language — polished select */}
      <div className="flex flex-col items-center gap-3">
        <label className="text-2xs text-muted-foreground uppercase tracking-[0.2em] font-medium">
          Language
        </label>
        <div className="relative w-48">
          <select
            value={language}
            onChange={(e) => onUpdateLanguage(e.target.value)}
            disabled={isSubmitting}
            className="w-full appearance-none bg-white/5 border border-white/15 text-sm text-foreground py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:border-aurora-violet/60 focus:bg-white/[0.07] hover:border-white/30 transition-all duration-200 cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value} className="bg-[rgb(var(--background))] text-foreground">
                {l.label}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-[10px] pointer-events-none">
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
