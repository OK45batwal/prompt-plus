"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import {
  Scale,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";

const termsSections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms & Eligibility",
    badge: "Agreement",
    body: [
      "These Terms of Service (\"Terms\") constitute a legally binding agreement between you (\"User\", \"you\") and Prompt+ (\"we\", \"our\", \"us\"), governing your access to and use of our prompt engineering platform, web application (prompt-plus-three.vercel.app), browser extension, APIs, and associated tools (collectively, the \"Service\").",
      "By creating an account, selecting 'I agree', installing our Chrome extension, or accessing the Service, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must immediately discontinue use of the Service.",
      "You represent that you are at least 13 years of age (or the minimum legal age required in your country) to enter into a binding contract.",
    ],
  },
  {
    id: "services",
    title: "2. Description of Service & AI Architectures",
    badge: "Platform Scope",
    body: [
      "Prompt+ provides advanced prompt engineering, meta-compilation, automated scoring, side-by-side model comparisons, context memory management, and cross-AI synchronization across platforms like ChatGPT, Claude, Gemini, and DeepSeek.",
      "The Service operates across two primary technical architectures:",
      "• On-Device Mode: Executes client-side prompt optimization locally in your browser using Chrome's built-in Gemini Nano model without transmitting prompt data to external servers.",
      "• Cloud AI Mode: Dispatches prompt payloads to your configured third-party AI provider API or our standard serverless models to generate enhanced specifications.",
    ],
  },
  {
    id: "ownership",
    title: "3. User Prompt Ownership & Commercial Rights",
    badge: "100% Your IP",
    body: [
      "• Full Ownership of Your Prompts: You retain 100% ownership, copyright, and intellectual property rights to all raw prompts, customized instructions, context memories, and system templates that you input into Prompt+ (\"Your Content\").",
      "• Full Commercial Rights to Outputs: You hold complete rights to use, modify, publish, integrate, monetize, and commercially exploit any prompt specifications and AI outputs generated through Prompt+.",
      "• Limited Operational License: You grant Prompt+ only a narrow, non-exclusive, royalty-free license to transmit, format, and display your prompts solely as necessary to provide the Service to you (e.g. generating enhanced versions or creating shareable links when requested).",
      "• Zero Model Training: We will never use your prompts or outputs to train or fine-tune public or private AI models.",
    ],
  },
  {
    id: "accounts",
    title: "4. Account Security & Verification",
    badge: "Authentication",
    body: [
      "To access persistent workspaces and library sync, you must register with a valid email address and verify ownership via our 6-digit cryptographic OTP system.",
      "You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately at promptplus2@gmail.com upon discovering any unauthorized account access.",
      "You can permanently close your account at any time in Settings, which initiates immediate, irreversible deletion of all stored prompts, API keys, and account metadata.",
    ],
  },
  {
    id: "acceptable-use",
    title: "5. Acceptable Use Policy",
    badge: "Prohibited Actions",
    body: [
      "You agree to use Prompt+ ethically, lawfully, and responsibly. You expressly agree not to:",
      "• Use the Service to generate, promote, or distribute illegal material, child exploitation, malware, phishing exploits, hate speech, violent extremism, or targeted harassment.",
      "• Interfere with, overload, or attempt to bypass platform rate-limits, anti-CSRF protections, or database connection safeguards.",
      "• Reverse engineer, decompile, or harvest proprietary application source code or scraping endpoints without explicit written authorization.",
      "• Use automated scripts or bots to exhaust free-tier server resources or disrupt service availability for other users.",
    ],
  },
  {
    id: "ai-disclaimer",
    title: "6. AI Output Disclaimer & Verification",
    badge: "Important Notice",
    body: [
      "AI models are probabilistic systems that can occasionally generate inaccurate, outdated, incomplete, or biased information. Prompt+ provides prompt optimization tools, but does not guarantee the accuracy, truthfulness, or legal fitness of any AI-generated response.",
      "You are solely responsible for independently reviewing and validating any AI output before deploying it in critical commercial, financial, medical, legal, or production environments.",
    ],
  },
  {
    id: "api-vault",
    title: "7. Third-Party API Keys & Encryption",
    badge: "AES-256 Vault",
    body: [
      "Prompt+ allows you to bring your own API keys (OpenAI, Anthropic, OpenRouter, NVIDIA). When stored, your keys are encrypted at rest with AES-256-GCM. We never expose your plaintext keys in client bundles.",
      "You are responsible for managing your third-party API provider accounts, quotas, and any associated costs incurred by your keys.",
    ],
  },
  {
    id: "liability",
    title: "8. Limitation of Liability & Warranty Disclaimers",
    badge: "Legal Limitations",
    body: [
      "THE SERVICE IS PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROMPT+ AND ITS OPERATORS DISCLAIM ALL WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.",
      "IN NO EVENT SHALL PROMPT+ BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF REVENUE, PROFITS, OR DATA ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.",
    ],
  },
  {
    id: "governing-law",
    title: "9. Governing Law & Dispute Resolution",
    badge: "Jurisdiction",
    body: [
      "These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.",
    ],
  },
  {
    id: "contact",
    title: "10. Contact & Support",
    badge: "Contact",
    body: [
      "For questions regarding these Terms or legal inquiries, reach out to our team at promptplus2@gmail.com. We are committed to responding promptly to all inquiries.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={22} />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Hero Banner */}
      <div className="border-b border-border/40 bg-card/30 py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Scale className="h-3.5 w-3.5" />
            <span>Fair & Transparent Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Effective Date: August 27, 2026 · Version 2.4.0. Clear rules, 100% intellectual property ownership of your prompts, and transparent usage guidelines.
          </p>

          {/* Quick Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-foreground">100% Your IP</strong>
                <span className="text-muted-foreground text-[11px]">Full commercial rights to prompts</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 flex items-center gap-2.5 text-xs">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <div>
                <strong className="block text-foreground">Zero Model Training</strong>
                <span className="text-muted-foreground text-[11px]">Your data is never exploited</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 flex items-center gap-2.5 text-xs">
              <Lock className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <strong className="block text-foreground">Encrypted API Vault</strong>
                <span className="text-muted-foreground text-[11px]">AES-256 protected credentials</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 sm:p-10">
        <div className="space-y-10">
          {termsSections.map((sec) => (
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
          <span>Prompt+ Legal Department</span>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy →
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
