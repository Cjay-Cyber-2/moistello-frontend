"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";
type Density = "comfortable" | "compact";
type FontSize = "small" | "medium" | "large";
type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface UIState {
  theme: Theme;
  density: Density;
  fontSize: FontSize;
  sidebarOpen: boolean;
  toasts: Toast[];
}

interface UIActions {
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  setFontSize: (fontSize: FontSize) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

/*
 * Monotonic counter for toast ids: `Date.now()` alone can collide when two
 * toasts are added within the same millisecond (e.g. a batch of archive
 * results), so every id gets a strictly increasing sequence suffix.
 */
let toastIdCounter = 0;

/*
 * Pending auto-dismiss timers keyed by toast id. Tracking them lets a manual
 * dismissal cancel its timer so a stale timeout can never fire for a toast
 * that was already removed (and, in tests, keeps fake timers leak-free).
 */
const toastDismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      density: "comfortable",
      fontSize: "medium",
      sidebarOpen: false,
      toasts: [],

      toggleTheme: () => {
        const { theme } = get();
        if (theme === "light") {
          set({ theme: "dark" });
        } else if (theme === "dark") {
          set({ theme: "system" });
        } else {
          set({ theme: "light" });
        }
      },

      setTheme: (theme: Theme) => set({ theme }),
      setDensity: (density: Density) => set({ density }),
      setFontSize: (fontSize: FontSize) => set({ fontSize }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      addToast: (toast: Omit<Toast, "id">) => {
        const id = `toast-${Date.now()}-${++toastIdCounter}`;
        const newToast: Toast = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        const duration = toast.duration ?? 5000;
        const timer = setTimeout(() => {
          toastDismissTimers.delete(id);
          get().removeToast(id);
        }, duration);
        toastDismissTimers.set(id, timer);
      },

      removeToast: (id: string) => {
        const timer = toastDismissTimers.get(id);
        if (timer) {
          clearTimeout(timer);
          toastDismissTimers.delete(id);
        }
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },
    }),
    {
      name: "moistello_theme",
      partialize: (state) => ({ theme: state.theme, density: state.density, fontSize: state.fontSize }),
    }
  )
);
