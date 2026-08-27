"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import {
  Lock,
  EyeOff,
  Cpu,
  Cookie,
  ArrowLeft,
  SlidersHorizontal,
  Globe2,
  Building2,
  Scale,
  FileCheck2,
} from "lucide-react";
import { openCookiePreferences } from "@/components/ui/cookie-banner";

type RegionKey = "global" | "eu" | "us" | "india" | "apac_latam";

interface PrivacySection {
  id: string;
  title: string;
  badge: string;
  body: string[];
}

const globalSections: PrivacySection[] = [
  {
    id: "overview",
    title: "1. Global Privacy Charter & Core Principles",
    badge: "Core Charter",
    body: [
      "This Privacy Policy governs the processing of personal data and digital inputs by Prompt+ (\"we\", \"our\", \"us\") across the web application (prompt-plus-three.vercel.app), Chrome browser extension, and related APIs.",
      "Prompt+ is architected from the ground up on three immutable principles:",
      "• Zero Data Commercialization: We do not sell, rent, monetize, broker, or trade user data, prompt text, or AI outputs under any circumstances.",
      "• Zero AI Model Training: Your raw prompts, customized instructions, context memories, and enhanced outputs are NEVER utilized to train, fine-tune, or benchmark public or proprietary foundation models.",
      "• On-Device Processing Option: Users have access to 100% local, client-side execution via Chrome 138+ Gemini Nano, allowing prompts to be optimized entirely within browser sandbox memory without network transmission.",
    ],
  },
  {
    id: "collection",
    title: "2. Itemized Information Collection",
    badge: "Data Inventory",
    body: [
      "We practice strict data minimization and collect only the minimum necessary data points:",
      "2.1 Account Credentials: Email address, optional display name, and password hash (encrypted via bcrypt with 12 computational rounds — plaintext passwords cannot be decrypted or viewed by Prompt+ staff). For Google or GitHub OAuth users, we receive only provider unique IDs and verified email addresses.",
      "2.2 Workspace Content (Authenticated Users): Saved prompt templates, iterative revision history, 6-pillar quality scores, and workspace collections stored in encrypted PostgreSQL database partitions.",
      "2.3 API Key Vault (Optional): User-provided API keys (OpenAI, Anthropic, OpenRouter, NVIDIA) are encrypted at rest using AES-256-GCM authenticated cipher with hardware-isolated server encryption keys.",
      "2.4 Ephemeral Server Telemetry: Ephemeral request metrics (timestamp, execution latency, estimated token count, and HTTP response status) are retained temporarily in volatile server memory for DDoS protection and automatically rotated.",
      "2.5 Device-Local Data: Context memory buckets, scratchpad drafts, UI preferences, and theme choices are stored strictly in client browser localStorage.",
    ],
  },
  {
    id: "cookies",
    title: "3. Transparent Cookie Policy & User Control",
    badge: "ePrivacy / Cookies",
    body: [
      "We reject invasive tracking cookies and provide granular, user-controlled cookie management:",
      "• Strictly Essential Cookies: Cryptographically signed session tokens (authjs.session-token and __Secure-authjs.session-token) used solely to maintain authenticated user sessions and defend against CSRF attacks. These cookies do not track users across external websites.",
      "• Performance & Web Vitals (Optional): Anonymized Vercel Analytics and Speed Insights to monitor server latency and crash rates without logging persistent IP addresses.",
      "• Preferences Storage (Optional): LocalStorage keys that remember dark/light mode and layout preferences.",
      "You can accept all, reject non-essential cookies, or customize individual categories at any time via our Cookie Preferences widget.",
    ],
  },
  {
    id: "security",
    title: "4. Technical Safeguards & Data Security",
    badge: "AES-256-GCM",
    body: [
      "We enforce enterprise-grade security controls across our infrastructure:",
      "• Mandatory HTTPS / TLS 1.3 encryption across all public and internal network communications.",
      "• AES-256-GCM encryption for all sensitive user credentials and API keys stored at rest.",
      "• Automated rate limiting, CSP headers (Content-Security-Policy), and input sanitization against XSS, injection, and CSRF vectors.",
      "• Instant, single-click account deletion in Settings that triggers complete cascading database eradication.",
    ],
  },
];

