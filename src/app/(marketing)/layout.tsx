import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <Logo size={20} />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="h-8 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="py-8 px-4 border-t">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <Logo size={18} />
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
