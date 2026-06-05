"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Globe, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { patch } from "@/lib/api-client"

const LANGUAGES = [
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

const TIMEZONES = [
  { value: "Africa/Lagos", label: "WAT (UTC+1) — Lagos" },
  { value: "Africa/Nairobi", label: "EAT (UTC+3) — Nairobi" },
  { value: "Africa/Johannesburg", label: "SAST (UTC+2) — Johannesburg" },
  { value: "Africa/Cairo", label: "EET (UTC+2) — Cairo" },
  { value: "Africa/Casablanca", label: "WET/UTC — Casablanca" },
  { value: "America/New_York", label: "ET (UTC-5) — New York" },
  { value: "America/Chicago", label: "CT (UTC-6) — Chicago" },
  { value: "America/Denver", label: "MT (UTC-7) — Denver" },
  { value: "America/Los_Angeles", label: "PT (UTC-8) — Los Angeles" },
  { value: "America/Sao_Paulo", label: "BRT (UTC-3) — São Paulo" },
  { value: "Europe/London", label: "GMT/BST — London" },
  { value: "Europe/Berlin", label: "CET/CEST — Berlin" },
  { value: "Europe/Paris", label: "CET/CEST — Paris" },
  { value: "Asia/Dubai", label: "GST (UTC+4) — Dubai" },
  { value: "Asia/Tokyo", label: "JST (UTC+9) — Tokyo" },
  { value: "Asia/Shanghai", label: "CST (UTC+8) — Shanghai" },
  { value: "Asia/Kolkata", label: "IST (UTC+5:30) — Kolkata" },
  { value: "Australia/Sydney", label: "AEST (UTC+10) — Sydney" },
  { value: "Pacific/Auckland", label: "NZST (UTC+12) — Auckland" },
]

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK/EU)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY (DE)" },
]

const NUMBER_FORMATS = [
  { value: "1,234.56", label: "1,234.56 (US/UK)" },
  { value: "1.234,56", label: "1.234,56 (EU)" },
  { value: "1 234,56", label: "1 234,56 (FR)" },
]

const WEEK_START = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
  { value: "saturday", label: "Saturday" },
]

export default function LanguageSettingsPage() {
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("Africa/Lagos")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")
  const [numberFormat, setNumberFormat] = useState("1,234.56")
  const [weekStart, setWeekStart] = useState("monday")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await patch("/users/me", {
        preferredLanguage: language,
        timezone,
        dateFormat,
        numberFormat,
        weekStartDay: weekStart,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
    } finally {
      setSaving(false)
    }
  }, [language, timezone, dateFormat, numberFormat, weekStart])

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Language & Region</h1>
          <p className="text-sm text-muted-foreground">Set your language, timezone, and regional preferences</p>
        </div>
      </div>

      <div className="glass-premium rounded-2xl p-6 space-y-5">
        <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-aurora-violet" />
          Regional Settings
        </h3>

        <Select
          label="Language"
          options={LANGUAGES}
          value={language}
          onChange={setLanguage}
          placeholder="Select language"
        />

        <Select
          label="Timezone"
          options={TIMEZONES}
          value={timezone}
          onChange={setTimezone}
          placeholder="Select timezone"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Date Format"
            options={DATE_FORMATS}
            value={dateFormat}
            onChange={setDateFormat}
          />
          <Select
            label="Number Format"
            options={NUMBER_FORMATS}
            value={numberFormat}
            onChange={setNumberFormat}
          />
        </div>

        <Select
          label="First Day of Week"
          options={WEEK_START}
          value={weekStart}
          onChange={setWeekStart}
        />

        <p className="text-xs text-muted-foreground">
          These preferences affect how dates, times, and numbers are displayed throughout the app.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Link href="/settings">
          <Button variant="outline" size="md">Cancel</Button>
        </Link>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <Button variant="primary" size="md" onClick={handleSave} isLoading={saving}>
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
