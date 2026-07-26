"use client";
import { Logo } from "@/components/ui/logo";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="font-semibold text-sm">Something went wrong</h2>
      <p className="text-xs text-muted-foreground mt-1 mb-4">An error occurred loading this page.</p>
      <button onClick={reset} className="h-8 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-xs font-medium hover:bg-foreground/90 transition-colors">
        Try again
      </button>
    </div>
  );
}
