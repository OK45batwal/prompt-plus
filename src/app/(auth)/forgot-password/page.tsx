"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, ArrowRight, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "reset" | "done">("email");

  const handleSendOtp = async (e: React.FormEvent) => {
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
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (otp.length !== 6) { setError("Enter the 6-digit code"); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
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
          {step === "done" ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-muted-foreground">Password updated successfully.</p>
              <Link href="/login"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors">
                Log in
              </Link>
            </div>
          ) : step === "reset" ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">Enter code &amp; new password</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  A 6-digit code was sent to {email}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">{error}</div>
              )}

              <form onSubmit={handleReset} className="space-y-3">
                <Input type="text" placeholder="000000" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required maxLength={6} className="text-center text-2xl tracking-[0.5em] h-12" inputMode="numeric" />
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} placeholder="New password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required minLength={8} className="pl-9 pr-9" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="Confirm new password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} required minLength={8} className="pl-9" />
                </div>
                <button type="submit" disabled={isLoading}
                  className="h-9 w-full inline-flex items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50">
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : <>Reset password</>}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
                <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a verification code.</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">{error}</div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="Email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required className="pl-9" />
                </div>
                <button type="submit" disabled={isLoading}
                  className="h-9 w-full inline-flex items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50">
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : <><ArrowRight className="h-4 w-4 ml-2" /> Send code</>}
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Remember your password? <Link href="/login" className="text-foreground hover:underline">Log in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
