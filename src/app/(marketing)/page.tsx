"use client";

import { useState } from "react";
import Link from "next/link";
import { PromptDemo } from "@/components/marketing/prompt-demo";
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
  ExternalLink,
  ShieldCheck,
  Lock,
  Mail,
  MessageSquare,
  Copy,
  Check,
  CheckCircle2,
  Globe,
  CircleDollarSign,
  ChevronDown,
  MonitorSmartphone,
  ListChecks,
  Repeat,
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
    title: "Team & Personal Collections",
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
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { q: "Is Prompt+ really free?", a: "Yes — 100% free with no daily limits, no quotas, and no credit card. Enhancements run on our free server model or fully on-device with Chrome's Gemini Nano, so it costs us almost nothing to keep it free." },
    { q: "Does on-device AI require an API key?", a: "No. On-device mode uses Chrome 138+'s built-in Gemini Nano and runs entirely in your browser — private, offline, and free. Your prompt text never leaves your device." },
    { q: "Which AI models does Prompt+ work with?", a: "The enhanced prompts work with any major model — ChatGPT, Claude, Gemini, DeepSeek, Llama, and more. API mode also lets you run enhancement itself on OpenRouter free models, NVIDIA, OpenAI, or Anthropic." },
    { q: "Is there a Chrome extension?", a: "Yes. The free extension enhances prompts directly inside ChatGPT, Claude, Gemini, and DeepSeek with a floating button — no tab switching and no key required. It currently installs via developer mode while store review is in progress." },
    { q: "What do you do with my prompts?", a: "Nothing — we never sell, rent, or train on your prompts. Your prompts and API keys (encrypted with AES-256-GCM) belong to you. You can delete your account and data at any time." },
    { q: "Can I bring my own API key?", a: "Yes. Add OpenAI, Anthropic, OpenRouter, or NVIDIA keys in Settings for full model access. Keys are encrypted at rest. If you don't add one, the free server model covers you." },
  ];

  const contactEmail = "promptplus2@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background Mesh Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/20 dark:bg-blue-500/25 blur-[140px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-28 right-1/4 w-[450px] h-[450px] rounded-full bg-violet-500/20 dark:bg-violet-500/25 blur-[150px] animate-pulse" style={{ animationDuration: "10s" }} />
      </div>

      {/* Hero Section */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary mb-8 shadow-sm backdrop-blur-md animate-fade-in hover:border-primary/50 transition-all cursor-default">
            <Sparkles className="h-4 w-4 animate-spin text-blue-500" style={{ animationDuration: "6s" }} />
            <span>Prompt+ v2.0 Live</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
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
            Stop guessing prompt structures. Prompt+ analyzes, scores, and refines your raw text into high-precision instructions for ChatGPT, Claude, Gemini, and local On-Device models.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="h-11 sm:h-12 w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-foreground text-background px-7 text-sm font-semibold hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl active:scale-95 group"
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

          {/* Interactive Live Demo Preview Box */}
          <PromptDemo />

          {/* Supported AI Models */}
          <div className="mt-12 sm:mt-16 pt-8 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Optimized for Industry-Leading AI Models
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-medium">
              {modelBadges.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border bg-card/50 backdrop-blur-sm text-foreground/80 shadow-2xs hover:border-primary/40 transition-colors"
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

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border/50 bg-accent/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary mb-4">
              <ListChecks className="h-3.5 w-3.5" />
              How It Works
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              From Rough Idea to Production Prompt in 3 Steps
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
              No prompt-engineering knowledge needed. Paste, pick your level, and go.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: MonitorSmartphone, title: "1. Type Your Idea", desc: "Paste or dictate any rough thought — a blog topic, a code request, a marketing brief. No formatting needed." },
              { icon: Repeat, title: "2. Pick Your Level", desc: "Quick for concise structure, Deep for full role/context/steps, or Expert for chain-of-thought reasoning." },
              { icon: ListChecks, title: "3. Use It Anywhere", desc: "Copy, open in ChatGPT/Claude/Gemini with one click, or inject it live via the free Chrome extension." },
            ].map((s) => (
              <div key={s.title} className="p-6 rounded-2xl border bg-card">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
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
                Install the free Chrome extension to enhance prompts directly inside ChatGPT, Claude, Gemini, and DeepSeek — with zero tab switching.
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

      {/* Free Forever Pricing */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3.5 py-1 text-xs font-medium text-green-600 dark:text-green-400 mb-4">
              <CircleDollarSign className="h-3.5 w-3.5" />
              Honest Pricing
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Free. Forever. No Quotas, No Paywall.
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
              Every competitor charges $9–19/month. Prompt+ is free — unlimited enhancements, no credit card, no daily caps.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-green-500/10 blur-3xl" />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold">Prompt+ Free</h3>
                  <p className="text-3xl sm:text-4xl font-extrabold mt-1">
                    $0 <span className="text-base font-medium text-muted-foreground">/ forever</span>
                  </p>
                </div>
                <Link
                  href="/signup"
                  className="h-11 inline-flex items-center justify-center rounded-xl bg-foreground text-background px-6 text-sm font-semibold hover:bg-foreground/90 transition-all"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-6 text-sm">
                {[
                  "Unlimited prompt enhancements",
                  "On-device AI — free, private, offline",
                  "Free server model out of the box",
                  "6-dimension quality scoring",
                  "Curated prompt library & templates",
                  "Chrome extension — no key required",
                  "Collections, versions & sharing",
                  "Bring your own key for full model access",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-6">
                How is it free? It&apos;s open-source (MIT), funded by optional donations, and on-device AI costs nothing to run.
                IP-based throttling keeps the free servers healthy — never your wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy, Data & Policies Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border/50 bg-accent/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3.5 py-1 text-xs font-medium text-green-600 dark:text-green-400 mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy First Architecture
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Security, Privacy & Data Protection Policies
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
              Your data security and prompt intellectual property are guaranteed by design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border bg-card">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold">Zero Data Selling</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                We never sell, rent, or monetize your prompt data or user interactions. Your custom prompts remain strictly your private property.
              </p>
              <Link href="/privacy" className="inline-flex items-center text-xs font-semibold text-primary mt-4 hover:underline">
                Read Privacy Policy <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            <div className="p-6 rounded-2xl border bg-card">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold">100% On-Device AI Option</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Run prompt enhancements locally using Chrome Gemini Nano Built-in AI. Your prompt text never leaves your browser device.
              </p>
              <Link href="/extension" className="inline-flex items-center text-xs font-semibold text-primary mt-4 hover:underline">
                Learn About On-Device AI <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            <div className="p-6 rounded-2xl border bg-card">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold">Fair Usage & Terms</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Transparent service terms, account deletion rights, and total export control over your prompt collections and history.
              </p>
              <Link href="/terms" className="inline-flex items-center text-xs font-semibold text-primary mt-4 hover:underline">
                Read Terms of Service <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary mb-4">
              <MessageSquare className="h-3.5 w-3.5" />
              FAQ
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Questions? We&apos;ve Got Answers</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, idx) => (
              <div key={f.q} className="rounded-xl border bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaq === idx && (
                  <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Contact & Support Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border bg-gradient-to-br from-card via-card to-primary/5 p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary mb-4">
                <Mail className="h-3.5 w-3.5" />
                Contact & Support
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Have Questions or Feedback?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-3">
                Reach out directly to the Prompt+ engineering team. We respond to all inquiries within 24 hours.
              </p>

              {/* Contact Email & GitHub Discussions Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`mailto:${contactEmail}`}
                  className="h-12 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-foreground text-background px-6 text-sm font-semibold hover:bg-foreground/90 transition-all shadow-md active:scale-95"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email: {contactEmail}</span>
                </a>

                <a
                  href="https://github.com/OK45batwal/prompt-plus/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl border bg-card px-6 text-sm font-semibold hover:bg-accent transition-all active:scale-95 text-foreground"
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>GitHub Issues & Feedback</span>
                </a>

                <button
                  onClick={handleCopyEmail}
                  type="button"
                  className="h-12 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border bg-card px-5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {copiedEmail ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  <span>{copiedEmail ? "Copied Email!" : "Copy Email"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="py-20 px-4 sm:px-6 border-t border-border/50 bg-accent/20">
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
