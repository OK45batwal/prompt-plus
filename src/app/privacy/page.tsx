import Link from "next/link";
import {
  Shield,
  Lock,
  Cpu,
  Trash2,
  Database,
  FileCheck,
  ArrowRight,
  HelpCircle,
  EyeOff,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { LiveBackground } from "@/components/ui/live-background";
import { Logo } from "@/components/ui/logo";

const sections = [
  {
    id: "overview",
    title: "1. Overview & Privacy Principles",
    body: [
      'This Privacy Policy explains what Prompt+ ("we", "our", "us") collects, why we collect it, how we use it, and the choices and rights you have. By creating an account or using the Prompt+ website, extension, or API, you agree to this policy.',
      "Prompt+ is built on a privacy-first engineering architecture: we never sell user data, and we offer a fully on-device processing mode that functions without your prompts ever leaving your browser.",
    ],
  },
  {
    id: "collect",
    title: "2. Information We Collect",
    body: [
      "We collect only the minimum telemetry and content required to operate the service. Here is an itemized specification:",
      "2.1 Account Information: Email address; name (if provided); avatar URL (if provided); password (stored strictly as a salted bcrypt hash — we cannot read or recover plaintext passwords); and OAuth provider identifiers if signing in via GitHub or Google.",
      "2.2 Prompt Content & Library: When signed in, saved prompts, enhanced iterations, quality score benchmarks, and category/model tags are stored in your private account library.",
      "2.3 API Keys Vault: When using Bring-Your-Own-Key mode, keys are encrypted at rest using AES-256-GCM with authenticated tags. Keys are decrypted exclusively in memory during active inference requests and can be revoked or erased at any moment.",
      "2.4 Usage & Performance Logs: Action type (enhance, score, compare), provider model invoked, token count estimates, and latency metrics to enforce fair-use limits and verify billing integrity.",
      "2.5 Device-Local Storage: Preferences, temporary sandbox history, context-memory blocks, and active UI states reside strictly inside your browser's localStorage and are never sent to our servers.",
      "2.6 Ephemeral IP Rate-Limiting: IP addresses are inspected transiently in server memory to mitigate DDoS and brute-force attacks. They are automatically flushed and never permanently logged.",
    ],
  },
  {
    id: "use",
    title: "3. How We Use Your Data",
    body: [
      "We use collected information solely for the following explicit functions:",
      "· To execute prompt optimizations, multi-model comparisons, and library persistence.",
      "· To authenticate your sessions and protect your account against unauthorized access.",
      "· To enforce fair-use tier limits and maintain high API service reliability.",
      "· To deliver transactional security emails (such as email verification codes and password reset tokens).",
      "We never sell, rent, or monetize your personal data. We never feed your private prompts into AI training pipelines.",
    ],
  },
  {
    id: "modes",
    title: "4. On-Device vs. Cloud API Processing",
    body: [
      "Prompt+ provides two distinct architectural execution modes with different data paths:",
      "· On-Device Mode (Gemini Nano): Executes 100% locally inside your Google Chrome runtime. Your prompt text, system instructions, and generated output never traverse any network socket or cloud server.",
      "· Cloud API Mode: Transmits prompt text over TLS 1.3 to our edge proxies solely to request inference from your chosen provider (OpenAI, Anthropic, Google, or DeepSeek) or our deterministic engine. Content is processed in-flight and not retained for model training.",
    ],
  },
  {
    id: "processors",
    title: "5. Third-Party Sub-Processors",
    body: [
      "We partner only with verified infrastructure providers under strict confidentiality agreements:",
      "· AI Model Providers (OpenAI, Anthropic, Google Cloud, DeepSeek, OpenRouter) — receive prompt payloads in API mode strictly to synthesize responses.",
      "· Hosting & Edge Infrastructure (Vercel) — edge functions, secure CDN, and TLS termination.",
      "· Database Infrastructure (Neon / PostgreSQL) — encrypted relational storage for account records.",
      "· Email Gateways (Resend / SMTP) — automated transactional email delivery.",
      "All sub-processors are legally prohibited from utilizing customer data for advertising or cross-context tracking.",
    ],
  },
  {
    id: "cookies",
    title: "6. Cookies & Client-Side Storage",
    body: [
      "Prompt+ utilizes an httpOnly, SameSite=Lax session cookie over secure HTTPS for authentication state. We do not embed advertising, tracking, or marketing cookies.",
      "Your browser's localStorage stores your UI theme, active model preferences, and extension cache. You can wipe this state at any time by clearing your browser cache.",
    ],
  },
  {
    id: "retention",
    title: "7. Data Retention & Account Erasure",
    body: [
      "We retain account records only while your account remains active. You maintain total administrative control:",
      "You can individually delete prompts, revision versions, and API keys from your dashboard. Closing your account triggers an immediate cascade deletion that permanently purges all prompts, tokens, usage logs, and account records across our databases. This action is instantaneous and irreversible.",
    ],
  },
  {
    id: "security",
    title: "8. Security Engineering Controls",
    body: [
      "Our defense-in-depth security model encompasses:",
      "· Mandatory HTTPS encryption with modern cipher suites.",
      "· AES-256-GCM envelope encryption for sensitive credentials and API tokens.",
      "· Bcrypt password hashing with high work factors.",
      "· Rate-limiting safeguards, CSRF anti-forgery tokens, and constant-time auth comparison routines.",
    ],
  },
  {
    id: "rights",
    title: "9. Global Rights (GDPR, CCPA & Global Regs)",
    body: [
      "Regardless of geographic location, Prompt+ affords all users equal privacy rights:",
      "· Right to Access: View and review all prompts and profile metadata stored in your account.",
      "· Right to Portability: Export your prompt catalog into code snippets (Python, TypeScript, cURL) with a single click.",
      "· Right to Rectification: Modify or update your prompt library and credentials at any time.",
      "· Right to Erasure: Instantly trigger permanent deletion of your complete digital footprint.",
      "We respond to all verified privacy inquiries within 30 days.",
    ],
  },
  {
    id: "contact",
    title: "10. Privacy Officer & Contact Information",
    body: [
      "For privacy assessments, data subject requests, or security inquiries, email promptplus2@gmail.com. Our security team reviews every message within 48 business hours.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background text-foreground">
      {/* Dynamic Live Background */}
      <LiveBackground className="opacity-90 dark:opacity-85" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <MarketingNav />

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 w-full space-y-12">
          {/* Header Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-medium tracking-wide">
              <Shield className="h-3.5 w-3.5" />
              <span>PRIVACY-FIRST ENGINEERING SPECIFICATION</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              We treat privacy as an engineering constraint, not a legal afterthought.
              Explore our itemized data matrix and zero-sale guarantee.
            </p>
          </div>

          {/* Key Privacy Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                <EyeOff className="h-4 w-4" />
                <span>Zero Data Reselling</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We never sell, rent, or broker your personal information or prompt texts.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                <Cpu className="h-4 w-4" />
                <span>Local-First Nano Mode</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enhance prompts entirely on-device with zero cloud server communication.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                <Lock className="h-4 w-4" />
                <span>AES-256-GCM Vault</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bring-Your-Own API keys are encrypted at rest with authenticated tags.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                <Trash2 className="h-4 w-4" />
                <span>Instant 1-Click Purge</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Account closure immediately wipes your records across all relational tables.
              </p>
            </div>
          </div>

          {/* Interactive Data Lifecycle Matrix */}
          <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card/85 backdrop-blur-xl p-6 sm:p-7 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Database className="h-4 w-4 text-cyan-500" />
              <h2 className="font-bold text-sm tracking-tight">Data Handling Architecture At a Glance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-muted/40 uppercase font-semibold text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="py-2.5 px-3">Data Category</th>
                    <th className="py-2.5 px-3">Storage Location</th>
                    <th className="py-2.5 px-3">Encryption</th>
                    <th className="py-2.5 px-3">AI Model Training</th>
                    <th className="py-2.5 px-3 text-right">Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-foreground">Account Credentials</td>
                    <td className="py-3 px-3 text-muted-foreground">PostgreSQL Database</td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">Bcrypt Salted Hash</td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">Never (0%)</td>
                    <td className="py-3 px-3 text-right text-muted-foreground">Until account deletion</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-foreground">On-Device Prompts (Nano)</td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">Browser Device Only</td>
                    <td className="py-3 px-3 text-muted-foreground">Sandbox Isolated</td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">Never (0%)</td>
                    <td className="py-3 px-3 text-right text-muted-foreground">Local cache only</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-foreground">Saved Cloud Library</td>
                    <td className="py-3 px-3 text-muted-foreground">Encrypted Database</td>
                    <td className="py-3 px-3 text-cyan-600 dark:text-cyan-400">TLS 1.3 / In-Rest</td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">Never (0%)</td>
                    <td className="py-3 px-3 text-right text-muted-foreground">User-managed / Delete anytime</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-foreground">Provider API Keys</td>
                    <td className="py-3 px-3 text-muted-foreground">Encrypted Key Vault</td>
                    <td className="py-3 px-3 text-cyan-600 dark:text-cyan-400">AES-256-GCM</td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">Never (0%)</td>
                    <td className="py-3 px-3 text-right text-muted-foreground">Revoke anytime</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Two-Column Layout: Sticky Navigation + Main Privacy Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sticky Table of Contents (4 Cols) */}
            <aside className="hidden lg:block lg:col-span-4 sticky top-24 p-5 rounded-3xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                <FileCheck className="h-4 w-4 text-cyan-500" />
                <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Policy Sections
                </h2>
              </div>
              <nav aria-label="Table of contents" className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 text-xs">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block py-1.5 px-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors truncate"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
              <div className="pt-3 border-t border-border/50">
                <a
                  href="mailto:promptplus2@gmail.com"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border/80 bg-background/80 hover:bg-accent text-xs font-medium text-foreground transition-all"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-cyan-500" />
                  <span>Contact Privacy Team</span>
                </a>
              </div>
            </aside>

            {/* Right Detailed Sections (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {sections.map((s) => (
                <section
                  key={s.id}
                  id={s.id}
                  className="p-6 sm:p-7 rounded-3xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-xl shadow-xs space-y-3.5 scroll-mt-28"
                >
                  <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>{s.title}</span>
                  </h2>
                  <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {s.body.map((p, i) => (
                      <p key={i} className="leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              ))}

              {/* Bottom Terms Crosslink Banner */}
              <div className="p-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="font-semibold text-sm text-foreground">Need to review our terms of use?</p>
                  <p className="text-xs text-muted-foreground">
                    Check our full user rights, intellectual property, and service agreements.
                  </p>
                </div>
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-all shrink-0"
                >
                  <span>Terms of Service</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Global Footer */}
        <footer className="py-12 px-4 sm:px-6 border-t border-border/50 bg-background/80 backdrop-blur-xl mt-auto">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <Link href="/" className="hover:opacity-90 transition-opacity">
                <Logo size={20} />
              </Link>
              <span>© {new Date().getFullYear()} Prompt+ Architect AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/prompt-engineering-guide" className="hover:text-foreground transition-colors">
                Guide
              </Link>
              <Link href="/prompt-cost-calculator" className="hover:text-foreground transition-colors">
                Cost Calculator
              </Link>
              <Link href="/privacy" className="hover:text-foreground font-semibold text-cyan-500 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
