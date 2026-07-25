"use client";

import React, { useMemo } from "react";

interface DiffChunk {
  value: string;
  added?: boolean;
  removed?: boolean;
}

function computeDiffWords(oldStr: string, newStr: string): DiffChunk[] {
  const oldWords = oldStr ? oldStr.split(/(\s+)/) : [];
  const newWords = newStr ? newStr.split(/(\s+)/) : [];
  const chunks: DiffChunk[] = [];

  let i = 0;
  let j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
      chunks.push({ value: oldWords[i] });
      i++;
      j++;
    } else if (j < newWords.length && !oldWords.slice(i).includes(newWords[j])) {
      chunks.push({ value: newWords[j], added: true });
      j++;
    } else if (i < oldWords.length) {
      chunks.push({ value: oldWords[i], removed: true });
      i++;
    } else if (j < newWords.length) {
      chunks.push({ value: newWords[j], added: true });
      j++;
    }
  }

  return chunks;
}

interface PromptDiffProps {
  originalText: string;
  enhancedText: string;
}

export function PromptDiff({ originalText, enhancedText }: PromptDiffProps) {
  const diffChunks = useMemo(() => {
    if (!originalText && !enhancedText) return [];
    return computeDiffWords(originalText || "", enhancedText || "");
  }, [originalText, enhancedText]);

  if (!originalText && !enhancedText) {
    return (
      <div className="text-xs text-muted-foreground text-center py-6">
        Enter prompts to compare differences.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border bg-card font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
      {diffChunks.map((part, index) => {
        if (part.added) {
          return (
            <mark
              key={index}
              className="bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 font-medium px-1 rounded mx-0.5 decoration-none"
            >
              {part.value}
            </mark>
          );
        }
        if (part.removed) {
          return (
            <del
              key={index}
              className="bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400 line-through px-1 rounded mx-0.5 opacity-70"
            >
              {part.value}
            </del>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
}
