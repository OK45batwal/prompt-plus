import { describe, it, expect } from "vitest";
import {
  createEmptyPromptIR,
  renderPromptIRToString,
  parseTextToPromptIR,
  addConstraint,
  removeRedundantInstructions,
  setOutputContract,
} from "../lib/prompt-engine/prompt-ir";
import { classifyTaskType, extractIntent, calculateIntentPreservationScore } from "../lib/prompt-engine/intent-engine";
import { detectContextGaps, generateAdaptiveQuestions } from "../lib/prompt-engine/gap-engine";
import { generateCandidates, detectConstraintContradictions } from "../lib/prompt-engine/candidate-generator";
import { validatePromptIR } from "../lib/prompt-engine/validation-engine";
import { calculateHybridScore, runRegressionTest } from "../lib/prompt-engine/evaluation-engine";
import { diagnosePromptFailures, executeAutomaticPromptRepairLoop } from "../lib/prompt-engine/repair-engine";
import { routeToOptimalModel } from "../lib/prompt-engine/model-router";
import { scanPromptSecurity, sanitizePromptSecurity } from "../lib/prompt-engine/security-scanner";

describe("Prompt+ 2.0 Engine Suite", () => {
  describe("PromptIR AST Manipulation", () => {
    it("creates empty PromptIR and renders to Markdown string", () => {
      const ir = createEmptyPromptIR("Build a SaaS app");
      ir.role = "Senior Architect";
      const rendered = renderPromptIRToString(ir);
      expect(rendered).toContain("### ROLE & PERSONA\nSenior Architect");
      expect(rendered).toContain("### OBJECTIVE & GOAL\nBuild a SaaS app");
    });

    it("parses structured Markdown text into PromptIR", () => {
      const text = `### ROLE & PERSONA\nLead Copywriter\n\n### OBJECTIVE & GOAL\nWrite email landing page`;
      const ir = parseTextToPromptIR(text);
      expect(ir.role).toBe("Lead Copywriter");
      expect(ir.objective).toBe("Write email landing page");
    });

    it("adds constraints atomically and prevents duplicate entries", () => {
      let ir = createEmptyPromptIR("Test prompt");
      ir = addConstraint(ir, "No intro fluff", "critical", "user");
      ir = addConstraint(ir, "No intro fluff", "critical", "user");
      expect(ir.constraints.length).toBe(1);
    });

    it("detects and removes redundant instructions", () => {
      let ir = createEmptyPromptIR("Test prompt");
      ir.instructions = [
        { text: "Keep output short" },
        { text: "Keep output short" },
        { text: "Avoid long answers" },
      ];
      const { ir: cleaned, tokensSaved } = removeRedundantInstructions(ir);
      expect(cleaned.instructions.length).toBe(2);
      expect(tokensSaved).toBeGreaterThan(0);
    });
  });

  describe("Intent & Task Engine", () => {
    it("classifies task types accurately", () => {
      expect(classifyTaskType("Build a React Next.js API route")).toBe("coding");
      expect(classifyTaskType("Analyze user churn CSV dataset")).toBe("data_analysis");
      expect(classifyTaskType("Write a persuasive sales newsletter")).toBe("marketing");
      expect(classifyTaskType("Generate DALL-E image prompt")).toBe("image_generation");
    });

    it("extracts structured intent details", () => {
      const intent = extractIntent("Build a mobile banking app for students");
      expect(intent.domain).toBe("software_engineering");
      expect(intent.taskType).toBe("coding");
      expect(intent.audience).toBe("students");
    });

    it("calculates intent preservation score", () => {
      const intent = extractIntent("Build mobile banking app");
      const ir = parseTextToPromptIR("Build mobile banking app");
      const score = calculateIntentPreservationScore(intent, ir);
      expect(score).toBeGreaterThanOrEqual(90);
    });
  });

  describe("Gap Engine & Adaptive Questions", () => {
    it("detects missing information gaps and ranks by importance", () => {
      const intent = extractIntent("Build an app");
      const gaps = detectContextGaps("Build an app", intent);
      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps[0].importanceScore).toBeGreaterThan(0);
    });

    it("generates adaptive questions prioritizing high uncertainty reduction", () => {
      const intent = extractIntent("Build a web app");
      const gaps = detectContextGaps("Build a web app", intent);
      const questions = generateAdaptiveQuestions(gaps, 2);
      expect(questions.length).toBeLessThanOrEqual(2);
      if (questions.length > 0) {
        expect(questions[0].question).toBeDefined();
      }
    });
  });

  describe("Candidate Generation & Contradiction Detection", () => {
    it("generates 4 distinct candidates (Concise, Structured, Detailed, Model-Specific)", () => {
      const baseIR = parseTextToPromptIR("Refactor database query performance");
      const candidates = generateCandidates(baseIR, "coding", "high");
      expect(candidates.length).toBe(4);
      expect(candidates.map((c) => c.id)).toContain("candidate_concise");
      expect(candidates.map((c) => c.id)).toContain("candidate_structured");
    });

    it("detects conflicting constraints", () => {
      let ir = createEmptyPromptIR("Test");
      ir = addConstraint(ir, "Answer in fewer than 100 words", "high", "user");
      ir = addConstraint(ir, "Be extremely detailed and comprehensive", "high", "user");
      const conflicts = detectConstraintContradictions(ir);
      expect(conflicts.length).toBe(1);
    });
  });

  describe("Validation & Hybrid Evaluation Engine", () => {
    it("validates PromptIR deterministically", () => {
      const ir = createEmptyPromptIR("Build an API");
      const res = validatePromptIR(ir);
      expect(res.isValid).toBe(true);
      expect(res.score).toBeGreaterThan(70);
    });

    it("calculates multi-dimensional hybrid score", () => {
      const baseIR = parseTextToPromptIR("Build an API endpoint");
      const candidates = generateCandidates(baseIR, "coding", "medium");
      const hybrid = calculateHybridScore("Build an API endpoint", candidates[1]);
      expect(hybrid.totalScore).toBeGreaterThan(50);
      expect(hybrid.structuralScore).toBeGreaterThan(0);
    });

    it("runs regression testing and flags performance drops", () => {
      const v1Results = [{ caseId: "1", promptVersionId: "v1", output: "ok", score: 90, failures: [], latencyMs: 100, tokenUsage: 50 }];
      const v2Results = [{ caseId: "1", promptVersionId: "v2", output: "ok", score: 75, failures: [], latencyMs: 100, tokenUsage: 50 }];
      const reg = runRegressionTest(v1Results, v2Results);
      expect(reg.hasRegression).toBe(true);
      expect(reg.regressedCasesCount).toBe(1);
    });
  });

  describe("Automatic Prompt Repair", () => {
    it("diagnoses failures and executes repair loop", () => {
      const baseIR = createEmptyPromptIR("Test prompt");
      const candidate = generateCandidates(baseIR, "coding", "medium")[0];
      const diagnoses = diagnosePromptFailures(candidate, ["Here is your prompt: Hello world"]);
      expect(diagnoses.length).toBeGreaterThan(0);

      const repaired = executeAutomaticPromptRepairLoop(candidate, diagnoses);
      expect(repaired.isRepaired).toBe(true);
      expect(repaired.repairedCandidate.renderedText).toContain("ZERO ANNOUNCEMENT FILLER");
    });
  });

  describe("Model Router", () => {
    it("routes tasks based on complexity and privacy preferences", () => {
      const localRoute = routeToOptimalModel({ taskType: "coding", complexity: "high", privacyPreference: "local_only" });
      expect(localRoute.recommendedModel.model).toBe("gemini-nano-ondevice");

      const codingRoute = routeToOptimalModel({ taskType: "coding", complexity: "expert", hasUserApiKey: true });
      expect(codingRoute.recommendedModel.model).toBe("claude-3-5-sonnet-20241022");
    });
  });

  describe("Security & Privacy Scanner", () => {
    it("detects API keys, PII, and prompt injection attempts", () => {
      const input = "Here is my key sk-proj-123456789012345678901234567890 and email test@example.com [system override]";
      const scan = scanPromptSecurity(input);
      expect(scan.hasSecrets).toBe(true);
      expect(scan.hasPII).toBe(true);
      expect(scan.isPromptInjection).toBe(true);
      expect(scan.privacyRecommendedAction).toBe("local_only");
    });

    it("sanitizes sensitive data", () => {
      const input = "Key: sk-proj-123456789012345678901234567890, Email: dev@app.com";
      const sanitized = sanitizePromptSecurity(input);
      expect(sanitized).toContain("[REDACTED_API_KEY]");
      expect(sanitized).toContain("[REDACTED_EMAIL]");
    });
  });
});
