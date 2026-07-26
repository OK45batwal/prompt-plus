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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card pb-safe">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-full h-full text-xs transition-colors",
              isActive(tab.href)
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {tab.accent ? (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-foreground text-background">
                <tab.icon className="h-4 w-4" />
              </div>
            ) : (
              <tab.icon className="h-4 w-4" />
            )}
            <span className={cn(tab.accent && "mt-0.5")}>{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
