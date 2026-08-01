"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Folder, Settings, Puzzle, Plus, BookOpen, Layers, X, Command } from "lucide-react";
import { curatedPrompts } from "@/lib/curated-prompts";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const navItems = [
    { label: "New Prompt Studio", href: "/dashboard/new", icon: Plus, category: "Navigation" },
    { label: "Saved Prompt Library", href: "/dashboard/library", icon: BookOpen, category: "Navigation" },
    { label: "Side-by-Side Model Lab", href: "/dashboard/model-lab", icon: Sparkles, category: "Navigation" },
    { label: "Prompt Collections", href: "/dashboard/collections", icon: Folder, category: "Navigation" },
    { label: "Prompt Templates", href: "/dashboard/templates", icon: Layers, category: "Navigation" },
    { label: "Settings & API Vault", href: "/dashboard/settings", icon: Settings, category: "Navigation" },
    { label: "Chrome Extension Guide", href: "/extension", icon: Puzzle, category: "Navigation" },
  ];

  const filteredNav = navItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCurated = curatedPrompts.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div className="bg-card border rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Header */}
        <div className="p-3 sm:p-4 border-b flex items-center gap-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search prompts, or jump to route… (⌘K)"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded border bg-muted text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-4">
          {/* Navigation Section */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Pages & Navigation
              </div>
              <div className="space-y-0.5">
                {filteredNav.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleSelect(item.href)}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between hover:bg-primary/10 hover:text-primary transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">Go to →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Curated Prompt Blueprints Section */}
          {filteredCurated.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Curated Prompt Blueprints
              </div>
              <div className="space-y-1">
                {filteredCurated.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => handleSelect(`/dashboard/library?search=${encodeURIComponent(item.title)}`)}
                    className="w-full text-left p-2.5 rounded-xl border bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold group-hover:text-primary">{item.title}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full border bg-background font-semibold text-muted-foreground">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredCurated.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No matching pages or prompt blueprints found for &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>Prompt+ Global Command Palette</span>
          </div>
          <span>Use <kbd className="px-1 py-0.5 rounded border bg-background text-[9px] font-mono">↑</kbd> <kbd className="px-1 py-0.5 rounded border bg-background text-[9px] font-mono">↓</kbd> to navigate</span>
        </div>
      </div>
    </div>
  );
}
