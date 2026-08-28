"use client"

import { Check, Copy } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

interface CircleInviteModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
  copied: boolean
  isError: boolean
  error: string
  onCopy: () => void
}

export function CircleInviteModal({
  isOpen,
  onClose,
  code,
  copied,
  isError,
  error,
  onCopy,
}: CircleInviteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Members"
      description="Share this code with people you want to invite."
      size="sm"
    >
      <div className="space-y-4">
        <div className="glass-whisper rounded-xl p-4 text-center">
          <p className="font-mono text-2xl font-bold tracking-widest gradient-text">
            {code || (
              <span className="inline-flex gap-1">
                Generating
                <span className="animate-bounce [animation-delay:0ms]">.</span>
                <span className="animate-bounce [animation-delay:200ms]">.</span>
                <span className="animate-bounce [animation-delay:400ms]">.</span>
              </span>
            )}
          </p>
        </div>
        {code && !isError && (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            onClick={onCopy}
          >
            {copied ? "Copied!" : "Copy Code"}
          </Button>
        )}
        {isError && (
          <p className="text-sm text-red-400 text-center">
            {error || "Failed to generate invite code. Try again."}
          </p>
        )}
        {code && (
          <Button variant="outline" size="md" className="w-full" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </Modal>
  )
}
