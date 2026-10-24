"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PromptDemo } from "@/components/marketing/prompt-demo";
import {
  ChatGptLogo,
  ClaudeLogo,
  GeminiLogo,
  DeepSeekLogo,
  GrokLogo,
  PerplexityLogo,
  CopilotLogo,
  MetaLogo,
} from "@/components/marketing/model-logos";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Puzzle,
  Sparkles,
  ShieldCheck,
  Cpu,
  Terminal,
  FileCode,
} from "lucide-react";
import { EXTENSION_STORE_URL } from "@/lib/version";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// Plain-text output: compatibility list with major chat interfaces
const compatibility = [
  { name: "ChatGPT", logoSrc: "/logos/chatgpt.svg", Logo: ChatGptLogo },
  { name: "Claude", logoSrc: "/logos/claude.svg", Logo: ClaudeLogo },
  { name: "Gemini", logoSrc: "/logos/gemini.svg", Logo: GeminiLogo },
  { name: "DeepSeek", logoSrc: "/logos/deepseek.svg", Logo: DeepSeekLogo },
  { name: "Grok", logoSrc: "/logos/grok.svg", Logo: GrokLogo },
  { name: "Perplexity", logoSrc: "/logos/perplexity.svg", Logo: PerplexityLogo },
  { name: "Copilot", logoSrc: "/logos/copilot.svg", Logo: CopilotLogo },
  { name: "Llama", logoSrc: "/logos/llama.svg", Logo: MetaLogo },
];

const pipelineStages = [
  {
    step: "01",
    name: "Intent Extraction",
    tag: "Deconstruction",
    desc: "Isolates the core technical objective, programming languages, and implicit assumptions from casual wording.",
    icon: Terminal,
  },
  {
    step: "02",
    name: "Persona Framing",
    tag: "Role Scaffolding",
    desc: "Anchors the LLM with senior domain specialization (e.g., Staff Systems Architect, SRE) to invoke deeper reasoning.",
    icon: Cpu,
  },
  {
    step: "03",
    name: "Constraint Injection",
    tag: "Guardrails",
    desc: "Specifies strict error boundaries, security standards, and negative instructions to prevent hallucinations.",
    icon: ShieldCheck,
  },
  {
    step: "04",
    name: "Contract Formatting",
    tag: "Verification",
    desc: "Defines exact output structure (numbered phases, JSON schemas, runnable verification commands) for predictable parsing.",
    icon: FileCode,
  },
];

interface ComparisonExample {
  id: string;
  tabLabel: string;
  category: string;
  raw: string;
  enhanced: string;
  added: string[];
  kept: string[];
}

