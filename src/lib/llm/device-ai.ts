import { EnhanceLevel, sanitizeUserInput, detectImplicitTone, cleanMasterPromptOutput } from "./meta-prompt";
import { executeLoopEngineering } from "@/lib/prompt-engine/loop-engine";

interface LanguageModelSession {
  prompt(input: string): Promise<string>;
  destroy(): void;
}

interface LanguageModelAvailability {
  availability?(): Promise<"available" | "unavailable" | "downloading" | string>;
  capabilities?(): Promise<{ available: "readily" | "after-download" | "no" | string }>;
  create(opts?: { systemPrompt?: string; temperature?: number; topK?: number }): Promise<LanguageModelSession>;
}

export interface DeviceEnhanceOptions {
  text: string;
  category?: string;
  tone?: string;
  length?: string;
  tokenSaver?: boolean;
  level?: EnhanceLevel;
}

export interface DeviceEnhanceResult {
  enhancedText: string;
  source: "nano" | "engine";
  engineName: string;
  latencyMs: number;
  fallback: boolean;
  fallbackReason?: string;
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
    let res: string | undefined;
    if (typeof (lm as any).capabilities === "function") {
      const caps = await (lm as any).capabilities();
      res = caps?.available;
    } else if (typeof (lm as any).availability === "function") {
      res = await (lm as any).availability();
    }
    if (res === "available" || res === "readily") return "available";
    if (res === "downloading" || res === "after-download") return "downloading";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

/**
 * Optimized prompt blueprint engineered specifically for Google Gemini Nano on-device AI.
 * Employs clean delimiters, high instructional density, and strict role contracts
 * to prevent context overflow or hallucinations in constrained on-device runtimes.
 */
export function buildNanoGeminiPrompt(options: DeviceEnhanceOptions): { systemPrompt: string; userPrompt: string } {
  const sanitized = sanitizeUserInput(options.text);
  const detectedTone = options.tone || detectImplicitTone(sanitized);
  const targetCategory = options.category || "General Task";
  const targetLength = options.length || "Production-Ready & Concrete";
  const level = options.level || "deep";

  const systemPrompt = `You are Gemini Nano Prompt Architect — Google's on-device AI prompt optimization engine.
Your sole mission is to transform raw, incomplete, or informal user requests into structured, professional, production-grade Master Prompts.

OPERATIONAL CONTRACT:
1. START IMMEDIATELY with "### Role & Persona". Never output conversational greetings ("Here is your prompt:"), preamble, or wrapping markdown fences.
2. ARCHITECTURE OF THE MASTER PROMPT:
   - ### Role & Persona: Authoritative expert identity and domain competence.
   - ### Core Objective: Clear problem statement, primary goal, and unambiguous success deliverables.
   - ### Execution Steps: Sequential, step-by-step instructions to methodically complete the task.
   - ### Constraints & Guardrails: Strict negative boundaries (e.g., "Do NOT use placeholders or generic filler", "Do NOT assume unverified facts", tone: ${detectedTone}).
   - ### Output Specification: Exact layout requirements (clean markdown, tables, bullet points, or schema).
3. FIDELITY: Retain every explicit entity, variable, and technical detail from the raw prompt.
4. ZERO FLUFF: Eliminate all meta-commentary, introductory remarks, and conclusion sign-offs.`;

  const userPrompt = `[INPUT TASK SPECIFICATIONS]
- Category: ${targetCategory}
- Tone Profile: ${detectedTone}
- Depth / Length: ${targetLength}
- Reasoning Depth: ${level.toUpperCase()}${options.tokenSaver ? "\n- Token Economy: High-density wording (~40% fewer tokens, lossless)" : ""}

[RAW PROMPT TO OPTIMIZE]
"""
${sanitized}
"""

Compile the production Master Prompt now. Output ONLY the finalized prompt starting with "### Role & Persona":`;

  return { systemPrompt, userPrompt };
}

/**
 * Execute enhancement using Chrome Gemini Nano on-device AI.
 * Throws an error if Gemini Nano is not available or encounters an execution failure.
 */
export async function enhanceWithDevice(options: DeviceEnhanceOptions): Promise<string> {
  const lm = getLanguageModel();
  if (!lm) {
    throw new Error("On-device AI is unavailable in this browser.");
  }

  const availability = await checkDeviceAvailability();
  if (availability === "unavailable") {
    throw new Error("On-device AI is unavailable in this browser.");
  }

  const { systemPrompt, userPrompt } = buildNanoGeminiPrompt(options);
  let session: LanguageModelSession | null = null;
  let systemPromptSetInCreate = false;

  try {
    session = await (lm as any).create({
      systemPrompt,
      temperature: 0.1,
      topK: 1,
    });
    systemPromptSetInCreate = true;
  } catch {
    session = await lm.create({ temperature: 0.1, topK: 1 });
  }

  if (!session) {
    throw new Error("Failed to create on-device AI session.");
  }

  try {
    const input = systemPromptSetInCreate ? userPrompt : `${systemPrompt}\n\n${userPrompt}`;
    const rawResult = await session.prompt(input);
    const cleaned = cleanMasterPromptOutput(rawResult);
    return cleaned.trim();
  } finally {
    session.destroy();
  }
}

/**
 * Local deterministic engine fallback when Gemini Nano is unavailable or encounters an error.
 */
function runLocalEngineFallback(
  options: DeviceEnhanceOptions,
  startTime: number,
  fallbackReason?: string
): DeviceEnhanceResult {
  const preferences = [
    options.tone && `Tone: ${options.tone}`,
    options.length && `Length: ${options.length}`,
    options.category && `Category: ${options.category}`,
  ]
    .filter(Boolean)
    .join("\n");

  const inputWithPrefs = preferences ? `${options.text}\n\n${preferences}` : options.text;
  const loopResult = executeLoopEngineering(inputWithPrefs, {
    zeroFluff: true,
    maxCycles: options.level === "quick" ? 1 : 3,
  });

  const enhancedText = cleanMasterPromptOutput(
    loopResult.selectedCandidate.renderedText || loopResult.finalPrompt
  );

  return {
    enhancedText,
    source: "engine",
    engineName: "Local Deterministic Engine",
    latencyMs: Math.max(1, Date.now() - startTime),
    fallback: true,
    fallbackReason,
  };
}

/**
 * Primary enhancement entrypoint for local execution:
 * 1. Checks if Google Gemini Nano on-device AI is available.
 * 2. If available, optimizes the prompt locally using Gemini Nano with the improved prompt contract.
 * 3. If unavailable, downloading, or if runtime generation fails, seamlessly falls back to the deterministic local engine.
 */
export async function enhanceWithDeviceOrFallback(
  options: DeviceEnhanceOptions
): Promise<DeviceEnhanceResult> {
  const startTime = Date.now();
  const lm = getLanguageModel();

  if (lm) {
    const availability = await checkDeviceAvailability();
    if (availability === "available") {
      try {
        const { systemPrompt, userPrompt } = buildNanoGeminiPrompt(options);
        let session: LanguageModelSession | null = null;
        let systemPromptSetInCreate = false;

        try {
          session = await (lm as any).create({
            systemPrompt,
            temperature: 0.1,
            topK: 1,
          });
          systemPromptSetInCreate = true;
        } catch {
          session = await lm.create({ temperature: 0.1, topK: 1 });
        }

        if (session) {
          try {
            const input = systemPromptSetInCreate ? userPrompt : `${systemPrompt}\n\n${userPrompt}`;
            const rawResult = await session.prompt(input);
            const cleaned = cleanMasterPromptOutput(rawResult);

            if (cleaned && cleaned.trim().length > 20) {
              return {
                enhancedText: cleaned.trim(),
                source: "nano",
                engineName: "Gemini Nano (On-Device)",
                latencyMs: Math.max(1, Date.now() - startTime),
                fallback: false,
              };
            }
          } finally {
            session.destroy();
          }
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : "On-device generation failed";
        return runLocalEngineFallback(options, startTime, reason);
      }
    } else {
      const reason =
        availability === "downloading"
          ? "Gemini Nano is currently downloading on this device"
          : "Gemini Nano is unavailable in this browser";
      return runLocalEngineFallback(options, startTime, reason);
    }
  }

  return runLocalEngineFallback(
    options,
    startTime,
    "Chrome Built-in AI (Gemini Nano) is not supported in this browser"
  );
}
