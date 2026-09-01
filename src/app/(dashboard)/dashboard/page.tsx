"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Book, History, Folder, LayoutTemplate, GitCompare, ArrowRight, Zap, TrendingUp, Loader2 } from "lucide-react";
import { OnboardingTour } from "@/components/dashboard/onboarding-tour";

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
      {/* Hero Welcome with Double-Bezel Nested Shell */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono font-semibold uppercase tracking-wider mb-2">
              <span>● Prompt Architect Active</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Transform rough thoughts into deterministic, production-grade master instructions.
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="group relative z-10 inline-flex items-center justify-between gap-3 h-11 px-5 rounded-full bg-foreground text-background text-xs sm:text-sm font-semibold hover:bg-foreground/90 transition-all shadow-xs active:scale-95 shrink-0"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Create Prompt</span>
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/15 text-xs transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* Interactive First-Use Onboarding Tour */}
      <OnboardingTour />

      {/* Quick Stats Grid with Double-Bezel Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
          <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Generations</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold mt-3 font-mono">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : usage?.totalEnhancements || 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">{loading ? "" : `${usage?.monthly?.used || 0} this month`}</p>
          </div>
        </div>

        <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
          <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Saved Prompts</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Book className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold mt-3 font-mono">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : usage?.totalPrompts || 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">{loading ? "" : `In ${collectionsCount} collections`}</p>
          </div>
        </div>

        <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
          <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Quality Score</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold mt-3 font-mono text-amber-500">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${usage?.averageScore || 0}%`}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">Average quality benchmark</p>
          </div>
        </div>

        <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
          <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between bg-primary/[0.03] border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">Tier Plan</span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold mt-3 text-primary font-mono">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "∞ Free"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">Zero paywalls & no quotas</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-bold text-sm tracking-tight uppercase font-mono text-foreground/80">Quick Workflows</h3>
          <span className="text-xs text-muted-foreground font-mono">{"// Select an action"}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`double-bezel-outer group transition-all duration-200 hover:-translate-y-0.5 ${
                action.primary ? "ring-1 ring-primary/40" : ""
              }`}
            >
              <div
                className={`double-bezel-inner p-5 h-full flex flex-col justify-between transition-colors ${
                  action.primary
                    ? "bg-foreground text-background"
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
      </div>

      {/* Service Command Center Showcase */}
      <div className="pt-4 border-t border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm tracking-tight uppercase font-mono text-foreground/80">Prompt+ Service Hub</h3>
            <p className="text-xs text-muted-foreground">All core developer tools included free</p>
          </div>
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            6 Active Modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Live</span>
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
          </div>

          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <GitCompare className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Multi-Model</span>
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
          </div>

          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Calculator</span>
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
          </div>

          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <Folder className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">Vault</span>
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
          </div>

          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Zap className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Sync</span>
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
          </div>

          <div className="double-bezel-outer group hover:-translate-y-0.5 transition-all">
            <div className="double-bezel-inner p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    <LayoutTemplate className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">v1.1.1</span>
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
    </div>
  );
}
