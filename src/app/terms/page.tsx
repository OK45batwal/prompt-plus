import Link from "next/link";
import {
  ShieldCheck,
  Scale,
  Lock,
  Cpu,
  FileText,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { LiveBackground } from "@/components/ui/live-background";
import { Logo } from "@/components/ui/logo";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of These Terms",
    body: [
      'These Terms of Service ("Terms") govern your access to and use of Prompt+ (the "Service"), including the website, the Chrome extension, and the API. By creating an account, installing the extension, or using any part of the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.',
      "If you use the Service on behalf of an organization, you represent that you have authority to bind that organization and agree to these Terms on its behalf.",
    ],
  },
  {
    id: "service",
    title: "2. Description of the Service",
    body: [
      "Prompt+ is an AI prompt-engineering tool that helps you write, enhance, score, compare, organize, and reuse prompts for third-party AI models. Depending on the mode you choose, enhancement may run on-device in your browser (using Chrome's built-in Gemini Nano) or through our servers and third-party AI providers.",
    ],
  },
  {
    id: "accounts",
    title: "3. Accounts & Security",
    body: [
      "You may use certain features without an account. To use the full service, you must create an account with a valid email address and agree to these Terms.",
      "You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must notify us immediately at promptplus2@gmail.com if you suspect unauthorized use of your account.",
      "You may close your account at any time. Closure permanently deletes your account and all associated data, as described in our Privacy Policy.",
    ],
  },
  {
    id: "acceptance-use",
    title: "4. Acceptable Use Policy",
    body: [
      "You agree not to use the Service to:",
      "· Violate any applicable law or regulation, or the rights of any third party (including intellectual property and privacy rights).",
      "· Generate, store, share, or solicit content that is unlawful, harmful, hateful, harassing, defamatory, obscene, or that promotes violence, discrimination, or exploitation of minors.",
      "· Misuse AI outputs to deceive, defraud, spread misinformation, create malware, or otherwise cause harm.",
      "· Attempt to gain unauthorized access to the Service, other users' accounts or data, or our systems, or to bypass rate limits, security controls, or fair-use protections.",
      "· Reverse engineer, decompile, or scrape the Service beyond what is necessary for normal use, or resell access to the Service without our written permission.",
      "· Interfere with or disrupt the Service or the servers and networks connected to it.",
      "We may suspend or terminate accounts that violate these rules. We also apply automated rate limiting to protect the free Service; deliberate attempts to evade it are a violation of these Terms.",
    ],
  },
  {
    id: "content",
    title: "5. Your Content and Your Prompts",
    body: [
      'You retain all rights to the prompts and other content you submit to the Service ("Your Content"). You grant us a limited, non-exclusive, worldwide, royalty-free license to process, store, and display Your Content solely to provide and operate the Service (for example, to generate enhanced output or power a shared link).',
      "You represent and warrant that you own or have the necessary rights to Your Content, and that Your Content does not violate any law or any third party's rights.",
      'When you enable the "share" feature, the shared prompt becomes accessible to anyone with the link. Do not share content you expect to remain private.',
      "We do not claim ownership of AI-generated output, but you are solely responsible for how you use it.",
    ],
  },
  {
    id: "ai-output",
    title: "6. AI Output Disclaimer",
    body: [
      'AI-generated outputs can be inaccurate, incomplete, biased, or outdated. AI models may "hallucinate" facts. The Service does not guarantee the correctness, safety, or fitness of any output for any purpose.',
      "You are solely responsible for verifying AI output before relying on it, especially for professional, medical, legal, financial, security, or other consequential decisions. You must not use the Service to provide professional advice in regulated fields.",
    ],
  },
  {
    id: "third-party",
    title: "7. Third-Party Models, API Keys, and Services",
    body: [
      "The Service integrates with third-party AI providers (including OpenAI, Anthropic, OpenRouter, and NVIDIA) and third-party platforms (including ChatGPT, Claude, Gemini, and others). These providers and platforms are not affiliated with us, and their use is governed by their own terms and privacy policies, not ours.",
      "If you provide your own API key, you are responsible for managing that key and for any usage or cost incurred through it. Keys are encrypted at rest on our servers and may also be stored in your browser. You may revoke or delete a stored key at any time. You must keep keys secret and must not share them with third parties through the Service.",
      "We are not responsible for the availability, behavior, or output of any third-party service you use with Prompt+.",
    ],
  },
  {
    id: "ip",
    title: "8. Intellectual Property",
    body: [
      "The Prompt+ software, trademarks, branding, and visual design are proprietary property owned by Prompt+ and may not be copied, reproduced, or distributed without our prior written consent.",
      "Nothing in these Terms transfers ownership of any of our intellectual property to you. The Service, its content, and its code remain our property (or that of our licensors).",
    ],
  },
  {
    id: "privacy",
    title: "9. Privacy",
    body: [
      "Our data practices, including exactly what information we collect and how to delete it, are described in our Privacy Policy, which is incorporated into these Terms by reference.",
    ],
  },
  {
    id: "warranties",
    title: "10. Disclaimer of Warranties",
    body: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT AI OUTPUTS WILL BE ACCURATE OR RELIABLE.',
    ],
  },
  {
    id: "liability",
    title: "11. Limitation of Liability",
    body: [
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL PROMPT+ OR ITS OPERATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, DATA, REVENUE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
      "OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF ONE HUNDRED US DOLLARS ($100) OR THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN LIABILITIES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.",
    ],
  },
  {
    id: "indemnification",
    title: "12. Indemnification",
    body: [
      "You agree to defend, indemnify, and hold harmless Prompt+ and its operators, contributors, and affiliates from and against any claims, damages, liabilities, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Service, your violation of these Terms, your violation of any law, or your infringement of any third-party rights.",
    ],
  },
  {
    id: "termination",
    title: "13. Termination",
    body: [
      "You may stop using the Service and close your account at any time. We may suspend or terminate your access to the Service at any time, with or without notice, if you violate these Terms, if we suspect fraud or abuse, or as required by law.",
      "Sections that by their nature should survive termination (including Sections 6, 8, 10, 11, and 12) will survive any termination of these Terms.",
    ],
  },
  {
    id: "changes",
    title: "14. Changes to These Terms",
    body: [
      "We may revise these Terms from time to time. We will post the updated Terms on this page and update the date above. Material changes take effect 14 days after posting for existing users, unless required sooner by law. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms.",
    ],
  },
  {
    id: "law",
    title: "15. Governing Law and Disputes",
    body: [
      "These Terms are governed by the laws of India, without regard to conflict-of-law principles. You agree that any dispute arising out of or relating to these Terms or the Service will be resolved in the competent courts of India. Where required by law, nothing in this section limits rights you cannot contractually waive, including consumer protections.",
    ],
  },
  {
    id: "severability",
    title: "16. Severability",
    body: [
      "If any provision of these Terms is held to be invalid or unenforceable, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.",
    ],
  },
  {
    id: "contact",
    title: "17. Contact Information",
    body: [
      "Questions about these Terms? Contact our legal and engineering team at promptplus2@gmail.com. We aim to respond within 48 hours.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-background text-foreground">
      {/* Dynamic Live Background */}
      <LiveBackground className="opacity-90 dark:opacity-85" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <MarketingNav />

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 w-full space-y-10">
          {/* Header Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-medium tracking-wide">
              <Scale className="h-3.5 w-3.5" />
              <span>LEGAL SPECIFICATION &amp; USER AGREEMENT</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Last updated: August 2026 · Effective for the Prompt+ web application, Chrome extension, and developer API.
            </p>
          </div>

          {/* Key Commitments Highlights Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>100% User Ownership</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You retain full rights to your original prompts and generated outputs.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                <Lock className="h-4 w-4" />
                <span>Zero Model Training</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We never use your prompt history or private inputs to train AI models.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                <Cpu className="h-4 w-4" />
                <span>On-Device Privacy</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gemini Nano runs locally in-browser — zero data leaves your machine.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                <Scale className="h-4 w-4" />
                <span>Encrypted Vaults</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bring-Your-Own API keys are protected with AES-256-GCM encryption.
              </p>
            </div>
          </div>

          {/* Two-Column Layout: Sticky Navigation + Main Legal Text */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sticky Table of Contents (4 Cols) */}
            <aside className="hidden lg:block lg:col-span-4 sticky top-24 p-5 rounded-3xl border border-border/80 dark:border-white/10 bg-card/80 backdrop-blur-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                <FileText className="h-4 w-4 text-cyan-500" />
                <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Document Sections
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
                  <span>Contact Legal Team</span>
                </a>
              </div>
            </aside>

            {/* Right Legal Content (8 Cols) */}
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

              {/* Bottom Privacy Crosslink Banner */}
              <div className="p-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="font-semibold text-sm text-foreground">Need to know how we protect your data?</p>
                  <p className="text-xs text-muted-foreground">
                    Review our detailed, itemized Data Architecture &amp; Privacy Policy.
                  </p>
                </div>
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-all shrink-0"
                >
                  <span>Read Privacy Policy</span>
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
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground font-semibold text-cyan-500 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
