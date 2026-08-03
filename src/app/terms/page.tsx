import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of These Terms",
    body: [
      "These Terms of Service (\"Terms\") govern your access to and use of Prompt+ (the \"Service\"), including the website, the Chrome extension, and the API. By creating an account, installing the extension, or using any part of the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.",
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
    title: "3. Accounts",
    body: [
      "You may use certain features without an account. To use the full service, you must create an account with a valid email address and agree to these Terms.",
      "You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must notify us immediately at promptplus2@gmail.com if you suspect unauthorized use of your account.",
      "You may close your account at any time. Closure permanently deletes your account and all associated data, as described in our Privacy Policy.",
    ],
  },
  {
    id: "acceptance-use",
    title: "4. Acceptable Use",
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
      "You retain all rights to the prompts and other content you submit to the Service (\"Your Content\"). You grant us a limited, non-exclusive, worldwide, royalty-free license to process, store, and display Your Content solely to provide and operate the Service (for example, to generate enhanced output or power a shared link).",
      "You represent and warrant that you own or have the necessary rights to Your Content, and that Your Content does not violate any law or any third party's rights.",
      "When you enable the \"share\" feature, the shared prompt becomes accessible to anyone with the link. Do not share content you expect to remain private.",
      "We do not claim ownership of AI-generated output, but you are solely responsible for how you use it.",
    ],
  },
  {
    id: "ai-output",
    title: "6. AI Output Disclaimer",
    body: [
      "AI-generated outputs can be inaccurate, incomplete, biased, or outdated. AI models may \"hallucinate\" facts. The Service does not guarantee the correctness, safety, or fitness of any output for any purpose.",
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
      "The Prompt+ software is open source and licensed under the MIT License. The Service's trademarks, branding, and visual design are owned by Prompt+ and may not be used without our prior written consent.",
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
      "THE SERVICE IS PROVIDED \"AS IS\" AND \"AS AVAILABLE\", WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT AI OUTPUTS WILL BE ACCURATE OR RELIABLE.",
    ],
  },
  {
    id: "liability",
    title: "11. Limitation of Liability",
    body: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL PROMPT+ OR ITS OPERATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, DATA, REVENUE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
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
    title: "17. Contact",
    body: [
      "Questions about these Terms? Contact us at promptplus2@gmail.com. We aim to respond within 48 hours.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center px-4 border-b">
        <Link href="/"><Logo size={20} /></Link>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full p-6 sm:p-10">
        <h1 className="text-2xl font-bold text-foreground mb-1">Terms of Service</h1>
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
          Read our <Link href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}
