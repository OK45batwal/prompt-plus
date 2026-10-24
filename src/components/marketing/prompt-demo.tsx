"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Zap, Copy, Check, Terminal, Cpu, Database, FileCode, ArrowRight, Layers, SlidersHorizontal } from "lucide-react";
import { estimateTokenCount, calculateCostEstimates } from "@/lib/token-calculator";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

interface PresetPrompt {
  id: string;
  title: string;
  icon: typeof Terminal;
  category: string;
  raw: string;
  enhanced: string;
  addedStructure: string[];
}

const samplePrompts: PresetPrompt[] = [
  {
    id: "python-scraper",
    title: "Python Scraper",
    icon: Terminal,
    category: "Async Systems",
    raw: "Fix bugs in my Python web scraper and optimize connection leaks",
    enhanced: `[ROLE & PERSONA]
Act as a Senior Python Systems & Web Scraping Engineer specializing in AsyncIO and Playwright.

[OBJECTIVE]
Inspect the provided code, identify root causes of connection timeouts and socket leaks, and refactor connection pooling.

[CONSTRAINTS & REQUIREMENTS]
- Provide clean Python 3.12 code with inline explanatory comments.
- Implement exponential backoff retries with jitter and rotate headers.
- Gracefully handle SIGINT and ensure proper context-manager teardown.

[OUTPUT FORMAT]
1. Root cause summary (3 bullets).
2. Refactored runnable Python script.
3. Verification check command.`,
    addedStructure: [
      "Role: Senior Python AsyncIO Engineer",
      "Objective: Root-cause analysis + connection pooling",
      "Constraints: Python 3.12, jittered retries, SIGINT teardown",
      "Contract: 3-part structured delivery",
    ],
  },
  {
    id: "ts-api",
    title: "Next.js API Route",
    icon: FileCode,
    category: "Full Stack",
    raw: "Create a secure Next.js API route that validates JSON input and handles errors",
    enhanced: `[ROLE & PERSONA]
Act as a Principal Full-Stack Engineer specializing in Next.js App Router and TypeScript.

[TASK & OBJECTIVE]
Build a production-grade POST handler in \`src/app/api/v1/resource/route.ts\` validating incoming JSON with Zod schemas.

[CONSTRAINTS]
- Use strict TypeScript 5.x with explicit return types (\`NextResponse<ApiResponse>\`).
- Fail closed on malformed payloads with 400 Bad Request and Zod issue details.
- Catch unhandled exceptions and return sanitized 500 responses without stack traces.

[VERIFICATION]
Provide a sample \`curl\` command testing both valid payload and malformed JSON boundary cases.`,
    addedStructure: [
      "Role: Principal Full-Stack Engineer",
      "Scope: Next.js App Router & strict Zod validation",
      "Security: Fail-closed error handling without stack disclosure",
      "Verification: Runnable curl boundary test suite",
    ],
  },
  {
    id: "sql-indexing",
    title: "SQL Performance",
    icon: Database,
    category: "Database",
    raw: "Optimize slow PostgreSQL queries on our user activity audit log table",
    enhanced: `[ROLE & PERSONA]
Act as a Staff Database Reliability Engineer specializing in PostgreSQL 16 performance tuning.

[OBJECTIVE]
Analyze query latency on a multi-million-row \`audit_logs\` table and recommend indexing and query plan improvements.

[CONSTRAINTS & STRATEGY]
- Include \`EXPLAIN (ANALYZE, BUFFERS)\` interpretation instructions.
- Propose composite and BRIN/B-tree indexes with justification.
- Highlight table bloat mitigation and vacuum settings.

[DELIVERABLE]
1. SQL DDL for recommended indexes with \`CONCURRENTLY\`.
2. Rewritten optimized SQL query.
3. Maintenance and vacuum tuning checklist.`,
    addedStructure: [
      "Role: Staff Database Reliability Engineer",
      "Diagnostic: EXPLAIN (ANALYZE, BUFFERS) guidelines",
      "Index Strategy: CONCURRENTLY DDL + bloat avoidance",
      "Deliverable: 3-step actionable migration checklist",
    ],
  },
  {
    id: "arch-brief",
    title: "System Architecture",
    icon: Cpu,
    category: "Architecture",
    raw: "Design a webhook receiver system that won't drop events during traffic spikes",
    enhanced: `[ROLE & PERSONA]
Act as an Enterprise Cloud Architect specializing in event-driven distributed systems.

[OBJECTIVE]
Design an idempotent, high-availability webhook ingestion pipeline capable of absorbing traffic spikes without event loss.

[ARCHITECTURAL REQUIREMENTS]
- Decouple HTTP ingestion from background processing via a durable message queue.
- Implement idempotency keys with distributed Redis lock verification.
- Define dead-letter queue (DLQ) retry policies and consumer backoff.

[OUTPUT SPECIFICATION]
Provide architecture diagram breakdown, sequence flow, and failure recovery protocols.`,
    addedStructure: [
      "Role: Enterprise Cloud Architect",
      "Decoupling: Ingestion buffer + durable message queue",
      "Reliability: Idempotency keys + DLQ backoff policies",
      "Format: Architectural specification & recovery protocols",
    ],
  },
];

