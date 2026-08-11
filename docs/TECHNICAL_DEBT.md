# Prompt+ Technical Debt & Refactoring Assessment

This document outlines structural limitations and areas requiring enhancement to transition Prompt+ from a simple prompt enhancer to **Prompt+ 2.0 (Intelligent Prompt Engineering & Optimization System)**.

---

## 1. Compiler Limitations & Lack of Internal Representation

* **Current Reality:** The existing compiler converts `string in` $\rightarrow$ `string out` using static meta-prompt wrapper templates in [`src/lib/llm/meta-prompt.ts`](file:///Users/omkar/prompt-plus/src/lib/llm/meta-prompt.ts).
* **Deficit:** There is no intermediate AST or structured representation (`PromptIR`). The system cannot programmatically add a constraint, compress context, change target output schema, or alter tone without re-compiling the entire prompt string with an LLM call.
* **Target Fix:** Introduce `PromptIR` / `PromptAST` interface supporting atomic manipulation of `role`, `objective`, `context`, `instructions`, `constraints`, `examples`, and `output`.

---

## 2. Heuristic-Only Scoring System

* **Current Reality:** [`src/lib/scoring.ts`](file:///Users/omkar/prompt-plus/src/lib/scoring.ts) calculates score based on simple regex keywords (`[ROLE]`, `[CONSTRAINTS]`, `[STEPS]`) and basic word counts.
* **Deficit:** Scores do not reflect actual prompt performance, model execution results, semantic intent preservation, or task-specific metrics. A 400-word prompt filled with repetitive fluff scores high simply because of word count and bracket markers.
* **Target Fix:** Build a multi-dimensional Evaluation Engine combining deterministic checks, semantic LLM evaluation, actual model execution testing, and intent preservation scoring.

---

## 3. Single-Candidate Generation & Lack of Evidentiary Evaluation

* **Current Reality:** Enhancer returns 1 single output prompt. The system assumes longer, bracketed prompts are inherently better.
* **Deficit:** No candidate generation (e.g. Concise vs Structured vs Detailed vs Model-Specific), no real model execution comparison (Input $\rightarrow$ Model Output A vs Model Output B), and no automated repair loop when prompts fail.
* **Target Fix:** Implement candidate generation (3–5 variants), real execution evals, automated prompt repair, and regression testing datasets.

---

## 4. Generic Template Application Across All Tasks

* **Current Reality:** The meta-prompt uses a single "Gemini Prompt Architect" persona skeleton for all prompts, regardless of whether the task is software development, research, creative writing, image generation, or data analysis.
* **Deficit:** Code prompts need explicit environment, dependency, edge case, and test criteria; image prompts need composition, style, and lighting; data prompts need dataset descriptions and analysis rules.
* **Target Fix:** Implement a Task Classifier and Task-Specific Strategy Engine (`coding`, `research`, `writing`, `data_analysis`, `image_generation`, etc.).

---

## 5. Security & Privacy Gaps

* **Current Reality:** Security relies on basic string replacement ([`sanitizeUserInput()`](file:///Users/omkar/prompt-plus/src/lib/llm/meta-prompt.ts#L50)) which strips script tags and basic override strings.
* **Deficit:** Lacks secret detection (API keys, passwords), PII scanning (emails, SSNs), prompt injection risk classification, and context trust boundary tracking.
* **Target Fix:** Build a dedicated Security Scanner module (`SecretScanner`, `PIIScanner`, `PromptInjectionDetector`) and Local Privacy Mode.

---

## 6. Model-Aware Tuning Gaps

* **Current Reality:** Model parameters (temperature, max tokens) are static across all LLMs.
* **Deficit:** Lacks model-specific tuning for GPT-5/o3-mini reasoning effort controls (`reasoning_effort: "low" | "medium" | "high"`), verbosity controls, and capability routing.
* **Target Fix:** Implement a Model Capability Registry (`ModelProfile`) and Model Router.
