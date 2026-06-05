"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { User, Save, Check } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { patch } from "@/lib/api-client"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function ProfileSettingsPage() {
  const { user, isLoading: authLoading } = useAuth()

  const [displayName, setDisplayName] = useState(user?.displayName ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await patch("/users/me", {
        displayName: displayName.trim() || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
    } finally {
      setSaving(false)
    }
  }, [displayName])

  if (authLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile Settings" description="Edit your public profile." />
        <div className="mx-auto max-w-lg space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-premium rounded-2xl p-5 h-16 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Edit your public profile information."
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Profile" }]}
      />

      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-lg space-y-5">
        {/* Avatar Section */}
        <motion.div variants={item} className="glass-premium rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-bg text-white font-mono text-2xl font-bold">
            {displayName?.charAt(0)?.toUpperCase() ?? user?.walletAddress?.slice(0, 2)?.toUpperCase() ?? "U"}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Avatar coming soon. Your avatar is generated from your display name initial.
          </p>
        </motion.div>

        {/* Display Name */}
        <motion.div variants={item} className="glass-premium rounded-2xl p-5 space-y-4">
          <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-aurora-violet" />
            Public Profile
          </h3>

          <Input
            label="Display Name"
            placeholder="Your public name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            hint="This is how others see you."
          />

          <Input
            label="Wallet Address"
            value={user?.walletAddress ?? ""}
            disabled
            hint="Your Stellar wallet address. Cannot be changed."
          />

          <div className="glass-whisper rounded-xl p-3 text-xs text-muted-foreground">
            <p className="font-medium">MoiScore: {user?.moiScore ?? 0}</p>
            <p className="mt-0.5">Your reputation score increases with on-time contributions. Displayed on your public profile.</p>
          </div>
        </motion.div>

        {/* Save */}
        <motion.div variants={item} className="flex justify-end">
          <Button
            variant="premium"
            size="lg"
            onClick={handleSave}
            isLoading={saving}
            disabled={!displayName.trim()}
            leftIcon={saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          >
            {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
