import type { Metadata } from "next";
import { ModelSeoPage } from "@/components/marketing/model-seo-page";

export const metadata: Metadata = {
  title: "Gemini Prompt Enhancer — Optimize Prompts for Gemini | Prompt+",
  description:
    "Free Gemini prompt enhancer. Structure your prompts for Google Gemini with role, context, constraints, and format specs. Enhance on-device with Gemini Nano — private and offline.",
};

export default function GeminiEnhancerPage() {
  return (
    <ModelSeoPage
      model="Gemini"
      tagline="Craft prompts that get sharper, more consistent answers from Google Gemini — including free on-device enhancement via Chrome's Gemini Nano."
      perks={[
        "Structured prompts tuned for Gemini's style and reasoning",
        "On-device enhancement with Gemini Nano — private, offline, zero cost",
        "One-click open your enhanced prompt in Gemini",
        "Free Chrome extension that enhances right inside gemini.google.com",
        "No limits, no credit card — genuinely free forever",
      ]}
    />
  );
}
