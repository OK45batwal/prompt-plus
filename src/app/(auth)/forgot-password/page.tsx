"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      window.location.assign(data.redirectUrl || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/3 w-[450px] h-[450px] rounded-full bg-primary/10 blur-[130px] animate-pulse" />
      </div>

      <header className="h-16 flex items-center px-6 border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-50">
        <Link href="/"><Logo size={22} /></Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Instant Account Recovery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Reset Your Password</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Enter your email and choose a new password
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium text-center animate-slide-up">
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 h-10 rounded-xl bg-background/50 border-border/70 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-9 pr-10 h-10 rounded-xl bg-background/50 border-border/70 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  className="pl-9 h-10 rounded-xl bg-background/50 border-border/70 focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="h-10 w-full inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 text-sm font-semibold hover:bg-foreground/90 transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  Update Password & Enter Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Remember your password?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Back to log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
