"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowRight, Loader2, Check, Copy, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [fallback, setFallback] = useState<{ resetUrl: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else if (data.fallback) {
        setFallback(data);
        setSent(true);
      } else {
        setSent(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center px-4 border-b">
        <Link href="/"><Logo size={20} /></Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              {fallback ? (
                <>
                  <p className="text-sm text-muted-foreground">{fallback.message}</p>
                  <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 text-left">
                    <input
                      readOnly
                      value={`${window.location.origin}/reset-password/${fallback.resetUrl}`}
                      className="flex-1 bg-transparent text-xs truncate outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/reset-password/${fallback.resetUrl}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent transition-colors"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <a
                      href={`${window.location.origin}/reset-password/${fallback.resetUrl}`}
                      className="shrink-0 h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  If an account with that email exists, a reset link has been sent. Check your inbox.
                </p>
              )}
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-9 w-full inline-flex items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                  ) : (
                    <><ArrowRight className="h-4 w-4 ml-2" /> Send reset link</>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Remember your password?{" "}
                <Link href="/login" className="text-foreground hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
