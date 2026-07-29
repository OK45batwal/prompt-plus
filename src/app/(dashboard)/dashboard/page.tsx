"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Book, History, Folder, LayoutTemplate, GitCompare, ArrowRight, Zap, TrendingUp, Key, Loader2 } from "lucide-react";

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
  const [usage, setUsage] = useState<{ daily: { used: number; limit: number; remaining: number }; totalPrompts: number; totalEnhancements: number; averageScore: number; monthly: { used: number } } | null>(null);
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
            <span className="text-xs font-medium text-muted-foreground">Quality Score</span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-2">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${usage?.averageScore || 0}%`}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Avg optimization</p>
        </div>
        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Daily Limit</span>
            <Key className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-2">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${usage?.daily?.remaining || 0}/${usage?.daily?.limit || 20}`}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Free tier quota</p>
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
    </div>
  );
}
