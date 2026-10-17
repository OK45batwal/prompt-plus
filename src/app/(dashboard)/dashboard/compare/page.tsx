"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, X, Copy, Check, GitCompare, LayoutGrid, Loader2 } from "lucide-react";
import { PromptDiff } from "@/components/dashboard/prompt-diff";

interface ComparisonItem {
  id: string;
  text: string;
  score: number | null;
  checking: boolean;
}

export default function ComparePage() {
  const [mode, setMode] = useState<"side-by-side" | "diff">("side-by-side");
  const [items, setItems] = useState<ComparisonItem[]>([
    { id: "1", text: "", score: null, checking: false },
    { id: "2", text: "", score: null, checking: false },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [gradingNotice, setGradingNotice] = useState<string | null>(null);
  const scoreTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => { const timers = scoreTimers.current; return () => Object.values(timers).forEach(clearTimeout); }, []);

  const addItem = () => {
    if (items.length >= 4) return;
    setItems([...items, { id: `new-${Date.now()}`, text: "", score: null, checking: false }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 2) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, text: string) => {
    if (scoreTimers.current[id]) clearTimeout(scoreTimers.current[id]);

    const shouldCheck = text.trim().length > 10;
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, text, score: null, checking: shouldCheck } : item));

    if (!shouldCheck) return;

    scoreTimers.current[id] = setTimeout(async () => {
      try {
        const res = await fetch("/api/v1/prompts/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const json = await res.json();
        const measured = res.ok && json.data?.source === "llm" && typeof json.data.total === "number";
        setItems((prev) =>
          prev.map((item) => item.id === id && item.text === text ? { ...item, score: measured ? json.data.total : null, checking: false } : item)
        );
        // Only report grading as available when a model actually returned a score.
        if (measured) setGradingNotice(null);
        else if (res.ok) setGradingNotice("Prompt grading is unavailable right now (no provider key, or the model request failed). Prompts stay unmeasured; the text comparison and word diff still work.");
      } catch {
        // A failed assessment stays unmeasured.
        setItems((prev) => prev.map((item) => item.id === id && item.text === text ? { ...item, checking: false } : item));
      }
    }, 800);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };


  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-sm">Compare Prompts</h2>
          <p className="text-xs text-muted-foreground">
            Compare how prompts are worded, not how models answer. Grading runs on a connected model provider; without
            one, prompts stay unmeasured and only the text comparison is available. Verify real outputs in the Studio.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div role="group" aria-label="Comparison view" className="flex shrink-0 items-center whitespace-nowrap p-1 rounded-lg border bg-muted/50 text-xs font-medium">
          <button
            type="button"
            aria-pressed={mode === "side-by-side"}
            onClick={() => setMode("side-by-side")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              mode === "side-by-side" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Side-by-Side
          </button>
          <button
            type="button"
            aria-pressed={mode === "diff"}
            onClick={() => setMode("diff")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              mode === "diff" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitCompare className="h-3.5 w-3.5" />
            Changes
          </button>
        </div>
      </div>

      {gradingNotice && (
        <p role="status" className="border-l-2 border-border pl-2 text-xs text-muted-foreground">
          {gradingNotice} <Link href="/dashboard/settings" className="underline hover:text-foreground">Manage provider keys</Link>
        </p>
      )}

      <div className="max-w-6xl">
        {mode === "side-by-side" ? (
          /* Side-by-Side View */
          <div className={`grid gap-4 ${items.length === 2 ? "grid-cols-1 md:grid-cols-2" : items.length === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
            {items.map((item, index) => (
              <div key={item.id} className="rounded-lg border bg-card overflow-hidden">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span id={`compare-label-${item.id}`} className="text-sm font-medium">Prompt {index + 1}</span>
                    {item.checking ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Checking…
                      </span>
                    ) : item.score !== null ? (
                      <span className="text-xs font-medium tabular-nums">{item.score}/100</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not measured</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {item.text && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.text, item.id)}
                        aria-label={copiedId === item.id ? `Prompt ${index + 1} copied` : `Copy prompt ${index + 1}`}
                        className="p-1 rounded hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    )}
                    {items.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove prompt ${index + 1}`}
                        className="p-1 rounded hover:bg-accent text-red-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={item.text}
                  onChange={(e) => updateItem(item.id, e.target.value)}
                  aria-labelledby={`compare-label-${item.id}`}
                  placeholder={`Enter prompt ${index + 1}...`}
                  className="w-full h-64 p-3 bg-transparent text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset placeholder:text-muted-foreground"
                />
              </div>
            ))}

            {/* Add Button */}
            {items.length < 4 && (
              <button
                type="button"
                onClick={addItem}
                className="rounded-lg border border-dashed hover:border-foreground/30 transition-colors flex flex-col items-center justify-center min-h-[300px] text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Plus className="h-6 w-6 mb-2" />
                <span className="text-sm">Add prompt</span>
              </button>
            )}
          </div>
        ) : (
          /* Changes View */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.slice(0, 2).map((item, index) => (
                <div key={item.id} className="rounded-lg border bg-card p-3 space-y-2">
                  <label htmlFor={`compare-diff-${item.id}`} className="text-xs font-medium text-muted-foreground">
                    {index === 0 ? "Original (Prompt 1)" : "Enhanced (Prompt 2)"}
                  </label>
                  <textarea
                    id={`compare-diff-${item.id}`}
                    value={item.text}
                    onChange={(e) => updateItem(item.id, e.target.value)}
                    placeholder={index === 0 ? "Enter original prompt..." : "Enter enhanced prompt..."}
                    className="w-full h-36 p-2 rounded bg-muted/50 text-sm resize-none outline-none font-mono focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              ))}
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <GitCompare className="h-3.5 w-3.5" /> Changes
              </h3>
              <p className="mb-2 text-xs text-muted-foreground">
                <mark className="rounded bg-green-100 px-1 text-green-800 dark:bg-green-950/60 dark:text-green-300">Added</mark> words are highlighted;{" "}
                <del className="rounded bg-red-100 px-1 text-red-800 line-through dark:bg-red-950/60 dark:text-red-400">removed</del> words are struck through.
              </p>
              <PromptDiff originalText={items[0]?.text || ""} enhancedText={items[1]?.text || ""} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
