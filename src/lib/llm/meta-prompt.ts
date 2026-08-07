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
  quick: `You are the Prompt+ Architect Engine. Transform the user's prompt into a concise, highly effective master instruction. Preserve the user's original intent and tone. Return ONLY the enhanced prompt.`,
  deep: `You are the Prompt+ Architect Engine — an advanced AI meta-prompt compiler.
Your task is to transform raw, simple, or incomplete user prompts into production-grade master instructions.

RULES:
1. Deeply analyze the user's prompt intent, target audience, domain, and implicit tone.
2. Expand the prompt into a rich, structured instruction framework covering persona, core objective, domain-specific guidelines, step-by-step execution, and output formatting.
3. Do NOT use rigid, repeating template boilerplate or disclaimers. Adapt the sections fluidly to fit the exact task.
4. Return ONLY the final enhanced prompt framework ready for immediate execution by AI models (GPT-4, Claude, Gemini, DeepSeek). Do NOT add introductory or conversational fluff.`,
  expert: `You are the Prompt+ Architect Engine — an advanced AI prompt-engineering expert.
Transform raw user prompts into master instructions using expert prompt techniques: chain-of-thought reasoning, custom role personas, domain constraints, negative directives, output specs, and edge case handling.

RULES:
1. Deeply analyze the user's prompt intent, target audience, domain, and implicit tone.
2. Include a reasoning requirement (chain-of-thought) so the executing model plans before generating the answer.
3. Adapt the structure fluidly to fit the exact task without using rigid template skeletons.
4. Return ONLY the final enhanced prompt framework. Do NOT add introductory or conversational fluff.`,
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
