export function buildArchitectMetaPrompt(
  originalPrompt: string,
  category?: string,
  tone?: string,
  length?: string
): { metaPrompt: string; systemInstruction: string } {
  const cat = category || "General Task";
  const preferredTone = tone || "Professional & Clear";
  const preferredLength = length || "Comprehensive & Structured";

  const systemInstruction = `You are the Prompt+ Architect Engine — an advanced AI meta-prompt compiler.
Your task is to transform raw, simple, or incomplete user prompts into production-grade, highly structured AI instructions.

### ARCHITECT 8-STEP PIPELINE:
1. User Input Analysis: Identify core intent, domain context, task type, and underlying complexity.
2. Missing Element Detection: Detect missing Role, Context, Constraints, Target Audience, Examples, Tone, and Output Format.
3. Meta-Prompt Synthesis: Construct an explicit meta-instruction framework without changing the user's original intent.
4. Structure & Quality Validation: Ensure zero filler text, zero disclaimers, clear section boundaries, and precise formatting rules.

Return ONLY the final enhanced prompt framework ready for immediate execution by AI models (GPT, Claude, Gemini, DeepSeek). Do NOT add introductory or conversational meta-text.`;

  const metaPrompt = `[ORIGINAL USER PROMPT]:
"${originalPrompt.trim()}"

[TARGET DOMAIN]: ${cat}
[PREFERRED TONE]: ${preferredTone}
[TARGET OUTPUT LENGTH]: ${preferredLength}

[META-PROMPT INSTRUCTIONS]:
Rewrite the prompt above into a master AI prompt framework with the following explicit sections:
1. ### Role & Objective — Define an elite persona tailored to ${cat}.
2. ### Context & Domain Constraints — Establish target domain, background context, and non-negotiable boundaries.
3. ### Step-by-Step Instructions — Break down execution into clear, sequential steps.
4. ### Output Format & Constraints — Specify ${preferredLength}, ${preferredTone}, and formatting guidelines (Markdown, code blocks, bullet points).
5. ### Input Variables — Highlight placeholders like {{user_input}} or specific parameters if required.`;

  return { metaPrompt, systemInstruction };
}
