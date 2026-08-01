import type { Metadata } from "next";
import { ModelSeoPage } from "@/components/marketing/model-seo-page";

export const metadata: Metadata = {
  title: "ChatGPT Prompt Enhancer — Make Prompts That Work | Prompt+",
  description:
    "Free ChatGPT prompt enhancer. Paste a rough idea, get a structured, role-assigned prompt optimized for GPT-4o and ChatGPT. No limits, no credit card.",
};

export default function ChatGPTEnhancerPage() {
  return (
    <ModelSeoPage
      model="ChatGPT / GPT-4o"
      tagline="Turn vague ideas into structured, high-precision prompts ChatGPT actually nails — with role, context, constraints, and output format added automatically."
      perks={[
        "Structured prompts that reduce GPT-4o hallucinations and vague answers",
        "One-click open your enhanced prompt in ChatGPT",
        "Free Chrome extension that enhances right inside chatgpt.com",
        "100-point quality score with per-dimension breakdown",
        "No limits, no credit card — genuinely free forever",
      ]}
    />
  );
}
