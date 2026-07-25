"use client"

import Link from "next/link"
import { Home, RefreshCw, ShieldAlert } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#08090d] text-white">
        <main className="relative flex min-h-screen items-center overflow-hidden px-6 py-16">
          <div
            className="absolute inset-0 opacity-30"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(rgba(139,92,246,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,.12) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto w-full max-w-3xl border-l-4 border-l-red-400 pl-6 md:pl-10">
            <div className="mb-8 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] text-red-300">
              <ShieldAlert className="h-5 w-5" />
              Application recovery
            </div>
            <p className="font-heading text-5xl font-black leading-none md:text-7xl">
              Unexpected
              <span className="block text-red-400">fault.</span>
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
              The application hit an unrecoverable error. Your technical details remain private.
              Retry the session or return home.
            </p>
            {error.digest && (
              <p className="mt-5 inline-flex border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-white/50">
                Reference: {error.digest}
              </p>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 bg-red-400 px-5 py-3 font-heading font-semibold text-black transition-colors hover:bg-red-300"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 border border-white/15 px-5 py-3 font-heading text-white/80 transition-colors hover:border-white/30 hover:text-white"
              >
                <Home className="h-4 w-4" />
                Return home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
