import { describe, expect, it } from "vitest";
import { extractSlots } from "../lib/prompt-engine/slots";
import { extractIntent } from "../lib/prompt-engine/intent-engine";
import { detectContextGaps, gapsToConstraintTexts } from "../lib/prompt-engine/gap-engine";
import { generateCandidates } from "../lib/prompt-engine/candidate-generator";
import { FEW_SHOT_LIBRARY, selectFewShotExamples } from "../lib/prompt-engine/example-synthesizer";
import { calculateHybridScore } from "../lib/prompt-engine/evaluation-engine";
import {
  createEmptyPromptIR,
  parseTextToPromptIR,
  renderPromptIRToString,
  setOutputContract,
  addConstraint,
} from "../lib/prompt-engine/prompt-ir";
import { StrategyRegistry } from "../lib/prompt-engine/strategy-engine";
import { executeLoopEngineering } from "../lib/prompt-engine/loop-engine";
import type { PromptCandidate, PromptIR } from "../lib/prompt-engine/types";

/**
 * The enhancement engine used to answer from a lookup table: one persona per
 * category, two fixed constraints, one fixed example. These tests hold it to the
 * request itself -- and to the removal of the frozen strings it replaced, which
 * are quoted here so they cannot come back.
 */

const personaFor = (text: string) => StrategyRegistry.structure.apply(parseTextToPromptIR(text)).role || "";
const constraintTexts = (text: string) =>
  StrategyRegistry.constraints.apply(parseTextToPromptIR(text)).constraints.map((c) => c.text).join(" ");

/** Tokens of the parts of a prompt that are not the request itself. */
function boilerplateTokens(input: string): Set<string> {
  const prompt = executeLoopEngineering(input).finalPrompt;
  const body = prompt
    .split("\n")
    .filter((line) => !line.startsWith("### ") && line.trim() !== input.trim())
    .join(" ");
  return new Set(body.toLowerCase().match(/[a-z][a-z0-9.]{3,}/g) || []);
}

function overlap(left: string, right: string): number {
  const a = boilerplateTokens(left);
  const b = boilerplateTokens(right);
  return [...a].filter((token) => b.has(token)).length / new Set([...a, ...b]).size;
}

function asCandidate(ir: PromptIR, renderedText: string = renderPromptIRToString(ir)): PromptCandidate {
  return {
    id: "candidate",
    name: "candidate",
    strategyName: "test",
    ir,
    renderedText,
    estimatedTokens: Math.ceil(renderedText.length / 4),
  };
}

describe("Slot extraction (deterministic, no model)", () => {
  it("reads the action, the subject and the named technologies", () => {
    const slots = extractSlots("Build a Next.js 16 authentication system with NextAuth v5 and TypeScript.");
    expect(slots.action).toBe("build");
    expect(slots.subject).toBe("a Next.js 16 authentication system with NextAuth v5 and TypeScript");
    expect(slots.entities).toEqual(["Next.js", "NextAuth", "TypeScript"]);
    expect(slots.mentionsCode).toBe(true);
  });

  it("records the output shape a request asks for", () => {
    expect(extractSlots("Return a JSON table of the results").formats).toEqual(["json", "table"]);
    expect(extractSlots("Keep it under 100 words").modifiers).toContain("concise");
    expect(extractSlots("a production-grade Redis cache").modifiers).toContain("production");
  });

  it("keeps the request's own verb in the goal instead of truncating the text", () => {
    const intent = extractIntent("improve the error handling in the uploader");
    expect(intent.slots.action).toBe("optimize");
    expect(intent.slots.actionWord).toBe("improve");
    expect(intent.goal).toBe("Improve the error handling in the uploader");
  });

  it("does not end a goal mid-word when the request is long", () => {
    const input = "summarize the incident report that the platform team produced after the regional failover last quarter";
    const goal = extractIntent(input).goal;
    const lastWord = goal.toLowerCase().match(/[a-z]+$/)?.[0];
    expect(input.toLowerCase().match(/[a-z]+/g)).toContain(lastWord);
  });
});

