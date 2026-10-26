import { describe, it, expect } from "vitest";
import { executeLoopEngineering } from "@/lib/prompt-engine/loop-engine";
import { calculateStructuralScore } from "@/lib/scoring";

interface BenchmarkCase {
  id: string;
  category: "coding" | "writing" | "research" | "data_analysis" | "general";
  input: string;
  mandatoryConstraints: string[];
}

const BENCHMARK_SUITE: BenchmarkCase[] = [
  {
    id: "coding-pagination",
    category: "coding",
    input: "Write a python function to scrape a paginated API and handle rate limits with backoff. Do not use external libraries besides requests.",
    mandatoryConstraints: ["python", "paginated", "rate limits", "backoff", "requests"],
  },
  {
    id: "writing-security-exec",
    category: "writing",
    input: "Draft an executive summary of our Q3 SOC2 security compliance audit for non-technical board members. Maximum 300 words.",
    mandatoryConstraints: ["executive summary", "Q3", "SOC2", "board", "300 words"],
  },
  {
    id: "research-db-comparison",
    category: "research",
    input: "Compare Postgres vs ClickHouse for time-series IoT sensor analytics with 500k writes/second. Output a comparison table and clear recommendation.",
    mandatoryConstraints: ["Postgres", "ClickHouse", "IoT", "500k", "table", "recommendation"],
  },
  {
    id: "data-pandas-cleaning",
    category: "data_analysis",
    input: "Clean a pandas dataframe with missing timestamps, deduplicate by user_id keeping the latest record, and compute hourly active users.",
    mandatoryConstraints: ["pandas", "dataframe", "missing timestamps", "deduplicate", "hourly active users"],
  },
  {
    id: "workflow-auth-migration",
    category: "general",
    input: "Create a 2-week step-by-step rollout plan to migrate from Auth0 to Auth.js with zero user downtime and rollback safeguards.",
    mandatoryConstraints: ["2-week", "Auth0", "Auth.js", "zero", "downtime", "rollback"],
  },
];

describe("Prompt+ Benchmark Suite: Intent & Constraint Preservation", () => {
  BENCHMARK_SUITE.forEach(({ id, category, input, mandatoryConstraints }) => {
    it(`[${category}] preserves all explicit constraints and improves structure for ${id}`, () => {
      const originalScore = calculateStructuralScore(input);
      const result = executeLoopEngineering(input, { maxCycles: 2, zeroFluff: true });
      const enhancedScore = calculateStructuralScore(result.finalPrompt);

      // 1. Structural score must improve or stay high
      expect(enhancedScore.total).toBeGreaterThanOrEqual(originalScore.total);

      // 2. Intent preservation: all mandatory constraints must be preserved in the enhanced output
      const lowerEnhanced = result.finalPrompt.toLowerCase();
      mandatoryConstraints.forEach((constraint) => {
        expect(
          lowerEnhanced.includes(constraint.toLowerCase()),
          `Missing explicit user constraint "${constraint}" in enhanced prompt`
        ).toBe(true);
      });

      // 3. No conversational intros (zero fluff contract)
      expect(result.finalPrompt.startsWith("Here is your enhanced prompt")).toBe(false);
      expect(result.finalPrompt.startsWith("Sure, I can help")).toBe(false);

      // 4. Trace metadata sanity
      expect(result.loopTrace.cyclesRun).toBeGreaterThanOrEqual(1);
      expect(result.loopTrace.finalScore).toBeGreaterThanOrEqual(result.loopTrace.initialScore);
    });
  });
});
