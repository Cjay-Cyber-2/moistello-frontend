'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Registers the service worker and handles PWA install prompts
 */
export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('[PWA] Service worker registered:', registration)

        // Check for updates periodically
        const interval = setInterval(() => {
          registration.update()
        }, 60000) // Check every minute

        return () => clearInterval(interval)
      }).catch((error) => {
        console.error('[PWA] Service worker registration failed:', error)
      })
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (event: Event) => {
      const e = event as BeforeInstallPromptEvent
      e.preventDefault()
      setInstallPrompt(e)
      console.log('[PWA] Install prompt available')
    }

    // Check if app is already installed
    const handleAppInstalled = () => {
      console.log('[PWA] App installed')
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if running as standalone (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Make install prompt available globally for UI components
  useEffect(() => {
    if (installPrompt) {
      window.dispatchEvent(new CustomEvent('pwa:install-available', { detail: { prompt: installPrompt } }))
    }
  }, [installPrompt])

  return null
}
