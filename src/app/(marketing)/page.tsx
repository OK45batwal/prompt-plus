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
import { ArrowRight, ArrowUpRight, Check, Download, Puzzle } from "lucide-react";

const EXTENSION_STORE_URL =
  "https://chromewebstore.google.com/detail/gdfaohfmmjjmpiggdcankjjihpljoccn";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// Plain-text output, so this is a compatibility list, not a partner or endorsement list.
const compatibility = [
  { name: "ChatGPT", Logo: ChatGptLogo },
  { name: "Claude", Logo: ClaudeLogo },
  { name: "Gemini", Logo: GeminiLogo },
  { name: "DeepSeek", Logo: DeepSeekLogo },
  { name: "Grok", Logo: GrokLogo },
  { name: "Perplexity", Logo: PerplexityLogo },
  { name: "Copilot", Logo: CopilotLogo },
  { name: "Llama", Logo: MetaLogo },
];

const example = {
  raw: "Fix bugs in my Python web scraper and optimize connection leaks",
  enhanced: `[ROLE & PERSONA]
Act as a senior Python systems engineer working with AsyncIO and Playwright.

[TASK]
Inspect the provided code, find the root causes of the timeouts and memory leaks, and fix the error handling rather than patching the symptoms.

[CONSTRAINTS]
- Return Python 3.12 code with inline comments.
- Add exponential backoff retries and rotate the user agent.`,
};

const added = [
  "A role: senior Python systems engineer, sized to the task.",
  "A concrete task: find the root causes, not just the symptom.",
  "Constraints: Python 3.12, inline comments, retries, user-agent rotation.",
];

const kept = [
  "The subject: your Python web scraper.",
  "The goal: fewer bugs and no connection leaks.",
  "Your wording of the problem, kept in the request.",
];

const processingModes = [
  {
    name: "On-device",
    where: "In your browser",
    data: "Your prompt text stays on your device. It is not sent to our servers or to any provider.",
    note: "Uses Chrome's built-in Gemini Nano, available in Chrome 138 and later.",
    key: "No key needed",
  },
  {
    name: "Built-in engine",
    where: "On our server, no external model",
    data: "Your prompt is sent to our server to build the result. It is not used to train models.",
    note: "The default when no provider key is connected, and the mode behind the demo above.",
    key: "No key needed",
  },
  {
    name: "Your own key",
    where: "Our server forwards to the provider you pick",
    data: "Your prompt text leaves your device and is handled by that provider under their terms.",
    note: "OpenAI, Anthropic, OpenRouter, or NVIDIA. The key is encrypted at rest with AES-256-GCM.",
    key: "Key required",
  },
];

const faqs = [
  {
    q: "Is Prompt+ free?",
    a: "Yes. No credit card and no paid tier. Enhancements run on the built-in engine, on-device with Gemini Nano, or through a key you already have.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can enhance a prompt on this page without signing in. An account saves your history and your reusable context blocks.",
  },
  {
    q: "Does on-device mode need an API key?",
    a: "No. On-device mode uses Chrome's built-in Gemini Nano and runs in your browser in Chrome 138 and later, so your prompt text stays on your device.",
  },
  {
    q: "Which tools do the results work with?",
    a: "The result is plain text, so you can paste it into any chat tool, including ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot, and Llama.",
  },
  {
    q: "Is there a Chrome extension?",
    a: "Yes. The free extension adds an Enhance button inside ChatGPT, Claude, Gemini, and DeepSeek. A setup guide covers installing the release build manually.",
  },
  {
    q: "What happens to my prompts?",
    a: "We do not sell, rent, or train on your prompts. In on-device mode your text never leaves your browser. In API mode it is sent only to the provider you chose to build the result. You can delete your account and data at any time.",
  },
  {
    q: "Can I use my own API key?",
    a: "Yes. Add an OpenAI, Anthropic, OpenRouter, or NVIDIA key in Settings for full model access. Keys are encrypted at rest. Without a key, the built-in engine handles the enhancement.",
  },
];

