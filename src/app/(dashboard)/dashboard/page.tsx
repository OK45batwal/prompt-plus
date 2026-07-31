"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Book, History, Folder, LayoutTemplate, GitCompare, ArrowRight, Zap, TrendingUp, Loader2, Search, Copy, Check, FileText, Code, GraduationCap, Megaphone, ChartLine, Briefcase, Lightbulb } from "lucide-react";
import { curatedPrompts } from "@/lib/curated-prompts";

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

const categoryMeta: Record<string, { label: string; icon: typeof Code }> = {
  coding: { label: "Coding", icon: Code },
  writing: { label: "Writing", icon: FileText },
  learning: { label: "Learning", icon: GraduationCap },
  marketing: { label: "Marketing", icon: Megaphone },
  analysis: { label: "Analysis", icon: ChartLine },
  productivity: { label: "Productivity", icon: Briefcase },
  creativity: { label: "Creativity", icon: Lightbulb },
  career: { label: "Career", icon: Briefcase },
};

export default function DashboardPage() {
  const [usage, setUsage] = useState<{ totalPrompts: number; totalEnhancements: number; averageScore: number; monthly: { used: number } } | null>(null);
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/usage").then((r) => r.json()),
      fetch("/api/v1/collections?pageSize=1").then((r) => r.json()),
    ]).then(([usageJson, collJson]) => {
      setUsage(usageJson.data);
      setCollectionsCount(collJson.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = curatedPrompts.filter((p) => {
    const matchesCategory = category === "all" || p.category === category;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const copyPrompt = async (id: string, prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
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

      {/* Curated Prompt Collection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-base tracking-tight">Curated Prompt Collection</h3>
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} prompts</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="h-10 w-full rounded-lg border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-lg border bg-card px-3 text-sm outline-none focus:border-ring"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryMeta).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((p) => {
            const meta = categoryMeta[p.category] || categoryMeta.creativity;
            return (
              <div key={p.title} className="flex flex-col p-4 rounded-xl border bg-card hover:border-foreground/20 transition-colors">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <meta.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm truncate">{p.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2 flex-1">{p.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase tracking-wider">
                    {meta.label}
                  </span>
                  <button
                    onClick={() => copyPrompt(p.title, p.prompt)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors active:scale-95"
                  >
                    {copiedId === p.title ? (
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
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="p-6 rounded-xl border bg-card/50 text-center">
            <p className="text-sm text-muted-foreground">No prompts match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