export function PromptDemo() {
  const [activeSampleIndex, setActiveSampleIndex] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>("");
  const [customEnhanced, setCustomEnhanced] = useState<string>("");
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [outputTab, setOutputTab] = useState<"enhanced" | "diff" | "structure">("enhanced");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("");

  const activePreset = samplePrompts[activeSampleIndex];
  const activeRaw = customInput.trim() ? customInput : activePreset.raw;
  const activeEnhanced = customEnhanced || activePreset.enhanced;

  const tokens = estimateTokenCount(activeRaw);
  const enhancedTokens = estimateTokenCount(activeEnhanced);
  const costs = calculateCostEstimates(activeRaw);
  const paidCosts = costs.filter((c) => c.estimatedCostUSD !== null && c.estimatedCostUSD > 0);
  const cheapest = paidCosts.length > 0 ? Math.min(...paidCosts.map((c) => c.estimatedCostUSD!)) : 0;

  const handleEnhanceCustom = async () => {
    if (!activeRaw.trim()) return;
    setIsEnhancing(true);
    setError(null);
    setCustomEnhanced("");
    try {
      const res = await fetch("/api/v1/extension/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: activeRaw, level: "deep" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enhancement unavailable. Please try again.");
      if (data?.enhanced || data?.data?.enhanced) {
        const provider = data.provider || data.data?.provider;
        setSource(
          provider === "engine"
            ? "Deterministic Rule-Engine · No external model call"
            : provider === "local"
            ? "Local template fallback"
            : "Model synthesis"
        );
        setCustomEnhanced(data.enhanced || data.data.enhanced);
      } else {
        throw new Error("No enhancement returned. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSelectPreset = (idx: number) => {
    setActiveSampleIndex(idx);
    setCustomInput("");
    setCustomEnhanced("");
    setError(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeEnhanced);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the result and copy it manually.");
    }
  };

  const studioHandoffUrl = `/dashboard/new?prompt=${encodeURIComponent(activeEnhanced || activeRaw)}`;

  return (
    <div className="terminal-window w-full overflow-hidden transition-all duration-300">
      {/* Top macOS-style Terminal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border/70 bg-muted/30 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ef4444]/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-[#f59e0b]/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-[#10b981]/80 inline-block" />
          </div>
          <span className="ml-2 font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-primary" />
            Interactive Playground
          </span>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5" role="tablist" aria-label="Preset Prompts">
          {samplePrompts.map((s, idx) => {
            const Icon = s.icon;
            const isSelected = activeSampleIndex === idx && !customInput;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                disabled={isEnhancing}
                onClick={() => handleSelectPreset(idx)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${focusRing} ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div role="alert" className="px-5 py-2.5 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/60">
        {/* Left Side: Input Workspace (5 cols) */}
        <div className="lg:col-span-5 p-4 sm:p-5 bg-muted/10 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="raw-prompt-input" className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Input Prompt
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent text-muted-foreground border border-border/60">
                {customInput ? "Custom Input" : "Preset Mode"}
              </span>
            </div>

            <textarea
              id="raw-prompt-input"
              aria-label="Input prompt to optimize"
              disabled={isEnhancing}
              value={customInput ? customInput : activePreset.raw}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setCustomEnhanced("");
              }}
              rows={6}
              placeholder="Type any rough prompt here to test..."
              className="w-full p-3.5 rounded-xl border border-border/80 bg-background font-mono text-xs text-foreground leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all shadow-2xs"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEnhanceCustom}
                disabled={isEnhancing || !activeRaw.trim()}
                className={`flex-1 h-9.5 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 active:scale-[0.98] shadow-xs ${focusRing} ${
                  isEnhancing ? "animate-shimmer-sweep cursor-wait opacity-90" : "hover:shadow-sm"
                }`}
              >
                <Sparkles className={`h-3.5 w-3.5 ${isEnhancing ? "animate-spin" : ""}`} />
                <span>{isEnhancing ? "Compiling Structure…" : "Enhance Prompt"}</span>
              </button>

              {customInput && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomInput("");
                    setCustomEnhanced("");
                  }}
                  className={`h-9.5 px-3 rounded-xl border border-border/80 bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors ${focusRing}`}
                  title="Reset to preset"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Telemetry Footnote */}
          <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              ~{tokens} tokens
            </span>
            <span>
              {paidCosts.length > 0 ? `Est. $${cheapest.toFixed(5)}/run` : "Deterministic free tier"}
            </span>
          </div>
        </div>

        {/* Right Side: Enhanced Output & Inspection (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 bg-background flex flex-col justify-between gap-4">
          <div className="space-y-3">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60" role="tablist" aria-label="Output View">
                <button
                  type="button"
                  role="tab"
                  aria-selected={outputTab === "enhanced"}
                  onClick={() => setOutputTab("enhanced")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${focusRing} ${
                    outputTab === "enhanced"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Structured Prompt
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={outputTab === "diff"}
                  onClick={() => setOutputTab("diff")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${focusRing} ${
                    outputTab === "diff"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers className="h-3 w-3" />
                  Structure Diff
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={outputTab === "structure"}
                  onClick={() => setOutputTab("structure")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${focusRing} ${
                    outputTab === "structure"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  Breakdown
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!activeEnhanced || isEnhancing}
                  onClick={handleCopy}
                  aria-label="Copy enhanced prompt"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border/80 text-[11px] font-semibold text-foreground hover:bg-accent hover:border-primary/40 transition-all active:scale-95 shadow-2xs ${focusRing}`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-muted-foreground" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <Link
                  href={studioHandoffUrl}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-all active:scale-95 ${focusRing}`}
                >
                  <span>Open in Studio</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* View 1: Formatted Output */}
            {outputTab === "enhanced" && (
              <div key={`view-enhanced-${activeSampleIndex}-${Boolean(customEnhanced)}`} className="relative animate-smooth-in">
                <pre className={`p-3.5 sm:p-4 rounded-xl border font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto shadow-2xs select-text transition-all duration-300 ${
                  isEnhancing
                    ? "border-primary bg-primary/5 animate-pulse"
                    : "border-primary/20 bg-muted/20"
                }`}>
                  {activeEnhanced || (isEnhancing ? "Compiling prompt structure…" : "Enter a prompt and click Enhance.")}
                </pre>
              </div>
            )}

            {/* View 2: Diff View */}
            {outputTab === "diff" && (
              <div key="view-diff" className="space-y-2.5 max-h-72 overflow-y-auto animate-smooth-in">
                <div className="p-3 rounded-lg border border-border/60 bg-muted/30 transition-colors">
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Original Core Intent (Preserved)
                  </span>
                  <p className="font-mono text-xs text-foreground/80 leading-relaxed">
                    &quot;{activeRaw}&quot;
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 transition-colors">
                  <span className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider block mb-1">
                    Structured Constraints Added
                  </span>
                  <ul className="space-y-1.5 font-mono text-xs text-foreground/90">
                    {(customEnhanced ? ["Explicit role & domain framing", "Concrete task parameters", "Output format contract"] : activePreset.addedStructure).map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary font-bold">+</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* View 3: Structural Breakdown */}
            {outputTab === "structure" && (
              <div key="view-structure" className="space-y-3 p-1 max-h-72 overflow-y-auto animate-smooth-in">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl border border-border/70 bg-card text-center hover:border-primary/30 transition-colors">
                    <span className="text-[10px] font-mono text-muted-foreground block">Clarity</span>
                    <span className="text-base font-bold font-mono text-foreground">High</span>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">Disambiguated</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border/70 bg-card text-center">
                    <span className="text-[10px] font-mono text-muted-foreground block">Specificity</span>
                    <span className="text-base font-bold font-mono text-foreground">Strict</span>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">Concrete goals</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border/70 bg-card text-center">
                    <span className="text-[10px] font-mono text-muted-foreground block">Formatting</span>
                    <span className="text-base font-bold font-mono text-primary">Explicit</span>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">Structured</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Why this matters: </span>
                  Standard chat prompts often produce generic replies because they lack explicit negative constraints, role depth, and verifiable output contracts. Prompt+ structures your request so LLMs respond predictably without hallucinations.
                </div>
              </div>
            )}
          </div>

          {/* Footer Telemetry */}
          <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              {customEnhanced ? source : "Deterministic engine active"}
            </span>
            <span className="font-mono text-[11px]">
              ~{enhancedTokens} output tokens
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
