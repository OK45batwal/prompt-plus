"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Grid, List, Book, Star } from "lucide-react";

interface Prompt {
  id: string;
  title: string;
  originalText: string;
  enhancedText?: string;
  model: string;
  category: string;
  score: number;
  isFavorite: boolean;
  createdAt: string;
}

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCategory, setFilterCategory] = useState("all");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/prompts?pageSize=50")
      .then((res) => res.json())
      .then((data) => {
        setPrompts(data.data || []);
      })
      .catch(() => {
        setPrompts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const categories = ["all", "Blog Post", "Email", "Code", "Social Media", "Tutorial", "Documentation", "Marketing"];

  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.originalText.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Prompt Library</h2>
          <p className="text-xs text-muted-foreground">{prompts.length} prompts saved</p>
        </div>
        <Link
          href="/dashboard/new"
          className="h-8 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> New Prompt
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-9 px-2 rounded-lg border bg-background text-sm outline-none focus:border-ring"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
          ))}
        </select>
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 ${viewMode === "grid" ? "bg-accent" : ""}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 ${viewMode === "list" ? "bg-accent" : ""}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-muted animate-pulse h-24" />
          ))}
        </div>
      ) : prompts.length === 0 && !search && filterCategory === "all" ? (
        <div className="text-center py-16">
          <Book className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No prompts yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first prompt to get started</p>
          <Link href="/dashboard/new" className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Prompt
          </Link>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No prompts match your search</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt) => (
            <Link key={prompt.id} href={`/dashboard/new?promptId=${prompt.id}`}>
              <div className="p-4 rounded-lg border bg-card hover:border-foreground/20 transition-colors h-full">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm line-clamp-1">{prompt.title || prompt.originalText.substring(0, 60)}</h3>
                  {prompt.isFavorite && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{prompt.originalText}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span className="px-1.5 py-0.5 rounded bg-muted">{prompt.model}</span>
                  <span className="px-1.5 py-0.5 rounded bg-muted">{prompt.category}</span>
                  <span className="ml-auto font-medium">{prompt.score}/100</span>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(prompt.createdAt).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPrompts.map((prompt) => (
            <Link key={prompt.id} href={`/dashboard/new?promptId=${prompt.id}`}>
              <div className="p-3 rounded-lg border bg-card hover:border-foreground/20 transition-colors flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm line-clamp-1">{prompt.title || prompt.originalText.substring(0, 60)}</h3>
                    {prompt.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />}
                    <span className="px-1.5 py-0.5 rounded bg-muted text-xs">{prompt.model}</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-xs">{prompt.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{prompt.originalText}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(prompt.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-medium shrink-0">{prompt.score}/100</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
