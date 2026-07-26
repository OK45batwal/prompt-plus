"use client";
import { Logo } from "@/components/ui/logo";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <Logo size={24} />
        <h1 className="text-xl font-semibold mt-6">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mt-2">An unexpected error occurred.</p>
        <button onClick={reset} className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors">
          Try again
        </button>
      </div>
    </div>
  );
}
