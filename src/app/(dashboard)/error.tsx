"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[340px] max-w-md mx-auto">
      <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
        <span className="text-lg font-bold">!</span>
      </div>
      <h2 className="font-semibold text-base">Something went wrong</h2>
      <p className="text-xs text-muted-foreground mt-1 mb-5">
        An error occurred loading this page. Please try refreshing or return to your dashboard.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="h-8 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-3.5 text-xs font-medium hover:bg-foreground/90 transition-colors active:scale-95"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="h-8 inline-flex items-center justify-center rounded-lg border bg-background px-3.5 text-xs font-medium hover:bg-accent transition-colors"
        >
          Dashboard Home
        </Link>
      </div>
    </div>
  );
}
