"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Layers,
  Terminal,
  Cpu,
  Copy,
  Check,
  Wand2,
  ArrowUpRight,
  Sliders,
  Bot
} from "lucide-react";

const sampleDemos = [
  {
    category: "Software Development",
    original: "Write a React component for a data table.",
    enhanced:
      "Act as a Principal Frontend Engineer specializing in Next.js 16 and TypeScript. Build a highly performant, accessible data table component featuring:\n• Server-side pagination & sorting\n• Column visibility toggles & sticky headers\n• Accessible ARIA roles & keyboard navigation\n• Zero third-party runtime bloat using Tailwind CSS",
    score: 98,
    timeSaved: "15 mins",
  },
  {
    category: "Content Creation",
    original: "Write a blog post about AI in marketing.",
    enhanced:
      "Act as a Tech Journalist for Wired. Draft a 1,200-word data-driven article analyzing the shift to generative AI in B2B marketing funnel optimization. Include:\n• 3 case studies with verified ROI metrics\n• Nuanced analysis of ethical considerations & bias\n• Actionable framework for CMOs implementing AI tools in 2026",
    score: 96,
    timeSaved: "30 mins",
  },
  {
    category: "Data Analysis",
    original: "Help me analyze this customer churn data.",
    enhanced:
      "Act as a Senior Product Data Scientist. Analyze the provided quarterly customer churn CSV dataset to:\n1. Identify statistical correlations between onboarding step completion and 30-day retention.\n2. Construct a predictive cohort matrix grouped by acquisition channel.\n3. Formulate 3 high-impact product experiments to reduce mid-funnel churn.",
    score: 99,
    timeSaved: "45 mins",
  },
];

const features = [
  {
    icon: Wand2,
    title: "Instant AI Refinement",
    description:
      "Transform vague 5-word prompts into structured, production-ready system instructions optimized for top AI models.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Precision Quality Scoring",
    description:
      "Receive real-time 100-point quality evaluation breakdowns for clarity, role assignment, specificity, and constraints.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Sliders,
    title: "Side-by-Side Model Lab",
    description:
      "Compare model responses across OpenAI, Claude, and Gemini simultaneously with version-controlled prompt history.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Layers,
    title: "Curated Prompt Library",
    description:
      "Organize prompts into team collections, save reusable variables, and export templates directly to your workspace.",
    color: "from-emerald-500 to-teal-500",
  },
];

const modelBadges = [
  { name: "ChatGPT / GPT-4o", icon: Bot },
  { name: "Claude 3.5 Sonnet", icon: Cpu },
  { name: "Gemini 1.5 Pro", icon: Sparkles },
  { name: "Llama 3 & DeepSeek", icon: Terminal },
];

