"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Check } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { patch } from "@/lib/api-client"

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
  { value: "NG", label: "Nigeria" },
  { value: "KE", label: "Kenya" },
  { value: "ZA", label: "South Africa" },
  { value: "MX", label: "Mexico" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "SG", label: "Singapore" },
]

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

export default function AccountSettingsPage() {
  const { user, isLoading: authLoading } = useAuth()

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [language, setLanguage] = useState("en")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "")
      setEmail(user.email ?? "")
      setPhone(user.phone ?? "")
      setCountry(user.countryCode ?? "")
      setLanguage(user.preferredLanguage ?? "en")
    }
  }, [user])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await patch("/users/me", {
        displayName: displayName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        countryCode: country || undefined,
        preferredLanguage: language || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
    } finally {
      setSaving(false)
    }
  }, [displayName, email, phone, country, language])

  if (authLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-64 glass-premium rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Account</h1>
          <p className="text-sm text-muted-foreground">Manage your account details and preferences</p>
        </div>
      </div>

      <div className="glass-premium rounded-2xl p-6 space-y-5">
        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your public name"
          hint="2-50 characters. Shown on your profile."
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          hint="Optional. Used for account recovery."
        />

        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1234567890"
          hint="Optional. Used for notifications."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Country"
            options={COUNTRIES}
            value={country}
            onChange={setCountry}
            placeholder="Select country"
          />
          <Select
            label="Language"
            options={LANGUAGES}
            value={language}
            onChange={setLanguage}
            placeholder="Select language"
          />
        </div>
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
        <Button variant="primary" size="md" onClick={handleSave} isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
