"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import en from "./en.json"
import fr from "./fr.json"
import { useAuthStore } from "@/stores/auth-store"

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
}: {
  children: ReactNode
}) {
  const authUser = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [locale, setLocaleState] = useState("en")

  // Initialize from: 1) auth user profile, 2) localStorage, 3) English
  useEffect(() => {
    if (isAuthenticated && authUser?.preferredLanguage) {
      setLocaleState(authUser.preferredLanguage)
      localStorage.setItem("moistello_locale", authUser.preferredLanguage)
      return
    }
    const stored = typeof window !== "undefined" ? localStorage.getItem("moistello_locale") : null
    if (stored) {
      setLocaleState(stored)
    }
  }, [isAuthenticated, authUser?.preferredLanguage])

  const persistLocale = useCallback(async (lang: string) => {
    const { patch } = await import("@/lib/api-client")
    for (let i = 0; i < 3; i++) {
      try {
        await patch("/users/me", { preferredLanguage: lang })
        return
      } catch {
        if (i === 2) {
          console.warn(`[locale] failed to persist language "${lang}" after 3 attempts`)
          return
        }
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
      }
    }
  }, [])

  const setLocale = useCallback((lang: string) => {
    setLocaleState(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem("moistello_locale", lang)
    }
    persistLocale(lang)
  }, [persistLocale])

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