const comparisonExamples: ComparisonExample[] = [
  {
    id: "python",
    tabLabel: "Python AsyncIO",
    category: "Systems Engineering",
    raw: "Fix bugs in my Python web scraper and optimize connection leaks",
    enhanced: `[ROLE & PERSONA]
Act as a Senior Python Systems Engineer specializing in AsyncIO and Playwright.

[TASK & OBJECTIVE]
Inspect the provided code, identify root causes of connection timeouts and socket leaks, and refactor connection pooling.

[CONSTRAINTS & REQUIREMENTS]
- Return clean Python 3.12 code with inline explanatory comments.
- Implement exponential backoff retries with jitter and user-agent rotation.
- Guarantee proper context-manager teardown during SIGINT / cancellation.

[VERIFICATION]
Provide a test invocation snippet verifying socket closure under simulated network failure.`,
    added: [
      "Role: Senior Python AsyncIO Engineer sized specifically for network scraping.",
      "Root cause focus: Dissects connection pooling instead of superficial patching.",
      "Operational constraints: Python 3.12, jittered retries, SIGINT safety.",
      "Verification contract: Specific test script validating socket teardown.",
    ],
    kept: [
      "Subject: Your Python web scraper.",
      "Goal: Zero connection leaks and stable execution.",
      "Context: Preserves your core logic and domain constraints.",
    ],
  },
  {
    id: "typescript",
    tabLabel: "Next.js & Zod",
    category: "Full Stack",
    raw: "Create a Next.js API route that validates JSON input and handles errors",
    enhanced: `[ROLE & PERSONA]
Act as a Principal Full-Stack Engineer specializing in Next.js App Router and TypeScript.

[TASK]
Build a production-ready POST handler in \`src/app/api/v1/resource/route.ts\` enforcing strict Zod validation on incoming JSON payloads.

[SECURITY & ERROR HANDLING]
- Fail closed with 400 Bad Request on malformed schemas with detailed error maps.
- Catch unexpected runtime exceptions and return sanitized 500 responses without leaking server stack traces.
- Enforce strict typing with explicit \`NextResponse<ApiResponse>\` return signatures.

[DELIVERABLE]
Complete runnable file code followed by a verification \`curl\` test case.`,
    added: [
      "Role: Principal Full-Stack Engineer with App Router expertise.",
      "Security boundary: Fail-closed schema parsing and stack sanitization.",
      "Type safety: Explicit NextResponse generic return types.",
      "Contract: Ready-to-run file code and curl verification command.",
    ],
    kept: [
      "Requirement: Next.js API route with JSON validation and error handling.",
      "Scope: Remains focused entirely on the requested endpoint logic.",
    ],
  },
  {
    id: "sql",
    tabLabel: "PostgreSQL DBA",
    category: "Database Tuning",
    raw: "Optimize slow PostgreSQL queries on our user activity audit log table",
    enhanced: `[ROLE & PERSONA]
Act as a Staff Database Reliability Engineer specializing in PostgreSQL 16 performance tuning.

[OBJECTIVE]
Diagnose query latency across an append-heavy \`audit_logs\` table and design an indexing and vacuum strategy.

[CONSTRAINTS & STRATEGY]
- Include \`EXPLAIN (ANALYZE, BUFFERS)\` diagnostic steps.
- Recommend composite B-Tree or BRIN indexes with concurrent creation DDL (\`CREATE INDEX CONCURRENTLY\`).
- Outline autovacuum and fillfactor adjustments to prevent table bloat.

[OUTPUT SPECIFICATION]
1. Index DDL script.
2. Rewritten optimized SQL query.
3. Maintenance operational checklist.`,
    added: [
      "Role: Staff Database Reliability Engineer with PostgreSQL 16 tuning depth.",
      "Diagnostics: EXPLAIN (ANALYZE, BUFFERS) guidelines for empirical profiling.",
      "Zero-downtime DDL: CONCURRENTLY syntax to prevent production table locks.",
      "Delivery: 3-step structured migration and maintenance plan.",
    ],
    kept: [
      "Target table: User activity audit logs.",
      "Problem statement: High query latency during analytical lookups.",
    ],
  },
];