const euGdprSections: PrivacySection[] = [
  {
    id: "gdpr-basis",
    title: "1. Legal Basis for Processing (GDPR Art. 6)",
    badge: "EU / UK GDPR",
    body: [
      "Under the European Union General Data Protection Regulation (EU GDPR) and the UK Data Protection Act 2018 (UK GDPR), we process personal data under the following lawful bases:",
      "• Performance of a Contract (Art. 6(1)(b)): Processing account credentials, saved prompt libraries, and enhancement requests to deliver the Service you signed up for.",
      "• Consent (Art. 6(1)(a)): Granular opt-in consent for optional performance analytics cookies, which you can freely grant or withdraw at any time.",
      "• Legitimate Interests (Art. 6(1)(f)): Defending platform integrity, rate limiting abuse, preventing DDoS attacks, and ensuring server security.",
      "• Legal Obligation (Art. 6(1)(c)): Complying with statutory reporting, accounting, or regulatory requirements where mandated by law.",
    ],
  },
  {
    id: "gdpr-rights",
    title: "2. Data Subject Rights (GDPR Arts. 15–22)",
    badge: "European Rights",
    body: [
      "European Economic Area (EEA) and UK residents are entitled to exercise the following fundamental rights:",
      "• Right of Access (Art. 15): Request a full copy of all personal data held about you in a structured, readable format.",
      "• Right to Rectification (Art. 16): Correct inaccurate, outdated, or incomplete account data directly in Settings.",
      "• Right to Erasure / 'Right to be Forgotten' (Art. 17): Permanently erase your account, prompt history, API keys, and logs with instant effect.",
      "• Right to Restriction of Processing (Art. 18): Restrict processing of your data while a dispute or verification request is pending.",
      "• Right to Data Portability (Art. 20): Export all saved prompts, templates, and metadata in JSON/CSV formats.",
      "• Right to Object (Art. 21): Object to processing based on legitimate interests.",
      "• Right to Withdraw Consent (Art. 7(3)): Withdraw cookie or communications consent at any time without penalty.",
      "To exercise these rights, email promptplus2@gmail.com. We respond within 30 days free of charge.",
    ],
  },
  {
    id: "gdpr-transfers",
    title: "3. International Data Transfers & Standard Contractual Clauses (SCCs)",
    badge: "Cross-Border",
    body: [
      "When data is transferred outside the European Economic Area (EEA) or UK (such as to cloud serverless nodes hosted on Vercel or upstream AI endpoints in the US), we ensure appropriate safeguards pursuant to GDPR Chapter V.",
      "We utilize European Commission-approved Standard Contractual Clauses (SCCs) and verified Data Privacy Framework (DPF) certifications to guarantee an adequate level of data protection equivalent to EU standards.",
    ],
  },
  {
    id: "gdpr-dpo",
    title: "4. Supervisory Authority & Complaints",
    badge: "Regulatory Recourse",
    body: [
      "If you believe our processing of your personal data infringes GDPR provisions, you have the statutory right to lodge a formal complaint with your local EU Data Protection Authority (DPA) or the UK Information Commissioner's Office (ICO) at https://ico.org.uk.",
    ],
  },
];

const usSections: PrivacySection[] = [
  {
    id: "us-ccpa",
    title: "1. California Consumer Privacy Act (CCPA / CPRA Disclosures)",
    badge: "California / CPRA",
    body: [
      "This section applies to California residents pursuant to the California Consumer Privacy Act of 2018, as amended by the California Privacy Rights Act of 2020 (collectively, \"CCPA/CPRA\"), as well as state privacy laws in Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), and Utah (UCPA).",
      "Categories of Personal Information Collected in the Preceding 12 Months:",
      "• Identifiers: Email address, username/name, IP address (ephemeral only), unique session identifiers.",
      "• Commercial Information: Prompt metadata, quality scores, API key vault references.",
      "• Internet/Network Activity: Page load latency, feature usage counts via anonymized telemetry.",
      "• Sensitive Personal Information: Encrypted API key secrets (used solely to perform requested AI enhancements; never used for profiling or cross-context behavioral advertising).",
    ],
  },
  {
    id: "us-no-sale",
    title: "2. Absolute 'Do Not Sell or Share My Personal Information' Guarantee",
    badge: "Zero Sale of Data",
    body: [
      "• Prompt+ has NOT sold personal information to any third party in the preceding 12 months.",
      "• Prompt+ has NOT shared personal information for cross-context behavioral advertising.",
      "• Prompt+ does NOT sell or share personal information of minors under 16 years of age.",
      "Because we do not sell or share personal data for advertising, opt-out mechanisms for data sales are not necessary, though we honor Global Privacy Control (GPC) signals sent by your browser automatically.",
    ],
  },
  {
    id: "us-rights",
    title: "3. California & Multi-State Consumer Rights",
    badge: "Consumer Rights",
    body: [
      "Consumers in California, Virginia, Colorado, Connecticut, and Utah have the right to:",
      "• Right to Know & Access: Request disclosure of categories and specific pieces of personal information collected.",
      "• Right to Delete: Request irreversible deletion of collected personal information.",
      "• Right to Correct: Request correction of inaccurate personal information.",
      "• Right to Non-Discrimination: We will never deny services, charge different prices, or provide a degraded level of service for exercising your privacy rights.",
      "• Shine the Light Law: California Civil Code § 1798.83 permits users to request information regarding third-party direct marketing disclosures (we disclose zero user data for direct marketing).",
      "To submit a request, contact us at promptplus2@gmail.com. We verify requests via account email confirmation and fulfill them within 45 days.",
    ],
  },
];

