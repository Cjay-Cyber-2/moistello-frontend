"use client"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  if (typeof console !== "undefined") {
    console.error("GlobalError caught:", error)
  }

  return (
    <html>
      <body>
        <pre style={{ padding: "2rem", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "14px" }}>
          {error?.stack || error?.message || String(error)}
        </pre>
        <button onClick={() => reset()} style={{ margin: "0 2rem", padding: "0.5rem 1rem" }}>
          Try again
        </button>
      </body>
    </html>
  )
}
