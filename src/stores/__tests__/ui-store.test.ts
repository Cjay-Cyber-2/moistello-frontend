import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "@/stores/ui-store";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      theme: "system",
      density: "comfortable",
      fontSize: "medium",
      sidebarOpen: false,
      activeModal: null,
      toasts: [],
    });
  });

  describe("sidebar", () => {
    it("starts with sidebar closed", () => {
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it("toggles sidebar", () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it("sets sidebar open directly", () => {
      useUIStore.getState().setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);

      useUIStore.getState().setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe("theme", () => {
    it("starts with system theme", () => {
      expect(useUIStore.getState().theme).toBe("system");
    });

    it("toggles through the cycle dark → system → light → dark", () => {
      useUIStore.setState({ theme: "dark" });
      useUIStore.getState().toggleTheme();
      expect(useUIStore.getState().theme).toBe("system");

      useUIStore.getState().toggleTheme();
      expect(useUIStore.getState().theme).toBe("light");

      useUIStore.getState().toggleTheme();
      expect(useUIStore.getState().theme).toBe("dark");
    });

    it("sets theme directly", () => {
      useUIStore.getState().setTheme("light");
      expect(useUIStore.getState().theme).toBe("light");

      useUIStore.getState().setTheme("dark");
      expect(useUIStore.getState().theme).toBe("dark");

      useUIStore.getState().setTheme("system");
      expect(useUIStore.getState().theme).toBe("system");
    });
  });

  describe("modal", () => {
    it("starts with no active modal", () => {
      expect(useUIStore.getState().activeModal).toBeNull();
    });

    it("opens a modal by id", () => {
      useUIStore.getState().openModal("settings");
      expect(useUIStore.getState().activeModal).toBe("settings");
    });

    it("closes the active modal", () => {
      useUIStore.getState().openModal("settings");
      useUIStore.getState().closeModal();
      expect(useUIStore.getState().activeModal).toBeNull();
    });

    it("replaces modal when opening another", () => {
      useUIStore.getState().openModal("settings");
      useUIStore.getState().openModal("profile");
      expect(useUIStore.getState().activeModal).toBe("profile");
    });
  });

  describe("toasts", () => {
    it("starts with empty toasts", () => {
      expect(useUIStore.getState().toasts).toEqual([]);
    });

    it("adds a toast with generated id", () => {
      vi.useFakeTimers();
      vi.spyOn(Date, "now").mockReturnValue(1000);

      useUIStore.getState().addToast({
        type: "success",
        title: "Saved",
        description: "Changes saved successfully",
      });

      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe("success");
      expect(toasts[0].title).toBe("Saved");
      expect(toasts[0].description).toBe("Changes saved successfully");
      expect(toasts[0].id).toMatch(/^toast-/);

      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("removes a toast by id", () => {
      vi.useFakeTimers();
      vi.spyOn(Date, "now").mockReturnValue(1000);

      useUIStore.getState().addToast({
        type: "error",
        title: "Error",
      });

      const toastId = useUIStore.getState().toasts[0].id;
      useUIStore.getState().removeToast(toastId);

      expect(useUIStore.getState().toasts).toEqual([]);
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("auto-removes toast after duration", () => {
      vi.useFakeTimers();
      vi.spyOn(Date, "now").mockReturnValue(1000);

      useUIStore.getState().addToast({
        type: "info",
        title: "Temporary",
        duration: 3000,
      });

      expect(useUIStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(3000);

      expect(useUIStore.getState().toasts).toEqual([]);
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("uses default duration of 5000ms", () => {
      vi.useFakeTimers();
      vi.spyOn(Date, "now").mockReturnValue(1000);

      useUIStore.getState().addToast({
        type: "warning",
        title: "Warning",
      });

      vi.advanceTimersByTime(4999);
      expect(useUIStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(1);
      expect(useUIStore.getState().toasts).toEqual([]);
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("handles multiple toasts independently", () => {
      vi.useFakeTimers();
      vi.spyOn(Date, "now")
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);

      useUIStore.getState().addToast({
        type: "success",
        title: "First",
        duration: 1000,
      });
      useUIStore.getState().addToast({
        type: "error",
        title: "Second",
        duration: 2000,
      });

      expect(useUIStore.getState().toasts).toHaveLength(2);

      vi.advanceTimersByTime(1000);
      expect(useUIStore.getState().toasts).toHaveLength(1);
      expect(useUIStore.getState().toasts[0].title).toBe("Second");

      vi.advanceTimersByTime(1000);
      expect(useUIStore.getState().toasts).toEqual([]);
      vi.useRealTimers();
      vi.restoreAllMocks();
    });
  });

  describe("density and fontSize", () => {
    it("sets density", () => {
      useUIStore.getState().setDensity("compact");
      expect(useUIStore.getState().density).toBe("compact");

      useUIStore.getState().setDensity("comfortable");
      expect(useUIStore.getState().density).toBe("comfortable");
    });

    it("sets fontSize", () => {
      useUIStore.getState().setFontSize("small");
      expect(useUIStore.getState().fontSize).toBe("small");

      useUIStore.getState().setFontSize("large");
      expect(useUIStore.getState().fontSize).toBe("large");
    });
  });
});
