import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, BarChart3, BookOpen, Shield } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { auth } from "@/lib/auth/config";

const features = [
  {
    icon: Sparkles,
    title: "AI Enhancement",
    description: "Transform simple prompts into detailed, professional instructions with AI-powered analysis.",
  },
  {
    icon: BarChart3,
    title: "Prompt Scoring",
    description: "Get instant quality scores with detailed breakdowns of clarity, specificity, and context.",
  },
  {
    icon: BookOpen,
    title: "Templates",
    description: "Start with proven templates for code, content, images, and more.",
  },
  {
    icon: Shield,
    title: "Free to Use",
    description: "No subscriptions, no hidden costs. Use your own API keys or our free tier.",
  },
];

const steps = [
  {
    step: "01",
    title: "Write",
    description: "Enter your prompt idea in plain language.",
  },
  {
    step: "02",
    title: "Analyze",
    description: "AI analyzes intent, category, and identifies improvements.",
  },
  {
    step: "03",
    title: "Enhance",
    description: "Get a production-ready, optimized prompt.",
  },
  {
    step: "04",
    title: "Use",
    description: "Copy, save, or export to any AI model.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <Logo size={20} />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="h-8 inline-flex items-center justify-center rounded-lg bg-foreground text-background px-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 animate-slide-up">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
            Free and open-source
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Better prompts.
            <br />
            Better results.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Transform simple ideas into professional, AI-optimized prompts.
            Free to use with your own API keys.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="h-9 w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Start for Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link
              href="/dashboard/new"
              className="h-9 w-full sm:w-auto inline-flex items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-accent transition-colors"
            >
              Start Building
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <p className="text-muted-foreground mt-2">
              Four steps to a perfect prompt.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-stagger">
            {steps.map((step) => (
              <div key={step.step} className="text-center hover-lift">
                <div className="text-xs font-mono text-muted-foreground mb-2">
                  {step.step}
                </div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
            <p className="text-muted-foreground mt-2">
              Everything you need to craft the perfect prompt.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-stagger">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border hover:border-foreground/20 transition-colors hover-lift"
              >
                <feature.icon className="h-5 w-5 mb-3" />
                <h3 className="font-medium text-sm">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t animate-slide-up">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to write better prompts?
          </h2>
          <p className="text-muted-foreground mt-2 mb-6">
            Join thousands of users creating AI-optimized prompts.
          </p>
          <Link
            href="/signup"
            className="h-9 w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <Logo size={18} />
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
