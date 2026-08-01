import type { Metadata } from "next";
import { ModelSeoPage } from "@/components/marketing/model-seo-page";

export const metadata: Metadata = {
  title: "Claude Prompt Enhancer — Structure Prompts for Claude | Prompt+",
  description:
    "Free Claude prompt enhancer. Get structured, constraint-rich prompts optimized for Claude 3.5 Sonnet and Claude.ai. Open the result in Claude with one click.",
};

export default function ClaudeEnhancerPage() {
  return (
    <ModelSeoPage
      model="Claude"
      tagline="Build clear, constraint-rich prompts that make the most of Claude's long context and careful reasoning."
      perks={[
        "Adds explicit role, context, and step-by-step instructions Claude follows reliably",
        "One-click open your enhanced prompt in Claude",
        "Free Chrome extension that enhances right inside claude.ai",
        "Expert level adds chain-of-thought reasoning for complex tasks",
        "No limits, no credit card — genuinely free forever",
      ]}
    />
  );
}
