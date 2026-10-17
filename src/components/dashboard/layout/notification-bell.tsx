"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  Sparkles,
  ExternalLink,
  Zap,
  Layers,
  ShieldCheck,
  X,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  category: "system" | "optimization" | "extension" | "security";
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread" | "optimization" | "system">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function loadNotifications() {
      try {
        const res = await fetch("/api/v1/notifications");
        if (res.ok && active) {
          const json = await res.json();
          if (json.data) {
            setNotifications(json.data.notifications || []);
            setUnreadCount(json.data.unreadCount || 0);
          }
        }
      } catch {
        // ignore
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 45000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleDismissNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/v1/notifications?id=${id}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleClearAll = async () => {
    try {
      await fetch("/api/v1/notifications?all=true", {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const getCategoryIcon = (cat: InAppNotification["category"]) => {
    switch (cat) {
      case "optimization":
        return <Zap className="h-3.5 w-3.5 text-amber-500" />;
      case "extension":
        return <Layers className="h-3.5 w-3.5 text-indigo-500" />;
      case "security":
        return <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-primary" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "optimization") return n.category === "optimization";
    if (filter === "system") return n.category === "system" || n.category === "extension";
    return true;
  });

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 relative text-foreground/80 hover:text-foreground"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-3.5 min-w-3.5 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border bg-card/95 backdrop-blur-xl shadow-xl z-50 overflow-hidden text-card-foreground animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 opacity-50" />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 hover:underline"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[10px] text-muted-foreground hover:text-red-500 font-medium flex items-center gap-1 hover:underline"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3.5 py-2 border-b bg-background/50 flex items-center gap-1 overflow-x-auto text-[10px] font-semibold">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: "Unread" },
              { id: "optimization", label: "Optimizations" },
              { id: "system", label: "System" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-2.5 py-0.5 rounded-lg transition-all ${
                  filter === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkOneRead(n.id)}
                  className={`p-3.5 transition-colors cursor-pointer text-xs space-y-1.5 group relative ${
                    !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/40 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      {getCategoryIcon(n.category)}
                      <span className="truncate">{n.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDismissNotification(n.id, e)}
                        title="Dismiss notification"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-0.5 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>

                    {n.actionUrl && (
                      <Link
                        href={n.actionUrl}
                        target={n.actionUrl.startsWith("http") ? "_blank" : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          handleMarkOneRead(n.id);
                        }}
                        className="text-[10px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>{n.actionLabel || "View"}</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <Bell className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
                <p className="font-medium text-foreground">All caught up!</p>
                <p className="text-[11px]">No notifications found under this filter.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
