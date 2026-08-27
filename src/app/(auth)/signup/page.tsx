"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Check, Sparkles, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/logo";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [providers, setProviders] = useState<{ google: boolean; github: boolean }>({ google: false, github: false });
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers").then(r => r.json()).then(setProviders).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }

      setShowOtp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setOtpLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid code");
      }

      setVerified(true);
      router.push("/login?message=Email verified. Please log in.");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError(null);
    await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setOtpError("New verification code sent!");
  };

  const handleOAuth = (provider: "google" | "github") => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  const hasOauth = providers.google || providers.github;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Background Ambient Mesh Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/3 w-[450px] h-[450px] rounded-full bg-blue-500/15 dark:bg-blue-500/20 blur-[130px] animate-pulse" style={{ animationDuration: "7s" }} />
        <div className="absolute top-28 right-1/3 w-[400px] h-[400px] rounded-full bg-purple-500/15 dark:bg-purple-500/20 blur-[140px] animate-pulse" style={{ animationDuration: "9s" }} />
      </div>

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={22} />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </header>

      {/* Main Container - 50/50 Desktop Split */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 my-auto">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Panel: Value Proposition & Zero-Cost Guarantees */}
          <div className="hidden lg:flex flex-col justify-between p-8 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl h-full min-h-[480px]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Free Forever • No Credit Card</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3">
                Unlock Master-Class AI Prompts
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Join thousands of builders refining prompts in ChatGPT, Claude, Gemini, and DeepSeek.
              </p>

              <div className="space-y-4 text-xs font-medium">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background/40 border border-border/40">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">✓</div>
                  <div>
                    <strong className="text-foreground block mb-0.5">100% Free Out-of-the-Box</strong>
                    <span className="text-muted-foreground">Access OpenRouter free models without credit card or paid API keys.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background/40 border border-border/40">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">🔐</div>
                  <div>
                    <strong className="text-foreground block mb-0.5">AES-256 GCM Key Security</strong>
                    <span className="text-muted-foreground">Optional user API keys are encrypted locally using Web Crypto API.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-background/40 border border-border/40">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">📦</div>
                  <div>
                    <strong className="text-foreground block mb-0.5">Context Bucket Cross-Chat Sync</strong>
                    <span className="text-muted-foreground">Transfer conversation history seamlessly between ChatGPT and Claude.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span>Prompt+ Studio v1.1.1</span>
              <span className="text-emerald-400 font-medium">🟢 Production Ready</span>
            </div>
          </div>

          {/* Right Panel: Clean Auth Form Container */}
          <div className="w-full max-w-md mx-auto">
            <div className="p-6 sm:p-8 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl hover:border-primary/30 transition-all">
              {showOtp ? (
                <div className="animate-slide-up">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                      {verified ? <Check className="h-6 w-6 text-emerald-500 animate-pulse" /> : <Mail className="h-6 w-6 text-primary animate-pulse" />}
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Verify Your Email</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Enter the 6-digit code sent to <span className="font-semibold text-foreground">{email}</span>
                    </p>
                  </div>

                  {otpError && (
                    <div className={`mb-4 p-3 rounded-xl text-xs text-center font-medium animate-slide-up ${
                      otpError === "New verification code sent!"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-destructive/10 border border-destructive/30 text-destructive"
                    }`}>
                      {otpError}
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <Input
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      maxLength={6}
                      className="text-center text-2xl tracking-[0.4em] h-12 rounded-xl border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background/50 font-mono font-bold"
                      inputMode="numeric"
                    />
                    <button
                      type="submit"
                      disabled={otpLoading || otp.length !== 6}
                      className="h-10 w-full inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 text-sm font-semibold hover:bg-foreground/90 transition-all disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      {otpLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</> : <>Verify Email & Finish</>}
                    </button>
                  </form>

                  <p className="text-center text-xs text-muted-foreground mt-5">
                    Didn&apos;t receive code?{" "}
                    <button onClick={handleResendOtp} className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-none p-0">
                      Resend code
                    </button>
                  </p>
                </div>
              ) : (
                <div className="animate-slide-up">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-3">
                      <Sparkles className="h-3.5 w-3.5 animate-spin-slow" />
                      <span>Free Forever Account</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Create Account</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Start engineering 10x better AI prompts today
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs text-center font-medium animate-slide-up">
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
                            className="h-10 w-full inline-flex items-center justify-center rounded-xl border bg-background/50 hover:bg-accent hover:border-primary/40 px-4 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 shadow-2xs group"
                          >
                            <svg className="h-4 w-4 mr-2.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
                            className="h-10 w-full inline-flex items-center justify-center rounded-xl border bg-background/50 hover:bg-accent hover:border-primary/40 px-4 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 shadow-2xs group"
                          >
                            <svg className="h-4 w-4 mr-2.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                            </svg>
                            Continue with GitHub
                          </button>
                        )}
                      </div>
                      <div className="relative mb-5">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground font-medium">
                          or sign up with email
                        </span>
                      </div>
                    </>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div className="relative">
                      <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === "name" ? "text-primary" : "text-muted-foreground"}`} />
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        required
                        className="pl-9 h-10 rounded-xl bg-background/50 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === "email" ? "text-primary" : "text-muted-foreground"}`} />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        required
                        className="pl-9 h-10 rounded-xl bg-background/50 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${focusedField === "password" ? "text-primary" : "text-muted-foreground"}`} />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password (8+ characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        required
                        minLength={8}
                        className="pl-9 pr-10 h-10 rounded-xl bg-background/50 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Live Password Strength Meter */}
                    {password && (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Strength:</span>
                          <span className={password.length >= 10 ? "text-emerald-400 font-semibold" : password.length >= 8 ? "text-amber-400 font-semibold" : "text-red-400"}>
                            {password.length >= 10 ? "Strong" : password.length >= 8 ? "Fair" : "Weak"}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-background/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              password.length >= 10 ? "w-full bg-emerald-400" : password.length >= 8 ? "w-2/3 bg-amber-400" : "w-1/3 bg-red-400"
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="h-10 w-full inline-flex items-center justify-center rounded-xl bg-foreground text-background px-4 text-sm font-semibold hover:bg-foreground/90 transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 group"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Sign Up Free
                          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                      Log in
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Footer Terms Link */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing up, you agree to Prompt+{" "}
              <Link href="/terms" className="hover:text-foreground underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="hover:text-foreground underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
