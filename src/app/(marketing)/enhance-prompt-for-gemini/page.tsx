import type { Metadata } from "next";
import { ModelSeoPage } from "@/components/marketing/model-seo-page";

export const metadata: Metadata = {
  title: "Gemini Prompt Enhancer — Optimize Prompts for Gemini | Prompt+",
  description:
    "Free prompt enhancer for Gemini. Structure a rough request with a role, context, constraints, and an output format. On-device enhancement uses Chrome's built-in Gemini Nano when available.",
};

export default function GeminiEnhancerPage() {
  return (
    <ModelSeoPage
      model="Gemini"
      tagline="Craft a structured prompt for Google Gemini, or enhance on-device with Chrome's built-in Gemini Nano when your browser provides it."
      perks={[
        "Adds a role, context, constraints, and an output format to your request",
        "On-device enhancement with Chrome's built-in Gemini Nano when available",
        "Open your enhanced prompt in Gemini with one click",
        "Free Chrome extension that enhances inside gemini.google.com",
        "Free to use, no credit card",
      ]}
    />
  );
}
