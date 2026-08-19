import { describe, it, expect } from "vitest";
import { cleanMasterPromptOutput } from "@/lib/llm/meta-prompt";
import { cleanPromptResponse } from "@/lib/prompt-engine/cleaner";

describe("Zero-Fluff Master Prompt Cleaner", () => {
  it("should strip Prompt ID, Date, meta titles, preamble paragraphs, and Roman numeral bloat", () => {
    const bloatedInput = `## Advanced Master Prompt: Building Your Own LLM - A Structured Approach

**Prompt ID:** LLM-BUILD-V1.0
**Date:** October 26, 2023

This prompt aims to guide the user through the process of building their own Large Language Model (LLM). It emphasizes a strategic approach...

---

**I. ROLE:** AI Research Engineer & LLM Architect

**Description:** You are a highly experienced AI Research Engineer...

---

**II. SPECIFICATIONS (Output Requirements & Formatting)**

* Output Format: JSON format where each section is clearly labeled.

---

**III. EXECUTION STEPS**

1. Data Availability Assessment.

---

**IV. ADDITIONAL CONSIDERATIONS**

* Cost Estimation.

---

**Output Format:** The requested output will be a single JSON document adhering to the defined structure.
This prompt prioritizes a thorough and grounded response.`;

    const cleaned = cleanMasterPromptOutput(bloatedInput);

    // Verify Prompt ID and Date headers are removed
    expect(cleaned).not.toContain("Prompt ID:");
    expect(cleaned).not.toContain("LLM-BUILD-V1.0");
    expect(cleaned).not.toContain("October 26, 2023");
    expect(cleaned).not.toContain("## Advanced Master Prompt");
    expect(cleaned).not.toContain("This prompt aims to guide the user");

    // Verify Roman numeral headers were converted to clean section headers
    expect(cleaned).toContain("### ROLE & PERSONA");
    expect(cleaned).toContain("### SPECIFICATIONS & REQUIREMENTS");
    expect(cleaned).toContain("### EXECUTION STEPS");
    expect(cleaned).toContain("### CONSTRAINTS & OPERATING RULES");

    // Verify concluding meta disclaimers are removed
    expect(cleaned).not.toContain("This prompt prioritizes a thorough");
    expect(cleaned).not.toContain("The requested output will be a single JSON document");
  });

  it("should clean prompt response via cleanPromptResponse", () => {
    const raw = `Here is your enhanced prompt:

## Advanced Master Prompt: Web Scraper

**Prompt ID:** SCRAPE-101

**I. ROLE:** Principal Software Engineer

Build a Python web scraper.`;

    const cleaned = cleanPromptResponse(raw, { zeroFluff: true });
    expect(cleaned).not.toContain("Here is your enhanced prompt");
    expect(cleaned).not.toContain("Prompt ID:");
    expect(cleaned).toContain("### ROLE & PERSONA");
    expect(cleaned).toContain("Build a Python web scraper.");
  });
});
