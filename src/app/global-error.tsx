"use client"

import Link from "next/link"
import { Home, RefreshCw, ShieldAlert } from "lucide-react"

  const errorMessage =
    process.env.NODE_ENV === "development"
      ? error?.stack || error?.message || String(error)
      : "Something went wrong. Please try again later."

  return (
    <html>
      <body>
        <pre style={{ padding: "2rem", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "14px" }}>
          {errorMessage}
        </pre>
        <button onClick={() => reset()} style={{ margin: "0 2rem", padding: "0.5rem 1rem" }}>
          Try again
        </button>
      </body>
    </html>
  )
}
