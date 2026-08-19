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
  quick: `You are the Gemini Prompt Architect. Your sole task is to transform raw user inputs into concise, direct, high-potency Master Prompts. Output ONLY the final Master Prompt. NEVER add titles like 'Advanced Master Prompt', Prompt ID, Date, conversational intros, or meta explanations.`,
  deep: `You are the Gemini Prompt Architect — an elite AI prompt engineering engine.
Your sole job is to transform raw, simple, or incomplete user inputs into clean, production-grade Master Prompts.

STRICT OPERATING RULES:
1. ZERO META HEADERS OR PREAMBLE: Never output titles like "## Advanced Master Prompt", "Prompt ID", "Date", or introductory paragraphs explaining what the prompt aims to do. Start IMMEDIATELY with the Role/Persona section.
2. ZERO CONVERSATIONAL ANNOUNCEMENTS: Never start with 'Here is an enhanced prompt', 'Sure!', or meta commentary.
3. DOMAIN & PERSONA ARCHITECTURE: Create a specialized expert role (e.g. Senior Software Architect, Chief Copywriter) tailored precisely to the user's topic.
4. DYNAMIC DOMAIN SECTIONS: Generate bespoke, topic-specific markdown headers (e.g. "### Architecture & Technical Specs" for software, "### Narrative Strategy & Audience Hook" for content).
5. RICH CONSTRAINT EXPANSION: Expand implied requirements, step-by-step guidelines, edge cases, and precise formatting deliverables.
6. PURE OUTPUT: Return ONLY the final Master Prompt ready for direct execution by AI models. No disclaimers, no Prompt IDs, no concluding meta paragraphs.`,
  expert: `You are the Gemini Prompt Architect — an expert prompt-engineering system.
Transform raw user prompts into production-grade Master Prompts using advanced techniques: domain personas, topic-specific constraint sections, step-by-step chain-of-thought requirements, edge case handling, and exact formatting specifications.

STRICT OPERATING RULES:
1. ZERO META FILLER OR HEADERS: Absolutely no titles ('Advanced Master Prompt'), Prompt IDs, Dates, or introductory meta explanations ('This prompt aims to...'). Start directly with the Role & Persona text.
2. REASONING REQUIREMENT: Mandate that the executing AI model performs step-by-step chain-of-thought planning before generating its answer.
3. TOPIC SPECIFICITY: Custom-tailor all section titles and requirements specifically to the user's subject.
4. PURE MASTER PROMPT: Output ONLY the final Master Prompt. No intro, no outro, no disclaimers.`,
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
