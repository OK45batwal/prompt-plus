"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Moon,
  Sun,
  Menu,
  User,
  Settings,
  Key,
  LogOut,
  Home,
  Sparkles,
  BookOpen,
  Clock,
  Folder,
  GitCompare,
  BarChart3,
  FileText,
  Shield,
  Layers,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useSyncExternalStore, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { NotificationBell } from "./notification-bell";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
  isAdmin?: boolean;
}

const emptySubscribe = () => () => {};

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/new", label: "New Prompt", icon: Sparkles },
  { href: "/dashboard/templates", label: "Templates", icon: FileText },
  { href: "/dashboard/library", label: "Library", icon: BookOpen },
  { href: "/dashboard/history", label: "History", icon: Clock },
  { href: "/dashboard/collections", label: "Collections", icon: Folder },
  { href: "/dashboard/batch", label: "Batch", icon: Layers },
  { href: "/dashboard/model-lab", label: "Model Lab", icon: FlaskConical },
  { href: "/dashboard/compare", label: "Compare", icon: GitCompare },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Header({ onMenuClick, isAdmin = false }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const [userAvatar, setUserAvatar] = useState<string>("");
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const effectiveAvatar =
    userAvatar ||
    session?.user?.image ||
    (session?.user?.name
      ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(session.user.name)}&backgroundColor=06b6d4`
      : "https://api.dicebear.com/7.x/bottts/svg?seed=Architect&backgroundColor=06b6d4");

  const effectiveAvatarRef = useRef(effectiveAvatar);
  useEffect(() => {
    effectiveAvatarRef.current = effectiveAvatar;
  }, [effectiveAvatar]);

  useEffect(() => {
    const syncAvatar = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEYS.avatar);
        if (saved) setUserAvatar(saved);
      }
    };
    syncAvatar();
    window.addEventListener("promptplus:avatar_updated", syncAvatar);
    window.addEventListener("storage", syncAvatar);
    return () => {
      window.removeEventListener("promptplus:avatar_updated", syncAvatar);
      window.removeEventListener("storage", syncAvatar);
    };
  }, []);

  useEffect(() => {
    const userImg = session?.user?.image;
    if (userImg) {
      queueMicrotask(() => {
        if (!localStorage.getItem(STORAGE_KEYS.avatar)) {
          setUserAvatar(userImg);
        }
      });
    }

    // Direct Extension Communication Bridge: Broadcast active web session to Prompt+ Extension
    const currentUser = session?.user;
    if (typeof window !== "undefined" && currentUser?.id) {
      const broadcastSession = async () => {
        try {
          let quota = undefined;
          let savedBlocks = undefined;
          let recentPrompts = undefined;
          try {
            const res = await fetch("/api/v1/auth/extension-sync");
            if (res.ok) {
              const data = await res.json();
              if (data.quota) quota = data.quota;
              if (data.savedBlocks) savedBlocks = data.savedBlocks;
              if (data.recentPrompts) recentPrompts = data.recentPrompts;
            }
          } catch {}

          window.postMessage(
            {
              source: "promptplus_web",
              type: "SESSION_UPDATE",
              user: {
                id: currentUser.id,
                name: currentUser.name || "Prompt+ User",
                email: currentUser.email || "",
                avatar: effectiveAvatarRef.current,
              },
              quota,
              savedBlocks,
              recentPrompts,
            },
            "*"
          );
        } catch {
          // Silently catch postMessage edge cases
        }
      };

      broadcastSession();

      const handleExtReady = () => broadcastSession();
      window.addEventListener("promptplus:extension_ready", handleExtReady);
      return () => {
        window.removeEventListener("promptplus:extension_ready", handleExtReady);
      };
    }
  }, [session]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const triggerCommandPalette = () => {
    window.dispatchEvent(new CustomEvent("promptplus:open-command-palette"));
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-card/90 dark:bg-[#090d16]/90 backdrop-blur-xl border-b border-border/70 transition-colors">
      {/* Row 1: Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger + Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            aria-label="Prompt+ Dashboard"
          >
            <Logo size={22} />
          </Link>
        </div>

        {/* Center: Search Workspace ⌘K Input Pill */}
        <div className="flex-1 max-w-sm mx-auto hidden md:flex items-center justify-center">
          <button
            type="button"
            onClick={triggerCommandPalette}
            className="group flex items-center justify-center w-full max-w-85 h-9 px-4 rounded-full border border-border/70 dark:border-neutral-800 bg-muted/40 dark:bg-neutral-900/60 hover:bg-muted/70 dark:hover:bg-neutral-900/90 hover:border-border text-xs text-muted-foreground dark:text-neutral-400 transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
            aria-label="Search workspace"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground dark:text-neutral-400 group-hover:text-cyan-400 transition-colors mr-2 shrink-0" />
            <span className="truncate select-none font-normal">Search workspace... ⌘K</span>
          </button>
        </div>

        {/* Right: Actions (New Prompt CTA, Mobile Search, Theme Toggle, Notification Bell, Avatar) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden text-muted-foreground hover:text-foreground"
            onClick={triggerCommandPalette}
            aria-label="Open search command palette"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Quick New Prompt CTA Button */}
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-1.5 h-8.5 px-3.5 sm:px-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-xs hover:shadow-cyan-500/20 active:scale-95 transition-all shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-slate-950 stroke-[2.2]" />
            <span className="font-semibold">New Prompt</span>
          </Link>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 hover:text-amber-300 transition-colors" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notification Center */}
          <NotificationBell />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative h-8 w-8 rounded-full ring-2 ring-cyan-500/80 ring-offset-2 ring-offset-background hover:ring-cyan-400 transition-all outline-none cursor-pointer flex items-center justify-center shrink-0 ml-0.5"
              aria-label="User menu"
            >
              <Avatar className="h-7 w-7 rounded-full overflow-hidden">
                <AvatarImage src={effectiveAvatar} alt="User Avatar" className="object-cover w-full h-full" />
                <AvatarFallback className="text-[10px] bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold">
                  {session?.user?.name ? session.user.name.slice(0, 2).toUpperCase() : "AI"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-xl">
              <div className="px-2 py-1.5 mb-1 border-b border-border/50">
                <p className="text-xs font-semibold text-foreground truncate">
                  {session?.user?.name || "Prompt Architect"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate font-mono">
                  {session?.user?.email || "architect@promptplus.ai"}
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer gap-2 rounded-lg text-xs"
              >
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Profile &amp; Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer gap-2 rounded-lg text-xs"
              >
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                <span>API Keys Vault</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer gap-2 rounded-lg text-xs"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Engine Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={async () => {
                  if (typeof window !== "undefined") {
                    try {
                      localStorage.removeItem(STORAGE_KEYS.legacyApiKeys);
                    } catch {
                      // ignore
                    }
                  }
                  await signOut({ callbackUrl: "/" });
                }}
                className="cursor-pointer gap-2 rounded-lg text-xs text-destructive focus:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: Horizontal Navigation Tabs Bar */}
      <div className="border-t border-border/50 bg-background/50 dark:bg-[#070a10]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Dashboard Horizontal Navigation"
            className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-150 shrink-0",
                    active
                      ? "border border-cyan-500/50 bg-cyan-950/30 text-cyan-400 font-medium dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-500/50 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-normal"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-colors",
                      active ? "text-cyan-400" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.label}</span>
                  {active && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0 ml-1"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className={cn(
                  "group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-150 shrink-0",
                  isActive("/dashboard/admin")
                    ? "border border-cyan-500/50 bg-cyan-950/30 text-cyan-400 font-medium dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-500/50 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-normal"
                )}
              >
                <Shield
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-colors",
                    isActive("/dashboard/admin")
                      ? "text-cyan-400"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>Admin</span>
                {isActive("/dashboard/admin") && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0 ml-1"
                    aria-hidden="true"
                  />
                )}
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
