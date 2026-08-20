import { describe, it, expect } from "vitest";
import { executeLoopEngineering } from "@/lib/prompt-engine/loop-engine";

describe("Loop Engineering Optimizer", () => {
  it("should execute closed-loop refinement with sub-50ms latency", () => {
    const rawInput = "imrpove python web scrpaer with secutiy";
    const result = executeLoopEngineering(rawInput, { zeroFluff: true });

    expect(result).toBeDefined();
    expect(result.finalPrompt).toBeDefined();
    expect(result.finalPrompt.length).toBeGreaterThan(20);

    // Verify AutoCorrect was applied in Cycle 1
    expect(result.autoCorrect.correctionsCount).toBeGreaterThan(0);
    expect(result.autoCorrect.correctedText).toContain("scraper");

    // Verify LoopTrace telemetry
    expect(result.loopTrace.cyclesRun).toBeGreaterThanOrEqual(1);
    expect(result.loopTrace.finalScore).toBeGreaterThanOrEqual(result.loopTrace.initialScore);
    expect(result.loopTrace.converged).toBe(true);
    expect(result.loopTrace.latencyMs).toBeLessThan(100);

    // Verify zero-fluff output
    expect(result.finalPrompt).not.toContain("Prompt ID:");
    expect(result.finalPrompt).not.toContain("Date:");
    expect(result.finalPrompt).not.toContain("## Advanced Master Prompt");
  });

  it("should generate multi-candidate strategies and score breakdown", () => {
    const rawInput = "Build a Next.js 16 authentication system with NextAuth v5 and TypeScript.";
    const result = executeLoopEngineering(rawInput);

    expect(result.candidates.length).toBe(4);
    expect(result.hybridScore.totalScore).toBeGreaterThan(70);
    expect(result.hybridScore.dimensionBreakdown.clarity).toBeGreaterThan(0);
  });
});
