"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, RotateCcw, ChevronDown, Check, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

import { calculateDynamicPromptScore } from "@/lib/scoring";

interface HistoryItem {
  id: string;
  originalText: string;
  enhancedText: string;
  model: string;
  originalScore: number;
  enhancedScore: number;
  timestamp: string;
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let localItems: HistoryItem[] = [];
    try {
      const raw = localStorage.getItem("pp_local_history");
      if (raw) {
        const parsed = JSON.parse(raw);
        localItems = (parsed || []).map((x: { id?: string; originalText: string; enhancedText: string; model?: string; originalScore?: number; enhancedScore?: number; timestamp: string }) => {
          const orig = x.originalText || "";
          const enh = x.enhancedText || "";
          return {
            id: x.id || `local_${Math.random()}`,
            originalText: orig,
            enhancedText: enh,
            model: x.model || "AI Prompt+",
            originalScore: typeof x.originalScore === "number" && x.originalScore > 0 ? x.originalScore : calculateDynamicPromptScore(orig).total,
            enhancedScore: typeof x.enhancedScore === "number" && x.enhancedScore > 0 ? x.enhancedScore : calculateDynamicPromptScore(enh).total,
            timestamp: new Date(x.timestamp).toLocaleDateString(),
          };
        });
      }
    } catch {
      // ignore
    }

    fetch("/api/v1/prompts?pageSize=50")
      .then((r) => r.json())
      .then((json) => {
        const serverItems = (json.data || []).map((p: { id: string; originalText: string; enhancedText: string | null; model: string; score: unknown; createdAt: string }) => {
          const orig = p.originalText || "";
          const enh = p.enhancedText || "";
          const serverScore = (typeof p.score === "object" && p.score && "total" in (p.score as Record<string, unknown>))
            ? Number((p.score as Record<string, unknown>).total)
            : 0;

          return {
            id: p.id,
            originalText: orig,
            enhancedText: enh,
            model: p.model,
            originalScore: calculateDynamicPromptScore(orig).total,
            enhancedScore: serverScore > 0 ? serverScore : calculateDynamicPromptScore(enh).total,
            timestamp: new Date(p.createdAt).toLocaleDateString(),
          };
        });

        // Merge server and local items, deduplicating by originalText
        const textSet = new Set(serverItems.map((s: HistoryItem) => s.originalText.trim()));
        const uniqueLocal = localItems.filter((l) => !textSet.has(l.originalText.trim()));
        setHistory([...serverItems, ...uniqueLocal]);
      })
      .catch(() => {
        // Fallback to local storage history if unauthenticated
        setHistory(localItems);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredHistory = history.filter((item) =>
    item.originalText.toLowerCase().includes(search.toLowerCase()) ||
    item.enhancedText.toLowerCase().includes(search.toLowerCase())
  );

  const router = useRouter();

  const reusePrompt = (item: HistoryItem) => {
    router.push(`/dashboard/new?prompt=${encodeURIComponent(item.originalText)}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard", "success");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-sm">History</h2>
        <p className="text-xs text-muted-foreground">{loading ? "Loading..." : `${history.length} items`}</p>
      </div>

      <div className="max-w-4xl">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* History List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 && !search ? (
          <div className="text-center py-16">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No history yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your prompt enhancements will appear here</p>
            <Link href="/dashboard/new" className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> New Enhancement
            </Link>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No history matches your search</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <div key={item.id} className="rounded-lg border bg-card overflow-hidden">
                {/* Main Row */}
                <div
                  className="p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.originalText}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted">{item.model}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Before</p>
                      <p className="text-sm font-bold text-red-600">{item.originalScore}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">After</p>
                      <p className="text-sm font-bold text-green-600">{item.enhancedScore}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === item.id ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === item.id && (
                  <div className="border-t p-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Original</p>
                      <p className="text-sm p-2 rounded bg-muted/50">{item.originalText}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Enhanced</p>
                      <p className="text-sm p-2 rounded bg-muted/50">{item.enhancedText}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => reusePrompt(item)}
                        className="h-8 flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reuse
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.enhancedText)}
                        className="h-8 flex items-center justify-center rounded-lg border px-3 text-xs font-medium hover:bg-accent transition-colors"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Copy Enhanced
                      </button>

                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
