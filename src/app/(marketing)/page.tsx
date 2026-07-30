"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  BarChart3,
  Layers,
  Terminal,
  Cpu,
  Wand2,
  ArrowUpRight,
  Sliders,
  Bot,
  Puzzle,
  ExternalLink
} from "lucide-react";

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

      {/* Browser Extension Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border bg-card p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Puzzle className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Use Prompt+ Right Inside Your Chat</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                Install the free Chrome extension to enhance prompts directly in ChatGPT, Claude, Gemini, and DeepSeek — no tab switching.
              </p>
            </div>
            <Link
              href="/extension"
              className="h-10 w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-foreground text-background px-5 text-sm font-semibold hover:bg-foreground/90 transition-colors gap-2"
            >
              Get the Extension
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
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
