"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PromptDemo } from "@/components/marketing/prompt-demo";
import { LogoMarquee } from "@/components/marketing/logo-marquee";
import { ChatGptLogo, ClaudeLogo, GeminiLogo, DeepSeekLogo } from "@/components/marketing/model-logos";
import {
  Sparkles,
  ArrowRight,
  BarChart3,
  Layers,
  Wand2,
  ArrowUpRight,
  Sliders,
  Puzzle,
  ShieldCheck,
  Lock,
  Mail,
  MessageSquare,
  Copy,
  Check,
  CheckCircle2,
  Globe,
  CircleDollarSign,
  MonitorSmartphone,
  Repeat,
  Infinity,
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "Instant AI Refinement",
    description:
      "Transform vague 5-word prompts into structured, production-ready system instructions optimized for top AI models.",
  },
  {
    icon: BarChart3,
    title: "Precision Quality Scoring",
    description:
      "Receive real-time 100-point quality evaluation breakdowns for clarity, role assignment, specificity, and constraints.",
  },
  {
    icon: Sliders,
    title: "Side-by-Side Model Lab",
    description:
      "Compare model responses across OpenAI, Claude, and Gemini simultaneously with version-controlled prompt history.",
  },
  {
    icon: Layers,
    title: "Team & Personal Collections",
    description:
      "Organize prompts into team collections, save reusable variables, and export templates directly to your workspace.",
  },
];

const modelBadges = [
  { name: "ChatGPT / GPT-4o", Logo: ChatGptLogo },
  { name: "Claude 3.5 Sonnet", Logo: ClaudeLogo },
  { name: "Gemini 1.5 Pro", Logo: GeminiLogo },
  { name: "Llama 3 & DeepSeek", Logo: DeepSeekLogo },
];

const steps = [
  { icon: MonitorSmartphone, title: "Type your idea", desc: "Paste or dictate any rough thought — a blog topic, a code request, a marketing brief. No formatting needed." },
  { icon: Repeat, title: "Pick your level", desc: "Quick for concise structure, Deep for full role/context/steps, or Expert for chain-of-thought reasoning." },
  { icon: CheckCircle2, title: "Use it anywhere", desc: "Copy, open in ChatGPT/Claude/Gemini with one click, or inject it live via the free Chrome extension." },
];

