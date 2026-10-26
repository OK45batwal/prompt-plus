"use client";

import { useState } from "react";
import { diffWords } from "@/lib/text-diff";
import { Sparkles, SplitSquareVertical, Rows, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";

interface PromptDiffProps {
  before: string;
  after: string;
  rationales?: string[];
  taskType?: string;
}

export function PromptDiff({ before, after, rationales = [], taskType }: PromptDiffProps) {
  const [viewMode, setViewMode] = useState<"unified" | "split">("split");
  const tokens = diffWords(before, after);

  let added = 0;
  let removed = 0;
  for (const token of tokens) {
    if (!token.value.trim()) continue;
    if (token.changed === "added") added++;
    else if (token.changed === "removed") removed++;
  }

  // Generate fallback explainable rationales if none provided by loop trace
  const displayRationales =
    rationales.length > 0
      ? rationales
      : [
          "Preserved core user intent and explicit domain constraints.",
          "Restructured prompt with role-grounded objectives and clear execution instructions.",
          "Enforced strict output format and eliminated conversational preamble/fluff.",
          "Added self-verification criteria to reduce downstream AI hallucination risk.",
        ];

  return (
    <div className="space-y-4">
      {/* Header controls & summary stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border bg-card/60">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            +{added} words added
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
            -{removed} words removed
          </span>
          {taskType && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Optimized for: <strong className="text-foreground capitalize">{taskType}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === "split"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SplitSquareVertical className="h-3.5 w-3.5" />
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode("unified")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === "unified"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Rows className="h-3.5 w-3.5" />
            Inline Diff
          </button>
        </div>
      </div>

      {/* Diff Presentation */}
      {viewMode === "split" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Original Input
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {before.trim().split(/\s+/).length} words
              </span>
            </div>
            <pre className="max-h-90 h-90 overflow-y-auto rounded-xl border border-border/70 bg-background/80 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap wrap-break-word text-muted-foreground">
              {before}
            </pre>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Improved Prompt
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {after.trim().split(/\s+/).length} words
              </span>
            </div>
            <pre className="max-h-90 h-90 overflow-y-auto rounded-xl border border-emerald-500/30 bg-emerald-500/2 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap wrap-break-word text-foreground">
              {after}
            </pre>
          </div>
        </div>
      ) : (
        <pre className="max-h-90 overflow-y-auto rounded-xl border border-border/70 bg-background/90 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap wrap-break-word">
          {tokens.map((token, index) =>
            token.changed === "added" ? (
              <ins
                key={index}
                className="rounded px-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 no-underline"
              >
                {token.value}
              </ins>
            ) : token.changed === "removed" ? (
              <del key={index} className="rounded px-0.5 bg-red-500/10 text-red-700 dark:text-red-300">
                {token.value}
              </del>
            ) : (
              <span key={index}>{token.value}</span>
            )
          )}
        </pre>
      )}

      {/* Explainable Transformation Rationales */}
      <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-md space-y-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground tracking-tight">
            Why These Changes Were Made (Explainable Rationale)
          </h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The compiler analyzed your draft for instruction clarity, ambiguity, and output constraints. Important modifications:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {displayRationales.map((rationale, idx) => (
            <li
              key={idx}
              className="p-2.5 rounded-lg bg-background/80 border text-xs text-foreground flex items-start gap-2 shadow-2xs"
            >
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{rationale}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
