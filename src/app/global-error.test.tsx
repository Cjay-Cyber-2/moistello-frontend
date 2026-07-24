import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import GlobalError from "./global-error"

describe("GlobalError", () => {
  const error = new Error("Sensitive internal error")
  error.stack = "Error: Sensitive internal error\n    at internalFunction (secret-file.ts:42:7)"

  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("shows full error information in development", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.spyOn(console, "error").mockImplementation(() => undefined)

    const { container } = render(<GlobalError error={error} reset={vi.fn()} />)

    expect(container.querySelector("pre")?.textContent).toBe(error.stack)
  })

  it("shows a friendly error message in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.spyOn(console, "error").mockImplementation(() => undefined)

    const { container } = render(<GlobalError error={error} reset={vi.fn()} />)

    expect(container.querySelector("pre")?.textContent).toBe("Something went wrong. Please try again later.")
  })

  it("does not expose the stack or internal message in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.spyOn(console, "error").mockImplementation(() => undefined)

    const { container } = render(<GlobalError error={error} reset={vi.fn()} />)
    const renderedText = container.textContent || ""

    expect(renderedText).not.toContain(error.stack)
    expect(renderedText).not.toContain(error.message)
  })

  it("logs the error", () => {
    vi.stubEnv("NODE_ENV", "production")
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    render(<GlobalError error={error} reset={vi.fn()} />)

    expect(consoleError).toHaveBeenCalledWith("GlobalError caught:", error)
  })
})