export default function LandingPage() {
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeDemo = sampleDemos[selectedDemoIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeDemo.enhanced);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateEnhance = () => {
    setIsEnhancing(true);
    setTimeout(() => {
      setIsEnhancing(false);
    }, 600);
  };

  return (
    <div className="relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Background Mesh Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[450px] h-[450px] rounded-full bg-blue-500/15 dark:bg-blue-500/20 blur-[120px] animate-pulse" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/15 dark:bg-violet-500/20 blur-[130px]" />
      </div>

      {/* Hero Section */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-primary mb-8 shadow-sm backdrop-blur-md animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "6s" }} />
            <span>Prompt+ v2.0 Released</span>
            <span className="h-1 w-1 rounded-full bg-primary" />
            <span className="text-muted-foreground font-normal">Next-Gen AI Prompt Studio</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Craft Flawless AI Prompts.{" "}
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-500 dark:from-blue-400 dark:via-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">
              Unlock 10x Better Outputs.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop guessing prompt structures. Prompt+ analyzes, scores, and refines your text into high-precision instructions for ChatGPT, Claude, and Gemini.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="h-11 sm:h-12 w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-foreground text-background px-6 text-sm font-semibold hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl active:scale-95 group"
            >
              Start Building Free
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard/new"
              className="h-11 sm:h-12 w-full sm:w-auto inline-flex items-center justify-center rounded-xl border bg-card/80 backdrop-blur-md px-6 text-sm font-semibold hover:bg-accent transition-all active:scale-95"
            >
              Open Studio Sandbox
              <ArrowUpRight className="h-4 w-4 ml-1.5 opacity-60" />
            </Link>
          </div>

          {/* Supported AI Models */}
          <div className="mt-12 sm:mt-16 pt-8 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Optimized for Industry-Leading AI Models
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-medium">
              {modelBadges.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border bg-card/50 backdrop-blur-sm text-foreground/80 shadow-2xs"
                >
                  <m.icon className="h-3.5 w-3.5 text-primary" />
                  <span>{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Playground Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              See the Transformation in Action
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Select an example domain below to watch Prompt+ convert basic text into an elite prompt.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {sampleDemos.map((demo, idx) => (
              <button
                key={demo.category}
                onClick={() => {
                  setSelectedDemoIndex(idx);
                  handleSimulateEnhance();
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  selectedDemoIndex === idx
                    ? "bg-foreground text-background shadow-md scale-105"
                    : "bg-card border text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {demo.category}
              </button>
            ))}
          </div>

          {/* Interactive Card Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-2xl border bg-card/80 backdrop-blur-xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
            {/* Before (Original) */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-muted/40 border border-border/60">
              <div>
                <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Original Input
          </span>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded">
            Score: 45/100 (Basic)
          </span>
        </div>
        <p className="text-sm font-mono text-foreground/90 bg-background/60 p-3.5 rounded-lg border leading-relaxed">
          &quot;{activeDemo.original}&quot;
        </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
                <span>Vague instructions</span>
                <span>High hallucination risk</span>
              </div>
            </div>

            {/* After (Enhanced) */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-primary/5 border border-primary/20 relative">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    Prompt+ Refined Output
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Score: {activeDemo.score}/100
                    </span>
                  </div>
                </div>

                <div
                  className={`transition-opacity duration-300 ${
                    isEnhancing ? "opacity-30 blur-2xs" : "opacity-100"
                  }`}
                >
                  <pre className="text-xs font-sans text-foreground bg-background p-3.5 rounded-lg border whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto">
                    {activeDemo.enhanced}
                  </pre>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-primary/10 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  ⏱ Saves approx. <strong className="text-foreground">{activeDemo.timeSaved}</strong> of iteration
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border text-xs font-medium hover:bg-accent transition-colors active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Engineered for Prompt Perfection
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
              A comprehensive toolkit for developers, marketers, researchers, and creators.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative p-6 sm:p-8 rounded-2xl border bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center mb-5 shadow-md`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border/50 bg-accent/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Four Steps to Elite Results
            </h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              How Prompt+ takes your raw thoughts to production-ready prompts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Input Idea",
                desc: "Type a short summary of what you want the AI to achieve.",
              },
              {
                step: "02",
                title: "Intent Analysis",
                desc: "AI identifies target persona, missing context, and constraints.",
              },
              {
                step: "03",
                title: "Auto-Enhance",
                desc: "Injects structural tags, output formatting, and tone guards.",
              },
              {
                step: "04",
                title: "Deploy & Score",
                desc: "Export directly to ChatGPT or run side-by-side model tests.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow relative"
              >
                <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-md mb-4 inline-block">
                  STEP {s.step}
                </span>
                <h3 className="text-base font-bold">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="py-20 px-4 sm:px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center relative p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-primary/10 via-card to-primary/5 border border-primary/20 shadow-2xl overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Upgrade Your AI Workflow?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-lg mx-auto">
              Start generating higher quality AI responses today with Prompt+. No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="h-11 sm:h-12 w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-foreground text-background px-7 text-sm font-semibold hover:bg-foreground/90 transition-all shadow-lg active:scale-95"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
