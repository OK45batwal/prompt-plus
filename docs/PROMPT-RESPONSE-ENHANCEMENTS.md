# Action Plan — Elevating Prompt Response Quality & Intelligence

A strategic blueprint for enhancing the quality, structure, depth, and performance of AI-generated prompts in **Prompt+**.

---

## 🎯 1. Dynamic Domain-Specific Persona Deepening

### Current State
Prompts often assign standard roles like *"You are an expert copywriter"* or *"You are a developer"*.

### Enhancement Strategy
- **Hyper-Specific Persona Injections:** Dynamically map identified user intent to industry-leading titles (e.g. *"You are a Principal Software Architect specializing in Next.js 16 (App Router), TypeScript, and zero-trust API security"*).
- **Implied Expert Knowledge:** Add explicit domain assumptions so the LLM skips beginner explanations and dives directly into senior-level solutions.

---

## 🛡️ 2. Anti-Hallucination Guards & Anti-Pattern Elimination

### Current State
Prompts specify positive goals but lack explicit negative constraints.

### Enhancement Strategy
- **Explicit Non-Goals & Anti-Patterns:** Add a `### DO NOT (ANTI-PATTERNS)` section:
  - *Code tasks:* "DO NOT use deprecated APIs, DO NOT leave placeholder comments (`// TODO`), DO NOT omit error handling."
  - *Writing tasks:* "DO NOT use generic AI buzzwords (*'testament', 'delve', 'tapestry', 'game-changer'*)."
- **Boundary & Edge-Case Coverage:** Enforce handling for invalid inputs, missing context, and edge cases.

---

## 🧠 3. Structured Chain-of-Thought (CoT) & Verification Gates

### Current State
Prompts request answers directly without structured reasoning steps.

### Enhancement Strategy
- **Internal Reflection Scratchpad:** Require the LLM to perform internal planning inside a `<thinking>` or `<planning>` block before generating final deliverables.
- **Verification Checklist:** Mandate a 3-step self-audit:
  1. *Check constraints:* Did I satisfy every rule?
  2. *Check format:* Does the output strictly follow the requested structure?
  3. *Check completeness:* Are all edge cases addressed without placeholder code?

---

## 💡 4. Dynamic Synthetic Few-Shot Examples

### Current State
Prompts rely solely on zero-shot instructions.

### Enhancement Strategy
- **Synthesized Few-Shot Pairs:** Automatically generate 1-2 realistic `Input -> Output` pairs inside the prompt template.
- **Contrastive Examples (Good vs. Bad):** Show an explicit example of a *poor/generic answer* vs *ideal answer* to eliminate LLM ambiguity.

---

## ⚡ 5. Model-Specific Optimization Synthesizers

### Current State
Prompts use uniform Markdown headers across all target models.

### Enhancement Strategy
- **Claude 3.5 Sonnet Strategy:** Use clean semantic XML tags (`<role>`, `<instructions>`, `<constraints>`, `<output_format>`) which Anthropic models follow with highest fidelity.
- **OpenAI (GPT-4o / o3-mini) Strategy:** High-density bullet points, clear system/user separation, and explicit JSON Schema blocks.
- **DeepSeek R1 & Llama 3.3 Strategy:** Explicit step-by-step reasoning prompts with structured `<reasoning>` section.

---

## 📋 Implementation Matrix

| Phase | Feature | Target File | Impact |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Dynamic Few-Shot Generator | `src/lib/prompt-engine/candidate-generator.ts` | 🚀 High |
| **Phase 2** | Negative Anti-Pattern Injector | `src/lib/prompt-engine/strategy-engine.ts` | 🛡️ Critical |
| **Phase 3** | Model-Tuned XML Synthesizer | `src/lib/prompt-engine/prompt-ir.ts` | ⚡ High |
| **Phase 4** | Verification Checklist Gate | `src/lib/llm/meta-prompt.ts` | 🧠 High |
