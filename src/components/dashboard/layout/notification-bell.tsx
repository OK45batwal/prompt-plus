"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Sparkles, ExternalLink, Zap, Layers, ShieldCheck } from "lucide-react";
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
  const [filter, setFilter] = useState<"all" | "unread">("all");
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
    const interval = setInterval(loadNotifications, 60000);
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

  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

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
              <div className="flex items-center p-0.5 rounded-lg bg-background border text-[10px] font-medium">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    filter === "all" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("unread")}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    filter === "unread" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  Unread
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 hover:underline"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkOneRead(n.id)}
                  className={`p-3.5 transition-colors cursor-pointer text-xs space-y-1.5 ${
                    !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/40 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      {getCategoryIcon(n.category)}
                      <span className="truncate">{n.title}</span>
                    </div>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                    )}
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
                <p className="text-[11px]">No unread notifications to display.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
