import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useNotifications, useUnreadCount } from "@/hooks/use-notifications"
import { useNotificationStore } from "@/stores/notification-store"
import type { Notification } from "@/types"

const { mockGet, mockPatch } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
}))

vi.mock("@/lib/api-client", () => ({
  get: mockGet,
  patch: mockPatch,
}))

const notification = (overrides: Partial<Notification> = {}): Notification => ({
  id: "n-1",
  userId: "user-1",
  type: "circle",
  title: "New contribution",
  body: null,
  data: null,
  isRead: false,
  channel: "in_app",
  createdAt: "2026-08-01T00:00:00.000Z",
  ...overrides,
})

function resetStore() {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
  })
  mockGet.mockReset()
  mockPatch.mockReset()
}

describe("useNotifications", () => {
  beforeEach(() => {
    resetStore()
  })

  it("exposes notifications, unreadCount and isLoading from the store", () => {
    useNotificationStore.setState({
      notifications: [notification(), notification({ id: "n-2", isRead: true })],
      unreadCount: 1,
      isLoading: true,
    })

    const { result } = renderHook(() => useNotifications())

    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.unreadCount).toBe(1)
    expect(result.current.isLoading).toBe(true)
    expect(typeof result.current.markAsRead).toBe("function")
    expect(typeof result.current.markAllAsRead).toBe("function")
    expect(typeof result.current.fetchNotifications).toBe("function")
  })

  it("fetches notifications from the API into the store", async () => {
    mockGet.mockResolvedValue({
      data: {
        notifications: [
          notification(),
          notification({ id: "n-2" }),
          notification({ id: "n-3", isRead: true }),
        ],
      },
    })

    const { result } = renderHook(() => useNotifications())
    await act(async () => {
      await result.current.fetchNotifications()
    })

    const { notifications, unreadCount, isLoading } = useNotificationStore.getState()
    expect(mockGet).toHaveBeenCalledWith("/notifications")
    expect(notifications).toHaveLength(3)
    expect(unreadCount).toBe(2)
    expect(isLoading).toBe(false)
  })

  it("marks a notification read optimistically", async () => {
    useNotificationStore.setState({
      notifications: [notification(), notification({ id: "n-2" })],
      unreadCount: 2,
    })
    mockPatch.mockResolvedValue({})

    const { result } = renderHook(() => useNotifications())
    await act(async () => {
      await result.current.markAsRead("n-1")
    })

    const { notifications, unreadCount } = useNotificationStore.getState()
    expect(mockPatch).toHaveBeenCalledWith("/notifications/n-1/read")
    expect(notifications.find((n) => n.id === "n-1")?.isRead).toBe(true)
    expect(notifications.find((n) => n.id === "n-2")?.isRead).toBe(false)
    expect(unreadCount).toBe(1)
  })

  it("marks all notifications as read", async () => {
    useNotificationStore.setState({
      notifications: [
        notification(),
        notification({ id: "n-2", isRead: true }),
        notification({ id: "n-3" }),
      ],
      unreadCount: 2,
    })
    mockPatch.mockResolvedValue({})

    const { result } = renderHook(() => useNotifications())
    await act(async () => {
      await result.current.markAllAsRead()
    })

    const { notifications, unreadCount } = useNotificationStore.getState()
    expect(mockPatch).toHaveBeenCalledWith("/notifications/read-all")
    expect(notifications.every((n) => n.isRead)).toBe(true)
    expect(unreadCount).toBe(0)
  })

  it("rolls back the unread flag when marking read fails", async () => {
    useNotificationStore.setState({
      notifications: [notification()],
      unreadCount: 1,
    })
    mockPatch.mockRejectedValue(new Error("network down"))

    const { result } = renderHook(() => useNotifications())
    await act(async () => {
      await result.current.markAsRead("n-1")
    })

    const { notifications, unreadCount } = useNotificationStore.getState()
    expect(notifications[0].isRead).toBe(false)
    expect(unreadCount).toBe(1)
  })
})

describe("useUnreadCount", () => {
  beforeEach(() => {
    resetStore()
  })

  it("subscribes to the store's unreadCount", () => {
    useNotificationStore.setState({
      notifications: [notification(), notification({ id: "n-2" })],
      unreadCount: 2,
    })

    const { result } = renderHook(() => useUnreadCount())
    expect(result.current).toBe(2)
  })
})