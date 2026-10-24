"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CommandPalette } from "../command-palette";

export function DashboardLayout({ children, isAdmin }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Global Command Palette */}
      <CommandPalette />

      {/* Mobile Drawer Sheet for smaller viewports */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-70 p-0 border-r">
          <Sidebar isMobile={true} onToggle={() => setMobileOpen(false)} isAdmin={isAdmin} />
        </SheetContent>
      </Sheet>

      {/* Unified Top Horizontal Navigation Bar */}
      <Header onMenuClick={() => setMobileOpen(true)} isAdmin={isAdmin} />

      {/* Full-width Main Content Canvas */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 w-full max-w-7xl mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
