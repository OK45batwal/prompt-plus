"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Book, History, Folder, LayoutTemplate, GitCompare, ArrowRight, Zap, TrendingUp, Loader2, RotateCcw, FileText } from "lucide-react";
import { OnboardingTour } from "@/components/dashboard/onboarding-tour";
import { EXTENSION_VERSION } from "@/lib/version";

const quickActions = [
  {
    title: "Enhance prompt",
    description: "Turn a rough request into a structured prompt",
    href: "/dashboard/new",
    icon: Sparkles,
    primary: true,
  },
  {
    title: "Library",
    description: "Access your saved prompts & curated library",
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

interface RecentPrompt {
  id: string;
  originalText: string;
  createdAt: string;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function DashboardPage() {
  const [usage, setUsage] = useState<{ totalPrompts: number; totalEnhancements: number; averageScore: number | null; used: number; limit: number; remaining: number } | null>(null);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState<RecentPrompt[] | null>(null);
  const [recentFailed, setRecentFailed] = useState(false);
  const [recentAttempt, setRecentAttempt] = useState(0);
  const [hasDraft, setHasDraft] = useState(false);

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
    fetch("/api/v1/prompts?pageSize=4")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((json) => {
        setRecent((json.data || []).map((p: { id: string; originalText: string; createdAt: string }) => ({
          id: p.id,
          originalText: p.originalText,
          createdAt: p.createdAt,
        })));
      })
      .catch(() => setRecentFailed(true));
  }, [recentAttempt]);

  const retryRecent = () => {
    setRecent(null);
    setRecentFailed(false);
    setRecentAttempt((n) => n + 1);
  };

  // The Studio persists its in-progress draft under this key (see dashboard/new/page.tsx).
  // Read it after mount so the server and first client render agree.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem("pp_studio_draft");
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (typeof draft?.text === "string" && draft.text.trim()) setHasDraft(true);
      } catch {
        // Blocked or unreadable storage just means no resume offer.
      }
    });
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Start here: begin a new prompt, or resume the draft the Studio kept. */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Turn a rough request into a structured prompt you can reuse.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-xs sm:text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Sparkles className="h-4 w-4" />
              <span>Enhance a prompt</span>
            </Link>
            {hasDraft && (
              <Link
                href="/dashboard/new"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-xs sm:text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Resume draft</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Interactive First-Use Onboarding Tour */}
      <OnboardingTour />

      {/* Recent work — the returning user's own prompts, before any counters. */}
      <section aria-labelledby="recent-work-heading">
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <h3 id="recent-work-heading" className="font-bold text-sm tracking-tight">Recent work</h3>
          <Link href="/dashboard/history" className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            View all
          </Link>
        </div>

        {recentFailed ? (
          <div role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
            <span>Could not load your recent prompts.</span>
            <button
              type="button"
              onClick={retryRecent}
              className="font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Try again
            </button>
          </div>
        ) : recent === null ? (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-lg border bg-card animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Nothing here yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Enhance your first prompt and it will appear here.</p>
            <Link
              href="/dashboard/new"
              className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Sparkles className="h-3.5 w-3.5" /> Enhance a prompt
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border bg-card">
            {recent.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/dashboard/new?promptId=${encodeURIComponent(item.id)}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{item.originalText}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatWhen(item.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="font-bold text-sm tracking-tight mb-3.5">Workflows</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`double-bezel-outer group transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                action.primary ? "ring-1 ring-primary/40" : ""
              }`}
            >
              <div
                className={`double-bezel-inner p-5 h-full flex flex-col justify-between transition-colors ${
                  action.primary
                    ? "bg-foreground! text-background"
                    : "hover:border-foreground/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`p-2.5 rounded-xl transition-transform group-hover:scale-105 ${
                      action.primary
                        ? "bg-background/20 text-background"
                        : "bg-accent text-foreground border border-border/60"
                    }`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5 ${
                      action.primary ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className={`font-bold text-sm ${action.primary ? "text-background" : ""}`}>
                    {action.title}
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed ${action.primary ? "text-background/80" : "text-muted-foreground"}`}>
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Counters live behind a disclosure so the first screen stays task-first. */}
      <details className="border-t border-border/60 pt-5">
        <summary className="cursor-pointer text-sm font-medium text-foreground/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
          Usage and stats
        </summary>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-4">
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Prompts enhanced</span>
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold mt-3 font-mono">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : usage?.totalEnhancements || 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">{loading ? "" : `${usage?.used || 0} this month`}</p>
            </div>
          </div>

          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Saved prompts</span>
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Book className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold mt-3 font-mono">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : usage?.totalPrompts || 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">{loading ? "" : `In ${collectionsCount} collections`}</p>
            </div>
          </div>

          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Average score</span>
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold mt-3 font-mono">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : usage?.averageScore == null ? "—" : `${usage.averageScore}/100`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">From measured model assessments</p>
            </div>
          </div>

          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Enhancements left</span>
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold mt-3 font-mono">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : usage?.remaining ?? "—"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                {loading || usage?.limit == null ? "" : `of ${usage.limit} this month`}
              </p>
            </div>
          </div>
        </div>
      </details>

      {/* Service Command Center Showcase */}
      <section className="pt-4 border-t border-border/60">
        <div className="mb-4">
          <h3 className="font-bold text-sm tracking-tight">Prompt+ Service Hub</h3>
          <p className="text-xs text-muted-foreground">Everything here is included with your account.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <span className="inline-flex p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="h-5 w-5" />
                </span>
                <h4 className="font-bold text-sm mt-3">Prompt enhancement</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Turn a rough request into a structured prompt, with optional tone, length, and category controls.
                </p>
              </div>
              <Link href="/dashboard/new" className="mt-4 text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                Enhance a prompt <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <span className="inline-flex p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <GitCompare className="h-5 w-5" />
                </span>
                <h4 className="font-bold text-sm mt-3">Model comparison</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Compare responses from the models you have configured a key for, side by side.
                </p>
              </div>
              <Link href="/dashboard/model-lab" className="mt-4 text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                Open Model Lab <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <span className="inline-flex p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <h4 className="font-bold text-sm mt-3">Token cost calculator</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Estimate input and output token counts and the cost of a request before you send it.
                </p>
              </div>
              <Link href="/prompt-cost-calculator" className="mt-4 text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                Calculate tokens <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <span className="inline-flex p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Folder className="h-5 w-5" />
                </span>
                <h4 className="font-bold text-sm mt-3">Prompt library & history</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Save prompts, organize them with tags and collections, and revisit earlier versions.
                </p>
              </div>
              <Link href="/dashboard/library" className="mt-4 text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                Open library <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <span className="inline-flex p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Zap className="h-5 w-5" />
                </span>
                <h4 className="font-bold text-sm mt-3">Reusable context</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Save the tone, audience and constraints you keep repeating, and apply them in the extension.
                </p>
              </div>
              <Link href="/dashboard/settings" className="mt-4 text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                Manage sync <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <span className="inline-flex p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <LayoutTemplate className="h-5 w-5" />
                </span>
                <h4 className="font-bold text-sm mt-3">Browser extension</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Install the v{EXTENSION_VERSION} extension to enhance prompts on ChatGPT, Claude, and Gemini.
                </p>
              </div>
              <Link href="/extension" className="mt-4 text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                Download extension <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