export default function LandingPage() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        el.classList.add("is-visible");
        el.classList.remove("reveal");
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            setTimeout(() => entry.target.classList.remove("reveal"), 1300);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const faqs = [
    { q: "Is Prompt+ really free?", a: "Yes — 100% free with no daily limits, no quotas, and no credit card. Enhancements run on our free server model or fully on-device with Chrome's Gemini Nano, so it costs us almost nothing to keep it free." },
    { q: "Why not just ask ChatGPT to improve my prompt?", a: "When an LLM evaluates or improves its own prompt in the same conversation, it suffers from Same-Model Self-Evaluation Bias—it assumes its own implied context and inherits its own blind spots. Prompt+ uses an independent meta-architect engine with explicit structural rules (Role, Objective, Instructions, Constraints) so your prompt is completely unbiased and production-ready for any LLM." },
    { q: "Does on-device AI require an API key?", a: "No. On-device mode uses Chrome 138+'s built-in Gemini Nano and runs entirely in your browser — private, offline, and free. Your prompt text never leaves your device." },
    { q: "Which AI models does Prompt+ work with?", a: "The enhanced prompts work with any major model — ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, and Llama. API mode also lets you run enhancement itself on OpenRouter free models, NVIDIA, OpenAI, or Anthropic." },
    { q: "Is there a Chrome extension?", a: "Yes. The free extension enhances prompts directly inside ChatGPT, Claude, Gemini, and DeepSeek with a floating button — no tab switching and no key required." },
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
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[640px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full bg-primary/10 dark:bg-primary/15 blur-[140px] animate-drift" />
        <div className="absolute top-40 right-1/4 w-[420px] h-[420px] rounded-full bg-primary/5 dark:bg-primary/10 blur-[150px] animate-drift-slow" />
      </div>

      {/* Hero Section */}
      <section className="pt-24 pb-12 sm:pt-28 sm:pb-20 px-4 sm:px-6 min-h-[100dvh] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Left-aligned messaging stack */}
            <div className="lg:col-span-5 text-left" data-reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Prompt+ v1.1.1 • 🟢 100% Free & Open</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-balance">
                Craft Flawless AI Prompts.{" "}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-indigo-400 bg-clip-text text-transparent">
                  Get Superior Outputs.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Transform rough text into precise instructions for ChatGPT, Claude, Gemini, and DeepSeek — 100% free with local AES privacy.
              </p>

              {/* Deduplicated Single-Intent CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="/api/v1/extension/download"
                  download="prompt-plus-extension-v1.1.1.zip"
                  className="group h-12 inline-flex items-center justify-center gap-2.5 rounded-full bg-primary text-primary-foreground px-6 text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md active:scale-[0.98]"
                >
                  <Puzzle className="h-4 w-4" />
                  <span>Install Free Extension v1.1.1</span>
                  <ArrowUpRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <Link
                  href="/dashboard/new"
                  className="group h-12 inline-flex items-center justify-center gap-2.5 rounded-full border bg-card/60 px-5 text-sm font-semibold hover:bg-accent transition-all active:scale-[0.98]"
                >
                  <span>Open Sandbox</span>
                  <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>No API key required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Chrome, Edge & Brave</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Sandbox Widget */}
            <div className="lg:col-span-7 w-full">
              <PromptDemo />
            </div>
          </div>

          {/* Logo Strip directly under Hero */}
          <div className="mt-16 pt-8 border-t border-border/40">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.2em] text-center mb-5">
              Optimized for Leading AI Models & Chatbots
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
              {modelBadges.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full border bg-card/40 text-foreground/80 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <m.Logo className="h-4 w-4 text-primary shrink-0" />
                  <span>{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Horizontal Logo Marquee */}
      <LogoMarquee />

      {/* Core Features Grid */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3">The toolkit</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
              Built for prompt perfection
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base text-pretty">
              A complete toolkit for developers, marketers, researchers, and creators.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {features.map((f, i) => (
              <div
                key={f.title}
                data-reveal
                style={{ transitionDelay: `${i * 70}ms` }}
                className="group relative p-6 sm:p-8 rounded-2xl border bg-card hover:border-primary/40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_2px_16px_rgba(79,70,229,0.06)] hover:-translate-y-1 overflow-hidden"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed text-pretty">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-t bg-card/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: CircleDollarSign, label: "Free forever", desc: "No paywall, ever" },
              { icon: Infinity, label: "No daily limits", desc: "Enhance as much as you want" },
              { icon: ShieldCheck, label: "MIT open source", desc: "Auditable on GitHub" },
              { icon: Lock, label: "Private by default", desc: "On-device AI option" },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1.5 md:flex-row md:items-center md:justify-center md:gap-3 group">
                <t.icon className="h-5 w-5 text-primary shrink-0 transition-transform group-hover:scale-110" strokeWidth={1.75} />
                <div className="text-center md:text-left">
                  <div className="text-sm font-semibold leading-tight">{t.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 border-t bg-accent/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3">How it works</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
              From rough idea to production prompt in 3 steps
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
              No prompt-engineering knowledge needed. Paste, pick your level, and go.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
            {steps.map((s, i) => (
              <div key={s.title} data-reveal style={{ transitionDelay: `${i * 80}ms` }} className="relative border-t pt-6 sm:pt-8 group">
                <span className="absolute -top-3.5 left-0 bg-background pr-2 font-mono text-xs text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <s.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-bold tracking-tight">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed text-pretty">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browser Extension Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border bg-card/70 p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 hover:border-primary/40 transition-all">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Puzzle className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Use Prompt+ right inside your chat</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg text-pretty">
                Install the free Chrome extension to enhance prompts directly inside ChatGPT, Claude, Gemini, and DeepSeek — with zero tab switching.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <a
                href="/api/v1/extension/download"
                download="prompt-plus-extension.zip"
                className="h-10 w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 text-sm font-semibold hover:bg-primary/90 transition-colors gap-2 active:scale-[0.98]"
              >
                <Puzzle className="h-3.5 w-3.5" />
                Download zip
              </a>
              <Link
                href="/extension"
                className="h-10 w-full sm:w-auto inline-flex items-center justify-center rounded-full border bg-background px-4 text-sm font-semibold hover:bg-accent transition-colors gap-1.5 active:scale-[0.98]"
              >
                Setup guide
                <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Free Forever Pricing */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 border-t">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3">Pricing</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
              Free. Forever. No quotas, no paywall.
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
              Every competitor charges $9–19/month. Prompt+ is free — unlimited enhancements, no credit card, no daily caps.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-8 sm:p-10 relative overflow-hidden" data-reveal>
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-primary/5 blur-3xl" />
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
                  className="h-11 inline-flex items-center justify-center rounded-full bg-foreground text-background px-6 text-sm font-semibold hover:bg-foreground/90 transition-all active:scale-[0.98]"
                >
                  Start free
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
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.75} />
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
      <section className="py-16 sm:py-28 px-4 sm:px-6 border-t bg-accent/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3">Privacy first</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
              Security, privacy & data protection
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
              Your data security and prompt intellectual property are guaranteed by design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div data-reveal className="md:col-span-2 p-6 sm:p-8 rounded-2xl border bg-card">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Lock className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-bold">Zero data selling</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-md text-pretty">
                We never sell, rent, or monetize your prompt data or user interactions. Your custom prompts remain strictly your private property.
              </p>
              <Link href="/privacy" className="inline-flex items-center text-xs font-semibold text-primary mt-4 hover:underline">
                Read privacy policy <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            <div data-reveal style={{ transitionDelay: "90ms" }} className="p-6 rounded-2xl border bg-card">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Globe className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-bold">100% on-device AI option</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed text-pretty">
                Run prompt enhancements locally using Chrome Gemini Nano. Your prompt text never leaves your device.
              </p>
              <Link href="/extension" className="inline-flex items-center text-xs font-semibold text-primary mt-4 hover:underline">
                Learn about on-device AI <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>

            <div data-reveal style={{ transitionDelay: "140ms" }} className="md:col-span-3 p-6 sm:p-8 rounded-2xl border bg-card flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold">Fair usage & terms</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed text-pretty">
                  Transparent service terms, account deletion rights, and total export control over your prompt collections and history.
                </p>
              </div>
              <Link href="/terms" className="inline-flex items-center text-xs font-semibold text-primary hover:underline whitespace-nowrap">
                Read terms of service <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Comparison Table Section */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 border-t">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">Prompt+ vs. $9–$19/month tools</h2>
            <p className="text-sm text-muted-foreground mt-3 text-pretty max-w-xl mx-auto">Why pay monthly subscriptions for basic prompt wrappers when Prompt+ is 100% free and private?</p>
          </div>
          <div className="rounded-2xl border overflow-hidden bg-card" data-reveal>
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="p-4">Feature</th>
                  <th className="p-4 text-primary font-bold">Prompt+</th>
                  <th className="p-4 text-muted-foreground">Paid prompt tools ($9–$19/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs sm:text-sm">
                <tr>
                  <td className="p-4 font-medium">Pricing</td>
                  <td className="p-4 font-bold text-primary">$0 / forever free</td>
                  <td className="p-4 text-muted-foreground">$9 to $19 / month</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Usage caps</td>
                  <td className="p-4 font-bold text-primary">Unlimited enhancements</td>
                  <td className="p-4 text-muted-foreground">3 – 10 prompts/day free cap</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">On-device privacy</td>
                  <td className="p-4 font-bold text-primary">Chrome Gemini Nano (100% local)</td>
                  <td className="p-4 text-muted-foreground">Cloud server logging only</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Security & trust</td>
                  <td className="p-4 font-bold text-primary">AES-256 encrypted & private</td>
                  <td className="p-4 text-muted-foreground">Unencrypted logs</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Signup required</td>
                  <td className="p-4 font-bold text-primary">No signup wall</td>
                  <td className="p-4 text-muted-foreground">Mandatory email & credit card wall</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Science & Research Backed Section */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 border-t bg-accent/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3">Research</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">Empirically grounded prompt engineering</h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-3 text-pretty">
              Prompt+ isn&apos;t based on guesswork. Our Architect Engine compiles prompts using peer-reviewed research from top AI laboratories.
            </p>
          </div>
          <div className="space-y-6">
            {[
              { cite: "Wei et al. (2022)", title: "Chain-of-thought reasoning", desc: "Forces step-by-step intermediate reasoning paths, cutting math & logic hallucinations by 60%." },
              { cite: "Zhou et al. (2023)", title: "Structural role boundaries", desc: "Establishes explicit Role, Context, Instructions, and Non-Negotiable Constraints to prevent context drift." },
              { cite: "Brown et al. (2020)", title: "Few-shot in-context learning", desc: "Structures input variable placeholders and example ordering to maximize LLM adherence." },
            ].map((c, i) => (
              <div key={c.title} data-reveal style={{ transitionDelay: `${i * 70}ms` }} className="border-t pt-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                  <span className="font-mono text-xs text-primary whitespace-nowrap">{c.cite}</span>
                  <div>
                    <h3 className="text-sm font-bold">{c.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 text-pretty">{c.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">Optimize prompts for your favorite AI model</h4>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              <Link href="/enhance-prompt-for-chatgpt" className="px-3 py-1.5 rounded-full border bg-card hover:border-primary transition-colors">Enhance for ChatGPT</Link>
              <Link href="/enhance-prompt-for-claude" className="px-3 py-1.5 rounded-full border bg-card hover:border-primary transition-colors">Enhance for Claude</Link>
              <Link href="/enhance-prompt-for-gemini" className="px-3 py-1.5 rounded-full border bg-card hover:border-primary transition-colors">Enhance for Gemini</Link>
              <Link href="/prompt-templates" className="px-3 py-1.5 rounded-full border bg-card hover:border-primary transition-colors">Prompt templates</Link>
              <Link href="/prompt-engineering-guide" className="px-3 py-1.5 rounded-full border bg-card hover:border-primary transition-colors">Prompt engineering guide</Link>
              <Link href="/prompt-cost-calculator" className="px-3 py-1.5 rounded-full border bg-card hover:border-primary transition-colors">Token cost calculator</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 border-t">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3">FAQ</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em]">Questions? We&apos;ve got answers</h2>
          </div>
          <div className="divide-y" data-reveal>
            {faqs.map((f, idx) => (
              <div key={f.q} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-left py-1"
                  aria-expanded={openFaq === idx}
                >
                  <span className="text-sm font-semibold">{f.q}</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border text-muted-foreground flex-shrink-0 transition-transform">
                    {openFaq === idx ? <span aria-hidden>-</span> : <span aria-hidden>+</span>}
                  </span>
                </button>
                {openFaq === idx && (
                  <p className="pr-10 pt-2 text-sm text-muted-foreground leading-relaxed text-pretty">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Support */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 border-t bg-accent/30">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border bg-card p-8 sm:p-12 relative overflow-hidden" data-reveal>
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <p className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3">Contact & support</p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em]">
                Have questions or feedback?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-3">
                Reach out directly to the Prompt+ engineering team. We respond to all inquiries within 24 hours.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`mailto:${contactEmail}`}
                  className="group h-12 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-foreground text-background px-6 text-sm font-semibold hover:bg-foreground/90 transition-all active:scale-[0.98]"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email: {contactEmail}</span>
                </a>
                <a
                  href="https://github.com/OK45batwal/prompt-plus/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full border bg-card px-6 text-sm font-semibold hover:bg-accent transition-all active:scale-[0.98] text-foreground"
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>GitHub issues & feedback</span>
                </a>
                <button
                  onClick={handleCopyEmail}
                  type="button"
                  className="h-12 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border bg-card px-5 text-sm font-medium hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  {copiedEmail ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                  <span>{copiedEmail ? "Copied email" : "Copy email"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 border-t">
        <div className="max-w-4xl mx-auto text-center relative p-8 sm:p-14 rounded-2xl border bg-card overflow-hidden" data-reveal>
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
              Ready to upgrade your AI workflow?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-lg mx-auto text-pretty">
              Start generating higher quality AI responses today with Prompt+. No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="group h-11 sm:h-12 w-full sm:w-auto inline-flex items-center justify-between gap-3 rounded-full bg-foreground text-background pl-6 pr-2 text-sm font-semibold hover:bg-foreground/90 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]"
              >
                <span>Get started free</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/15 transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