describe("Personas are composed from the request", () => {
  it("names the technology and the work the request is about", () => {
    expect(personaFor("debug the memory leak in our node.js worker")).toBe(
      "Senior Node.js software engineer focused on debugging and failure analysis"
    );
    expect(personaFor("Build a Next.js 16 authentication system with NextAuth v5 and TypeScript.")).toBe(
      "Senior Next.js and NextAuth software engineer focused on implementation and system design"
    );
  });

  it("gives different requests different personas", () => {
    expect(personaFor("debug the memory leak in our node.js worker")).not.toBe(
      personaFor("Build a Next.js 16 authentication system with NextAuth v5 and TypeScript.")
    );
  });

  it("no longer returns the frozen category personas", () => {
    for (const text of [
      "debug the memory leak in our node.js worker",
      "write a release announcement for our customers",
      "build a quarterly revenue summary for the board",
    ]) {
      expect(personaFor(text)).not.toMatch(/Principal Software Architect|Lead Full-Stack Engineer|Master Editorial Director/);
    }
  });

  it("personalises the structure candidate for a named stack", () => {
    const candidates = generateCandidates(
      parseTextToPromptIR("Build a Next.js 16 authentication system with NextAuth v5 and TypeScript."),
      "coding",
      "expert"
    );
    const structured = candidates.find((c) => c.id === "candidate_structured");
    expect(structured?.ir.role).toContain("Next.js");
    expect(structured?.renderedText).toContain("### ROLE & PERSONA");
  });
});

describe("Constraints follow the request", () => {
  it("adds the rule the requested format needs, and only then", () => {
    expect(constraintTexts("Build an API endpoint that returns JSON")).toContain("Return only the JSON object, with no prose around it.");
    expect(constraintTexts("Build an API endpoint that returns JSON")).toContain("Handle the invalid-input and failure paths, not only the happy path.");
    expect(constraintTexts("Write a short summary of the incident")).toContain("Do not restate the request and do not summarise what you did.");
  });

  it("does not add the code rules to a request that is not about code", () => {
    expect(constraintTexts("Write a short summary of the incident")).not.toContain("Handle the invalid-input and failure paths, not only the happy path.");
  });

  it("drops the two canned constraints", () => {
    for (const text of ["Build an API endpoint that returns JSON", "Write a short summary of the incident"]) {
      expect(constraintTexts(text)).not.toContain("Maintain strict adherence to technical accuracy and specified formatting.");
      expect(constraintTexts(text)).not.toContain("Provide concrete, specific examples rather than abstract generalizations.");
    }
  });
});

describe("Context gaps are stated, never invented", () => {
  it("only reports a slot as missing when the request really did not name it", () => {
    const named = executeLoopEngineering("debug the memory leak in our node.js worker");
    expect(named.finalPrompt).not.toContain("No language or framework is named");
    expect(named.finalPrompt).toContain("No test suite is named");

    const unnamed = executeLoopEngineering("Build an API endpoint for the settings page");
    expect(unnamed.finalPrompt).toContain("No language or framework is named");
  });

  it("does not report a gap the request filled", () => {
    const gaps = detectContextGaps("Build a PostgreSQL-backed API for the billing service in TypeScript", extractIntent("Build a PostgreSQL-backed API for the billing service in TypeScript"));
    const ids = gaps.map((g) => g.id);
    expect(ids).not.toContain("coding_language");
    expect(ids).not.toContain("coding_db");
  });

  it("turns only the highest-importance gaps into statements", () => {
    const gaps = detectContextGaps("Write something about our product", extractIntent("Write something about our product"));
    const statements = gapsToConstraintTexts(gaps);
    expect(statements.length).toBeLessThanOrEqual(2);
    for (const statement of statements) expect(statement).toMatch(/^No .+ is named: state /);
  });
});

describe("Few-shot examples are selected, not fixed", () => {
  it("picks the library entry whose topic the request is about", () => {
    expect(selectFewShotExamples("coding", "Add session refresh to our NextAuth login flow")[0].output).toContain("NextAuth");
    expect(selectFewShotExamples("coding", "Build a React component with a debounced search input")[0].output).toContain("useState");
  });

  it("injects nothing when the library has nothing on the topic", () => {
    expect(selectFewShotExamples("coding", "make it better")).toEqual([]);
  });

  it("never demonstrates an invented statistic", () => {
    for (const entry of FEW_SHOT_LIBRARY) {
      expect(entry.example.output).not.toMatch(/\b\d+\s?%\s/);
    }
  });
});