const faqs = [
  {
    q: "Is Prompt+ free to use?",
    a: "Yes. There is no paywall and no credit card required. Prompts are enhanced using our built-in deterministic engine, locally via Chrome's Gemini Nano on-device AI, or with your own provider API keys.",
  },
  {
    q: "Do I need to sign up to enhance prompts?",
    a: "No. You can enhance prompts instantly in the playground on this page without creating an account. Creating a free account lets you save prompts to your library, manage custom context blocks, and sync with the extension.",
  },
  {
    q: "How does On-Device AI work?",
    a: "Chrome 138+ includes built-in Gemini Nano inference capabilities. When selected, the model runs directly inside your browser process using local hardware, meaning your prompt never leaves your computer.",
  },
  {
    q: "Which chat platforms and models does Prompt+ support?",
    a: "Output is clean, standard plain text formatted with universal structural markers. It works seamlessly across ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot, and open-source models.",
  },
  {
    q: "What does the Chrome Extension do?",
    a: "The Chrome Extension attaches an unobtrusive Enhance dock directly into the chat composer of supported platforms (ChatGPT, Claude, Gemini, DeepSeek). You can optimize your prompt in-place and inspect the changes before hitting enter.",
  },
  {
    q: "How are my API keys stored if I choose to connect them?",
    a: "Your API keys are encrypted at rest using AES-256-GCM encryption with dedicated server secrets. They are decrypted in-memory only during requested provider forwarding and never exposed in client bundles.",
  },
  {
    q: "Are my prompts used to train AI models?",
    a: "No. Prompt+ does not sell, log, or train models on user prompt text. In on-device mode, data never leaves your device. In server mode, prompts are processed ephemerally.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeComparisonTab, setActiveComparisonTab] = useState<number>(0);
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);

  useEffect(() => {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const activeComparison = comparisonExamples[activeComparisonTab];

  return (
    <div className="relative overflow-hidden bg-transparent selection:bg-primary/20 selection:text-primary min-h-screen">
      {/* 1. Hero Section with Live Playground */}
      <section id="playground" className="pt-28 pb-14 sm:pb-22 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-5 text-left" data-reveal>
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-mono font-semibold tracking-wider uppercase mb-5 shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Deterministic Engine · Zero-Key Default
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-balance">
                Make your next prompt clearer.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Turn a rough request into structured, model-ready instructions with explicit roles,
                boundaries, and verifiable output contracts.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/dashboard/new"
                  className={`group h-12 inline-flex items-center justify-between gap-3 rounded-full bg-primary text-primary-foreground pl-5 pr-2 text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-sm active:scale-[0.98] ${focusRing}`}
                >
                  <span>Open Prompt Studio</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  href="/extension"
                  className={`group h-12 inline-flex items-center justify-between gap-3 rounded-full border border-border/80 bg-card/70 pl-5 pr-2 text-sm font-semibold hover:bg-accent transition-all active:scale-[0.98] shadow-2xs ${focusRing}`}
                >
                  <span>Chrome Extension</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 dark:bg-foreground/10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4 opacity-70" />
                  </span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 pt-6 border-t border-border/50 grid grid-cols-2 gap-3 text-xs text-muted-foreground font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>Client-Side Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <span>On-Device Nano Support</span>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Interactive Playground */}
            <div className="lg:col-span-7 w-full">
              <PromptDemo />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Model Compatibility Strip */}
      <section className="py-10 sm:py-12 border-y border-border/60 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-6">
            Compatible with any chat interface or model runtime
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {compatibility.map(({ name, logoSrc }) => (
              <div
                key={name}
                className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border/80 bg-card/70 hover:bg-card hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 cursor-default"
              >
                <div className="h-5.5 w-5.5 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-115">
                  <Image
                    src={logoSrc}
                    alt={`${name} logo`}
                    width={22}
                    height={22}
                    unoptimized
                    className="h-5.5 w-5.5 object-contain"
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Horizontal Architecture Pipeline */}
      <section id="pipeline" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl text-left" data-reveal>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              Architecture & Method
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
              Horizontal Compiler Pipeline
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every prompt travels through four sequential decomposition stages before delivery to an LLM.
            </p>
          </div>

          {/* Horizontal Stepper Conduit */}
          <div className="mt-12 relative" data-reveal>
            {/* Horizontal progress beam line for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border/80 -translate-y-8 z-0">
              <div className="h-full bg-linear-to-r from-primary via-cyan-400 to-primary animate-beam-pulse w-1/3" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative z-10">
              {pipelineStages.map((stage, idx) => {
                const Icon = stage.icon;
                const isActive = activePipelineStep === idx;
                return (
                  <div
                    key={stage.step}
                    onClick={() => setActivePipelineStep(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setActivePipelineStep(idx);
                      }
                    }}
                    style={{ transitionDelay: `${idx * 60}ms` }}
                    className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between hover-lift transition-all cursor-pointer ${focusRing} ${
                      isActive
                        ? "border-primary bg-card shadow-md ring-1 ring-primary/20"
                        : "border-border/80 bg-card/60 hover:bg-card"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-xs font-bold text-primary">{stage.step}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent text-muted-foreground border border-border/60">
                          {stage.tag}
                        </span>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">{stage.name}</h3>
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {stage.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>Phase {idx + 1} of 4</span>
                      <span className="text-primary font-semibold">Active</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Horizontal Side-by-Side Comparison Plan ("Side Plan") */}
      <section id="compare" className="py-16 sm:py-24 px-4 sm:px-6 border-t bg-muted/15">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6" data-reveal>
            <div className="max-w-2xl text-left">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                Horizontal Side Plan
              </span>
              <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
                Side-by-side prompt transformation.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Compare the input request against the engineered Prompt+ specification across four disciplines.
              </p>
            </div>

            {/* Horizontal Example Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-card border border-border/80 shadow-2xs" role="tablist" aria-label="Example Categories">
              {comparisonExamples.map((ex, idx) => (
                <button
                  key={ex.id}
                  type="button"
                  role="tab"
                  aria-selected={activeComparisonTab === idx}
                  onClick={() => setActiveComparisonTab(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${focusRing} ${
                    activeComparisonTab === idx
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                >
                  {ex.tabLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal Side-by-Side Conduit Structure */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Card: Raw Request (5 cols) */}
            <div
              key={`${activeComparison.id}-raw`}
              className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 flex flex-col justify-between hover-lift transition-all animate-smooth-in"
              data-reveal
            >
              <div>
                <div className="flex items-baseline justify-between gap-3 pb-3 border-b border-border/50">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                    Original Request
                  </h3>
                  <span className="text-xs font-mono text-muted-foreground">{activeComparison.category}</span>
                </div>
                <p className="mt-4 rounded-xl border border-border/70 bg-muted/30 p-4 font-mono text-xs text-foreground/90 leading-relaxed">
                  &quot;{activeComparison.raw}&quot;
                </p>

                <div className="mt-6 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-muted-foreground">
                    Core Intent Preserved
                  </h4>
                  <ul className="space-y-2">
                    {activeComparison.kept.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-border/50 text-[11px] font-mono text-muted-foreground">
                Raw input · Unstructured
              </div>
            </div>

            {/* Center Animated Conduit (2 cols on desktop, horizontal connector) */}
            <div className="lg:col-span-2 hidden lg:flex flex-col items-center justify-center p-2 text-center" aria-hidden="true">
              <div className="w-full flex items-center justify-center relative">
                <div className="h-0.5 w-full bg-border" />
                <span className="absolute flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/30 text-primary animate-pulse-glow transition-transform hover:scale-110">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              <span className="mt-3 font-mono text-[10px] text-primary uppercase font-bold tracking-wider">
                Re-Engineered
              </span>
            </div>

            {/* Right Card: Enhanced Structured Prompt (5 cols) */}
            <div
              key={`${activeComparison.id}-enhanced`}
              className="lg:col-span-5 rounded-2xl border border-primary/30 bg-primary/3 p-5 sm:p-6 flex flex-col justify-between hover-lift transition-all animate-smooth-in"
              data-reveal
              style={{ transitionDelay: "70ms" }}
            >
              <div>
                <div className="flex items-baseline justify-between gap-3 pb-3 border-b border-primary/20">
                  <h3 className="text-sm font-bold flex items-center gap-1.5 text-primary">
                    <Sparkles className="h-4 w-4 text-primary animate-spin-slow" />
                    Structured Specification
                  </h3>
                  <span className="text-xs font-mono text-primary font-medium">Model-Ready</span>
                </div>

                <pre className="mt-4 rounded-xl border border-primary/20 bg-background/95 p-4 font-mono text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto shadow-2xs">
                  {activeComparison.enhanced}
                </pre>

                <div className="mt-6 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-primary">
                    Injected Constraints &amp; Schema
                  </h4>
                  <ul className="space-y-2">
                    {activeComparison.added.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-foreground/80">
                        <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-primary/20 flex items-center justify-between text-[11px] font-mono text-primary">
                <span>Model Contract</span>
                <Link
                  href={`/dashboard/new?prompt=${encodeURIComponent(activeComparison.enhanced)}`}
                  className="font-semibold underline hover:opacity-80"
                >
                  Test in Studio →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. In-Chat Extension Experience */}
      <section id="extension" className="py-16 sm:py-24 px-4 sm:px-6 border-t bg-muted/15">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl text-left" data-reveal>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              Browser Extension
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
              Enhance inside the chat you already use.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              The free Chrome extension pins an Enhance dock directly under your prompt composer in
              ChatGPT, Claude, Gemini, and DeepSeek. Review diffs in-place without switching tabs.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <figure data-reveal>
              <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm hover-lift transition-all">
                <Image
                  src="/screenshots/01-one-click-optimizer.png"
                  alt="A rough prompt in a chat composer with structured output previewed underneath"
                  width={1280}
                  height={800}
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="w-full h-auto"
                />
              </div>
              <figcaption className="mt-3 text-xs font-mono text-muted-foreground leading-relaxed">
                In-place enhancement dock: Inspect structured diff before injecting into chat.
              </figcaption>
            </figure>

            <figure data-reveal style={{ transitionDelay: "70ms" }}>
              <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm hover-lift transition-all">
                <Image
                  src="/screenshots/04-extension-command-center.png"
                  alt="The Prompt+ extension popup showing prompt blueprints and local processing options"
                  width={1280}
                  height={800}
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="w-full h-auto"
                />
              </div>
              <figcaption className="mt-3 text-xs font-mono text-muted-foreground leading-relaxed">
                Extension launcher: Blueprints, tone presets, and local vs cloud mode toggles.
              </figcaption>
            </figure>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href={EXTENSION_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`group h-11 inline-flex items-center justify-between gap-3 rounded-full bg-primary text-primary-foreground pl-5 pr-2 text-sm font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-xs ${focusRing}`}
            >
              <span className="flex items-center gap-2">
                <Puzzle className="h-4 w-4" />
                Add to Chrome Free
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20 transition-transform group-hover:translate-x-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
            <Link
              href="/extension"
              className={`h-11 inline-flex items-center justify-center rounded-full border border-border/80 bg-background px-5 text-sm font-semibold hover:bg-accent transition-colors active:scale-[0.98] ${focusRing}`}
            >
              Extension Setup Guide
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 border-t">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10" data-reveal>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              FAQ
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-[-0.03em]">
              Questions &amp; Answers
            </h2>
          </div>

          <div className="divide-y divide-border/60" data-reveal>
            {faqs.map((f, idx) => {
              const panelId = `faq-panel-${idx}`;
              const buttonId = `faq-button-${idx}`;
              const isOpen = openFaq === idx;
              return (
                <div key={f.q} className="py-4.5 transition-colors">
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className={`w-full flex items-center justify-between gap-4 text-left py-1 rounded-lg group transition-colors ${focusRing}`}
                    >
                      <span className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {f.q}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-mono transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
                          isOpen
                            ? "border-primary/40 bg-primary/10 text-primary rotate-45 scale-105"
                            : "border-border/80 text-muted-foreground group-hover:border-border rotate-0"
                        }`}
                      >
                        +
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="pr-10 pt-2 pb-1 text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Bottom Call to Action */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t">
        <div className="max-w-4xl mx-auto text-center" data-reveal>
          <div className="terminal-window p-8 sm:p-14 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-balance">
                Ready to make your prompts model-ready?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-lg mx-auto text-pretty">
                Start with our web-based Prompt Studio, or install the Chrome extension and optimize
                instructions in real time.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <Link
                  href="/dashboard/new"
                  className={`group h-12 inline-flex items-center justify-between gap-3 rounded-full bg-primary text-primary-foreground pl-5 pr-2 text-sm font-semibold hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] shadow-sm ${focusRing}`}
                >
                  <span>Open Prompt Studio</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  href="/extension"
                  className={`group h-12 inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-card/70 px-5 text-sm font-semibold hover:bg-accent transition-all active:scale-[0.98] shadow-2xs ${focusRing}`}
                >
                  <span>Chrome Extension</span>
                  <ArrowUpRight className="h-4 w-4 opacity-70" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
