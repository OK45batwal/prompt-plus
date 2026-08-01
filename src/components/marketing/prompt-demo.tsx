"use client";

import { useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import { estimateTokenCount, calculateCostEstimates } from "@/lib/token-calculator";

const samplePrompts = [
  {
    raw: "Write a blog post about artificial intelligence for business owners",
    enhanced: `[ROLE & PERSONA]
Act as an expert B2B tech journalist and AI strategist.

[OBJECTIVE]
Write an authoritative 1,200-word executive guide explaining actionable AI integration strategies for non-technical mid-sized business owners.

[KEY REQUIREMENTS & CONSTRAINTS]
- Tone: Professional, practical, and hype-free.
- Structure: Clear executive summary, 3 core implementation phases, ROI calculation framework, and common pitfalls.
- Formatting: Use bulleted lists, bold takeaways, and markdown headings.`,
  },
  {
    raw: "Fix bugs in my Python web scraper",
    enhanced: `[ROLE & PERSONA]
Act as a Senior Python Systems & Web Scraping Engineer specializing in AsyncIO and Playwright.

[TASK]
Inspect the provided code, identify root causes of connection timeouts and memory leaks, and optimize error handling.

[CONSTRAINTS]
- Provide clean Python 3.12 code with inline explanatory comments.
- Implement exponential backoff retries and dynamic user-agent rotation.`,
  },
];

export function PromptDemo() {
  const [activeSample, setActiveSample] = useState(0);

  const raw = samplePrompts[activeSample].raw;
  const tokens = estimateTokenCount(raw);
  const costs = calculateCostEstimates(raw);
  const paidCosts = costs.filter((c) => c.estimatedCostUSD > 0);
  const cheapest = paidCosts.length > 0 ? Math.min(...paidCosts.map((c) => c.estimatedCostUSD)) : 0;

  return (
    <div className="mt-14 max-w-4xl mx-auto text-left rounded-2xl border bg-card/90 shadow-2xl backdrop-blur-xl overflow-hidden transform transition-all hover:border-primary/30">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
          <span className="h-3 w-3 rounded-full bg-green-500/80 inline-block" />
          <span className="text-xs font-medium text-muted-foreground ml-2">Live Refinement Demo</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {samplePrompts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSample(idx)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                activeSample === idx
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              Sample {idx + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-border/60">
        <div className="p-5 bg-muted/10 flex flex-col">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Raw User Input</span>
          </div>
          <p className="text-sm font-mono text-foreground/90 bg-muted/40 p-3.5 rounded-xl border border-border/50">
            &ldquo;{raw}&rdquo;
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            ~{tokens.toLocaleString()} tokens · estimated cost from $
            {cheapest > 0 ? cheapest.toFixed(4) : "0.0000"} per enhance
          </p>
        </div>
        <div className="p-5 bg-primary/5">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Prompt+ Production Output</span>
          </div>
          <pre className="text-xs font-mono text-foreground leading-relaxed bg-background/80 p-3.5 rounded-xl border border-primary/20 whitespace-pre-wrap max-h-56 overflow-y-auto">
            {samplePrompts[activeSample].enhanced}
          </pre>
        </div>
      </div>
    </div>
  );
}
