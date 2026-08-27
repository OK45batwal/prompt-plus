"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Shield, Check, X, SlidersHorizontal, Info } from "lucide-react";

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean; // Vercel Analytics / Speed Insights
  preferences: boolean; // UI preferences / theme memory
  timestamp: string;
}

const STORAGE_KEY = "promptplus_cookie_consent_v1";

export function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Delay showing banner slightly for smooth page entrance
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage access issues
    }
  }, []);

  const saveConsent = (analyticsVal: boolean, preferencesVal: boolean) => {
    try {
      const payload: CookiePreferences = {
        essential: true,
        analytics: analyticsVal,
        preferences: preferencesVal,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent("promptplus_cookie_consent_updated", { detail: payload }));
    } catch {
      // LocalStorage access restricted
    }
    setIsOpen(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent(true, true);
  };

  const handleRejectAll = () => {
    saveConsent(false, false);
  };

  const handleSavePreferences = () => {
    saveConsent(analytics, preferences);
  };

  if (!isOpen) return null;

  return (
    <div
      suppressHydrationWarning
      role="dialog"
      aria-label="Cookie consent management"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[99999] animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl text-foreground text-xs space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Cookie className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-foreground">
                Cookie & Privacy Choices
              </h3>
              <p className="text-[11px] text-muted-foreground">GDPR & CCPA Compliant</p>
            </div>
          </div>
          <button
            onClick={handleRejectAll}
            type="button"
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
            title="Close and reject non-essential cookies"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Prompt+ uses strictly essential cookies for secure authentication and optional privacy-friendly cookies to measure site performance and remember your settings. We never sell your data or use advertising trackers.
        </p>

        {/* Detailed Preferences Accordion */}
        {showPreferences ? (
          <div className="space-y-3 pt-2 border-t border-border/50 animate-in fade-in duration-200">
            {/* Category: Essential */}
            <div className="p-3 rounded-xl bg-background/60 border border-border/40 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                  <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Strictly Essential</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Always Active</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Required for secure login authentication, CSRF defense, and database session tokens.
                </p>
              </div>
              <input type="checkbox" checked disabled className="h-4 w-4 rounded accent-primary opacity-60 cursor-not-allowed" />
            </div>

            {/* Category: Performance Analytics */}
            <div className="p-3 rounded-xl bg-background/60 border border-border/40 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                  <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Performance & Analytics</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Vercel Speed Insights & Web Vitals to monitor uptime and page responsiveness (anonymized).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {/* Category: Functional Preferences */}
            <div className="p-3 rounded-xl bg-background/60 border border-border/40 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span>Local Preferences</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Stores your dark/light theme choice, sidebar drawer state, and active model selection.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences}
                  onChange={(e) => setPreferences(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {/* Save Custom Preferences */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSavePreferences}
                type="button"
                className="flex-1 h-9 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Save My Choices
              </button>
              <button
                onClick={() => setShowPreferences(false)}
                type="button"
                className="h-9 px-3 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-xs font-medium transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          /* Default Action Buttons */
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAcceptAll}
                type="button"
                className="h-9 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectAll}
                type="button"
                className="h-9 inline-flex items-center justify-center rounded-xl border border-border bg-background/60 hover:bg-accent text-foreground font-medium text-xs transition-colors"
              >
                Reject Non-Essential
              </button>
            </div>
            <button
              onClick={() => setShowPreferences(true)}
              type="button"
              className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground font-medium underline underline-offset-4 transition-colors pt-1"
            >
              Customize Cookie Preferences
            </button>
          </div>
        )}

        {/* Footer Legal Links */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Your privacy is protected.</span>
          <div className="flex items-center gap-2 font-medium">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper hook to trigger cookie preferences modal from anywhere (e.g. Footer, Privacy page)
 */
export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch {
      // Ignore
    }
  }
}
