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
  X,
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
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useSyncExternalStore, useRef, useEffect } from "react";
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

const horizontalNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/new", label: "New Prompt", icon: Sparkles, accent: true },
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userAvatar, setUserAvatar] = useState<string>("");
  const searchRef = useRef<HTMLInputElement>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const effectiveAvatar =
    userAvatar ||
    session?.user?.image ||
    (session?.user?.name
      ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(session.user.name)}&backgroundColor=06b6d4`
      : "https://api.dicebear.com/7.x/bottts/svg?seed=Architect&backgroundColor=06b6d4");

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
              },
              token: "web_session_active",
              quota,
              savedBlocks,
              recentPrompts,
            },
            window.location.origin
          );
        } catch {
          // ignore sync failure
        }
      };

      broadcastSession();
    }
  }, [session]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-card/85 backdrop-blur-xl shadow-xs transition-all">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger + Brand Logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Logo size={22} />
          </Link>
        </div>

        {/* Center / Search */}
        <div className="relative hidden md:block flex-1 max-w-xs mx-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search workspace... ⌘K"
            className="h-8 w-full pl-8 pr-2 text-xs bg-muted/40 border border-border/60 rounded-full focus-visible:ring-1 focus-visible:border-primary shadow-2xs"
          />
        </div>

        {/* Mobile search expand */}
        {searchOpen && (
          <div className="absolute inset-x-0 top-0 h-14 z-50 flex items-center bg-card px-4 md:hidden border-b">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-2"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Right Utility Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Quick New Prompt CTA */}
          <Link
            href="/dashboard/new"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-xs"
          >
            <Sparkles className="h-3 w-3" />
            <span>New Prompt</span>
          </Link>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notification Center */}
          <NotificationBell />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary/40 transition-all outline-none">
              <Avatar className="h-7 w-7 rounded-full border overflow-hidden shadow-xs">
                <AvatarImage src={effectiveAvatar} alt="User Avatar" className="object-cover w-full h-full" />
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-bold">
                  {session?.user?.name ? session.user.name.slice(0, 2).toUpperCase() : "AI"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1">
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer gap-2"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Profile &amp; Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer gap-2"
              >
                <Key className="h-4 w-4 text-muted-foreground" />
                <span>API Keys</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer gap-2"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: Horizontal Navigation Tabs Bar */}
      <div className="border-t border-border/50 bg-background/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Dashboard Horizontal Navigation"
            className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none fade-mask-x"
          >
            {horizontalNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-95 shrink-0",
                    active
                      ? "bg-primary/10 text-primary font-semibold border border-primary/25 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-muted-foreground", item.accent && !active && "text-primary")} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="h-1 w-1 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}

            {/* Admin tab if user is admin */}
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-95 shrink-0",
                  isActive("/dashboard/admin")
                    ? "bg-primary/10 text-primary font-semibold border border-primary/25 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
