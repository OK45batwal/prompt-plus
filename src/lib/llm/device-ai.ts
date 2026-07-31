import { buildArchitectMetaPrompt } from "./meta-prompt";

interface LanguageModelSession {
  prompt(input: string): Promise<string>;
  destroy(): void;
}

interface LanguageModelAvailability {
  availability(): Promise<"available" | "unavailable" | "downloading">;
  create(opts?: { temperature?: number; topK?: number }): Promise<LanguageModelSession>;
}

interface WindowWithLanguageModel extends Window {
  LanguageModel?: LanguageModelAvailability;
}

export interface DeviceEnhanceOptions {
  text: string;
  category?: string;
  tone?: string;
  length?: string;
  tokenSaver?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getLanguageModel(): LanguageModelAvailability | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  if (w.LanguageModel) return w.LanguageModel;
  if (w.ai?.languageModel) return w.ai.languageModel;
  return null;
}

export function isDeviceAISupported(): boolean {
  return getLanguageModel() !== null;
}

export async function checkDeviceAvailability(): Promise<"available" | "unavailable" | "downloading"> {
  const lm = getLanguageModel();
  if (!lm) return "unavailable";
  try {
    const res = await lm.availability();
    if (res === "available" || res === "readily" as any) return "available";
    if (res === "downloading" || res === "after-download" as any) return "downloading";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

export async function enhanceWithDevice(options: DeviceEnhanceOptions): Promise<string> {
  const lm = getLanguageModel();
  if (!lm) {
    throw new Error(
      "Device AI not supported in this browser. Open in Chrome 138+ with Gemini Nano enabled (Settings → Experimental AI → Prompt API)."
    );
  }

  const availability = await checkDeviceAvailability();
  if (availability === "unavailable") {
    throw new Error(
      "Gemini Nano is not available on this device. Needs Chrome 138+, 22GB+ free storage, macOS 13+/Windows 10+/Linux."
    );
  }

  const session = await lm.create({ temperature: 0.1, topK: 1 });

  try {
    const { metaPrompt, systemInstruction } = buildArchitectMetaPrompt(
      options.text,
      options.category,
      options.tone,
      options.length
    );

    const tokenSaverClause = options.tokenSaver
      ? "\n\nTighten the output to ~40% fewer tokens while keeping every section complete and lossless."
      : "";

    const instruction = `${systemInstruction}${tokenSaverClause}\n\n${metaPrompt}`;
    const result = await session.prompt(instruction);
    return result.trim();
  } finally {
    session.destroy();
  }
}
