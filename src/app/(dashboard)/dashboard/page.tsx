"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Book, History, Folder, LayoutTemplate, GitCompare, ArrowRight, Zap, TrendingUp, Loader2, Flame, Copy, Check } from "lucide-react";

const quickActions = [
  {
    title: "New Prompt",
    description: "Transform your ideas into optimized prompts",
    href: "/dashboard/new",
    icon: Sparkles,
    primary: true,
  },
  {
    title: "Library",
    description: "Access your saved prompts",
    href: "/dashboard/library",
    icon: Book,
  },
  {
    title: "History",
    description: "View recent enhancements",
    href: "/dashboard/history",
    icon: History,
  },
  {
    title: "Collections",
    description: "Organize prompts by topic",
    href: "/dashboard/collections",
    icon: Folder,
  },
  {
    title: "Templates",
    description: "Ready-to-use prompt templates",
    href: "/dashboard/templates",
    icon: LayoutTemplate,
  },
  {
    title: "Compare",
    description: "Side-by-side prompt comparison",
    href: "/dashboard/compare",
    icon: GitCompare,
  },
];

export default function DashboardPage() {
  const [usage, setUsage] = useState<{ totalPrompts: number; totalEnhancements: number; averageScore: number; monthly: { used: number } } | null>(null);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState<{ id: string; title: string; description: string; prompt: string; usageCount: number; category: string }[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/usage").then((r) => r.json()),
      fetch("/api/v1/collections?pageSize=1").then((r) => r.json()),
    ]).then(([usageJson, collJson]) => {
      setUsage(usageJson.data);
      setCollectionsCount(collJson.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/v1/templates?isOfficial=true").then((r) => r.json()).then((json) => {
      const list = Array.isArray(json.data) ? json.data : [];
      setTrending([...list].sort((a, b) => b.usageCount - a.usageCount).slice(0, 6));
    }).catch(() => {}).finally(() => setTrendingLoading(false));
  }, []);

  const copyTrending = async (t: { id: string; prompt: string }) => {
    await navigator.clipboard.writeText(t.prompt);
    setCopiedId(t.id);
    try { await fetch(`/api/v1/templates/${t.id}/use`, { method: "POST" }); } catch { /* ignore */ }
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-accent/60 via-card to-accent/30 border shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Transform simple text into high-performance, AI-optimized instructions.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          Create Prompt
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Generations</span>
            <Zap className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-2">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : usage?.totalEnhancements || 0}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{loading ? "" : `${usage?.monthly?.used || 0} this month`}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Saved Prompts</span>
            <Book className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-2">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : usage?.totalPrompts || 0}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{loading ? "" : `In ${collectionsCount} collections`}</p>
        </div>
        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Avg Optimization</span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-2">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${usage?.averageScore || 0}%`}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Average quality score</p>
        </div>
        <div className="p-4 rounded-xl border bg-gradient-to-br from-primary/10 to-accent/30 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Completely Free</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-2">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "∞"}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">No limits, no quotas — free for everyone</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base tracking-tight">Quick Actions</h3>
          <span className="text-xs text-muted-foreground">Select a workflow</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`p-4 rounded-xl border transition-all duration-200 group hover:shadow-md hover:-translate-y-0.5 ${
                action.primary
                  ? "bg-foreground text-background shadow-sm hover:bg-foreground/95"
                  : "bg-card hover:border-foreground/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`p-2 rounded-lg ${
                    action.primary
                      ? "bg-background/20 text-background"
                      : "bg-accent text-foreground"
                  }`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <ArrowRight
                  className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-0.5 ${
                    action.primary ? "text-background" : "text-muted-foreground"
                  }`}
                />
              </div>
              <h4 className={`font-semibold text-sm mt-3 ${action.primary ? "text-background" : ""}`}>
                {action.title}
              </h4>
              <p className={`text-xs mt-1 leading-relaxed ${action.primary ? "text-background/80" : "text-muted-foreground"}`}>
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Prompts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <h3 className="font-semibold text-base tracking-tight">Trending Prompts</h3>
          </div>
          <Link href="/dashboard/templates" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            View all templates <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {trendingLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl border bg-card animate-pulse">
                <div className="h-3 w-32 bg-muted rounded mb-2" />
                <div className="h-2 w-full bg-muted rounded mb-2" />
                <div className="h-2 w-3/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : trending.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {trending.map((t, idx) => (
              <div key={t.id} className="flex flex-col p-4 rounded-xl border bg-card hover:border-foreground/20 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-semibold text-sm truncate">{t.title}</h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium flex items-center gap-0.5 shrink-0 ml-2">
                    <Flame className="h-3 w-3" /> #{idx + 1}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2 flex-1">{t.description || t.prompt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{t.usageCount} uses</span>
                  <button
                    onClick={() => copyTrending(t)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors active:scale-95"
                  >
                    {copiedId === t.id ? (
                      <>
                        <Check className="h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl border bg-card/50 text-center">
            <p className="text-sm text-muted-foreground">No trending prompts yet. Browse the templates library to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
