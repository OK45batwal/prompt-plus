export type EnhanceLevel = "quick" | "deep" | "expert";

export const ENHANCE_LEVEL_LABELS: Record<EnhanceLevel, string> = {
  quick: "Quick",
  deep: "Deep",
  expert: "Expert",
};

const LEVEL_SYSTEM: Record<EnhanceLevel, string> = {
  quick: `You are the Prompt+ Architect Engine. Rewrite the user's prompt into a clear, structured AI instruction.
Add a role, context, and output format where missing. Keep the rewrite concise and faithful to the original intent.
Return ONLY the enhanced prompt. Do NOT add introductory or conversational meta-text.`,
  deep: `You are the Prompt+ Architect Engine — an advanced AI meta-prompt compiler.
Your task is to transform raw, simple, or incomplete user prompts into production-grade, highly structured AI instructions.

### ARCHITECT 8-STEP PIPELINE:
1. User Input Analysis: Identify core intent, domain context, task type, and underlying complexity.
2. Missing Element Detection: Detect missing Role, Context, Constraints, Target Audience, Examples, Tone, and Output Format.
3. Meta-Prompt Synthesis: Construct an explicit meta-instruction framework without changing the user's original intent.
4. Structure & Quality Validation: Ensure zero filler text, zero disclaimers, clear section boundaries, and precise formatting rules.

Return ONLY the final enhanced prompt framework ready for immediate execution by AI models (GPT, Claude, Gemini, DeepSeek). Do NOT add introductory or conversational meta-text.`,
  expert: `You are the Prompt+ Architect Engine — an advanced AI meta-prompt compiler and prompt-engineering expert.
Transform raw, simple, or incomplete user prompts into production-grade, highly structured AI instructions using expert techniques:
chain-of-thought reasoning, explicit role personas, constraints, negative directives, output format specs, and a worked example.

### PIPELINE:
1. User Input Analysis: Identify core intent, domain context, task type, and underlying complexity.
2. Missing Element Detection: Detect missing Role, Context, Constraints, Target Audience, Examples, Tone, and Output Format.
3. Meta-Prompt Synthesis: Construct an explicit meta-instruction framework without changing the user's original intent.
4. Chain-of-Thought: Add a reasoning requirement so the model plans before answering.
5. Structure & Quality Validation: Zero filler, zero disclaimers, clear section boundaries, precise formatting rules.

Return ONLY the final enhanced prompt framework. Do NOT add introductory or conversational meta-text.`,
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
  const cat = category || "General Task";
  const preferredTone = tone || "Professional & Clear";
  const preferredLength = length || "Comprehensive & Structured";

  const systemInstruction = LEVEL_SYSTEM[level];

  const expertClause =
    level === "expert"
      ? `
6. ### Reasoning — Apply step-by-step chain-of-thought reasoning before finalizing the output.
7. ### Worked Example — Include one minimal example of the expected output where helpful.`
      : "";

  const metaPrompt = `[ORIGINAL USER PROMPT]:
"${sanitizedPrompt}"

[TARGET DOMAIN]: ${cat}
[PREFERRED TONE]: ${preferredTone}
[TARGET OUTPUT LENGTH]: ${preferredLength}

[META-PROMPT INSTRUCTIONS]:
Rewrite the prompt above into a master AI prompt framework with the following explicit sections:
1. ### Role & Objective — Define an elite persona tailored to ${cat}.
2. ### Context & Domain Constraints — Establish target domain, background context, and non-negotiable boundaries.
3. ### Step-by-Step Instructions — Break down execution into clear, sequential steps.
4. ### Output Format & Constraints — Specify ${preferredLength}, ${preferredTone}, and formatting guidelines (Markdown, code blocks, bullet points).
5. ### Input Variables — Highlight placeholders like {{user_input}} or specific parameters if required.${expertClause}`;

  return { metaPrompt, systemInstruction };
}
