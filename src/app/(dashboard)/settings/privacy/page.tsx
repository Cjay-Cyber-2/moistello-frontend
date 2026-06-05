"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Shield, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { patch } from "@/lib/api-client"

export default function PrivacySettingsPage() {
  const [profileVisibility, setProfileVisibility] = useState("public")
  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [allowFriendRequests, setAllowFriendRequests] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await patch("/users/me", {
        profileVisibility,
        showOnLeaderboard: showLeaderboard,
        allowFriendRequests,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
    } finally {
      setSaving(false)
    }
  }, [profileVisibility, showLeaderboard, allowFriendRequests])

  const VISIBILITY_OPTIONS = [
    { value: "public", label: "Public", desc: "Anyone can see your profile and activity" },
    { value: "members", label: "Members only", desc: "Only logged-in members can see your profile" },
    { value: "private", label: "Private", desc: "Only friends can see your profile" },
  ]

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">Privacy</h1>
          <p className="text-sm text-muted-foreground">Control who can see your information</p>
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="glass-premium rounded-2xl p-6 space-y-4">
        <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-aurora-violet" />
          Profile Visibility
        </h3>
        <div className="space-y-3">
          {VISIBILITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                profileVisibility === opt.value ? "glass-strong" : "hover:glass-whisper"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={profileVisibility === opt.value}
                onChange={(e) => setProfileVisibility(e.target.value)}
                className="h-4 w-4 mt-0.5 accent-aurora-violet"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="glass-premium rounded-2xl p-6 space-y-5">
        <h3 className="font-heading text-sm font-semibold text-foreground">Preferences</h3>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Show on Leaderboard</p>
            <p className="text-xs text-muted-foreground">Your stats appear on the public leaderboard</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showLeaderboard}
            onClick={() => setShowLeaderboard((v) => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
              showLeaderboard ? "bg-aurora-violet" : "bg-white/10"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                showLeaderboard ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Allow Friend Requests</p>
            <p className="text-xs text-muted-foreground">Other members can send you friend requests</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={allowFriendRequests}
            onClick={() => setAllowFriendRequests((v) => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
              allowFriendRequests ? "bg-aurora-violet" : "bg-white/10"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                allowFriendRequests ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
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
        <Button variant="primary" size="md" onClick={handleSave} isLoading={saving}>
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
