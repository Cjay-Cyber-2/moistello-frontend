import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { get } from "@/lib/api-client"
import { useCirclePayouts, usePayouts } from "@/hooks/use-payouts"
import { createQueryWrapper } from "./test-utils"

vi.mock("@/lib/api-client", () => ({ get: vi.fn() }))

const mockedGet = vi.mocked(get)

describe("usePayouts", () => {
  beforeEach(() => mockedGet.mockReset())

  it("loads payouts with the existing pagination", async () => {
    const payout = {
      id: "payout-1",
      circleId: "circle-1",
      recipientId: "user-1",
      roundNumber: 1,
      amount: 100,
      payoutType: "fixed" as const,
      executedAt: "2026-07-25T00:00:00Z",
    }
    mockedGet.mockResolvedValue({
      success: true,
      data: { payouts: [payout] },
      meta: { page: 2, limit: 10, total: 1, totalPages: 1 },
    })
    const { QueryWrapper } = createQueryWrapper()
    const { result } = renderHook(() => usePayouts({ page: 2, limit: 10 }), {
      wrapper: QueryWrapper,
    })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGet).toHaveBeenCalledWith("/payouts?page=2&limit=10")
    expect(result.current.data?.payouts).toEqual([payout])
  })

  it("normalizes an empty response", async () => {
    mockedGet.mockResolvedValue({ success: true })
    const { QueryWrapper } = createQueryWrapper()
    const { result } = renderHook(() => usePayouts(), {
      wrapper: QueryWrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      payouts: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
  })

  it("exposes request errors through TanStack Query", async () => {
    const error = new Error("payouts unavailable")
    mockedGet.mockRejectedValue(error)
    const { QueryWrapper } = createQueryWrapper()
    const { result } = renderHook(() => usePayouts(), {
      wrapper: QueryWrapper,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
  })

  it("loads payouts for a specific circle from the circle payouts endpoint", async () => {
    const payout = {
      id: "payout-2",
      circleId: "circle-1",
      recipientId: "user-2",
      roundNumber: 3,
      amount: 250,
      payoutType: "fixed" as const,
      executedAt: "2026-07-25T00:00:00Z",
    }
    mockedGet.mockResolvedValue({
      success: true,
      data: { payouts: [payout] },
      meta: { page: 1, limit: 5, total: 1, totalPages: 1 },
    })
    const { QueryWrapper } = createQueryWrapper()
    const { result } = renderHook(() => useCirclePayouts("circle-1", { limit: 5 }), {
      wrapper: QueryWrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGet).toHaveBeenCalledWith("/circles/circle-1/payouts?page=1&limit=5")
    expect(result.current.data?.payouts).toEqual([payout])
  })
})
