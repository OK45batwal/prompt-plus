import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { PromptDemo } from "@/components/marketing/prompt-demo";

interface ModelSeoPageProps {
  model: string;
  tagline: string;
  perks: string[];
}

export function ModelSeoPage({ model, tagline, perks }: ModelSeoPageProps) {
  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Enhance Your Prompts for {model}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          {tagline}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard/new"
            className="h-11 px-6 rounded-xl bg-foreground text-background text-sm font-semibold inline-flex items-center gap-2 hover:bg-foreground/90 transition-colors"
          >
            Start Building Free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/extension"
            className="h-11 px-6 rounded-xl border bg-card text-sm font-semibold inline-flex items-center hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" /> Get the Chrome Extension
          </Link>
        </div>

        <PromptDemo />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {perks.map((p) => (
            <div key={p} className="flex items-start gap-2 p-4 rounded-xl border bg-card">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{p}</span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Works with {model}, ChatGPT, Claude, Gemini, DeepSeek, Llama, and any other major model — free forever, no limits.
        </p>
      </div>
    </div>
  );
}
