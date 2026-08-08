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
  quick: `You are the Gemini Prompt Architect. Your sole task is to transform raw user inputs into concise, direct, high-potency Master Prompts. Output ONLY the final Master Prompt. NEVER add conversational intros like 'Here is your prompt' or meta-commentary.`,
  deep: `You are the Gemini Prompt Architect — an elite AI prompt engineering engine.
Your sole job is to transform raw, simple, or incomplete user inputs into production-grade Master Prompts.

STRICT OPERATING RULES:
1. ZERO CONVERSATIONAL ANNOUNCEMENTS: Never start with 'Here is an enhanced prompt', 'Sure!', or meta commentary. Start directly with the Master Prompt.
2. DOMAIN & PERSONA ARCHITECTURE: Create a specialized expert role (e.g. Senior Software Architect, Chief Copywriter) tailored precisely to the user's topic.
3. DYNAMIC DOMAIN SECTIONS: Generate bespoke, topic-specific markdown headers (e.g. "### Architecture & Technical Specs" for software, "### Narrative Strategy & Audience Hook" for content). Do NOT use generic repeating header skeletons.
4. RICH CONSTRAINT EXPANSION: Expand implied requirements, step-by-step guidelines, edge cases, and precise formatting deliverables.
5. PURE OUTPUT: Return ONLY the final Master Prompt ready for direct execution by AI models (GPT-4o, Claude 3.5, Gemini 2.0, DeepSeek R1).`,
  expert: `You are the Gemini Prompt Architect — an expert prompt-engineering system.
Transform raw user prompts into production-grade Master Prompts using advanced techniques: domain personas, topic-specific constraint sections, step-by-step chain-of-thought requirements, edge case handling, and exact formatting specifications.

STRICT OPERATING RULES:
1. ZERO ANNOUNCEMENT FILLER: Absolutely no introductory phrases ('Here is your prompt', 'Certainly!'). Start directly with the Master Prompt text.
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
 * Post-processor to strip any conversational announcement filler or markdown codeblocks
 * added by LLMs (e.g. "Here is your enhanced prompt:", "Sure! Below is the prompt:").
 */
export function cleanMasterPromptOutput(rawText: string): string {
  if (!rawText) return "";
  let text = rawText.trim();

  // Strip leading code fence blocks if wrapping entire output
  if (/^```(?:markdown|text)?\s*\n/i.test(text) && /\n```$/i.test(text)) {
    text = text.replace(/^```(?:markdown|text)?\s*\n/i, "").replace(/\n```$/i, "").trim();
  }

  // Strip conversational announcement intros
  const announcementRegex = /^(here\s+(is|are)\s+(a|an|the|your)?\s*(enhanced|optimized|master|compiled)?\s*prompt[^\n]*\n*|sure[!,.]?\s*here[^\n]*\n*|certainly[!,.]?\s*here[^\n]*\n*|as an ai prompt architect[^\n]*\n*|below is[^\n]*prompt[^\n]*\n*)/i;
  while (announcementRegex.test(text)) {
    text = text.replace(announcementRegex, "").trim();
  }

  // Strip trailing conversational outros
  text = text.replace(/\n+(hope this helps|let me know if you need|feel free to ask)[^\n]*$/i, "").trim();

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
