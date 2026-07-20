"use client";

import Link from "next/link";
import { Sparkles, Book, History, Folder, LayoutTemplate, GitCompare, ArrowRight, Clock, Zap } from "lucide-react";

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

const stats = [
  { label: "Total Prompts", value: "12", change: "+3 this week" },
  { label: "Avg. Score", value: "78", change: "+5 improvement" },
  { label: "Enhancements", value: "47", change: "5 remaining today" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-semibold">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Transform your prompts into powerful, AI-optimized instructions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-lg border bg-card">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`p-4 rounded-lg border hover:border-foreground/20 transition-colors group ${
                action.primary ? "bg-foreground text-background" : "bg-card"
              }`}
            >
              <div className="flex items-start justify-between">
                <action.icon className={`h-5 w-5 ${action.primary ? "text-background" : "text-muted-foreground"}`} />
                <ArrowRight className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                  action.primary ? "text-background" : "text-muted-foreground"
                }`} />
              </div>
              <h4 className={`font-medium text-sm mt-3 ${action.primary ? "text-background" : ""}`}>{action.title}</h4>
              <p className={`text-xs mt-1 ${action.primary ? "text-background/70" : "text-muted-foreground"}`}>{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {[
            { title: "Blog Post Introduction", model: "gpt-4", score: 85, time: "2 hours ago" },
            { title: "Email Follow-up Template", model: "claude-3", score: 78, time: "5 hours ago" },
            { title: "Code Review Request", model: "gpt-4", score: 92, time: "1 day ago" },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-lg border bg-card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                item.score >= 80 ? "bg-green-100 dark:bg-green-900/30" : item.score >= 60 ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-red-100 dark:bg-red-900/30"
              }`}>
                <span className={`text-sm font-bold ${
                  item.score >= 80 ? "text-green-700 dark:text-green-400" : item.score >= 60 ? "text-yellow-700 dark:text-yellow-400" : "text-red-700 dark:text-red-400"
                }`}>{item.score}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.model} • {item.time}</p>
              </div>
              <Link href="/dashboard/new" className="text-xs text-muted-foreground hover:text-foreground">
                View
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
