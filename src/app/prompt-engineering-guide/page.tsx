import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Ultimate AI Prompt Engineering Guide — Prompt+",
  description: "Learn research-backed prompt engineering techniques: Chain-of-Thought (CoT), Few-Shot conditioning, and structural boundary constraints.",
};

export const revalidate = 3600;

export default function PromptEngineeringGuidePage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-3xl mx-auto prose dark:prose-invert">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4 text-center">
        The Science-Backed Prompt Engineering Guide
      </h1>
      <p className="lead text-muted-foreground text-center mb-10">
        How to get 10x better results from ChatGPT, Claude, and Gemini using empirical research from AI labs.
      </p>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">1. Chain-of-Thought (CoT) Prompting</h2>
        <p className="text-sm leading-relaxed">
          Pioneered by <em>Wei et al. (2022) at Google Research</em>, Chain-of-Thought prompting forces large language models to output intermediate reasoning steps before arriving at a final answer. This reduces reasoning hallucinations by up to 60%.
        </p>

        <h2 className="text-2xl font-bold border-b pb-2">2. Role & Objective Conditioning</h2>
        <p className="text-sm leading-relaxed">
          Explicitly assigning a high-level persona (e.g. <code>&quot;You are a Principal Security Auditor&quot;</code>) conditions the transformer&apos;s latent activation state to prioritize domain-specific terminology and edge-case detection over generic responses.
        </p>

        <h2 className="text-2xl font-bold border-b pb-2">3. Structural Boundary Constraints</h2>
        <p className="text-sm leading-relaxed">
          Separating prompt context into clear sections (<code>### Role</code>, <code>### Context</code>, <code>### Instructions</code>, <code>### Constraints</code>) eliminates ambiguity and keeps long context windows focused.
        </p>

        <div className="mt-10 p-6 rounded-xl border bg-muted/30 text-center not-prose">
          <h3 className="text-lg font-bold mb-2">Automate Science-Backed Prompts Instantly</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Prompt+ automatically applies all these research techniques in sub-100ms on-device.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center font-semibold text-sm px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Prompt+ Free →
          </Link>
        </div>
      </section>
    </div>
  );
}
