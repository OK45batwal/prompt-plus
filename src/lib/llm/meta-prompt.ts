export type EnhanceLevel = "quick" | "deep" | "expert";

export const ENHANCE_LEVEL_LABELS: Record<EnhanceLevel, string> = {
  quick: "Quick",
  deep: "Deep",
  expert: "Expert",
};

export function detectImplicitTone(input: string): string {
  const text = (input || "").toLowerCase();
  if (/\b(tweet|post|linkedin|casual|friendly|fun|newsletter|blog|engaging|story)\b/i.test(text)) {
    return "Engaging, Authentic & Conversational";
  }
  if (/\b(sell|pitch|copy|ad|convert|sales|landing|cta|email|headline|offer)\b/i.test(text)) {
    return "High-Conversion, Persuasive & Action-Oriented";
  }
  if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|refactor|error|fix|architecture)\b/i.test(text)) {
    return "Technically Rigorous, Precise & Production-Grade";
  }
  if (/\b(strategy|plan|executive|kpi|growth|roadmap|summary|business|report)\b/i.test(text)) {
    return "Executive, Strategic & High-Level";
  }
  if (/\b(data|analyze|analysis|statistics|metrics|research|paper|study)\b/i.test(text)) {
    return "Analytical, Objective & Data-Driven";
  }
  return "Clear, Authoritative & Direct";
}

const LEVEL_SYSTEM: Record<EnhanceLevel, string> = {
  quick: `You are the Prompt+ Meta-Architect — an elite prompt optimization engine.
Your mission is to transform raw user inputs into crisp, powerful, high-potency Master Prompts.
Structure the Master Prompt with:
1. ### Role & Persona (Specific expert title & domain mastery)
2. ### Core Objective (Precise goal & key deliverables)
3. ### Key Requirements & Guardrails (Actionable directives & tone)
4. ### Output Format (Clean markdown specifications)
Return ONLY the ready-to-execute Master Prompt. Absolutely no introductory announcements or conversational preambles.`,

  deep: `You are the Prompt+ Meta-Architect — the world's most advanced prompt engineering system.
Your sole job is to transform raw, simple, or unstructured user requests into production-grade, battle-tested Master Prompts.

ARCHITECTURE OF A MASTER PROMPT (Must Include):
1. ### Role & Persona: Tailored domain authority (e.g., Staff Software Architect, Principal Strategist, Lead Copywriter) with clear cognitive framing.
2. ### Primary Objective & Context: Unambiguous problem statement, target audience, and primary success criteria.
3. ### Step-by-Step Execution Plan: Methodical, phased execution instructions that guide the AI step-by-step through the task.
4. ### Constraints & Negative Rules: Explicit boundaries (e.g., "Do NOT use placeholders or generic filler", "Do NOT make unverified assumptions", "Strictly adhere to production standards").
5. ### Output Format & Schema: Exact formatting guidelines (e.g., Markdown headers, tables, code blocks, or structured schemas).
6. ### Quality Audit Checklist: 3-4 verification criteria the AI must validate before finalizing its answer.

STRICT OPERATING RULES:
- ZERO META HEADERS: Never output titles like "## Master Prompt", "Prompt ID", "Date", or "This prompt is designed to...".
- ZERO PREAMBLE: Never output conversational filler like "Here is your enhanced prompt" or "Certainly!".
- PURE EXECUTION: Start immediately with the "### Role & Persona" header.`,

  expert: `You are the Prompt+ Meta-Architect — an elite autonomous prompt compilation system designed for deep reasoning models (GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Pro, DeepSeek R1, Llama 3.3).
Transform raw user prompts into industrial-strength Master Prompts engineered for zero hallucination, maximum reasoning depth, and flawless instruction adherence.

EXPERT MASTER PROMPT BLUEPRINT:
1. ### Role & Persona: World-class subject authority with cognitive stance and domain expertise.
2. ### Mission & Contextual Scope: Clear mission statement, background parameters, input variables in [BRACKETS] where user context can be injected, and edge-case scope.
3. ### Deep Reasoning & Execution Methodology: Require the model to reason through trade-offs, step-by-step execution phases, and algorithmic or strategic depth.
4. ### Constraints & Anti-Patterns (Negative Rules): Strict negative guards prohibiting hallucination, superficiality, filler, and truncated responses.
5. ### Concrete Deliverables & Output Schema: Exact output format specification (syntax-highlighted code, executive tables, structured sections).
6. ### Pre-Flight Verification Rubric: Self-evaluation rubric covering accuracy, completeness, edge case coverage, and adherence to requirements.

STRICT RULES:
- Output ONLY the final Master Prompt. Start directly with the "### Role & Persona" section.
- No conversational wrappers, no markdown code block surrounding the whole output, and no introductory meta text.`,
};