const indiaSections: PrivacySection[] = [
  {
    id: "india-dpdpa",
    title: "1. Digital Personal Data Protection Act, 2023 (DPDPA Compliance)",
    badge: "India / DPDPA",
    body: [
      "This section applies to users located in India and outlines compliance with the Digital Personal Data Protection Act, 2023 (DPDPA 2023) and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules).",
      "• Itemized Notice & Specified Purpose: Personal data is collected solely for specified, lawful purposes (account authentication, prompt enhancement, and secure storage).",
      "• Free, Specific, Informed & Unconditional Consent: Account registration requires explicit, affirmative agreement via our consent checkbox.",
      "• Right to Withdraw Consent: Data Principals may withdraw consent at any time by closing their account in Settings.",
    ],
  },
  {
    id: "india-rights",
    title: "2. Rights of Data Principals in India",
    badge: "Data Principal Rights",
    body: [
      "Under DPDPA 2023, you possess the following statutory rights:",
      "• Right to Access Information About Personal Data: Obtain a summary of digital personal data being processed and identities of all processing partners.",
      "• Right to Correction and Erasure: Request correction of misleading data and complete erasure of digital personal data no longer necessary for the purpose.",
      "• Right of Grievance Redressal: Access a designated Grievance Officer with an obligation to respond to inquiries promptly.",
      "• Right to Nominate: Designate any other individual to exercise your data rights in the event of death or incapacity.",
    ],
  },
  {
    id: "india-grievance",
    title: "3. Resident Grievance Officer & Contact",
    badge: "Grievance Redressal",
    body: [
      "In compliance with Rule 5(9) of the SPDI Rules and DPDPA requirements, Prompt+ has designated a dedicated Grievance Officer:",
      "• Grievance Officer: Legal & Data Privacy Team",
      "• Email: promptplus2@gmail.com",
      "• Subject Line: 'DPDPA Grievance / Privacy Inquiry'",
      "• Turnaround Time: All grievances will be acknowledged within 24 hours and resolved within 30 business days.",
      "If unsatisfied with the resolution, Data Principals in India may appeal to the Data Protection Board of India (DPBI).",
    ],
  },
];

const otherRegionsSections: PrivacySection[] = [
  {
    id: "canada-pipeda",
    title: "1. Canada (PIPEDA Compliance)",
    badge: "Canada",
    body: [
      "For Canadian residents, Prompt+ complies with the Personal Information Protection and Electronic Documents Act (PIPEDA). We process personal data only with knowledge and consent, for reasonable purposes, and provide full rights to access and challenge compliance via the Office of the Privacy Commissioner of Canada (OPC).",
    ],
  },
  {
    id: "brazil-lgpd",
    title: "2. Brazil (LGPD Compliance)",
    badge: "Brazil",
    body: [
      "For residents of Brazil, data is processed in accordance with the Lei Geral de Proteção de Dados (LGPD). Brazilian Data Subjects may confirm the existence of processing, access their data, rectify incomplete data, request anonymization or deletion, and petition the National Data Protection Authority (ANPD) by contacting promptplus2@gmail.com.",
    ],
  },
  {
    id: "apac-australia",
    title: "3. Asia-Pacific & Australia (Privacy Act 1988 & APPI)",
    badge: "APAC / Australia",
    body: [
      "• Australia: We adhere to the Australian Privacy Principles (APPs) under the Privacy Act 1988 regarding open data management and cross-border disclosures.",
      "• Japan: Complying with the Act on the Protection of Personal Information (APPI).",
      "• Singapore: Compliant with the Personal Data Protection Act 2012 (PDPA).",
    ],
  },
  {
    id: "children-global",
    title: "4. Global Children's Privacy (COPPA & Age Verification)",
    badge: "Minor Protection",
    body: [
      "Prompt+ is strictly intended for individuals aged 13 and older (or 16 in jurisdictions where mandated by law). We do not knowingly solicit or collect personal data from children under 13 under the US Children's Online Privacy Protection Act (COPPA) or equivalent global statutes. Any account identified as belonging to a child under the legal age will be immediately deleted.",
    ],
  },
];

