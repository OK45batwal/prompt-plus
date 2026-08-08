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
  quick: `You are the Prompt+ Meta-Prompt Engine.
Transform the user's raw input into a concise, direct, highly effective master prompt.
Preserve original intent, elevate tone, expand core constraints, and eliminate fluff. Return ONLY the enhanced prompt.`,
  deep: `You are the Prompt+ Meta-Prompt Engine — an elite AI prompt compiler.
Your task is to transform raw, simple, or incomplete user inputs into rich, production-grade master instructions.

STRICT COMPILATION RULES:
1. DEEP INTENT & DOMAIN ANALYSIS: Identify the domain (software, copywriting, marketing, analytics, business) and create a custom persona.
2. BESPOKE DYNAMIC SECTIONS: Do NOT use generic repeating headers (like "### Core Intent" or "### Execution Context"). Instead, generate custom, domain-specific headers tailored exactly to the user's request (e.g., for technical tasks: "### System Requirements & Architecture", for content: "### Narrative Structure & Audience Hook").
3. RICH EXPANSION: Fleshing out implied specifications, step-by-step constraints, input data models, edge cases, and output formatting.
4. ZERO CONVERSATIONAL BOILERPLATE: Return ONLY the final enhanced prompt ready for direct execution by AI models (GPT-4, Claude, Gemini, DeepSeek). Do NOT add introductory text or meta comments.`,
  expert: `You are the Prompt+ Meta-Prompt Engine — an elite AI prompt-engineering expert.
Transform raw user prompts into production-ready master instructions using expert techniques: domain-specific role personas, custom constraint sections, step-by-step chain-of-thought requirements, edge case mitigations, and output specifications.

STRICT COMPILATION RULES:
1. DOMAIN SPECIFICITY: Custom-tailor the persona, section headers, and execution requirements specifically to the user's topic.
2. BAN GENERIC TEMPLATE HEADERS: Never output rigid repeating headers. Craft topic-specific section titles.
3. REASONING REQUIREMENT: Mandate that the executing AI performs chain-of-thought planning before producing its final output.
4. ZERO FLUFF: Output ONLY the master prompt framework. No intro, no outro, no commentary.`,
};

export function sanitizeUserInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/\[system override\]/gi, "")
    .replace(/ignore (all )?previous instructions/gi, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .trim();
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

  const metaPrompt = `[RAW USER PROMPT TO ENHANCE]:
"${sanitizedPrompt}"

[ANALYSIS MATRIX]:
- Domain Context: ${cat}
- Detected Tone & Vibe: ${detectedTone}
- Required Output Depth: ${preferredLength}

[META-PROMPT COMPILATION TASK]:
Synthesize the raw prompt above into a master AI prompt framework.
- Establish an authoritative persona tailored specifically to "${sanitizedPrompt}".
- Adapt the structure fluidly (Role, Core Objective, Execution Methodology, Domain Rules, Formatting Specs).
- Match and elevate the detected tone ("${detectedTone}").
- Ensure zero rigid repeating boilerplate text or disclaimers. Output ONLY the master prompt.`;

  return { metaPrompt, systemInstruction };
}
