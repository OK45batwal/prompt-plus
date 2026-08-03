"use client";

import { useState, useCallback } from "react";
import type { EnhanceLevel } from "@/lib/llm/meta-prompt";

export interface EnhancePromptOptions {
  text: string;
  category?: string;
  tone?: string;
  length?: string;
  level?: EnhanceLevel;
  model?: string;
  provider?: string;
  apiKey?: string;
}

export interface EnhancePromptResult {
  original: { text: string; score: number; analysis: Record<string, unknown> };
  enhanced: {
    text: string;
    score: number;
    explanation: string;
    improvements: Array<{ aspect: string; change: string; reason: string }>;
  };
  scoring: Record<string, unknown>;
  enhancedScoring: Record<string, unknown>;
}

export function useEnhancePrompt() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnhancePromptResult | null>(null);

  const enhance = useCallback(async (options: EnhancePromptOptions) => {
    setIsEnhancing(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/prompts/enhance-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to enhance prompt");
      }

      setResult(data.data || data);
      return data.data || data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      throw err;
    } finally {
      setIsEnhancing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsEnhancing(false);
  }, []);

  return { enhance, isEnhancing, error, result, reset };
}
