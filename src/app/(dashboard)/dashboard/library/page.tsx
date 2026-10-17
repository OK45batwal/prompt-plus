"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Grid, List, Book, Star, Sparkles, Copy, Check, Code, FileText, GraduationCap, Megaphone, ChartLine, Briefcase, Lightbulb, Terminal, Pencil } from "lucide-react";
import { curatedPrompts } from "@/lib/curated-prompts";
import { useToast } from "@/components/ui/toast";
import { ExportCodeModal } from "@/components/prompts/export-code-modal";

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

export default function LibraryPage() {
  const { toast } = useToast();
  const [savedSearch, setSavedSearch] = useState("");
  const [curatedSearch, setCuratedSearch] = useState("");
  const [curatedCategory, setCuratedCategory] = useState("all");
  const [savedCategory, setSavedCategory] = useState("all");
  const [savedSort, setSavedSort] = useState<"recent" | "oldest" | "title" | "category">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);
  const [exportPrompt, setExportPrompt] = useState<{ title: string; text: string } | null>(null);

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

  const savedCategoryOptions = ["all", "Blog Post", "Email", "Code", "Social Media", "Tutorial", "Documentation", "Marketing"];

  const titleOf = (p: Prompt) => p.title || p.originalText.substring(0, 50);

  const filteredSavedPrompts = prompts.filter((p) => {
    const q = savedSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.originalText?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.model?.toLowerCase().includes(q);
    const matchesCategory = savedCategory === "all" || p.category === savedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedSavedPrompts = [...filteredSavedPrompts].sort((a, b) => {
    if (savedSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (savedSort === "title") return titleOf(a).localeCompare(titleOf(b));
    if (savedSort === "category") {
      return (a.category || "").localeCompare(b.category || "") || titleOf(a).localeCompare(titleOf(b));
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredCuratedPrompts = curatedPrompts.filter((p) => {
    const matchesCategory = curatedCategory === "all" || p.category === curatedCategory;
    const q = curatedSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCopyCurated = async (title: string, promptText: string) => {
    await navigator.clipboard.writeText(promptText);
    setCopiedTitle(title);
    toast("Copied curated prompt to clipboard!", "success");
    setTimeout(() => setCopiedTitle(null), 2000);
  };

  const toggleFavorite = async (prompt: Prompt) => {
    const next = !prompt.isFavorite;
    setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? { ...p, isFavorite: next } : p)));
    try {
      const res = await fetch(`/api/v1/prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? { ...p, isFavorite: !next } : p)));
      toast("Could not update favorite. Try again.", "error");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-accent/60 via-card to-accent/30 border shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Prompt Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your saved prompts, plus a curated collection you can copy from.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-all shadow-sm active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" /> New Prompt
        </Link>
      </div>

      {/* SECTION 1: MY SAVED PROMPTS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-cyan-500" />
            <h3 className="font-bold text-base tracking-tight">My Saved Prompts</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">
              {prompts.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-56 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <label htmlFor="saved-search" className="sr-only">Search saved prompts</label>
              <input
                id="saved-search"
                type="text"
                placeholder="Search title, text, category"
                value={savedSearch}
                onChange={(e) => setSavedSearch(e.target.value)}
                className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <label htmlFor="saved-category" className="sr-only">Filter saved prompts by category</label>
            <select
              id="saved-category"
              value={savedCategory}
              onChange={(e) => setSavedCategory(e.target.value)}
              className="h-8 px-2.5 rounded-lg border bg-background text-xs outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            >
              {savedCategoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>
            <label htmlFor="saved-sort" className="sr-only">Sort saved prompts</label>
            <select
              id="saved-sort"
              value={savedSort}
              onChange={(e) => setSavedSort(e.target.value as typeof savedSort)}
              className="h-8 px-2.5 rounded-lg border bg-background text-xs outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="recent">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A–Z</option>
              <option value="category">Category A–Z</option>
            </select>
            <div className="flex items-center border rounded-lg overflow-hidden shrink-0">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${viewMode === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted/60 animate-pulse h-28 border" />
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-10 border rounded-2xl bg-card/40">
            <Book className="h-7 w-7 text-muted-foreground mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold">No saved prompts yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Create one in the Studio, or copy a prompt from the curated collection below.</p>
            <Link
              href="/dashboard/new"
              className="mt-3 inline-flex h-8 items-center justify-center rounded-lg bg-foreground text-background px-3.5 text-xs font-medium hover:bg-foreground/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Prompt
            </Link>
          </div>
        ) : filteredSavedPrompts.length === 0 ? (
          <div className="text-center py-8 border rounded-2xl bg-card/40">
            <p className="text-sm font-semibold">No saved prompts match these filters</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Try a different search term or category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSavedSearch("");
                setSavedCategory("all");
              }}
              className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border bg-background px-3.5 text-xs font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear search & filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSavedPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-4 rounded-xl border bg-card hover:border-foreground/20 transition-colors h-full flex flex-col"
              >
                <h3 className="font-semibold text-sm line-clamp-1 mb-2">{titleOf(prompt)}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{prompt.originalText}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-muted font-medium">{prompt.model}</span>
                  <span className="px-2 py-0.5 rounded bg-muted font-medium">{prompt.category}</span>
                  <span className="ml-auto font-semibold text-foreground">{prompt.score}/100</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(prompt.createdAt).toLocaleDateString()}</p>
                <div className="mt-auto pt-3 border-t flex items-center justify-between">
                  <Link
                    href={`/dashboard/new?promptId=${prompt.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit prompt
                  </Link>
                  <button
                    type="button"
                    aria-pressed={prompt.isFavorite}
                    aria-label={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    onClick={() => toggleFavorite(prompt)}
                    className="p-1 rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star className={`h-3.5 w-3.5 ${prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSavedPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-3.5 rounded-xl border bg-card hover:border-foreground/20 transition-colors flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm line-clamp-1">{titleOf(prompt)}</h3>
                    <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium">{prompt.model}</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium">{prompt.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{prompt.originalText}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold">{prompt.score}/100</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(prompt.createdAt).toLocaleDateString()}</p>
                </div>
                <Link
                  href={`/dashboard/new?promptId=${prompt.id}`}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-primary rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <button
                  type="button"
                  aria-pressed={prompt.isFavorite}
                  aria-label={prompt.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  onClick={() => toggleFavorite(prompt)}
                  className="shrink-0 p-1 rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star className={`h-3.5 w-3.5 ${prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: CURATED PROMPT COLLECTION */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base tracking-tight">Curated Prompt Collection</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {filteredCuratedPrompts.length} prompts
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-56 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <label htmlFor="curated-search" className="sr-only">Search curated prompts</label>
              <input
                id="curated-search"
                type="text"
                placeholder="Search curated prompts"
                value={curatedSearch}
                onChange={(e) => setCuratedSearch(e.target.value)}
                className="h-8 w-full rounded-lg border bg-background pl-8 pr-3 text-xs outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <label htmlFor="curated-category" className="sr-only">Filter curated prompts by category</label>
            <select
              id="curated-category"
              value={curatedCategory}
              onChange={(e) => setCuratedCategory(e.target.value)}
              className="h-8 px-2.5 rounded-lg border bg-background text-xs outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryMeta).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredCuratedPrompts.length === 0 ? (
          <div className="text-center py-10 border rounded-2xl bg-card/40">
            <p className="text-sm font-semibold">Nothing matches that search</p>
            <p className="text-xs text-muted-foreground mt-0.5">Try another keyword, or pick a different category.</p>
            <button
              type="button"
              onClick={() => {
                setCuratedSearch("");
                setCuratedCategory("all");
              }}
              className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border bg-background px-3.5 text-xs font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear search & category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCuratedPrompts.map((p) => {
              const meta = categoryMeta[p.category] || categoryMeta.creativity;
              return (
                <div
                  key={p.title}
                  className="flex flex-col p-4 rounded-xl border bg-card hover:border-foreground/20 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <meta.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-sm truncate">{p.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2 flex-1">
                    {p.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {meta.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExportPrompt({ title: p.title, text: p.prompt })}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border bg-background text-muted-foreground hover:text-foreground text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        title="Export prompt as code"
                      >
                        <Terminal className="h-3.5 w-3.5" />
                        Code
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyCurated(p.title, p.prompt)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {copiedTitle === p.title ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedTitle === p.title ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Code Modal */}
      {exportPrompt && (
        <ExportCodeModal
          isOpen={!!exportPrompt}
          onClose={() => setExportPrompt(null)}
          title={exportPrompt.title}
          promptText={exportPrompt.text}
        />
      )}
    </div>
  );
}
