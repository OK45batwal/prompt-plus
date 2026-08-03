"use client";

import { useState } from "react";
import { Sparkles, Zap, Copy, Check, Terminal, Cpu } from "lucide-react";
import { estimateTokenCount, calculateCostEstimates } from "@/lib/token-calculator";

const samplePrompts = [
  {
    title: "SEO Blog Post",
    raw: "Write a blog post about artificial intelligence for business owners",
    enhanced: `[ROLE & PERSONA]
Act as an expert B2B tech journalist and AI strategist.

[OBJECTIVE]
Write an authoritative 1,200-word executive guide explaining actionable AI integration strategies for non-technical mid-sized business owners.

[KEY REQUIREMENTS & CONSTRAINTS]
- Tone: Professional, practical, and hype-free.
- Structure: Executive summary, 3 core implementation phases, ROI calculation framework, and common pitfalls.
- Formatting: Use bulleted lists, bold takeaways, and markdown headings.`,
  },
  {
    title: "Python Scraper",
    raw: "Fix bugs in my Python web scraper and optimize connection leaks",
    enhanced: `[ROLE & PERSONA]
Act as a Senior Python Systems & Web Scraping Engineer specializing in AsyncIO and Playwright.

[TASK]
Inspect the provided code, identify root causes of connection timeouts and memory leaks, and optimize error handling.

[CONSTRAINTS]
- Provide clean Python 3.12 code with inline explanatory comments.
- Implement exponential backoff retries and dynamic user-agent rotation.`,
  },
  {
    title: "Cold Outreach",
    raw: "Write a cold email to sell my SaaS product to CTOs",
    enhanced: `[ROLE & PERSONA]
Act as an elite B2B Enterprise Sales Director.

[TASK & CONSTRAINTS]
Write a 3-touch point high-converting cold email campaign targeting Enterprise CTOs.
- Email 1: 90-word pain-point hook highlighting 30% DevOps cloud savings.
- Email 2: Metric-backed case study example.
- Email 3: Low-friction break-up check-in.`,
  },
];

export function PromptDemo() {
  const [activeSample, setActiveSample] = useState(0);
  const [copied, setCopied] = useState(false);

  const current = samplePrompts[activeSample];
  const tokens = estimateTokenCount(current.raw);
  const costs = calculateCostEstimates(current.raw);
  const paidCosts = costs.filter((c) => c.estimatedCostUSD > 0);
  const cheapest = paidCosts.length > 0 ? Math.min(...paidCosts.map((c) => c.estimatedCostUSD)) : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(current.enhanced);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-12 max-w-4xl mx-auto text-left rounded-2xl border border-primary/20 bg-card/90 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-primary/10">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-muted/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-foreground tracking-wide uppercase flex items-center gap-1.5">
            Live Refinement Engine
          </span>
        </div>

        {/* Interactive Sample Tabs */}
        <div className="flex items-center gap-1 bg-background/60 p-1 rounded-xl border border-border/50">
          {samplePrompts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSample(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeSample === idx
                  ? "bg-primary text-primary-foreground shadow-sm scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              }`}
            >
              {idx === 0 ? <Terminal className="h-3 w-3" /> : idx === 1 ? <Cpu className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-border/60">
        {/* Left Side — Raw Input */}
        <div className="p-5 bg-muted/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              <span className="flex items-center gap-1.5 text-amber-500">
                <Zap className="h-3.5 w-3.5 animate-pulse" />
                Raw User Input
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                Vague / Unstructured
              </span>
            </div>
            <div className="p-4 rounded-xl border bg-background/80 font-mono text-xs text-foreground/90 leading-relaxed shadow-2xs">
              &ldquo;{current.raw}&rdquo;
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              ~{tokens} input tokens
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              Est. ${cheapest.toFixed(5)}/req
            </span>
          </div>
        </div>

        {/* Right Side — Enhanced Output */}
        <div className="p-5 bg-primary/5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-primary uppercase tracking-wider mb-2.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 animate-spin-slow text-blue-500" />
                Prompt+ Production Output
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background border text-[11px] font-medium text-foreground hover:bg-accent transition-colors shadow-2xs"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <pre className="text-xs font-mono text-foreground leading-relaxed bg-background/90 p-4 rounded-xl border border-primary/20 whitespace-pre-wrap max-h-60 overflow-y-auto shadow-inner">
              {current.enhanced}
            </pre>
          </div>

          <div className="mt-4 pt-3 border-t border-primary/10 flex items-center justify-between text-[11px] text-primary/80 font-medium">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Ready for GPT-4, Claude & Gemini
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              Score: 98/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
