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

export function LocaleProvider({ children }: { children: ReactNode }) {
  const authUser = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [locale, setLocaleState] = useState("en")
  const [tick, setTick] = useState(0)

  // Force re-render when auth changes
  useEffect(() => {
    if (isAuthenticated && authUser?.preferredLanguage) {
      setLocaleState(authUser.preferredLanguage)
      localStorage.setItem("moistello_locale", authUser.preferredLanguage)
      return
    }
    const stored = typeof window !== "undefined" ? localStorage.getItem("moistello_locale") : null
    if (stored) setLocaleState(stored)
  }, [isAuthenticated, authUser?.preferredLanguage, tick])

  const setLocale = useCallback((lang: string) => {
    setLocaleState(lang)
    if (typeof window !== "undefined") localStorage.setItem("moistello_locale", lang)
    // Only persist to backend if authenticated
    const state = useAuthStore.getState()
    if (state.isAuthenticated && state.user) {
      import("@/lib/api-client").then(({ patch }) => {
        patch("/users/me", { preferredLanguage: lang }).catch(() => {})
      })
    }
    setTick((t) => t + 1)
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
