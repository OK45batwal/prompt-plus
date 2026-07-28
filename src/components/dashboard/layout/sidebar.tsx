"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  BookOpen,
  Clock,
  Folder,
  GitCompare,
  BarChart3,
  Key,
  Settings,
  PanelLeftClose,
  PanelLeft,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/new", label: "New Prompt", icon: Sparkles, accent: true },
  { href: "/dashboard/templates", label: "Templates", icon: FileText },
];

const contentNav = [
  { href: "/dashboard/library", label: "Library", icon: BookOpen },
  { href: "/dashboard/history", label: "History", icon: Clock },
  { href: "/dashboard/collections", label: "Collections", icon: Folder },
  { href: "/dashboard/compare", label: "Compare", icon: GitCompare },
];

const insightsNav = [
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

const accountNav = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b">
        {!collapsed && (
          <Link href="/dashboard">
            <Logo size={20} />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {/* Main */}
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                item.accent && !isActive(item.href) && "text-foreground font-medium"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}

          <Separator className="my-2" />

          {/* Content */}
          {contentNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}

          <Separator className="my-2" />

          {/* Insights */}
          {insightsNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}

          <Separator className="my-2" />

          {/* Account */}
          {accountNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* Usage Banner */}
      {!collapsed && (
        <div className="p-3 border-t">
          <div className="rounded-lg bg-accent/50 p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Daily Usage</span>
              <span className="font-medium">5/20</span>
            </div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground rounded-full transition-all"
                style={{ width: "25%" }}
              />
            </div>
            <Link
              href="/dashboard/settings"
              className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Key className="h-3 w-3" />
              Add API Key for unlimited
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
