/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildNanoGeminiPrompt,
  checkDeviceAvailability,
  enhanceWithDeviceOrFallback,
} from "@/lib/llm/device-ai";

describe("Gemini Nano prompt generation and fallback", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore window
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it("builds a high-density, structured prompt tailored for Gemini Nano", () => {
    const { systemPrompt, userPrompt } = buildNanoGeminiPrompt({
      text: "Write a function to compute fibonacci numbers in TypeScript",
      category: "Coding",
      tone: "Technically Rigorous",
      length: "Concise",
    });

    expect(systemPrompt).toContain("Gemini Nano Prompt Architect");
    expect(systemPrompt).toContain("### Role & Persona");
    expect(systemPrompt).toContain("### Core Objective");
    expect(systemPrompt).toContain("### Execution Steps");
    expect(systemPrompt).toContain("### Constraints & Guardrails");

    expect(userPrompt).toContain("[INPUT TASK SPECIFICATIONS]");
    expect(userPrompt).toContain("Category: Coding");
    expect(userPrompt).toContain("Tone Profile: Technically Rigorous");
    expect(userPrompt).toContain("fibonacci numbers in TypeScript");
  });

  it("falls back cleanly to local engine when window is undefined or lacks AI", async () => {
    delete (globalThis as any).window;

    const result = await enhanceWithDeviceOrFallback({
      text: "Draft an announcement for our new open source release",
      category: "Marketing",
      tone: "Excited & Professional",
    });

    expect(result.source).toBe("engine");
    expect(result.fallback).toBe(true);
    expect(result.engineName).toBe("Local Deterministic Engine");
    expect(result.enhancedText).toBeTruthy();
    expect(result.fallbackReason).toContain("not supported");
  });

  it("runs on Gemini Nano when available and strips wrapper chatter", async () => {
    const mockPrompt = vi.fn().mockResolvedValue(`
Here is your optimized prompt:

### Role & Persona
Lead Systems Engineer

### Core Objective
Implement a production-grade Fibonacci sequence calculator in TypeScript.

### Constraints & Guardrails
- Avoid recursion without memoization.
- Ensure strict typing.
    `);

    const mockDestroy = vi.fn();
    const mockCreate = vi.fn().mockResolvedValue({
      prompt: mockPrompt,
      destroy: mockDestroy,
    });

    (globalThis as any).window = {
      ai: {
        languageModel: {
          capabilities: vi.fn().mockResolvedValue({ available: "readily" }),
          create: mockCreate,
        },
      },
    };

    const result = await enhanceWithDeviceOrFallback({
      text: "TypeScript fibonacci function",
    });

    expect(result.source).toBe("nano");
    expect(result.fallback).toBe(false);
    expect(result.engineName).toBe("Gemini Nano (On-Device)");
    expect(result.enhancedText).not.toContain("Here is your optimized prompt:");
    expect(result.enhancedText).toContain("### Role & Persona");
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it("falls back to local engine when Gemini Nano session throws during execution", async () => {
    const mockPrompt = vi.fn().mockRejectedValue(new Error("GPU context lost / OOM"));
    const mockDestroy = vi.fn();
    const mockCreate = vi.fn().mockResolvedValue({
      prompt: mockPrompt,
      destroy: mockDestroy,
    });

    (globalThis as any).window = {
      LanguageModel: {
        availability: vi.fn().mockResolvedValue("available"),
        create: mockCreate,
      },
    };

    const result = await enhanceWithDeviceOrFallback({
      text: "Create a design system token structure",
    });

    expect(result.source).toBe("engine");
    expect(result.fallback).toBe(true);
    expect(result.fallbackReason).toContain("GPU context lost");
    expect(result.enhancedText).toBeTruthy();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it("checks availability with both capabilities() and availability() signatures", async () => {
    (globalThis as any).window = {
      ai: {
        languageModel: {
          capabilities: vi.fn().mockResolvedValue({ available: "after-download" }),
        },
      },
    };

    expect(await checkDeviceAvailability()).toBe("downloading");

    (globalThis as any).window = {
      LanguageModel: {
        availability: vi.fn().mockResolvedValue("readily"),
      },
    };

    expect(await checkDeviceAvailability()).toBe("available");
  });
});
