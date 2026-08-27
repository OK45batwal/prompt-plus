import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    body: [
      "This Privacy Policy explains what Prompt+ (\"we\", \"our\", \"us\") collects, why we collect it, how we use it, and the choices and rights you have. By creating an account or using the Prompt+ website, extension, or API, you agree to this policy.",
      "Prompt+ is built on a privacy-first architecture: we never sell user data, and we offer a fully on-device processing mode that can work without your data ever leaving your browser.",
    ],
  },
  {
    id: "collect",
    title: "2. Information We Collect",
    body: [
      "We collect only the information needed to run the service. Here is a complete, itemized list.",
      "2.1 Account information. When you sign up we collect: your email address; a name if you provide one; an avatar if you provide one; a password (stored only as a bcrypt hash — we cannot read or recover it); and, if you sign in with GitHub or Google, the OAuth account identifier and any profile data that provider shares with us.",
      "2.2 Prompt content and history. When you use the enhancement, scoring, or analysis features and are signed in, we store: the original prompt text; the enhanced output; quality score and analysis breakdowns; model, category, tone, and length metadata; version history of each prompt; collections and tags you create; and any prompts you choose to share (see Section 7).",
      "2.3 API keys (optional). If you choose to bring your own API key, we store an encrypted copy on our servers using AES-256-GCM, along with the provider, last-used timestamp, and usage count. A copy may also be held in your browser's local storage so the extension can use it without a round-trip.",
      "2.4 Usage and analytics data. For authenticated requests we record: the action performed (e.g., enhance, score, compare), the model and provider used, input/output token counts, latency, and success/failure — tied to your account. We also use Vercel Analytics and Speed Insights, which collect aggregate, privacy-friendly traffic and performance statistics (no personal identifiers).",
      "2.5 Device-local data. The following stay in your browser and are never sent to our servers: your context-memory blocks, API key vault, local prompt history, UI preferences, search history, theme choice, and sidebar state (via localStorage).",
      "2.6 IP addresses and rate limiting. To prevent abuse and enforce fair-use limits, we may process your IP address transiently. This is held in server memory only, expires automatically, and is not stored or retained.",
      "2.7 Email. If you sign up with an email/password account, we send you verification codes (OTP) via email. We keep a record of your email address and verification state to operate your account.",
    ],
  },
  {
    id: "use",
    title: "3. How We Use Your Data",
    body: [
      "We use collected information only for the following purposes:",
      "· To operate, maintain, and improve the service (enhancement, scoring, comparisons, library, collections, and sharing).",
      "· To authenticate you and secure your account.",
      "· To track usage for fair-use protection, diagnostics, and service reliability.",
      "· To send you service-related emails you request (e.g., verification codes, password resets).",
      "· To display aggregate, non-identifying statistics for our own analytics.",
      "We never sell, rent, or monetize your personal data or prompt content. We never use your prompts to train AI models.",
    ],
  },
  {
    id: "modes",
    title: "4. On-Device vs. API Processing — When Your Data Leaves Your Browser",
    body: [
      "Prompt+ offers two enhancement modes, and they differ in where your prompt text goes:",
      "On-Device mode uses Chrome's built-in Gemini Nano and runs entirely in your browser. Your prompt text is processed locally and never transmitted to our servers or any third party.",
      "API mode sends your prompt text to our server, which forwards it to the AI provider you select (or the free server model) solely to generate the enhanced output. The prompt is processed for that request and is not used for training.",
      "In both modes, the enhanced result is returned to you. We do not log prompt content in API mode beyond what is necessary to deliver the request and, when you are signed in, the history you explicitly keep.",
    ],
  },
  {
    id: "sharing",
    title: "5. Third-Party Processors",
    body: [
      "We share data only with the processors required to deliver the service, and only to the extent necessary:",
      "· AI providers (OpenAI, Anthropic, OpenRouter, NVIDIA) — receive prompt text for enhancement/comparison only in API mode, under their own terms and privacy policies.",
      "· Hosting and infrastructure (Vercel) — servers, logs for security, and delivery.",
      "· Email delivery (SMTP provider or Resend) — to send verification codes and password resets.",
      "· Analytics (Vercel Analytics, Speed Insights) — aggregate, privacy-friendly metrics.",
      "Each processor is bound by its own privacy commitments; we require data minimization and prohibit any sale or use of your data for their own purposes.",
    ],
  },
  {
    id: "cookies",
    title: "6. Cookies & Local Storage",
    body: [
      "We use a single session cookie to keep you signed in. It is httpOnly, SameSite=Lax, transmitted over HTTPS, and expires after 30 days. We do not use advertising or tracking cookies.",
      "We use localStorage in your browser for preferences, local history, context blocks, and your API key vault. This data stays on your device unless you sign in and explicitly save content to your account.",
    ],
  },
  {
    id: "share-links",
    title: "7. Public Sharing",
    body: [
      "If you use the \"share\" feature on a prompt, we generate a unique, unguessable link. Anyone with that link can view the prompt. Shared prompts are public by design — do not share sensitive content. You can remove a shared prompt at any time, which invalidates the link.",
    ],
  },
  {
    id: "retention",
    title: "8. Data Retention & Deletion",
    body: [
      "We retain your account data while your account is active so that your library, history, and settings work as expected.",
      "You can delete individual prompts, versions, collections, and your stored API keys at any time from the dashboard. You can also close your account with one click in Settings. Account closure permanently deletes your account record and, by cascade, all prompts, versions, collections, stored API keys, usage logs, and analytics tied to it. This deletion is immediate and cannot be undone.",
      "If you have not signed in, your prompts are kept only in your browser's localStorage and can be cleared by clearing your browser data.",
    ],
  },
  {
    id: "security",
    title: "9. Data Security",
    body: [
      "We protect your data with: HTTPS everywhere; passwords hashed with bcrypt; API keys encrypted at rest with AES-256-GCM using a server-side secret; rate limiting and CSRF/session protection on all mutating endpoints; and the principle of least privilege on infrastructure.",
      "No method of transmission or storage is 100% secure. While we work hard to protect your data, we cannot guarantee absolute security.",
    ],
  },
  {
    id: "rights",
    title: "10. Your Rights",
    body: [
      "Depending on your jurisdiction (including under GDPR, CCPA, and similar laws), you may have the right to: access a copy of your data; correct inaccurate data; delete your data; export your data (e.g., copy your prompts); object to or restrict certain processing; and withdraw consent. You can exercise most of these directly in the dashboard (export/copy, edit, delete) or by contacting us — we respond to all verified requests within 30 days.",
      "We do not engage in \"sale\" or \"sharing\" of personal information as defined by the CCPA, and we do not use your data for advertising or profiling.",
    ],
  },
  {
    id: "children",
    title: "11. Children's Privacy",
    body: [
      "Prompt+ is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us personal information, contact us and we will delete it.",
    ],
  },
  {
    id: "transfers",
    title: "12. International Data Transfers",
    body: [
      "Prompt+ is hosted on infrastructure that may process data in regions outside your country of residence. By using the service, you acknowledge that your data may be transferred to and processed in countries where data-protection laws may differ from your jurisdiction. We rely on standard contractual clauses and equivalent safeguards where applicable.",
    ],
  },
  {
    id: "changes",
    title: "13. Changes to This Policy",
    body: [
      "We may update this policy from time to time. Material changes will be announced on this page with an updated date at the top. Continued use of the service after changes take effect constitutes acceptance of the revised policy.",
    ],
  },
  {
    id: "contact",
    title: "14. Contact",
    body: [
      "For any privacy questions, data requests, or concerns, contact us at promptplus2@gmail.com. We aim to respond within 48 hours.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center px-4 border-b">
        <Link href="/"><Logo size={20} /></Link>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full p-6 sm:p-10">
        <h1 className="text-2xl font-bold text-foreground mb-1">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mb-8">Last updated: August 3, 2026 · Applies to prompt-plus-three.vercel.app and the Prompt+ Chrome extension</p>

        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.id}>
              <h2 className="text-lg font-semibold text-foreground mb-3">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{p}</p>
              ))}
            </section>
          ))}
        </div>

        <p className="text-xs mt-10 border-t pt-4 text-muted-foreground">
          Read our <Link href="/terms" className="text-primary hover:underline font-medium">Terms of Service</Link>.
        </p>
      </main>
    </div>
  );
}
