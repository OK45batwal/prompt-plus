"use client";

import { useState, useEffect } from "react";
import { Search, Copy, Check, FileText, Mail, Code, Share2, Book, ShoppingBag, Star, BadgeCheck } from "lucide-react";

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: string;
  model: string | null;
  usageCount: number;
  isOfficial: boolean;
  prompt: string;
}

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterCategory !== "all") params.set("category", filterCategory);
        if (search.trim()) params.set("search", search.trim());
        if (onlyOfficial) params.set("isOfficial", "true");

        const res = await fetch(`/api/v1/templates?${params.toString()}`);
        if (res.ok && isMounted) {
          const json = await res.json();
          setTemplates(Array.isArray(json.data) ? json.data : []);
        } else if (isMounted) {
          setTemplates([]);
        }
      } catch {
        if (isMounted) setTemplates([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [filterCategory, search, onlyOfficial]);

  const copyTemplate = async (template: TemplateItem) => {
    navigator.clipboard.writeText(template.prompt);
    setCopiedId(template.id);

    try {
      await fetch(`/api/v1/templates/${template.id}/use`, { method: "POST" });
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t))
      );
    } catch {
      // ignore tracking errors
    }

    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = ["all", "Blog Post", "Email", "Code", "Social Media", "Tutorial", "Marketing"];

  const getIcon = (category: string) => {
    switch (category) {
      case "Blog Post": return <FileText className="h-5 w-5 text-blue-500" />;
      case "Email": return <Mail className="h-5 w-5 text-green-500" />;
      case "Code": return <Code className="h-5 w-5 text-purple-500" />;
      case "Social Media": return <Share2 className="h-5 w-5 text-pink-500" />;
      case "Tutorial": return <Book className="h-5 w-5 text-amber-500" />;
      case "Marketing": return <ShoppingBag className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Template Marketplace</h2>
          <p className="text-xs text-muted-foreground">Ready-to-use prompts with variable placeholders</p>
        </div>
      </div>

      <div className="max-w-6xl">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 w-full sm:w-auto px-2 rounded-lg border bg-background text-sm outline-none focus:border-ring"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOnlyOfficial(!onlyOfficial)}
            className={`h-9 w-full sm:w-auto px-3 rounded-lg border text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 ${
              onlyOfficial
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <BadgeCheck className="h-3.5 w-3.5 text-blue-400" />
            Official Only
          </button>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-muted rounded mb-1" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-muted rounded mb-1" />
                <div className="h-3 w-3/4 bg-muted rounded mb-3" />
                <div className="flex gap-1 mb-3">
                  <div className="h-4 w-12 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="h-8 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="p-4 rounded-lg border bg-card hover:border-foreground/20 transition-colors hover-lift flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        {getIcon(template.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-medium text-sm">{template.title}</h3>
                          {template.isOfficial && (
                            <span title="Official Template">
                              <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{template.usageCount.toLocaleString()} uses</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(template.id)}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <Star className={`h-4 w-4 ${favorites[template.id] ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex items-center gap-1 mb-3">
                    {template.model && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{template.model}</span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{template.category}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copyTemplate(template)}
                  className="w-full h-8 inline-flex items-center justify-center rounded-lg border text-xs font-medium hover:bg-accent transition-colors"
                >
                  {copiedId === template.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> Copied & Counted
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Use Template
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
