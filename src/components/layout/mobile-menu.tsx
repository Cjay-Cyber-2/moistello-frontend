"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CircleDot,
  ArrowUpCircle,
  ArrowDownCircle,
  Award,
  Bell,
  Settings,
  Wallet,
  LogOut,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Routes } from "@/lib/constants";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";

const navLinks = [
  { label: "Dashboard", href: Routes.DASHBOARD, icon: <Home className="h-4 w-4" /> },
  { label: "Circles", href: Routes.CIRCLES, icon: <CircleDot className="h-4 w-4" /> },
  { label: "Contributions", href: "/contributions", icon: <ArrowUpCircle className="h-4 w-4" /> },
  { label: "Payouts", href: "/payouts", icon: <ArrowDownCircle className="h-4 w-4" /> },
  { label: "Reputation", href: Routes.PROFILE_SCORE, icon: <Award className="h-4 w-4" /> },
];

const accountLinks = [
  { label: "Notifications", href: Routes.NOTIFICATIONS, icon: <Bell className="h-4 w-4" /> },
  { label: "Settings", href: Routes.PROFILE_SETTINGS, icon: <Settings className="h-4 w-4" /> },
  { label: "Wallet", href: Routes.WALLET, icon: <Wallet className="h-4 w-4" /> },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useUIStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const isDark = theme === "dark";

  const isActive = (href: string) => {
    if (href === Routes.DASHBOARD) return pathname === Routes.DASHBOARD;
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-80 max-w-[85vw]",
          "glass-premium backdrop-blur-2xl",
          "border-l border-white/[0.08] dark:border-white/[0.06]",
          "flex flex-col",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/[0.05]">
          <span className="gradient-text-extended font-heading font-bold text-lg">Moistello</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            Close
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 p-3 rounded-2xl glass-whisper mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg text-white font-mono text-sm font-bold">
                {user.displayName?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.displayName ?? "User"}
                </p>
                <p className="text-xs text-muted-foreground">Moi Score: {user.moiScore}</p>
              </div>
            </div>
          )}

          <div className="space-y-1 mb-6">
            <p className="px-3 text-[10px] font-heading tracking-[0.2em] uppercase text-muted-foreground/70 mb-2">
              Navigation
            </p>
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
                    active
                      ? "glass-strong bg-gradient-to-r from-aurora-violet/10 to-transparent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:glass-whisper",
                  )}
                >
                  {link.icon}
                  <span className="flex-1">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] font-heading tracking-[0.2em] uppercase text-muted-foreground/70 mb-2">
              Account
            </p>
            {accountLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
                    active
                      ? "glass-strong bg-gradient-to-r from-aurora-violet/10 to-transparent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:glass-whisper",
                  )}
                >
                  {link.icon}
                  <span className="flex-1">{link.label}</span>
                  {link.label === "Notifications" && unreadCount > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1.5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/[0.05] px-4 py-4 space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:glass-whisper"
          >
            <Sun className="h-4 w-4" />
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
