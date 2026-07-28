"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, BookOpen, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/library", label: "Library", icon: BookOpen },
  { href: "/dashboard/new", label: "New", icon: Sparkles, accent: true },
  { href: "/dashboard/history", label: "History", icon: Clock },
  { href: "/dashboard/settings", label: "Settings", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-md pb-safe shadow-lg">
      <div className="flex items-center justify-around h-14 px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full text-[11px] font-medium transition-all duration-200 active:scale-95",
                active
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.accent ? (
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-foreground text-background shadow-md hover:scale-105 transition-transform">
                  <tab.icon className="h-4 w-4" />
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  <tab.icon className={cn("h-4 w-4 transition-transform", active && "scale-110")} />
                  {active && (
                    <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-foreground animate-in fade-in zoom-in" />
                  )}
                </div>
              )}
              <span className={cn("text-[10px]", tab.accent && "mt-0.5")}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
