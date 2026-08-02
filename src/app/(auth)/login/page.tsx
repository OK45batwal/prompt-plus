"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Sparkles, Zap, Shield, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/logo";

import { authenticate } from "./actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const initialError = errorParam === "CredentialsSignin" ? "Invalid email or password" : null;
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [providers, setProviders] = useState<{ google: boolean; github: boolean }>({ google: false, github: false });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers").then(r => r.json()).then(setProviders).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const targetUrl = searchParams.get("callbackUrl") || "/dashboard";

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("redirectTo", targetUrl);

    try {
      const err = await authenticate(undefined, formData);
      if (err) {
        setError(err);
        setIsLoading(false);
      }
    } catch {
      window.location.href = targetUrl;
    }
  };

  const handleOAuth = (provider: "google" | "github") => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  const hasOauth = providers.google || providers.github;

  return (
    <div className="w-full max-w-sm animate-slide-up">
      {/* Logo centered on card */}
      <div className="flex flex-col items-center mb-8">
        <div className="mb-4">
          <Logo size={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Log in to your Prompt+ account
        </p>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-xs animate-slide-up">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs animate-slide-up">
          {error}
        </div>
      )}

      {hasOauth && (
        <>
          <div className="space-y-2.5 mb-5">
            {providers.google && (
              <button
                onClick={() => handleOAuth("google")}
                type="button"
                className="h-10 w-full inline-flex items-center justify-center rounded-xl border px-4 text-sm font-medium hover:bg-accent hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm group"
              >
                <svg className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            )}
            {providers.github && (
              <button
                onClick={() => handleOAuth("github")}
                type="button"
                className="h-10 w-full inline-flex items-center justify-center rounded-xl border px-4 text-sm font-medium hover:bg-accent hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm group"
              >
                <svg className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                Continue with GitHub
              </button>
            )}
          </div>
          <div className="relative mb-5">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or continue with email
            </span>
          </div>
        </>
      )}

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className={`relative transition-all duration-200 ${focusedField === "email" ? "scale-[1.01]" : ""}`}>
          <Mail className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === "email" ? "text-primary" : "text-muted-foreground"}`} />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            required
            className={`pl-9 h-10 rounded-xl transition-all duration-200 ${focusedField === "email" ? "border-primary ring-1 ring-primary/30" : ""}`}
          />
        </div>
        <div className={`relative transition-all duration-200 ${focusedField === "password" ? "scale-[1.01]" : ""}`}>
          <Lock className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === "password" ? "text-primary" : "text-muted-foreground"}`} />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            required
            className={`pl-9 pr-9 h-10 rounded-xl transition-all duration-200 ${focusedField === "password" ? "border-primary ring-1 ring-primary/30" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 text-sm font-semibold hover:bg-foreground/90 transition-all disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-none group"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              Log in
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-5">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}

// Animated floating icons for the left panel
const floatingFeatures = [
  { icon: Sparkles, label: "AI-Powered", color: "text-blue-400", delay: "0s", top: "15%", left: "10%" },
  { icon: Zap, label: "Instant Enhancement", color: "text-amber-400", delay: "1s", top: "35%", left: "75%" },
  { icon: Shield, label: "Private & Secure", color: "text-emerald-400", delay: "0.5s", top: "60%", left: "8%" },
  { icon: Brain, label: "Smart Analysis", color: "text-violet-400", delay: "1.5s", top: "78%", left: "68%" },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Animated brand panel (hidden on mobile) */}
      <div className="hidden lg:flex flex-col flex-1 relative bg-gradient-to-br from-[#090d16] via-[#0f1a30] to-[#0d1526] overflow-hidden">
        {/* Mesh glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDuration: "5s" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-500/15 blur-[120px] animate-pulse" style={{ animationDuration: "7s", animationDelay: "2s" }} />

        {/* Floating feature icons */}
        {floatingFeatures.map((f) => (
          <div
            key={f.label}
            className="absolute flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm animate-float"
            style={{ top: f.top, left: f.left, animationDelay: f.delay, animationDuration: "4s" }}
          >
            <f.icon className={`h-4 w-4 ${f.color}`} />
            <span className="text-xs text-white/70 font-medium">{f.label}</span>
          </div>
        ))}

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center px-12 text-center z-10">
          <div className="mb-6">
            <Logo size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Transform your prompts into{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              AI masterpieces
            </span>
          </h2>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed">
            Join thousands of developers, marketers, and creators who craft better AI outputs with Prompt+.
          </p>

          {/* Animated stat pills */}
          <div className="flex gap-3 mt-8 flex-wrap justify-center">
            {[
              { value: "10x", label: "Better Outputs" },
              { value: "Free", label: "No Credit Card" },
              { value: "4 AI", label: "Providers" },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-center animate-float-slow">
                <div className="text-sm font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom brand bar */}
        <div className="p-6 text-center">
          <p className="text-xs text-white/30">© 2025 Prompt+ · Free & Open Source</p>
        </div>
      </div>

      {/* Right Panel — Login form */}
      <div className="flex flex-col flex-1 min-h-screen bg-background">
        {/* Mobile header */}
        <header className="lg:hidden h-14 flex items-center px-4 border-b">
          <Link href="/">
            <Logo size={20} />
          </Link>
        </header>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center p-6">
          <Suspense fallback={<div className="text-center text-sm">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </main>

        {/* Bottom hint */}
        <div className="pb-6 text-center">
          <p className="text-xs text-muted-foreground">
            By logging in, you agree to our{" "}
            <Link href="/terms" className="hover:text-foreground underline">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="hover:text-foreground underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
