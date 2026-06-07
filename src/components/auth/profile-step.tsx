"use client"

import { useState } from "react"

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "aa", label: "Afar" },
  { value: "ab", label: "Abkhazian" },
  { value: "ae", label: "Avestan" },
  { value: "af", label: "Afrikaans" },
  { value: "ak", label: "Akan" },
  { value: "am", label: "Amharic" },
  { value: "an", label: "Aragonese" },
  { value: "ar", label: "Arabic" },
  { value: "as", label: "Assamese" },
  { value: "av", label: "Avaric" },
  { value: "ay", label: "Aymara" },
  { value: "az", label: "Azerbaijani" },
  { value: "ba", label: "Bashkir" },
  { value: "be", label: "Belarusian" },
  { value: "bg", label: "Bulgarian" },
  { value: "bh", label: "Bihari" },
  { value: "bi", label: "Bislama" },
  { value: "bm", label: "Bambara" },
  { value: "bn", label: "Bengali" },
  { value: "bo", label: "Tibetan" },
  { value: "br", label: "Breton" },
  { value: "bs", label: "Bosnian" },
  { value: "ca", label: "Catalan" },
  { value: "ce", label: "Chechen" },
  { value: "ch", label: "Chamorro" },
  { value: "co", label: "Corsican" },
  { value: "cr", label: "Cree" },
  { value: "cs", label: "Czech" },
  { value: "cu", label: "Old Church Slavonic" },
  { value: "cv", label: "Chuvash" },
  { value: "cy", label: "Welsh" },
  { value: "da", label: "Danish" },
  { value: "de", label: "German" },
  { value: "dv", label: "Divehi" },
  { value: "dz", label: "Dzongkha" },
  { value: "ee", label: "Ewe" },
  { value: "el", label: "Greek" },
  { value: "eo", label: "Esperanto" },
  { value: "es", label: "Spanish" },
  { value: "et", label: "Estonian" },
  { value: "eu", label: "Basque" },
  { value: "fa", label: "Persian" },
  { value: "ff", label: "Fulah" },
  { value: "fi", label: "Finnish" },
  { value: "fj", label: "Fijian" },
  { value: "fo", label: "Faroese" },
  { value: "fr", label: "French" },
  { value: "fy", label: "Western Frisian" },
  { value: "ga", label: "Irish" },
  { value: "gd", label: "Scottish Gaelic" },
  { value: "gl", label: "Galician" },
  { value: "gn", label: "Guarani" },
  { value: "gu", label: "Gujarati" },
  { value: "gv", label: "Manx" },
  { value: "ha", label: "Hausa" },
  { value: "he", label: "Hebrew" },
  { value: "hi", label: "Hindi" },
  { value: "ho", label: "Hiri Motu" },
  { value: "hr", label: "Croatian" },
  { value: "ht", label: "Haitian Creole" },
  { value: "hu", label: "Hungarian" },
  { value: "hy", label: "Armenian" },
  { value: "hz", label: "Herero" },
  { value: "ia", label: "Interlingua" },
  { value: "id", label: "Indonesian" },
  { value: "ie", label: "Interlingue" },
  { value: "ig", label: "Igbo" },
  { value: "ii", label: "Sichuan Yi" },
  { value: "ik", label: "Inupiaq" },
  { value: "io", label: "Ido" },
  { value: "is", label: "Icelandic" },
  { value: "it", label: "Italian" },
  { value: "iu", label: "Inuktitut" },
  { value: "ja", label: "Japanese" },
  { value: "jv", label: "Javanese" },
  { value: "ka", label: "Georgian" },
  { value: "kg", label: "Kongo" },
  { value: "ki", label: "Kikuyu" },
  { value: "kj", label: "Kwanyama" },
  { value: "kk", label: "Kazakh" },
  { value: "kl", label: "Kalaallisut" },
  { value: "km", label: "Khmer" },
  { value: "kn", label: "Kannada" },
  { value: "ko", label: "Korean" },
  { value: "kr", label: "Kanuri" },
  { value: "ks", label: "Kashmiri" },
  { value: "ku", label: "Kurdish" },
  { value: "kv", label: "Komi" },
  { value: "kw", label: "Cornish" },
  { value: "ky", label: "Kyrgyz" },
  { value: "la", label: "Latin" },
  { value: "lb", label: "Luxembourgish" },
  { value: "lg", label: "Ganda" },
  { value: "li", label: "Limburgish" },
  { value: "ln", label: "Lingala" },
  { value: "lo", label: "Lao" },
  { value: "lt", label: "Lithuanian" },
  { value: "lu", label: "Luba-Katanga" },
  { value: "lv", label: "Latvian" },
  { value: "mg", label: "Malagasy" },
  { value: "mh", label: "Marshallese" },
  { value: "mi", label: "Maori" },
  { value: "mk", label: "Macedonian" },
  { value: "ml", label: "Malayalam" },
  { value: "mn", label: "Mongolian" },
  { value: "mr", label: "Marathi" },
  { value: "ms", label: "Malay" },
  { value: "mt", label: "Maltese" },
  { value: "my", label: "Burmese" },
  { value: "na", label: "Nauru" },
  { value: "nb", label: "Norwegian Bokmal" },
  { value: "nd", label: "North Ndebele" },
  { value: "ne", label: "Nepali" },
  { value: "ng", label: "Ndonga" },
  { value: "nl", label: "Dutch" },
  { value: "nn", label: "Norwegian Nynorsk" },
  { value: "no", label: "Norwegian" },
  { value: "nr", label: "South Ndebele" },
  { value: "nv", label: "Navajo" },
  { value: "ny", label: "Chichewa" },
  { value: "oc", label: "Occitan" },
  { value: "oj", label: "Ojibwa" },
  { value: "om", label: "Oromo" },
  { value: "or", label: "Oriya" },
  { value: "os", label: "Ossetian" },
  { value: "pa", label: "Punjabi" },
  { value: "pi", label: "Pali" },
  { value: "pl", label: "Polish" },
  { value: "ps", label: "Pashto" },
  { value: "pt", label: "Portuguese" },
  { value: "qu", label: "Quechua" },
  { value: "rm", label: "Romansh" },
  { value: "rn", label: "Kirundi" },
  { value: "ro", label: "Romanian" },
  { value: "ru", label: "Russian" },
  { value: "rw", label: "Kinyarwanda" },
  { value: "sa", label: "Sanskrit" },
  { value: "sc", label: "Sardinian" },
  { value: "sd", label: "Sindhi" },
  { value: "se", label: "Northern Sami" },
  { value: "sg", label: "Sango" },
  { value: "si", label: "Sinhala" },
  { value: "sk", label: "Slovak" },
  { value: "sl", label: "Slovenian" },
  { value: "sm", label: "Samoan" },
  { value: "sn", label: "Shona" },
  { value: "so", label: "Somali" },
  { value: "sq", label: "Albanian" },
  { value: "sr", label: "Serbian" },
  { value: "ss", label: "Swati" },
  { value: "st", label: "Southern Sotho" },
  { value: "su", label: "Sundanese" },
  { value: "sv", label: "Swedish" },
  { value: "sw", label: "Swahili" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "tg", label: "Tajik" },
  { value: "th", label: "Thai" },
  { value: "ti", label: "Tigrinya" },
  { value: "tk", label: "Turkmen" },
  { value: "tl", label: "Tagalog" },
  { value: "tn", label: "Tswana" },
  { value: "to", label: "Tonga" },
  { value: "tr", label: "Turkish" },
  { value: "ts", label: "Tsonga" },
  { value: "tt", label: "Tatar" },
  { value: "tw", label: "Twi" },
  { value: "ty", label: "Tahitian" },
  { value: "ug", label: "Uyghur" },
  { value: "uk", label: "Ukrainian" },
  { value: "ur", label: "Urdu" },
  { value: "uz", label: "Uzbek" },
  { value: "ve", label: "Venda" },
  { value: "vi", label: "Vietnamese" },
  { value: "vo", label: "Volapuk" },
  { value: "wa", label: "Walloon" },
  { value: "wo", label: "Wolof" },
  { value: "xh", label: "Xhosa" },
  { value: "yi", label: "Yiddish" },
  { value: "yo", label: "Yoruba" },
  { value: "za", label: "Zhuang" },
  { value: "zh", label: "Chinese" },
  { value: "zu", label: "Zulu" },
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
  const [showModal, setShowModal] = useState(false)

  const selected = LANGUAGES.find((l) => l.value === language)

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      {/* Name — giant, alone, centered */}
      <p className="font-heading text-4xl sm:text-5xl font-black tracking-tight text-center leading-none select-none pointer-events-none mb-14">
        {displayName}
      </p>

      {/* Language selector */}
      <div className="flex flex-col items-center gap-3">
        <label className="text-2xs text-muted-foreground uppercase tracking-[0.2em] font-medium">
          Language
        </label>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          disabled={isSubmitting}
          className="w-56 flex items-center justify-between bg-white/10 border border-white/25 text-sm text-foreground py-3 px-4 rounded-xl focus:outline-none focus:border-white/40 transition-all"
        >
          <span>{selected?.label ?? "Select language"}</span>
          <svg className="w-4 h-4 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Language modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[rgb(var(--background))] border border-white/15 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select language
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/10 text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04]">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => { onUpdateLanguage(l.value); setShowModal(false) }}
                  className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-white/5 ${
                    l.value === language ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Continue */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="text-sm font-heading font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
      >
        {isSubmitting ? "Setting up.." : "Continue"}
      </button>
    </div>
  )
}