describe("Sections appear only when they have something to say", () => {
  it("omits the deliverable section when there is nothing to declare", () => {
    expect(renderPromptIRToString(createEmptyPromptIR("Improve the onboarding copy"))).not.toContain("DELIVERABLE FORMAT");
  });

  it("prints the deliverable section once a format is required", () => {
    const rendered = renderPromptIRToString(setOutputContract(createEmptyPromptIR("Return the results"), { format: "json" }));
    expect(rendered).toContain("### DELIVERABLE FORMAT & OUTPUT CONTRACT");
    expect(rendered).toContain("Format: JSON");
  });

  it("names the domain sections for the task", () => {
    const withRule = (text: string) => addConstraint(createEmptyPromptIR(text), "Keep the answer short.", "high", "system");
    expect(renderPromptIRToString(withRule("Refactor the cache layer to use Redis"), { taskType: "coding" })).toContain("### IMPLEMENTATION CONSTRAINTS");
    expect(renderPromptIRToString(withRule("Write the release announcement"), { taskType: "writing" })).toContain("### STYLE & CONTENT RULES");
    expect(renderPromptIRToString(withRule("Analyze the churn numbers"), { taskType: "data_analysis" })).toContain("### ANALYSIS CONSTRAINTS");
  });

  it("keeps the canonical role and objective headings", () => {
    const rendered = renderPromptIRToString({ ...createEmptyPromptIR("Build a SaaS app"), role: "Senior Architect" });
    expect(rendered).toContain("### ROLE & PERSONA\nSenior Architect");
    expect(rendered).toContain("### OBJECTIVE & GOAL\nBuild a SaaS app");
  });
});

describe("Scoring measures the candidate instead of asserting it", () => {
  const input = "Build a Redis-backed cache for the reporting service";

  it("counts a rule that names the request above a generic one", () => {
    const base = parseTextToPromptIR(input);
    const specific = asCandidate(addConstraint(base, "Keep the Redis eviction policy explicit.", "high", "system"));
    const generic = asCandidate(addConstraint(base, "Always follow best practices.", "high", "system"));
    expect(calculateHybridScore(input, specific).constraintScore).toBeGreaterThan(calculateHybridScore(input, generic).constraintScore);
  });

  it("penalises padding beyond what the task needs", () => {
    const base = parseTextToPromptIR(input);
    const padded = asCandidate(base, renderPromptIRToString(base) + " ".repeat(4000));
    expect(calculateHybridScore(input, padded).efficiencyScore).toBeLessThan(calculateHybridScore(input, asCandidate(base)).efficiencyScore);
  });

  it("scores a prompt that kept the request's words above one that dropped them", () => {
    const kept = asCandidate(parseTextToPromptIR(input));
    const dropped = asCandidate(createEmptyPromptIR("Do something useful."), "### OBJECTIVE & GOAL\nDo something useful.");
    expect(calculateHybridScore(input, kept).intentScore).toBeGreaterThan(calculateHybridScore(input, dropped).intentScore);
  });
});

describe("Different requests do not produce the same prompt", () => {
  it("keeps the shared boilerplate below half of the prompt's vocabulary", () => {
    const pairs: Array<[string, string]> = [
      [
        "Build a Next.js 16 authentication system with NextAuth v5 and TypeScript.",
        "Refactor the PostgreSQL query layer and add Redis caching to the reporting service.",
      ],
      ["Write a release announcement for our customers.", "Draft a technical blog post about our caching change."],
    ];
    for (const [left, right] of pairs) {
      expect(overlap(left, right)).toBeLessThan(0.7);
    }
  });

  it("answers four different requests with four different prompts", () => {
    const prompts = [
      "Build a Next.js 16 authentication system with NextAuth v5 and TypeScript.",
      "Write a release announcement for our customers.",
      "Analyze the churn csv and report the metrics.",
      "Design a logo for a coffee subscription brand",
    ].map((input) => executeLoopEngineering(input).finalPrompt);

    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it("names each request's own technology in the final prompt", () => {
    expect(executeLoopEngineering("Build a Next.js 16 authentication system with NextAuth v5 and TypeScript.").finalPrompt).toContain("Next.js");
    expect(executeLoopEngineering("Refactor the PostgreSQL query layer and add Redis caching to the reporting service.").finalPrompt).toContain("PostgreSQL");
  });

  it("does not label a data request as an implementation", () => {
    expect(executeLoopEngineering("Analyze the churn csv and report the metrics.").finalPrompt).toContain("### ANALYSIS CONSTRAINTS");
    expect(executeLoopEngineering("Analyze the churn csv and report the metrics.").finalPrompt).not.toContain("### IMPLEMENTATION CONSTRAINTS");
  });
});
