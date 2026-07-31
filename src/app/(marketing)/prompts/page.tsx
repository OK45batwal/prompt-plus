"use client";

import { useState } from "react";
import { Search, Copy, Check, Sparkles, FileText, Code, GraduationCap, Megaphone, ChartLine, Briefcase, Lightbulb } from "lucide-react";
import { curatedPrompts } from "@/lib/curated-prompts";

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

export default function PromptsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopy = async (id: string, prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = Object.keys(categoryMeta);

  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Free Prompt Library
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            The Best Prompts, Curated for You
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Proven prompt templates from the AI community — copy any prompt, paste it into your
            favorite AI, or enhance it with Prompt+ for free.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
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
            {categories.map((c) => (
              <option key={c} value={c}>{categoryMeta[c].label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const meta = categoryMeta[p.category] || categoryMeta.creativity;
            return (
              <div key={p.title} className="flex flex-col p-5 rounded-xl border bg-card">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <meta.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold">{p.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{p.description}</p>
                <pre className="flex-1 text-xs leading-relaxed whitespace-pre-wrap bg-muted/40 border rounded-lg p-3 mb-3 max-h-40 overflow-y-auto text-foreground/90">
                  {p.prompt}
                </pre>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase tracking-wider">
                    {meta.label}
                  </span>
                  <button
                    onClick={() => handleCopy(p.title, p.prompt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors active:scale-95"
                  >
                    {copiedId === p.title ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Prompt
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No prompts match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
