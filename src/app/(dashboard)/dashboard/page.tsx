"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Book, History, Folder, LayoutTemplate, GitCompare, ArrowRight, Zap, TrendingUp, Loader2 } from "lucide-react";

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

export default function DashboardPage() {
  const [usage, setUsage] = useState<{ totalPrompts: number; totalEnhancements: number; averageScore: number; monthly: { used: number } } | null>(null);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/usage").then((r) => r.json()),
      fetch("/api/v1/collections?pageSize=1").then((r) => r.json()),
    ]).then(([usageJson, collJson]) => {
      setUsage(usageJson.data);
      setCollectionsCount(collJson.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

      {/* Service Command Center Showcase */}
      <div className="pt-4 border-t border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base tracking-tight">Prompt+ Service Hub</h3>
            <p className="text-xs text-muted-foreground">All core services included free in your account</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            6 Active Services
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur-md flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Live</span>
              </div>
              <h4 className="font-bold text-sm mt-3">⚡ Dynamic Prompt Compiler</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Transform raw prompt ideas into production-grade, domain-tailored master instructions with tone intelligence.
              </p>
            </div>
            <Link href="/dashboard/new" className="mt-4 text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Launch Compiler →
            </Link>
          </div>

          <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur-md flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <GitCompare className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">Multi-Model</span>
              </div>
              <h4 className="font-bold text-sm mt-3">🔬 Side-by-Side Model Lab</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Test prompts simultaneously across GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, and DeepSeek R1.
              </p>
            </div>
            <Link href="/dashboard/compare" className="mt-4 text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1">
              Open Model Lab →
            </Link>
          </div>

          <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur-md flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Calculator</span>
              </div>
              <h4 className="font-bold text-sm mt-3">🧮 Token Cost Estimator</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Calculate input/output token counts and exact USD costs across OpenAI, Anthropic, and Google APIs.
              </p>
            </div>
            <Link href="/prompt-cost-calculator" className="mt-4 text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1">
              Calculate Tokens →
            </Link>
          </div>

          <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur-md flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <Folder className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">Vault</span>
              </div>
              <h4 className="font-bold text-sm mt-3">📁 Prompt Vault & History</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Save prompts, organize with custom tags, track complete version history, and generate shareable links.
              </p>
            </div>
            <Link href="/dashboard/library" className="mt-4 text-xs font-semibold text-purple-500 hover:underline flex items-center gap-1">
              Access Vault →
            </Link>
          </div>

          <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur-md flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Zap className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Sync</span>
              </div>
              <h4 className="font-bold text-sm mt-3">📦 Context Bucket Handoff</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Capture multi-turn chat turns from ChatGPT and carry context to Claude or DeepSeek in 1 click.
              </p>
            </div>
            <Link href="/dashboard/settings" className="mt-4 text-xs font-semibold text-emerald-500 hover:underline flex items-center gap-1">
              Manage Sync →
            </Link>
          </div>

          <div className="p-5 rounded-2xl border bg-card/80 backdrop-blur-md flex flex-col justify-between hover:border-primary/40 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <LayoutTemplate className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">v1.1.1</span>
              </div>
              <h4 className="font-bold text-sm mt-3">🧩 Browser Extension Hub</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Install the v1.1.1 Chrome & Edge extension for in-page prompt enhancement on ChatGPT, Claude & Gemini.
              </p>
            </div>
            <Link href="/extension" className="mt-4 text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1">
              Download Extension →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
