"use client";

import Link from "next/link";
import { Sparkles, Book, History, Folder, LayoutTemplate, GitCompare, ArrowRight } from "lucide-react";

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
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-semibold">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Transform your prompts into powerful, AI-optimized instructions.</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-stagger">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`p-4 rounded-lg border hover:border-foreground/20 transition-colors group hover-lift ${
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

    </div>
  );
}
