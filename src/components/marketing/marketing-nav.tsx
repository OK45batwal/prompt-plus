"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 sm:pt-4 flex justify-center pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto flex items-center justify-between gap-3 sm:gap-6 rounded-full border border-border/80 dark:border-white/10 bg-background/85 dark:bg-card/85 backdrop-blur-2xl px-3.5 sm:px-5 h-13 shadow-sm w-full max-w-5xl transition-all duration-300"
      >
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo size={22} />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden sm:flex items-center gap-0.5 md:gap-1">
          <Link
            href="/#pipeline"
            className={`text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-full hover:bg-accent/60 ${focusRing}`}
          >
            Pipeline
          </Link>
          <Link
            href="/#compare"
            className={`text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-full hover:bg-accent/60 ${focusRing}`}
          >
            Compare
          </Link>
          <Link
            href="/extension"
            className={`text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-full hover:bg-accent/60 ${focusRing}`}
          >
            Extension
          </Link>
          <Link
            href="/prompt-engineering-guide"
            className={`text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-full hover:bg-accent/60 hidden lg:inline ${focusRing}`}
          >
            Guide
          </Link>
          <Link
            href="/dashboard/new"
            className={`text-xs md:text-sm font-semibold text-primary hover:text-primary transition-colors px-2.5 py-1.5 rounded-full hover:bg-primary/10 flex items-center gap-1 ${focusRing}`}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Studio
          </Link>
          <a
            href="https://github.com/OK45batwal/prompt-plus"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-full hover:bg-accent/60 inline-flex items-center gap-1.5 ${focusRing}`}
            aria-label="GitHub Repository"
          >
            <GithubIcon className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={`text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-accent/60 ${focusRing}`}
          >
            Log in
          </Link>
          <Link
            href="/dashboard/new"
            className={`group h-8.5 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground pl-3.5 pr-1.5 text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] shadow-xs ${focusRing}`}
          >
            <span>Try Free</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            className={`sm:hidden flex h-8.5 w-8.5 items-center justify-center rounded-full border border-border/80 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors ${focusRing}`}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          className="pointer-events-auto fixed inset-x-4 top-20 z-50 rounded-2xl border border-border/80 dark:border-white/10 bg-background/95 dark:bg-card/95 backdrop-blur-2xl p-5 shadow-xl sm:hidden animate-scale-in"
        >
          <div className="flex flex-col gap-3">
            <Link
              href="/#pipeline"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/60 transition-colors flex items-center justify-between"
            >
              <span>Architecture Pipeline</span>
              <span className="text-xs text-muted-foreground">4 Stages</span>
            </Link>
            <Link
              href="/#compare"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/60 transition-colors flex items-center justify-between"
            >
              <span>Side-by-Side Compare</span>
              <span className="text-xs text-muted-foreground">Diff Plan</span>
            </Link>
            <Link
              href="/dashboard/new"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/60 transition-colors flex items-center justify-between text-primary"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Prompt Studio
              </span>
              <span className="text-xs text-primary/70">Interactive</span>
            </Link>
            <Link
              href="/extension"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/60 transition-colors flex items-center justify-between"
            >
              <span>Chrome Extension</span>
              <span className="text-xs text-muted-foreground">In-chat dock</span>
            </Link>
            <Link
              href="/prompt-engineering-guide"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/60 transition-colors flex items-center justify-between"
            >
              <span>Prompt Guide</span>
              <span className="text-xs text-muted-foreground">Frameworks</span>
            </Link>
            <Link
              href="/prompt-templates"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/60 transition-colors flex items-center justify-between"
            >
              <span>Templates</span>
              <span className="text-xs text-muted-foreground">Pre-built</span>
            </Link>
            <a
              href="https://github.com/OK45batwal/prompt-plus"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent/60 transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <GithubIcon className="h-4 w-4" />
                GitHub
              </span>
              <span className="text-xs text-muted-foreground">Open Source</span>
            </a>

            <div className="pt-3 mt-1 border-t border-border/60 flex items-center gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2 text-xs font-semibold rounded-lg border border-border/70 hover:bg-accent/60 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