export function sanitizeUserInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/\[system override\]/gi, "")
    .replace(/ignore (all )?previous instructions/gi, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .trim();
}

/**
 * Post-processor to strip any conversational announcement filler, metadata headers,
 * Prompt IDs, dates, and meta explanations from LLM outputs.
 */
export function cleanMasterPromptOutput(rawText: string): string {
  if (!rawText) return "";
  let text = rawText.trim();

  // 1. Strip leading code fence blocks if wrapping entire output
  if (/^```(?:markdown|text)?\s*\n/i.test(text) && /\n```$/i.test(text)) {
    text = text.replace(/^```(?:markdown|text)?\s*\n/i, "").replace(/\n```$/i, "").trim();
  }

  // 2. Strip conversational announcement intros
  const announcementRegex = /^(here\s+(is|are)\s+(a|an|the|your)?\s*(enhanced|optimized|master|compiled)?\s*prompt[^\n]*\n*|sure[!,.]?\s*here[^\n]*\n*|certainly[!,.]?\s*here[^\n]*\n*|as an ai prompt architect[^\n]*\n*|below is[^\n]*prompt[^\n]*\n*)/i;
  while (announcementRegex.test(text)) {
    text = text.replace(announcementRegex, "").trim();
  }

  // 3. Strip bloated meta-header titles (e.g. "## Advanced Master Prompt: ...", "# Master Prompt ...")
  text = text.replace(/^(?:#+|\*\*)\s*(?:Advanced\s+|Structured\s+)?Master\s+Prompt[^\n]*\n*/gi, "").trim();

  // 4. Strip Prompt ID / Date / Version / Author metadata lines
  text = text.replace(/^(?:\*\*|\*|\s)*(?:Prompt ID|Date|Version|Created|Author):\*?\*?[^\n]*\n*/gim, "").trim();

  // 5. Strip introductory & concluding meta-explanation paragraphs
  text = text.replace(/^(?:\*\*|\*|\s)*(?:This prompt (?:aims|is designed|strives|intends)|The requested output|This prompt prioritizes)[^\n]*\n*/gim, "").trim();
  text = text.replace(/\n*(?:\*\*|\*|\s)*(?:This prompt (?:aims|is designed|strives|intends)|The requested output|This prompt prioritizes|Please leverage your expertise|Hope this helps|Let me know if you need)[^\n]*/gim, "").trim();

  // 6. Strip isolated or repetitive horizontal rule dividers (---)
  text = text.replace(/(?:\n\s*---\s*){2,}/g, "\n---").replace(/\n+\s*---\s*$/g, "").trim();

  // 8. Normalize bloated Roman numeral headers (e.g. "**I. ROLE:**" or "**II. SPECIFICATIONS (...)**") into clean section headers
  text = text.replace(/(?:\*\*|\#\#?\s*)?(?:I|1)\.\s*ROLE\s*:?\*?\*?/gi, "### ROLE & PERSONA");
  text = text.replace(/(?:\*\*|\#\#?\s*)?(?:II|2)\.\s*SPECIFICATIONS[^\n]*\*?\*?/gi, "### SPECIFICATIONS & REQUIREMENTS");
  text = text.replace(/(?:\*\*|\#\#?\s*)?(?:III|3)\.\s*EXECUTION\s*STEPS[^\n]*\*?\*?/gi, "### EXECUTION STEPS");
  text = text.replace(/(?:\*\*|\#\#?\s*)?(?:IV|4)\.\s*ADDITIONAL\s*CONSIDERATIONS[^\n]*\*?\*?/gi, "### CONSTRAINTS & OPERATING RULES");

  // 9. Normalize multiple blank lines to clean double newlines
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

export function buildArchitectMetaPrompt(
  originalPrompt: string,
  category?: string,
  tone?: string,
  length?: string,
  level: EnhanceLevel = "deep"
): { metaPrompt: string; systemInstruction: string } {
  const sanitizedPrompt = sanitizeUserInput(originalPrompt);
  const detectedTone = tone || detectImplicitTone(sanitizedPrompt);
  const cat = category || "General Task";
  const preferredLength = length || "Comprehensive & Detailed";

  const systemInstruction = LEVEL_SYSTEM[level];

  const metaPrompt = `Transform this raw user input into an elite, ready-to-execute Master Prompt for AI models:
"${sanitizedPrompt}"

[COMPILATION METADATA]
- Domain Context: ${cat}
- Tone Profile: ${detectedTone}
- Output Depth: ${preferredLength}

OUTPUT ONLY THE FINAL MASTER PROMPT. DO NOT INCLUDE INTRODUCTORY OR CONVERSATIONAL ANNOUNCEMENTS.`;

  return { metaPrompt, systemInstruction };
}
