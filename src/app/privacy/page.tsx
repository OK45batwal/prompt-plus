"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Cpu,
  Cookie,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import { openCookiePreferences } from "@/components/ui/cookie-banner";

const privacySections = [
  {
    id: "overview",
    title: "1. Overview & Privacy Principles",
    badge: "Core Commitment",
    body: [
      "This Privacy Policy explains how Prompt+ (\"we\", \"our\", \"us\") collects, processes, protects, and handles your information across our website (prompt-plus-three.vercel.app), browser extension, and associated APIs.",
      "Prompt+ operates on three fundamental principles:",
      "• Zero Data Monetization: We never sell, rent, monetize, or trade your personal data, prompt engineering inputs, or AI outputs with data brokers or advertisers.",
      "• Zero AI Model Training: Your prompts and enhancement workflows are never used to train, fine-tune, or improve any public or proprietary machine learning models.",
      "• On-Device First Processing: We provide full client-side execution with Chrome's built-in Gemini Nano AI, allowing prompts to be optimized entirely inside your browser without transmitting a single byte to external servers.",
    ],
  },
  {
    id: "collection",
    title: "2. Information We Collect",
    badge: "Itemized Data",
    body: [
      "We practice strict data minimization and collect only what is strictly necessary to deliver the service:",
      "2.1 Account Credentials: When you create an account, we store your email address, optional profile name, and password hash (encrypted via bcrypt with 12 salt rounds — we cannot read, view, or decrypt your plaintext password). If you authenticate with Google or GitHub OAuth, we receive only your public profile ID and verified email.",
      "2.2 Prompts & Optimization History: For authenticated users, your saved prompts, version history, quality audit scores, and workspace collections are stored in our secure PostgreSQL database to allow synchronization across your devices and the browser extension.",
      "2.3 API Key Vault (Optional): If you choose to bring your own API keys (OpenAI, Anthropic, OpenRouter, NVIDIA), your keys are encrypted at rest using industry-standard AES-256-GCM encryption with hardware-isolated server-side secret keys. You can delete or revoke stored keys at any moment.",
      "2.4 Ephemeral Server Logs: When making API requests, server telemetry temporarily records timestamp, response latency, token count estimates, and status code. These logs contain no personal prompt payloads and are automatically purged.",
      "2.5 Device-Local Data: Context memory blocks, local prompt scratchpads, UI layout states, and active dark/light mode preferences stay exclusively in your browser's localStorage.",
    ],
  },
  {
    id: "ai-modes",
    title: "3. On-Device vs. Cloud AI Processing",
    badge: "AI Architecture",
    body: [
      "Prompt+ provides two distinct processing architectures so you maintain total control over your data:",
      "• On-Device Mode (Chrome 138+ Gemini Nano): Runs 100% locally on your machine. Your prompt text never leaves your device and is not sent across any network connection.",
      "• Cloud AI Mode: Sends your prompt text directly to the AI provider endpoint you selected (e.g. OpenAI, Anthropic, OpenRouter, or our high-speed free tier model). The provider processes the request solely to return the enhanced output.",
      "Neither Prompt+ nor our upstream providers store prompt content for model training.",
    ],
  },
  {
    id: "cookies",
    title: "4. Cookies, Tracking & Your Choices",
    badge: "Cookie Policy",
    body: [
      "We believe in transparent, user-controlled cookie management. You have full power to accept, reject, or customize cookies at any time:",
      "• Strictly Essential Cookies: Cryptographically signed session tokens (authjs.session-token and __Secure-authjs.session-token) required for user authentication, CSRF attack mitigation, and session persistence. These do not track browsing activity across other websites.",
      "• Performance & Analytics Cookies (Optional): Privacy-friendly Vercel Analytics and Web Vitals that monitor server response times and page load speeds without storing personal identifiers or persistent IP addresses.",
      "• Functional Preferences (Optional): LocalStorage keys that remember your dark mode preference, sidebar collapse state, and active model presets.",
    ],
  },
  {
    id: "security",
    title: "5. Data Security & Encryption",
    badge: "AES-256 Vault",
    body: [
      "We implement comprehensive, defense-in-depth technical safeguards to protect your data:",
      "• HTTPS & TLS 1.3 encryption across all network transmissions.",
      "• AES-256-GCM authenticated encryption for all user-stored API keys.",
      "• Bcrypt salted hashing for account passwords.",
      "• Strict Content Security Policy (CSP), anti-CSRF token verification, and automated IP rate-limiting to defend against brute-force and cross-site scripting attacks.",
    ],
  },
  {
    id: "rights",
    title: "6. Your Rights (GDPR, CCPA & Global Rights)",
    badge: "Compliance",
    body: [
      "Regardless of where you live, you have complete sovereignty over your information:",
      "• Right to Access & Export: You can view, copy, and export your entire prompt library and version history at any time.",
      "• Right to Rectification: You can edit and update your profile information and saved credentials anytime in Settings.",
      "• Right to Erasure (Account Deletion): You can permanently delete your entire account, prompt library, API keys, and all associated database records with one click in Dashboard Settings. Deletion is instantaneous and permanent.",
      "• Right to Withdraw Cookie Consent: You can update or revoke cookie choices at any time using the Cookie Preferences manager.",
    ],
  },
  {
    id: "contact",
    title: "7. Contact & Inquiries",
    badge: "Support",
    body: [
      "If you have any questions, privacy inquiries, or data access requests regarding this Privacy Policy, please contact our team directly at promptplus2@gmail.com.",
      "We respond to all verified inquiries within 24–48 hours.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={22} />
        </Link>
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            onClick={openCookiePreferences}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/60 hover:bg-accent text-foreground transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>Manage Cookie Choices</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-border/40 bg-card/30 py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Privacy-First Prompt Engineering</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Effective Date: August 27, 2026 · Version 2.4.0. We believe your ideas belong to you. Learn how Prompt+ protects your data, on-device AI operations, and cookie choices.
          </p>

          {/* Quick Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 flex items-center gap-2.5 text-xs">
              <EyeOff className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-foreground">Zero AI Training</strong>
                <span className="text-muted-foreground text-[11px]">Prompts never train models</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 flex items-center gap-2.5 text-xs">
              <Cpu className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <strong className="block text-foreground">On-Device Nano</strong>
                <span className="text-muted-foreground text-[11px]">100% private offline AI</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 flex items-center gap-2.5 text-xs">
              <Lock className="h-4 w-4 text-primary shrink-0" />
              <div>
                <strong className="block text-foreground">AES-256 GCM Vault</strong>
                <span className="text-muted-foreground text-[11px]">Client keys encrypted at rest</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 sm:p-10">
        {/* Interactive Cookie Control Callout */}
        <div className="mb-10 p-5 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <Cookie className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Interactive Cookie & Privacy Manager</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can accept all, reject non-essential cookies, or fine-tune individual analytics preferences at any time.
              </p>
            </div>
          </div>
          <button
            onClick={openCookiePreferences}
            type="button"
            className="shrink-0 h-9 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
          >
            Adjust Cookie Choices
          </button>
        </div>

        {/* Policy Sections */}
        <div className="space-y-10">
          {privacySections.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm scroll-mt-24 space-y-4"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  {sec.title}
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  {sec.badge}
                </span>
              </div>
              <div className="space-y-3">
                {sec.body.map((paragraph, idx) => (
                  <p key={idx} className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>Prompt+ Legal & Compliance Department</span>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service →
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-foreground">
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
