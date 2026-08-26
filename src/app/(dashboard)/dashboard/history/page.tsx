"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, RotateCcw, ChevronDown, Check, Sparkles, Loader2, Trash2, AlertTriangle } from "lucide-react";
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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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

  const handleDeleteItem = async (item: HistoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDeleting(item.id);

    try {
      // 1. Clean local storage
      try {
        const raw = localStorage.getItem("pp_local_history");
        if (raw) {
          const parsed = JSON.parse(raw);
          const filtered = (parsed || []).filter(
            (x: { id?: string; originalText?: string }) =>
              x.id !== item.id && x.originalText?.trim() !== item.originalText.trim()
          );
          localStorage.setItem("pp_local_history", JSON.stringify(filtered));
        }
      } catch {
        // ignore
      }

      // 2. Call backend if server item
      if (!item.id.startsWith("local_")) {
        await fetch(`/api/v1/prompts?id=${encodeURIComponent(item.id)}`, {
          method: "DELETE",
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        });
      }

      // 3. Update state
      setHistory((prev) => prev.filter((h) => h.id !== item.id));
      if (expandedId === item.id) setExpandedId(null);
      toast("Prompt deleted from history", "info");
    } catch {
      toast("Failed to delete prompt", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      // 1. Clear local storage
      localStorage.removeItem("pp_local_history");

      // 2. Call backend to clear all history
      await fetch("/api/v1/prompts?all=true", {
        method: "DELETE",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      // 3. Clear state
      setHistory([]);
      setShowClearConfirm(false);
      toast("All prompt history cleared", "success");
    } catch {
      toast("Failed to clear history", "error");
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Prompt History</h2>
          <p className="text-xs text-muted-foreground">{loading ? "Loading..." : `${history.length} saved prompts`}</p>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="h-8 px-3 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      <div className="max-w-4xl">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search history by prompt text..."
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
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item, e)}
                      disabled={isDeleting === item.id}
                      className="h-7 w-7 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 flex items-center justify-center transition-colors ml-1"
                      title="Delete prompt from history"
                    >
                      {isDeleting === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === item.id ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === item.id && (
                  <div className="border-t p-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Original Prompt</p>
                      <p className="text-sm p-2 rounded bg-muted/50 whitespace-pre-wrap">{item.originalText}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Enhanced Output</p>
                      <p className="text-sm p-2 rounded bg-muted/50 whitespace-pre-wrap">{item.enhancedText}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => reusePrompt(item)}
                          className="h-8 flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reuse in Editor
                        </button>
                        <button
                          onClick={() => copyToClipboard(item.enhancedText)}
                          className="h-8 flex items-center justify-center rounded-lg border px-3 text-xs font-medium hover:bg-accent transition-colors"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Copy Enhanced
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        disabled={isDeleting === item.id}
                        className="h-8 px-3 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        {isDeleting === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-base text-foreground">Clear Prompt History?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete all {history.length} saved prompts from your account and device. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearingAll}
                className="h-9 px-4 rounded-xl border text-xs font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isClearingAll}
                className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {isClearingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
