"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import en from "./en.json"
import fr from "./fr.json"

type TranslationDict = Record<string, string>

const LOCALE_MAP: Record<string, TranslationDict> = { en, fr }

interface LocaleContextType {
  locale: string
  setLocale: (lang: string) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
})

export function useTranslate() {
  return useContext(LocaleContext)
}

export function LocaleProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode
  initialLocale?: string
}) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window === "undefined") return initialLocale
    return localStorage.getItem("moistello_locale") || initialLocale
  })

  const setLocale = useCallback((lang: string) => {
    setLocaleState(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem("moistello_locale", lang)
    }
    import("@/lib/api-client").then(({ patch }) => {
      patch("/users/me", { preferredLanguage: lang }).catch(() => {})
    })
  }, [])

  const t = useCallback(
    (key: string): string => {
      const dict = LOCALE_MAP[locale]
      if (dict && key in dict) return dict[key]
      if (key in en) return (en as TranslationDict)[key]
      return key
    },
    [locale],
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}
