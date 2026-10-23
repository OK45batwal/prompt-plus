"use client";

import { diffWords } from "@/lib/text-diff";

export function PromptDiff({ before, after }: { before: string; after: string }) {
  const tokens = diffWords(before, after);
  let added = 0;
  let removed = 0;
  for (const token of tokens) {
    if (!token.value.trim()) continue;
    if (token.changed === "added") added++;
    else if (token.changed === "removed") removed++;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Your original compared with the current prompt: {added} word{added === 1 ? "" : "s"} added,{" "}
        {removed} removed. Added text is underlined; removed text is struck through.
      </p>
      <pre className="max-h-[360px] overflow-y-auto rounded-xl border border-border/70 bg-background/90 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
        {tokens.map((token, index) =>
          token.changed === "added" ? (
            <ins
              key={index}
              className="rounded px-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
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
    </div>
  );
}
