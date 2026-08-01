"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Grid, List, Book, Star, Sparkles, Copy, Check, Code, FileText, GraduationCap, Megaphone, ChartLine, Briefcase, Lightbulb } from "lucide-react";
import { curatedPrompts } from "@/lib/curated-prompts";
import { useToast } from "@/components/ui/toast";

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
  const [activeTab, setActiveTab] = useState<"saved" | "curated">("saved");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCategory, setFilterCategory] = useState("all");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);

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

  const filteredSavedPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.originalText?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCuratedPrompts = curatedPrompts.filter((p) => {
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    const q = search.trim().toLowerCase();
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-lg tracking-tight">Prompt Library</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your saved prompts & explore curated prompt engineering blueprints.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="h-9 inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 text-xs font-medium hover:bg-foreground/90 transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" /> New Prompt
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "saved"
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          <Book className="h-3.5 w-3.5" />
          My Saved Prompts ({prompts.length})
        </button>
        <button
          onClick={() => setActiveTab("curated")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "curated"
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Curated Collection ({curatedPrompts.length})
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>

        {activeTab === "saved" ? (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 rounded-lg border bg-background text-xs outline-none focus:border-ring w-full sm:w-auto"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 rounded-lg border bg-background text-xs outline-none focus:border-ring w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryMeta).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center border rounded-lg shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors ${viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors ${viewMode === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content View */}
      {activeTab === "saved" ? (
        loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted/60 animate-pulse h-28 border" />
            ))}
          </div>
        ) : prompts.length === 0 && !search && filterCategory === "all" ? (
          <div className="text-center py-16 border rounded-2xl bg-card/40">
            <Book className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No saved prompts yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first prompt or copy from our Curated Collection</p>
            <Link
              href="/dashboard/new"
              className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-foreground text-background px-3.5 text-xs font-medium hover:bg-foreground/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> New Prompt
            </Link>
          </div>
        ) : filteredSavedPrompts.length === 0 ? (
          <div className="text-center py-12 border rounded-2xl bg-card/40">
            <p className="text-xs text-muted-foreground">No saved prompts match your search</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSavedPrompts.map((prompt) => (
              <Link key={prompt.id} href={`/dashboard/new?promptId=${prompt.id}`}>
                <div className="p-4 rounded-xl border bg-card hover:border-foreground/20 transition-all hover:shadow-sm h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{prompt.title || prompt.originalText.substring(0, 50)}</h3>
                      {prompt.isFavorite && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{prompt.originalText}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                      <span className="px-2 py-0.5 rounded bg-muted font-medium">{prompt.model}</span>
                      <span className="px-2 py-0.5 rounded bg-muted font-medium">{prompt.category}</span>
                      <span className="ml-auto font-semibold text-foreground">{prompt.score}/100</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{new Date(prompt.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSavedPrompts.map((prompt) => (
              <Link key={prompt.id} href={`/dashboard/new?promptId=${prompt.id}`}>
                <div className="p-3.5 rounded-xl border bg-card hover:border-foreground/20 transition-colors flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm line-clamp-1">{prompt.title || prompt.originalText.substring(0, 50)}</h3>
                      {prompt.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />}
                      <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium">{prompt.model}</span>
                      <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium">{prompt.category}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{prompt.originalText}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold">{prompt.score}/100</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(prompt.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        /* Curated Collection View */
        filteredCuratedPrompts.length === 0 ? (
          <div className="text-center py-12 border rounded-2xl bg-card/40">
            <p className="text-xs text-muted-foreground">No curated prompts match your search</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCuratedPrompts.map((p) => {
              const meta = categoryMeta[p.category] || categoryMeta.creativity;
              return (
                <div key={p.title} className="flex flex-col p-4 rounded-xl border bg-card hover:border-foreground/20 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <meta.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-sm truncate">{p.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2 flex-1">{p.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase tracking-wider">
                      {meta.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCurated(p.title, p.prompt)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors active:scale-95"
                      >
                        {copiedTitle === p.title ? (
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
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCuratedPrompts.map((p) => {
              const meta = categoryMeta[p.category] || categoryMeta.creativity;
              return (
                <div key={p.title} className="p-3.5 rounded-xl border bg-card hover:border-foreground/20 transition-colors flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <meta.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-sm truncate">{p.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase tracking-wider shrink-0">
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCurated(p.title, p.prompt)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors active:scale-95 shrink-0"
                  >
                    {copiedTitle === p.title ? (
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
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
