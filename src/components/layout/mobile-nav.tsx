"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CircleDot, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { Routes } from "@/lib/constants";

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: MobileNavItem[] = [
  {
    label: "Home",
    href: Routes.DASHBOARD,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Circles",
    href: Routes.CIRCLES,
    icon: <CircleDot className="h-5 w-5" />,
  },
  {
    label: "Profile",
    href: Routes.PROFILE,
    icon: <User className="h-5 w-5" />,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === Routes.DASHBOARD) return pathname === Routes.DASHBOARD;
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md",
        "lg:hidden",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-evenly h-16 rounded-full px-1",
          "glass-flagship backdrop-blur-3xl",
          "border border-white/[0.08] dark:border-white/[0.06]",
        )}
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1",
                "h-full min-w-[64px] px-4 py-2",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-gradient-to-r from-aurora-indigo via-aurora-violet to-aurora-cyan" />
              )}
              <span
                className={cn(
                  "shrink-0",
                  active
                    ? "text-aurora-violet"
                    : "text-muted-foreground",
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  "font-body font-medium leading-none",
                  active
                    ? "gradient-text-extended text-xs"
                    : "text-[10px] text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
