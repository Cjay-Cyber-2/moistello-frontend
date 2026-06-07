"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import ALL from "./translations.json"
import { useAuthStore } from "@/stores/auth-store"

type TranslationDict = Record<string, string>
const ALL_LOCALES = ALL as unknown as Record<string, TranslationDict>

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

  useEffect(() => {
    if (isAuthenticated && authUser?.preferredLanguage) {
      setLocaleState(authUser.preferredLanguage)
      localStorage.setItem("moistello_locale", authUser.preferredLanguage)
      return
    }
    const stored = typeof window !== "undefined" ? localStorage.getItem("moistello_locale") : null
    if (stored) setLocaleState(stored)
  }, [isAuthenticated, authUser?.preferredLanguage])

  const setLocale = useCallback((lang: string) => {
    setLocaleState(lang)
    if (typeof window !== "undefined") localStorage.setItem("moistello_locale", lang)
    const state = useAuthStore.getState()
    if (state.isAuthenticated && state.user) {
      import("@/lib/api-client").then(({ patch }) => {
        patch("/users/me", { preferredLanguage: lang }).catch(() => {})
      })
    }
  }, [])

  const t = useCallback(
    (key: string): string => {
      const dict = ALL_LOCALES[locale]
      if (dict && key in dict) return dict[key]
      const enDict = ALL_LOCALES.en
      if (enDict && key in enDict) return enDict[key]
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