export default function LandingPage() {
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

  return (
    <div className="relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-160 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-120 h-120 rounded-full bg-primary/10 dark:bg-primary/15 blur-[140px] animate-drift" />
        <div className="absolute top-40 right-1/4 w-105 h-105 rounded-full bg-primary/5 dark:bg-primary/10 blur-[150px] animate-drift-slow" />
      </div>

      {/* 1. Hero with the working demo */}
      <section className="pt-24 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 text-left" data-reveal>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.08] text-balance">
                Make your next prompt clearer.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                Turn a rough request into clear instructions you can review, edit, and use in your AI
                chat.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/dashboard/new"
                  className={`group h-12 inline-flex items-center justify-between gap-3 rounded-full bg-primary text-primary-foreground pl-5 pr-2 text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-sm active:scale-[0.98] ${focusRing}`}
                >
                  <span>Try Prompt+</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  href="/extension"
                  className={`group h-12 inline-flex items-center justify-between gap-3 rounded-full border border-border/80 bg-card/70 pl-5 pr-2 text-sm font-semibold hover:bg-accent transition-all active:scale-[0.98] shadow-2xs ${focusRing}`}
                >
                  <span>Get the extension</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 dark:bg-foreground/10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4 opacity-70" />
                  </span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 w-full">
              <PromptDemo />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Before and after review */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
            See what changes, and what stays.
          </h2>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            One worked example. The enhancer adds structure around your request; it keeps the request
            itself.
          </p>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <div className="double-bezel-outer" data-reveal>
              <div className="double-bezel-inner p-5 sm:p-6 h-full">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-bold">Your request</h3>
                  <span className="text-xs text-muted-foreground">Example</span>
                </div>
                <p className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-4 font-mono text-xs text-foreground/90 leading-relaxed">
                  {example.raw}
                </p>
              </div>
            </div>

            <div className="double-bezel-outer" data-reveal style={{ transitionDelay: "70ms" }}>
              <div className="double-bezel-inner p-5 sm:p-6 h-full">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-bold">The enhanced prompt</h3>
                  <span className="text-xs text-muted-foreground">Example output</span>
                </div>
                <pre className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 font-mono text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {example.enhanced}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
            <div data-reveal>
              <h3 className="text-sm font-bold">Added</h3>
              <ul className="mt-4 space-y-3">
                {added.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" strokeWidth={2} />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div data-reveal style={{ transitionDelay: "70ms" }}>
              <h3 className="text-sm font-bold">Kept</h3>
              <ul className="mt-4 space-y-3">
                {kept.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" strokeWidth={2} />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Extension in context */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t bg-accent/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
            Enhance inside the chat you already use.
          </h2>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            The extension adds an Enhance button to the prompt box. Write your request there, enhance
            it in place, and keep going without switching tabs.
          </p>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <figure data-reveal>
              <div className="double-bezel-outer">
                <div className="double-bezel-inner overflow-hidden">
                  <Image
                    src="/screenshots/01-one-click-optimizer.png"
                    alt="A rough prompt about a payment webhook typed in a chat composer, with the structured result shown below it after enhancing."
                    width={1280}
                    height={800}
                    sizes="(min-width: 1024px) 560px, 100vw"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <figcaption className="mt-3 text-xs text-muted-foreground leading-relaxed">
                A rough request enhanced in place, with the structured result underneath.
              </figcaption>
            </figure>

            <figure data-reveal style={{ transitionDelay: "70ms" }}>
              <div className="double-bezel-outer">
                <div className="double-bezel-inner overflow-hidden">
                  <Image
                    src="/screenshots/04-extension-command-center.png"
                    alt="The Prompt+ extension popup showing a list of prompt starters, a local and cloud toggle, and a link to settings."
                    width={1280}
                    height={800}
                    sizes="(min-width: 1024px) 560px, 100vw"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <figcaption className="mt-3 text-xs text-muted-foreground leading-relaxed">
                The extension popup: prompt starters, a processing toggle, and settings.
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
                Add to Chrome
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20 transition-transform group-hover:translate-x-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
            <Link
              href="/extension"
              className={`h-11 inline-flex items-center justify-center rounded-full border border-border/80 bg-background px-5 text-sm font-semibold hover:bg-accent transition-colors active:scale-[0.98] ${focusRing}`}
            >
              Setup guide
            </Link>
            <a
              href="/api/v1/extension/download"
              download="prompt-plus-extension.zip"
              className={`h-11 inline-flex items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${focusRing}`}
            >
              <Download className="h-4 w-4" />
              Download the build
            </a>
          </div>
        </div>
      </section>

      {/* 4. Reusable context */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
            Save a preference once, reuse it in every prompt.
          </h2>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            A context block is a short note you keep, like a writing style or a stack. When you
            enhance, the matching block is added to the instructions.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-center gap-5 sm:gap-6">
            <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6" data-reveal>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold">Saved context block</h3>
                <span className="text-xs text-muted-foreground">Example</span>
              </div>
              <p className="mt-4 text-sm text-foreground/90 leading-relaxed">
                Write for B2B readers. Plain language, no hype.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Kept in your browser, next to the built-in blocks.
              </p>
            </div>

            <div className="flex justify-center" aria-hidden="true">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-primary">
                <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" />
              </span>
            </div>

            <div
              className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6"
              data-reveal
              style={{ transitionDelay: "70ms" }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold">In the result</h3>
                <span className="text-xs text-muted-foreground">Example output</span>
              </div>
              <pre className="mt-4 font-mono text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {`[CONSTRAINTS]
- Tone: plain, no hype.
- Audience: B2B readers.`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How processing works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t bg-accent/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-balance">
            Where your prompt goes.
          </h2>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            Three processing modes. Which one runs decides whether your prompt leaves your device, and
            whether a key is needed.
          </p>

          <dl className="mt-10 border-y border-border/60 divide-y divide-border/60">
            {processingModes.map((mode) => (
              <div key={mode.name} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 py-6">
                <dt className="md:col-span-3">
                  <span className="text-base font-bold">{mode.name}</span>
                  <span className="block text-xs text-muted-foreground mt-1">{mode.where}</span>
                </dt>
                <dd className="md:col-span-6 text-sm text-muted-foreground leading-relaxed">
                  {mode.data}
                  <span className="block mt-2 text-xs">{mode.note}</span>
                </dd>
                <dd className="md:col-span-3 text-sm font-semibold text-primary md:text-right">
                  {mode.key}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {compatibility.map(({ name, Logo }) => (
                <span key={name} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Logo className="h-4 w-4 text-primary shrink-0" />
                  {name}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Compatibility only. The result is plain text, so these are tools you can paste it into.
              Prompt+ is not affiliated with or endorsed by them.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em]">
            Questions, answered.
          </h2>
          <div className="mt-10 divide-y divide-border/60" data-reveal>
            {faqs.map((f, idx) => {
              const panelId = `faq-panel-${idx}`;
              const buttonId = `faq-button-${idx}`;
              const isOpen = openFaq === idx;
              return (
                <div key={f.q} className="py-4">
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className={`w-full flex items-center justify-between gap-4 text-left py-1 rounded-lg ${focusRing}`}
                    >
                      <span className="text-sm font-semibold">{f.q}</span>
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-border/80 text-muted-foreground shrink-0 text-xs font-mono"
                      >
                        {isOpen ? "-" : "+"}
                      </span>
                    </button>
                  </h3>
                  {isOpen && (
                    <div id={panelId} role="region" aria-labelledby={buttonId}>
                      <p className="pr-10 pt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
                        {f.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final action */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t">
        <div className="max-w-4xl mx-auto text-center" data-reveal>
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-8 sm:p-14 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-balance">
                  Ready to make your next prompt clearer?
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-lg mx-auto text-pretty">
                  Start with the web editor, or add the extension and enhance prompts where you write
                  them.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <Link
                    href="/dashboard/new"
                    className={`group h-12 inline-flex items-center justify-between gap-3 rounded-full bg-primary text-primary-foreground pl-5 pr-2 text-sm font-semibold hover:bg-primary/90 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] shadow-sm ${focusRing}`}
                  >
                    <span>Try Prompt+</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                  <Link
                    href="/extension"
                    className={`group h-12 inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-card/70 px-5 text-sm font-semibold hover:bg-accent transition-all active:scale-[0.98] shadow-2xs ${focusRing}`}
                  >
                    Get the extension
                    <ArrowUpRight className="h-4 w-4 opacity-70" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
