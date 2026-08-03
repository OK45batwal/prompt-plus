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

      <footer className="py-12 px-4 border-t">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
          <Link href="/">
            <Logo size={18} />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/extension" className="hover:text-foreground transition-colors">
              Extension
            </Link>
            <Link href="/prompt-templates" className="hover:text-foreground transition-colors">
              Templates
            </Link>
            <Link href="/prompt-engineering-guide" className="hover:text-foreground transition-colors">
              Guide
            </Link>
            <Link href="/prompt-cost-calculator" className="hover:text-foreground transition-colors">
              Cost Calculator
            </Link>
            <Link href="/enhance-prompt-for-chatgpt" className="hover:text-foreground transition-colors">
              ChatGPT
            </Link>
            <Link href="/enhance-prompt-for-claude" className="hover:text-foreground transition-colors">
              Claude
            </Link>
            <Link href="/enhance-prompt-for-gemini" className="hover:text-foreground transition-colors">
              Gemini
            </Link>
            <a
              href="https://github.com/OK45batwal/prompt-plus"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub Repo
            </a>
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">Free forever. Open source (MIT). Your prompts stay yours.</p>
        </div>
      </footer>
    </div>
  );
}
