"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  User,
  Pencil,
  X,
  Save,
  Calendar,
  Link as LinkIcon,
  CircleDot,
  Trophy,
  ArrowUpCircle,
  Globe,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { patch, getErrorMessage } from "@/lib/api-client"
import { useUIStore } from "@/stores/ui-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { cn } from "@/lib/cn"
import { formatAddress, formatDate } from "@/lib/formatters"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "glass-premium rounded-2xl p-5 animate-pulse",
        className,
      )}
    >
      <div className="h-4 w-24 bg-muted rounded mb-3" />
      <div className="h-8 w-full bg-muted rounded" />
    </div>
  )
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const addToast = useUIStore((s) => s.addToast)

  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? "")
  const [bio, setBio] = useState((user as unknown as Record<string, string>)?.bio ?? "")
  const [twitterUrl, setTwitterUrl] = useState((user as unknown as Record<string, string>)?.twitterUrl ?? "")
  const [githubUrl, setGithubUrl] = useState((user as unknown as Record<string, string>)?.githubUrl ?? "")
  const [saving, setSaving] = useState(false)

  const handleCancel = useCallback(() => {
    setDisplayName(user?.displayName ?? "")
    setBio((user as unknown as Record<string, string>)?.bio ?? "")
    setTwitterUrl((user as unknown as Record<string, string>)?.twitterUrl ?? "")
    setGithubUrl((user as unknown as Record<string, string>)?.githubUrl ?? "")
    setIsEditing(false)
  }, [user])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await patch("/users/me", {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
      })
      addToast({ type: "success", title: "Saved!", description: "Your profile has been updated." })
      setIsEditing(false)
    } catch (err) {
      const message = getErrorMessage(err)
      addToast({ type: "error", title: "Save failed", description: message })
    } finally {
      setSaving(false)
    }
  }, [displayName, bio, twitterUrl, githubUrl, addToast])

  const handleStartEdit = useCallback(() => {
    setDisplayName(user?.displayName ?? "")
    setBio((user as unknown as Record<string, string>)?.bio ?? "")
    setTwitterUrl((user as unknown as Record<string, string>)?.twitterUrl ?? "")
    setGithubUrl((user as unknown as Record<string, string>)?.githubUrl ?? "")
    setIsEditing(true)
  }, [user])

  if (authLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" description="Your public profile." />
        <div className="mx-auto max-w-lg space-y-4">
          <div className="glass-premium rounded-2xl p-6 flex flex-col items-center gap-4 animate-pulse">
            <div className="h-24 w-24 rounded-full bg-muted" />
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-36 bg-muted rounded" />
          </div>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" />
        <EmptyState
          icon={<User className="h-6 w-6" />}
          title="No profile data"
          description="We could not load your profile. Please try again."
        />
      </div>
    )
  }

  const avatarInitial = user.displayName?.charAt(0)?.toUpperCase()
    ?? user.walletAddress?.slice(0, 2)?.toUpperCase()
    ?? "U"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your public profile and personal information."
        action={
          <Button
            variant={isEditing ? "ghost" : "primary"}
            size="md"
            onClick={isEditing ? handleCancel : handleStartEdit}
            leftIcon={isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        }
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-lg space-y-5"
      >
        {/* Avatar + Name Section */}
        <motion.div
          variants={item}
          className="glass-premium rounded-2xl p-6 flex flex-col items-center gap-4"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full gradient-bg text-white font-mono text-3xl font-bold shrink-0 shadow-lg">
            {avatarInitial}
          </div>

          {isEditing ? (
            <div className="w-full max-w-sm space-y-4">
              <Input
                label="Display Name"
                placeholder="Your public name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
              />
            </div>
          ) : (
            <>
              <h1 className="font-heading text-3xl font-bold gradient-text-extended text-center">
                {user.displayName ?? "Unnamed User"}
              </h1>

              <div className="flex items-center gap-3 flex-wrap justify-center">
                <span className="font-mono text-sm text-muted-foreground">
                  {formatAddress(user.walletAddress, 8, 6)}
                </span>
                <Badge variant="premium" size="sm">
                  MoiScore {user.moiScore}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Joined {formatDate(user.createdAt)}
              </div>
            </>
          )}
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={item}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: "Circles Joined", value: "0", icon: CircleDot },
            { label: "Circles Completed", value: "0", icon: Trophy },
            { label: "Total Contributed", value: "$0", icon: ArrowUpCircle },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center"
            >
              <stat.icon className="h-4 w-4 text-aurora-violet" />
              <span className="font-heading text-xl font-bold gradient-text">
                {stat.value}
              </span>
              <span className="text-2xs text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Bio Section */}
        <motion.div variants={item} className="glass-premium rounded-2xl p-5 space-y-3">
          <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-aurora-violet" />
            Bio
          </h3>

          {isEditing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
              className={cn(
                "block w-full bg-transparent px-0 py-2 text-sm text-foreground",
                "placeholder:text-muted-foreground/50",
                "border-b-2 border-border",
                "transition-all duration-300 rounded-none",
                "focus:outline-none focus:border-b-aurora-violet focus:shadow-[0_0_12px_rgb(var(--aurora-violet)/0.1)]",
                "resize-none",
              )}
            />
          ) : (
            <p className={cn(
              "text-sm leading-relaxed",
              bio ? "text-foreground" : "text-muted-foreground italic",
            )}>
              {bio || "No bio yet."}
            </p>
          )}
        </motion.div>

        {/* Social Links */}
        <motion.div variants={item} className="glass-premium rounded-2xl p-5 space-y-3">
          <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-aurora-violet" />
            Social Links
          </h3>

          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="Twitter URL"
                placeholder="https://twitter.com/yourhandle"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                leftIcon={<Globe className="h-4 w-4" />}
              />
              <Input
                label="GitHub URL"
                placeholder="https://github.com/yourhandle"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                leftIcon={<Globe className="h-4 w-4" />}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                {twitterUrl ? (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-aurora-violet hover:underline truncate"
                  >
                    {twitterUrl}
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">No Twitter link</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                {githubUrl ? (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-aurora-violet hover:underline truncate"
                  >
                    {githubUrl}
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">No GitHub link</span>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Edit Mode: Save Button */}
        {isEditing && (
          <motion.div variants={item} className="flex justify-end gap-3">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="premium"
              size="lg"
              onClick={handleSave}
              isLoading={saving}
              disabled={!displayName.trim()}
              leftIcon={saving ? undefined : <Save className="h-4 w-4" />}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
