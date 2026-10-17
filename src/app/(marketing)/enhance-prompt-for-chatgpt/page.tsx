import type { Metadata } from "next";
import { ModelSeoPage } from "@/components/marketing/model-seo-page";

export const metadata: Metadata = {
  title: "ChatGPT Prompt Enhancer — Make Prompts That Work | Prompt+",
  description:
    "Free prompt enhancer for ChatGPT. Paste a rough idea and get a clearer, structured prompt you can review and edit before you send it.",
};

export default function ChatGPTEnhancerPage() {
  return (
    <ModelSeoPage
      model="ChatGPT / GPT-4o"
      tagline="Turn a vague idea into a structured prompt with a role, context, constraints, and an output format, ready to review before you send it."
      perks={[
        "Adds a role, context, constraints, and an output format to your request",
        "Open your enhanced prompt in ChatGPT with one click",
        "Free Chrome extension that enhances inside chatgpt.com",
        "A 0–100 structural score across clarity, specificity, and actionability",
        "Free to use, no credit card",
      ]}
    />
  );
}
