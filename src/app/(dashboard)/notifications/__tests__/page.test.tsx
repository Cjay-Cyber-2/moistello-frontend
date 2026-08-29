import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationsPage from "../page";
import type { Notification } from "@/types";

const mockUseNotifications = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => mockUseNotifications(),
}));

vi.mock("@/stores/ui-store", () => ({
  useUIStore: () => ({ addToast: vi.fn() }),
}));

vi.mock("@/lib/motion/list", () => ({
  useListMotion: () => ({ shouldReduce: true, variants: {} }),
  defaultItemVariants: {},
  STAGGER_CHILDREN_LIMIT: 50,
}));

function makeNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return {
    id: "n1",
    userId: "u-test",
    type: "payout",
    title: "Payout received",
    body: "Your payout of 100 USDC is on its way.",
    isRead: false,
    channel: "in_app",
    createdAt: "2026-08-20T10:00:00Z",
    ...overrides,
  };
}

describe("NotificationsPage bulk-select accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotifications.mockReturnValue({
      notifications: [
        makeNotification({ id: "n1", title: "Payout received", isRead: false }),
        makeNotification({
          id: "n2",
          type: "circle_joined",
          title: "You joined a circle",
          isRead: true,
        }),
      ],
      unreadCount: 1,
      isLoading: false,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      fetchNotifications: vi.fn(),
    });
  });

  it("renders each bulk-select control as a labeled checkbox", () => {
    render(<NotificationsPage />);

    const payoutCheckbox = screen.getByRole("checkbox", {
      name: "Select notification: Payout received",
    });
    expect(payoutCheckbox).toHaveAttribute("aria-checked", "false");

    const circleCheckbox = screen.getByRole("checkbox", {
      name: "Select notification: You joined a circle",
    });
    expect(circleCheckbox).toHaveAttribute("aria-checked", "false");
  });

  it("toggles aria-checked when a notification is selected", () => {
    render(<NotificationsPage />);

    const payoutCheckbox = screen.getByRole("checkbox", {
      name: "Select notification: Payout received",
    });
    expect(payoutCheckbox).toHaveAttribute("aria-checked", "false");

    fireEvent.click(payoutCheckbox);

    expect(payoutCheckbox).toHaveAttribute("aria-checked", "true");
    expect(payoutCheckbox).toHaveAccessibleName(
      "Deselect notification: Payout received"
    );
  });

  it("is keyboard operable via the native button semantics", () => {
    render(<NotificationsPage />);

    const payoutCheckbox = screen.getByRole("checkbox", {
      name: "Select notification: Payout received",
    });

    payoutCheckbox.focus();
    fireEvent.keyDown(payoutCheckbox, { key: "Enter" });
    fireEvent.click(payoutCheckbox);

    expect(payoutCheckbox).toHaveAttribute("aria-checked", "true");
  });

  it("exposes a tri-state select-all checkbox in the bulk actions bar", () => {
    render(<NotificationsPage />);

    const payoutCheckbox = screen.getByRole("checkbox", {
      name: "Select notification: Payout received",
    });
    const circleCheckbox = screen.getByRole("checkbox", {
      name: "Select notification: You joined a circle",
    });

    fireEvent.click(payoutCheckbox);
    fireEvent.click(circleCheckbox);

    const selectAll = screen.getByRole("checkbox", {
      name: "Deselect all notifications",
    });
    expect(selectAll).toHaveAttribute("aria-checked", "true");
  });
});
