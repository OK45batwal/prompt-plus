import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Prompt+",
    "operatingSystem": "Web, Chrome OS, Windows, macOS, Linux",
    "applicationCategory": "ProductivityApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Transform simple prompts into professional, AI-optimized instructions with free On-Device AI."
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between gap-3 sm:gap-6 rounded-full border bg-background/80 backdrop-blur-xl px-3 sm:px-4 h-12 shadow-2xs w-full max-w-5xl sm:w-auto">
          <Link href="/">
            <Logo size={20} />
          </Link>
          <div className="flex items-center gap-1 sm:gap-4">
            <Link
              href="/features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline px-2"
            >
              Features
            </Link>
            <Link
              href="/extension"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline px-2"
            >
              Extension
            </Link>
            <a
              href="https://github.com/OK45batwal/prompt-plus"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:inline-flex items-center gap-1 px-2"
            >
              GitHub
            </a>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="h-8 inline-flex items-center justify-center rounded-full bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto rounded-3xl border bg-card/80 backdrop-blur-xl p-8 sm:p-12 space-y-10 shadow-sm">
          {/* Tier 1: Brand & Tagline */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border/50">
            <div className="space-y-2">
              <Link href="/">
                <Logo size={24} />
              </Link>
              <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
                {"// Free AI Prompt Architect & Extension Platform"}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <a
                href="https://github.com/OK45batwal/prompt-plus"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full border bg-accent/40 hover:bg-accent hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground font-medium"
              >
                GitHub Repository
              </a>
              <a
                href="mailto:promptplus2@gmail.com"
                className="px-3 py-1.5 rounded-full border bg-accent/40 hover:bg-accent hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground font-medium"
              >
                Support Email
              </a>
            </div>
          </div>

          {/* Tier 2: Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            <div className="space-y-3">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/extension" className="hover:text-foreground transition-colors">Chrome Extension</Link></li>
                <li><Link href="/dashboard/new" className="hover:text-foreground transition-colors">AI Sandbox</Link></li>
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Resources</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/prompt-templates" className="hover:text-foreground transition-colors">Prompt Templates</Link></li>
                <li><Link href="/prompt-engineering-guide" className="hover:text-foreground transition-colors">Engineering Guide</Link></li>
                <li><Link href="/prompt-cost-calculator" className="hover:text-foreground transition-colors">Token Cost Calculator</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Model Optimizers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/enhance-prompt-for-chatgpt" className="hover:text-foreground transition-colors">Enhance for ChatGPT</Link></li>
                <li><Link href="/enhance-prompt-for-claude" className="hover:text-foreground transition-colors">Enhance for Claude</Link></li>
                <li><Link href="/enhance-prompt-for-gemini" className="hover:text-foreground transition-colors">Enhance for Gemini</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">Legal & Privacy</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          {/* Tier 3: Bottom Bar */}
          <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Prompt+ Architect AI. MIT Open Source. Your prompts stay yours.</p>
            <p className="font-mono text-[11px]">v1.1.1 • 100% Free & On-Device AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
