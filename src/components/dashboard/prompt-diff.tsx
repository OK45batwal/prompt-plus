"use client";

import { useMemo } from "react";
import { diffWords } from "@/lib/text-diff";

interface PromptDiffProps {
  originalText: string;
  enhancedText: string;
}

export function PromptDiff({ originalText, enhancedText }: PromptDiffProps) {
  const tokens = useMemo(
    () => (originalText || enhancedText ? diffWords(originalText || "", enhancedText || "") : []),
    [originalText, enhancedText]
  );

  if (!originalText && !enhancedText) {
    return (
      <div className="text-xs text-muted-foreground text-center py-6">
        Enter prompts to compare differences.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border bg-card font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
      {tokens.map((token, index) =>
        token.changed === "added" ? (
          <mark
            key={index}
            className="bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 font-medium px-1 rounded mx-0.5 decoration-none"
          >
            {token.value}
          </mark>
        ) : token.changed === "removed" ? (
          <del
            key={index}
            className="bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400 line-through px-1 rounded mx-0.5 opacity-70"
          >
            {token.value}
          </del>
        ) : (
          <span key={index}>{token.value}</span>
        )
      )}
    </div>
  );
}
