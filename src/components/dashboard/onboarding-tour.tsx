"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, CheckCircle2, ArrowRight } from "lucide-react";

export function OnboardingTour() {
  // Starts dismissed so the server and the first client render agree; the real
  // value is read from storage after mount.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setDismissed(localStorage.getItem("pp_onboarding_dismissed") === "true");
      } catch {
        setDismissed(false);
      }
    });
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("pp_onboarding_dismissed", "true");
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <div className="relative p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-card to-accent/40 border border-primary/20 shadow-sm space-y-4">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        title="Dismiss onboarding tour"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <h3 className="font-bold text-sm tracking-tight">Quick start: three steps</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <div className="p-3.5 rounded-xl border bg-card/80 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[11px]">1</span>
            <span>Type or Speak</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enter any simple prompt idea or click <strong>Voice Input</strong> to dictate naturally.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border bg-card/80 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-500">
            <span className="h-5 w-5 rounded-full bg-cyan-500/10 flex items-center justify-center font-bold text-[11px]">2</span>
            <span>Add your context</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Turn on saved <strong>context rules</strong> &mdash; tone, audience, constraints &mdash; so every enhancement already knows them.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border bg-card/80 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
            <span className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-[11px]">3</span>
            <span>Enhance, then review</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Compare <strong>Output</strong> against <strong>Changes</strong>, then copy the prompt &mdash; or apply it into the chat from the extension.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Free out-of-the-box — no API keys required.
        </span>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          Create First Prompt <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
