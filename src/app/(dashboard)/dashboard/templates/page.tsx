"use client";

import { useState, useEffect } from "react";
import { Search, Copy, Check, FileText, Mail, Code, Share2, Book, ShoppingBag, BadgeCheck, Terminal, GitFork, Sparkles } from "lucide-react";
import { ExportCodeModal } from "@/components/prompts/export-code-modal";

interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: string;
  model: string | null;
  /** Only set for DB-backed templates. The static official list carries no real usage count. */
  usageCount?: number;
  isOfficial: boolean;
  prompt: string;
}

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportItem, setExportItem] = useState<{ title: string; text: string } | null>(null);

  // Interactive Variable Filler State
  const [fillTemplate, setFillTemplate] = useState<TemplateItem | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const extractVariables = (promptText: string): string[] => {
    const matches = promptText.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, ""))));
  };

  const getFilledPrompt = (promptText: string, values: Record<string, string>): string => {
    let result = promptText;
    Object.entries(values).forEach(([k, v]) => {
      const regex = new RegExp(`\\{\\{${k}\\}\\}`, "g");
      result = result.replace(regex, v || `[${k}]`);
    });
    return result;
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const params = new URLSearchParams();
        if (filterCategory !== "all") params.set("category", filterCategory);
        if (search.trim()) params.set("search", search.trim());
        if (onlyOfficial) params.set("isOfficial", "true");

        const res = await fetch(`/api/v1/templates?${params.toString()}`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        if (isMounted) setTemplates(Array.isArray(json.data) ? json.data : []);
      } catch {
        if (isMounted) {
          setTemplates([]);
          setLoadError("Could not load templates. Check your connection and try again.");
        }
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
        prev.map((t) => (t.id === template.id ? { ...t, usageCount: (t.usageCount ?? 0) + 1 } : t))
      );
    } catch {
      // ignore tracking errors
    }

    setTimeout(() => setCopiedId(null), 2000);
  };

  const [forkingId, setForkingId] = useState<string | null>(null);

  const forkTemplate = async (template: TemplateItem) => {
    setForkingId(template.id);
    try {
      const res = await fetch("/api/v1/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({
          title: template.title,
          originalText: template.prompt,
          model: template.model || "gpt-4o-mini",
          category: template.category,
        }),
      });
      if (res.ok) {
        alert(`Successfully forked "${template.title}" into your personal Prompt Library!`);
      } else {
        alert("Please log in to fork templates into your personal library.");
      }
    } catch {
      alert("Failed to fork template.");
    } finally {
      setForkingId(null);
    }
  };

  const categories = ["all", "Blog Post", "Email", "Code", "Social Media", "Tutorial", "Marketing"];

  const getIcon = (category: string) => {
    switch (category) {
      case "Blog Post": return <FileText className="h-5 w-5 text-primary" />;
      case "Email": return <Mail className="h-5 w-5 text-primary" />;
      case "Code": return <Code className="h-5 w-5 text-primary" />;
      case "Social Media": return <Share2 className="h-5 w-5 text-primary" />;
      case "Tutorial": return <Book className="h-5 w-5 text-primary" />;
      case "Marketing": return <ShoppingBag className="h-5 w-5 text-primary" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Filter templates locally if search or category is active
  const filteredTemplates = templates.filter((t) => {
    if (filterCategory !== "all" && t.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
    if (onlyOfficial && !t.isOfficial) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.prompt.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Template Marketplace</h2>
          <p className="text-xs text-muted-foreground">Pick a template, see the inputs it needs, then customise it for your task.</p>
        </div>
      </div>

      <div className="max-w-6xl">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <label htmlFor="template-search" className="sr-only">Search templates by task</label>
            <input
              id="template-search"
              type="text"
              placeholder="Search by task, e.g. blog post, cold email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <label htmlFor="template-category" className="sr-only">Filter templates by category</label>
          <select
            id="template-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 w-full sm:w-auto px-2 rounded-lg border bg-background text-sm outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
            ))}
          </select>

          <button
            type="button"
            aria-pressed={onlyOfficial}
            onClick={() => setOnlyOfficial(!onlyOfficial)}
            className={`h-9 w-full sm:w-auto px-3 rounded-lg border text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              onlyOfficial
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <BadgeCheck className="h-3.5 w-3.5 text-cyan-400" />
            Official only
          </button>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 bg-muted rounded" />
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
        ) : loadError ? (
          <div className="text-center py-12">
            <p className="text-sm text-destructive">{loadError}</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12 border rounded-2xl bg-card/40">
            <p className="text-sm font-semibold">
              {templates.length === 0 ? "No templates to show" : "No templates match your search"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {templates.length === 0
                ? "Nothing came back from the template list. Reload the page to try again."
                : "Try a different keyword or category, or turn off Official only."}
            </p>
            {templates.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterCategory("all");
                  setOnlyOfficial(false);
                }}
                className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border bg-background px-3.5 text-xs font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Clear search & filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const variables = extractVariables(template.prompt);
              return (
                <div key={template.id} className="p-4 rounded-lg border bg-card hover:border-foreground/20 transition-colors hover-lift flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {getIcon(template.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-medium text-sm truncate">{template.title}</h3>
                        {template.isOfficial && (
                          <span className="shrink-0 text-cyan-500" title="Official template">
                            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Official template</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{template.category}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {template.description}
                  </p>

                  {variables.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-3">
                      <span className="font-medium text-foreground">Inputs: </span>
                      {variables.map((v) => v.replace(/_/g, " ")).join(", ")}
                    </p>
                  )}

                  <details className="mb-4">
                    <summary className="cursor-pointer text-xs font-medium text-primary rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Preview structure
                    </summary>
                    <pre className="mt-2 p-3 rounded-lg border bg-muted/40 text-[11px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{template.prompt}</pre>
                  </details>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.model && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono">
                        {template.model}
                      </span>
                    )}
                    {typeof template.usageCount === "number" && template.usageCount > 0 && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded">
                        {template.usageCount} uses
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      type="button"
                      aria-label={`Customize ${template.title}`}
                      onClick={() => {
                        const initialVals: Record<string, string> = {};
                        variables.forEach((v) => (initialVals[v] = ""));
                        setVariableValues(initialVals);
                        setFillTemplate(template);
                      }}
                      className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Customize
                    </button>
                    <button
                      type="button"
                      onClick={() => copyTemplate(template)}
                      aria-label={copiedId === template.id ? "Copied raw template text" : "Copy raw template text"}
                      className="h-8 px-2.5 rounded-lg border bg-background text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {copiedId === template.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => forkTemplate(template)}
                      disabled={forkingId === template.id}
                      aria-label={`Fork ${template.title} to your library`}
                      className="h-8 px-2.5 rounded-lg border bg-background text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <GitFork className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportItem({ title: template.title, text: template.prompt })}
                      aria-label={`Export ${template.title} as code`}
                      className="h-8 px-2.5 rounded-lg border bg-background text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Terminal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Variable Filler Modal */}
      {fillTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="template-fill-title" className="bg-card border rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 id="template-fill-title" className="font-bold text-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Customize Template
                </h3>
                <p className="text-xs text-muted-foreground">{fillTemplate.title}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setFillTemplate(null)}
                className="text-xs text-muted-foreground hover:text-foreground rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ✕
              </button>
            </div>

            {/* Dynamic Variable Input Fields */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground block">Required inputs</p>
              {extractVariables(fillTemplate.prompt).map((varName) => (
                <div key={varName} className="space-y-1">
                  <label htmlFor={`var-${varName}`} className="text-xs font-medium text-foreground capitalize">
                    {varName.replace(/_/g, " ")}
                  </label>
                  <input
                    id={`var-${varName}`}
                    type="text"
                    value={variableValues[varName] || ""}
                    onChange={(e) => setVariableValues((prev) => ({ ...prev, [varName]: e.target.value }))}
                    placeholder={`Enter ${varName.replace(/_/g, " ")}`}
                    className="w-full h-9 px-3 rounded-lg border bg-background text-xs outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              ))}
            </div>

            {/* Live Prompt Preview */}
            <div className="space-y-1 pt-2">
              <p id="template-preview-label" className="text-xs font-semibold text-muted-foreground block">Resulting prompt</p>
              <div role="group" aria-labelledby="template-preview-label" className="p-3 rounded-lg border bg-accent/30 text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                {getFilledPrompt(fillTemplate.prompt, variableValues)}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setFillTemplate(null)}
                className="px-3 py-1.5 rounded-lg border text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalPrompt = getFilledPrompt(fillTemplate.prompt, variableValues);
                  navigator.clipboard.writeText(finalPrompt);
                  alert("Custom prompt copied to clipboard!");
                  setFillTemplate(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Copy custom prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {exportItem && (
        <ExportCodeModal
          isOpen={!!exportItem}
          onClose={() => setExportItem(null)}
          title={exportItem.title}
          promptText={exportItem.text}
        />
      )}
    </div>
  );
}
