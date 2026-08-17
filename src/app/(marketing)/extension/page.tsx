import Link from "next/link";
import { ExternalLink, Puzzle, Sparkles, Copy, Layers, CheckCircle2, ShieldCheck } from "lucide-react";

const CHROME_STORE_URL = "https://chromewebstore.google.com/detail/gdfaohfmmjjmpiggdcankjjihpljoccn";

const steps = [
  { icon: Puzzle, title: "1. Install in 1-Click", desc: "Add Prompt+ Architect AI to Google Chrome directly from the official Chrome Web Store." },
  { icon: Sparkles, title: "2. Open Web AI Chat", desc: "Visit ChatGPT, Claude, Gemini, DeepSeek, or Grok. A non-intrusive floating action bar appears." },
  { icon: Copy, title: "3. Optimize & Launch", desc: "Click Enhance — select from 4 V2 strategy candidates right at your prompt box." },
  { icon: Layers, title: "4. On-Device or Cloud", desc: "Use free server-managed cloud AI or offline local Gemini Nano for total privacy." },
];

export default function ExtensionPage() {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Chrome Web Store Official Release v1.2.0 • 🟢 Verified & Safe
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Enhance AI Prompts Directly Inside Your Chat
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-6">
            Transform raw text into structured, high-performing AI instructions directly inside ChatGPT, Claude, Gemini, DeepSeek, and Grok without leaving the page.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 text-sm font-semibold hover:bg-primary/90 transition-all shadow-md gap-2.5 group active:scale-98"
            >
              <Puzzle className="h-4 w-4" />
              Add to Chrome — It&apos;s Free
              <ExternalLink className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="/prompt-plus-extension.zip"
              download="prompt-plus-extension.zip"
              className="h-12 inline-flex items-center justify-center rounded-xl border bg-card px-5 text-sm font-medium hover:bg-accent transition-colors gap-2 text-muted-foreground"
            >
              Direct Zip Download (.zip)
            </a>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {steps.map((s) => (
            <div key={s.title} className="p-5 rounded-xl border bg-card">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <s.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <h3 className="text-sm font-bold mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* CWS Live Verified Badge */}
        <div className="p-6 rounded-2xl border bg-emerald-500/5 border-emerald-500/20 mb-14 flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-1" />
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-sm text-foreground">Official Chrome Web Store Listing Verified</h3>
            <p className="text-muted-foreground leading-relaxed">
              Prompt+ Architect AI adheres strictly to Chrome Web Store Manifest V3 guidelines, privacy standards, and narrowest-scope permissions (`storage`, `activeTab`, `contextMenus`). No personal credentials or passwords are ever stored or evaluated.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-14">
          <h2 className="text-base font-bold mb-4">Features Included in Extension v1.2.0</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            {[
              "Floating Action Bar on ChatGPT, Claude, Gemini, DeepSeek, and Grok",
              "Multi-Candidate Strategy Switcher (Concise, Structured, Comprehensive, Model-Tuned)",
              "Context Memory Quick-Pill Injector for 1-click brand tone and tech stack injection",
              "Real-time token counter & context window limit threshold warnings",
              "1-click Apply or Keep Original — zero copy-pasting required",
              "On-Device Mode using Chrome's built-in Gemini Nano — 100% free, private, offline",
              "Server-managed Cloud AI included out-of-the-box — no API keys required",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 rounded-2xl border bg-gradient-to-r from-primary/10 via-card to-primary/5 space-y-4">
          <h2 className="text-lg font-bold">Ready to Supercharge Your AI Prompts?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 text-sm font-semibold hover:bg-primary/90 transition-all shadow-md gap-2"
            >
              Install from Chrome Web Store
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href="/dashboard/new"
              className="h-11 inline-flex items-center justify-center rounded-xl border bg-card px-5 text-sm font-semibold hover:bg-accent transition-colors"
            >
              Open Web App Studio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
