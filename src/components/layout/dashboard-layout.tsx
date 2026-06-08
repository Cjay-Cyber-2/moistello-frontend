"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="relative min-h-screen bg-[rgb(var(--background))]">
      <div className="relative z-10">
        <Sidebar />
        <Header
          onToggleMobileMenu={toggleMobileMenu}
          isMobileMenuOpen={mobileMenuOpen}
        />
        <MobileMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
        <main
          className={cn(
            "pt-24 pb-24 px-0 lg:pl-72 lg:pr-0 min-h-screen",
          )}
        >
          <div className="container-premium py-6">
            {children}
          </div>
        </main>
        <MobileNav isHidden={mobileMenuOpen} />
      </div>
    </div>
  );
}
