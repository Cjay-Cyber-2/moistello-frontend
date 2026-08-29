import React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CircleInviteModal } from "./circle-invite-modal"

describe("CircleInviteModal", () => {
  it("shows a generating placeholder while the code is empty", () => {
    render(
      <CircleInviteModal
        isOpen
        onClose={vi.fn()}
        code=""
        copied={false}
        isError={false}
        error=""
        onCopy={vi.fn()}
      />,
    )

    expect(screen.getByText("Generating")).toBeDefined()
  })

  it("shows the code and a copy button once generated", () => {
    render(
      <CircleInviteModal
        isOpen
        onClose={vi.fn()}
        code="ABC123"
        copied={false}
        isError={false}
        error=""
        onCopy={vi.fn()}
      />,
    )

    expect(screen.getByText("ABC123")).toBeDefined()
    expect(screen.getByRole("button", { name: "Copy Code" })).toBeDefined()
  })

  it("calls onCopy when the copy button is clicked", async () => {
    const user = userEvent.setup()
    const onCopy = vi.fn()
    render(
      <CircleInviteModal
        isOpen
        onClose={vi.fn()}
        code="ABC123"
        copied={false}
        isError={false}
        error=""
        onCopy={onCopy}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Copy Code" }))
    expect(onCopy).toHaveBeenCalledTimes(1)
  })

  it("shows an error message when generation failed", () => {
    render(
      <CircleInviteModal
        isOpen
        onClose={vi.fn()}
        code="error-generating-code"
        copied={false}
        isError
        error="Failed to generate invite code."
        onCopy={vi.fn()}
      />,
    )

    expect(screen.getByText("Failed to generate invite code.")).toBeDefined()
    expect(screen.queryByRole("button", { name: "Copy Code" })).toBeNull()
  })
})
