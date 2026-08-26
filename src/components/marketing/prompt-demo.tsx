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
  const [customInput, setCustomInput] = useState("");
  const [customEnhanced, setCustomEnhanced] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);

  const current = samplePrompts[activeSample];
  const activeRaw = customInput.trim() ? customInput : current.raw;
  const activeEnhanced = customEnhanced || current.enhanced;

  const tokens = estimateTokenCount(activeRaw);
  const costs = calculateCostEstimates(activeRaw);
  const paidCosts = costs.filter((c) => c.estimatedCostUSD > 0);
  const cheapest = paidCosts.length > 0 ? Math.min(...paidCosts.map((c) => c.estimatedCostUSD)) : 0;

  const handleEnhanceCustom = async () => {
    if (!activeRaw) return;
    setIsEnhancing(true);
    try {
      const res = await fetch("/api/v1/extension/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: activeRaw, level: "deep" }),
      });
      const data = await res.json();
      if (data?.enhanced || data?.data?.enhanced) {
        setCustomEnhanced(data.enhanced || data.data.enhanced);
      }
    } catch {
      // Fallback
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSelectSample = (idx: number) => {
    setActiveSample(idx);
    setCustomInput("");
    setCustomEnhanced("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeEnhanced);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="double-bezel-outer mt-4 w-full shadow-lg">
      <div className="double-bezel-inner overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border/60 bg-muted/30 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="text-[11px] font-semibold text-foreground tracking-wider uppercase font-mono flex items-center gap-1.5">
              Interactive Architect Sandbox
            </span>
          </div>

          {/* Interactive Sample Tabs */}
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-full border border-border/60 shadow-2xs">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(idx)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
                  activeSample === idx && !customInput
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/70"
                }`}
              >
                {idx === 0 ? <Terminal className="h-3 w-3" /> : idx === 1 ? <Cpu className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* Left Side — Live Editable Input */}
          <div className="p-5 sm:p-6 bg-muted/15 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                <span className="flex items-center gap-1.5 text-foreground/80 font-mono text-[11px]">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Raw Prompt Input
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                  Editable
                </span>
              </div>
              <textarea
                value={customInput || current.raw}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  setCustomEnhanced("");
                }}
                placeholder="Type any prompt here to enhance live..."
                rows={5}
                className="w-full p-3.5 rounded-xl border border-border/80 bg-background/90 font-mono text-xs text-foreground leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none resize-none transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={handleEnhanceCustom}
                disabled={isEnhancing || !activeRaw.trim()}
                className="group mt-3 h-10 w-full inline-flex items-center justify-between px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 active:scale-[0.98] shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isEnhancing ? "Compiling Master Prompt..." : "Enhance Prompt Live"}
                </span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ~{tokens} tokens
              </span>
              <span className="font-mono text-primary font-medium">
                Est. ${cheapest.toFixed(5)}/req
              </span>
            </div>
          </div>

          {/* Right Side — Enhanced Master Instruction Output */}
          <div className="p-5 sm:p-6 bg-primary/[0.02] dark:bg-primary/[0.04] flex flex-col justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-primary uppercase tracking-wider mb-2.5">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Master Instruction
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background border border-border/80 text-[11px] font-semibold text-foreground hover:bg-accent hover:border-primary/40 transition-all active:scale-95 shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-muted-foreground" />
                      <span>Copy Result</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 rounded-xl border border-primary/20 bg-background/95 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto shadow-2xs">
                {activeEnhanced}
              </div>
            </div>

            <div className="pt-3 border-t border-primary/10 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span>✓ Production-Ready Structure</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Universal LLM Format
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
