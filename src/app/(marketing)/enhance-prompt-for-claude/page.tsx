import type { Metadata } from "next";
import { ModelSeoPage } from "@/components/marketing/model-seo-page";

export const metadata: Metadata = {
  title: "Claude Prompt Enhancer — Structure Prompts for Claude | Prompt+",
  description:
    "Free prompt enhancer for Claude. Get a structured, constraint-rich prompt you can review and edit before you send it. Open the result in Claude with one click.",
};

export default function ClaudeEnhancerPage() {
  return (
    <ModelSeoPage
      model="Claude"
      tagline="Build clear, constraint-rich prompts for Claude, with a role, context, and step-by-step instructions."
      perks={[
        "Adds an explicit role, context, and step-by-step instructions",
        "Open your enhanced prompt in Claude with one click",
        "Free Chrome extension that enhances inside claude.ai",
        "Reusable context rules you keep and add to each prompt",
        "Free to use, no credit card",
      ]}
    />
  );
}
