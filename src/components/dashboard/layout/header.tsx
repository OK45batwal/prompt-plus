"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, Moon, Sun, Menu, User, Settings, Key, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { NotificationBell } from "./notification-bell";

interface HeaderProps {
  onMenuClick?: () => void;
}

const emptySubscribe = () => () => {};

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pp_user_avatar") || "";
    }
    return "";
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const effectiveAvatar =
    userAvatar ||
    session?.user?.image ||
    (session?.user?.name
      ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(session.user.name)}&backgroundColor=6366f1`
      : "https://api.dicebear.com/7.x/bottts/svg?seed=Architect&backgroundColor=6366f1");

  useEffect(() => {
    const syncAvatar = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("pp_user_avatar");
        if (saved) setUserAvatar(saved);
      }
    };
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
        if (!localStorage.getItem("pp_user_avatar")) {
          setUserAvatar(userImg);
        }
      });
    }
  }, [session?.user?.image]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/dashboard/new") return "New Prompt";
    if (pathname === "/dashboard/library") return "Library";
    if (pathname === "/dashboard/history") return "History";
    if (pathname === "/dashboard/collections") return "Collections";
    if (pathname === "/dashboard/compare") return "Compare";
    if (pathname === "/dashboard/batch") return "Batch";
    if (pathname === "/dashboard/model-lab") return "Model Lab";
    if (pathname === "/dashboard/analytics") return "Analytics";
    if (pathname === "/dashboard/templates") return "Templates";
    if (pathname === "/dashboard/settings") return "Settings";
    return "Dashboard";
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="h-14 border bg-card/70 backdrop-blur-xl rounded-2xl mx-3 sm:mx-6 mt-3 px-4 flex items-center gap-3 shrink-0 sticky top-3 z-40 shadow-xs border-foreground/10">
      {/* Mobile Menu */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-8 w-8"
        onClick={onMenuClick}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Page Title */}
      <h1 className="font-medium text-sm truncate">{getPageTitle()}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search... ⌘K"
          className="h-8 w-[160px] lg:w-[200px] pl-8 text-xs bg-accent/50 border-0 focus-visible:ring-1"
        />
      </div>

      {/* Mobile search expand */}
      {searchOpen && (
        <div className="absolute inset-0 z-50 flex items-center bg-card px-4 sm:hidden">
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
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:hidden"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 text-yellow-500" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* In-App Notification Center */}
        <NotificationBell />

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
              <span>Profile & Settings</span>
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
                    localStorage.removeItem("promptplus_user_apikeys");
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
    </header>
  );
}