export default function PrivacyPage() {
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("global");

  const getRegionSections = () => {
    switch (selectedRegion) {
      case "eu":
        return euGdprSections;
      case "us":
        return usSections;
      case "india":
        return indiaSections;
      case "apac_latam":
        return otherRegionsSections;
      case "global":
      default:
        return globalSections;
    }
  };

  const currentSections = getRegionSections();

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
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/60 hover:bg-accent text-foreground transition-colors cursor-pointer"
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
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Globe2 className="h-3.5 w-3.5" />
            <span>Global Data Protection & Regional Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Global Privacy Policy & Data Sovereignty
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Effective Date: August 27, 2026 · Multi-Jurisdiction Version 3.0.0. Tailored compliance covering the <strong>European Union (GDPR)</strong>, <strong>United States (CCPA/CPRA)</strong>, <strong>India (DPDPA 2023)</strong>, and global standards.
          </p>

          {/* Quick Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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
                <strong className="block text-foreground">On-Device Gemini Nano</strong>
                <span className="text-muted-foreground text-[11px]">100% private offline AI</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 flex items-center gap-2.5 text-xs">
              <Lock className="h-4 w-4 text-primary shrink-0" />
              <div>
                <strong className="block text-foreground">AES-256 Key Vault</strong>
                <span className="text-muted-foreground text-[11px]">Hardware-isolated encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 sm:p-10 space-y-8">
        {/* Interactive Cookie Control Callout */}
        <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
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

        {/* Region Selector Navigation Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-primary" />
              <span>Select Your Jurisdiction / Region</span>
            </h3>
            <span className="text-[11px] text-muted-foreground">Click a region for localized legal rights</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-card border border-border/80 shadow-xs">
            <button
              onClick={() => setSelectedRegion("global")}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRegion === "global"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>Global Overview</span>
            </button>

            <button
              onClick={() => setSelectedRegion("eu")}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRegion === "eu"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <span>🇪🇺 EU & UK (GDPR)</span>
            </button>

            <button
              onClick={() => setSelectedRegion("us")}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRegion === "us"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <span>🇺🇸 USA (CCPA/CPRA)</span>
            </button>

            <button
              onClick={() => setSelectedRegion("india")}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRegion === "india"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <span>🇮🇳 India (DPDPA)</span>
            </button>

            <button
              onClick={() => setSelectedRegion("apac_latam")}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1 ${
                selectedRegion === "apac_latam"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <span>🌍 Other Regions</span>
            </button>
          </div>
        </div>

        {/* Active Policy Content Container */}
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-4 rounded-xl bg-card/60 border border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              Showing legal protections for:{" "}
              <strong className="text-primary capitalize">
                {selectedRegion === "global"
                  ? "Worldwide Baseline"
                  : selectedRegion === "eu"
                  ? "European Union & United Kingdom (GDPR / ePrivacy)"
                  : selectedRegion === "us"
                  ? "United States (California CCPA/CPRA & State Laws)"
                  : selectedRegion === "india"
                  ? "India (Digital Personal Data Protection Act 2023)"
                  : "Canada (PIPEDA), Brazil (LGPD), APAC & Global Statutes"}
              </strong>
            </span>
          </div>

          <div className="space-y-6">
            {currentSections.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm scroll-mt-24 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                    {sec.title}
                  </h2>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary shrink-0">
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
        </div>

        {/* Global Compliance Guarantee Card */}
        <div className="p-6 rounded-2xl border border-border/80 bg-background/60 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Formal Data Privacy & Legal Compliance Office</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Prompt+ processes all requests in accordance with international data protection laws. To submit a verified Data Subject Request (DSR), request permanent data erasure, or contact our Data Protection and Grievance Officer, reach out to our legal department at:
          </p>
          <div className="p-3.5 rounded-xl bg-card border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Direct Compliance Contact:</span>
              <strong className="text-primary font-mono text-sm">promptplus2@gmail.com</strong>
            </div>
            <a
              href="mailto:promptplus2@gmail.com?subject=Privacy%20Inquiry%20%2F%20Data%20Subject%20Request"
              className="h-8 px-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs inline-flex items-center justify-center hover:bg-primary/90 transition-colors shadow-2xs"
            >
              Submit Privacy Inquiry →
            </a>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Prompt+ Architect AI. All rights reserved.</span>
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
