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
    <div className="mt-6 max-w-4xl mx-auto text-left rounded-2xl border bg-card/90 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-primary/40 shadow-[0_2px_16px_rgba(79,70,229,0.05)]">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-muted/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-xs font-semibold text-foreground tracking-wide uppercase flex items-center gap-1.5">
            Live Prompt Refinement Sandbox
          </span>
        </div>

        {/* Interactive Sample Tabs */}
        <div className="flex items-center gap-1 bg-background/60 p-1 rounded-full border border-border/50">
          {samplePrompts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(idx)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeSample === idx && !customInput
                  ? "bg-primary text-primary-foreground"
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
        {/* Left Side — Live Editable Input */}
        <div className="p-5 bg-muted/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Your Raw Prompt
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                Type or Edit below
              </span>
            </div>
            <textarea
              value={customInput || current.raw}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setCustomEnhanced("");
              }}
              placeholder="Type any prompt here to enhance live..."
              rows={4}
              className="w-full p-3 rounded-xl border bg-background/80 font-mono text-xs text-foreground/90 leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none transition-all"
            />
            <button
              onClick={handleEnhanceCustom}
              disabled={isEnhancing || !activeRaw.trim()}
              className="mt-3 h-9 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isEnhancing ? "Enhancing prompt..." : "Enhance Prompt Live"}
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              ~{tokens} input tokens
            </span>
            <span className="font-mono text-primary font-medium">
              Est. ${cheapest.toFixed(5)}/req
            </span>
          </div>
        </div>

        {/* Right Side — Enhanced Master Instruction Output */}
        <div className="p-5 bg-primary/5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-primary uppercase tracking-wider mb-2.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Enhanced Master Prompt
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background border text-[11px] font-medium text-foreground hover:bg-accent transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 rounded-xl border border-primary/20 bg-background/90 font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto">
              {activeEnhanced}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-primary/10 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <span>✓ Production Master Instruction</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              Ready for ChatGPT / Claude / Gemini
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
