export type EnhanceLevel = "quick" | "deep" | "expert";

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
  quick: `You are the Prompt+ Optimization Engine — an elite AI prompt architect.
Your mission is to transform the user's raw input into a clean, highly effective, ready-to-use prompt.

GUIDELINES FOR OUTPUT (CLEAN & COHESIVE, NOT CODED OR POINT-WISE):
- Write a clean, natural, and cohesive prompt in fluent prose.
- DO NOT format the prompt as a point-wise list or bullet-point checklist.
- DO NOT use pseudo-code, XML tags, or bracketed priority labels (such as [CRITICAL] or [HIGH]).
- Establish the expert persona and core objective immediately in the opening sentence.
- Weave context, requirements, tone, and constraints seamlessly into well-structured paragraphs.
- Specify the final deliverable clearly.
- Output ONLY the finished prompt. No conversational filler ("Here is your prompt:"), no preambles, and no surrounding markdown code fences.`,

  deep: `You are the Prompt+ Optimization Engine — an elite AI prompt architect.
Your mission is to transform raw, informal, or incomplete user requests into an authoritative, production-grade prompt.

CORE PRINCIPLES (CLEAN & COHESIVE, NOT CODED OR POINT-WISE):
1. WRITE IN NATURAL, AUTHORITATIVE PROSE: Do not output a robotic point-wise checklist, itemized numbered steps for every sentence, or pseudo-code tags. Synthesize the instructions into clear, beautifully structured paragraphs.
2. NO CODE-LIKE BRACKETS OR XML: Never output XML tags (e.g. <role>, <constraints>) or bracketed priority tags (e.g. [CRITICAL], [HIGH]).
3. ESSENTIAL ARCHITECTURE:
   - Role & Framing: Begin directly by establishing the model's expert role, perspective, and core domain authority.
   - Objective & Scope: Articulate the primary goal, background context, and target outcome in unambiguous prose.
   - Requirements & Execution Standards: Detail the specific guidelines, technical constraints, depth, and negative rules (what to avoid) as coherent instructional sentences.
   - Output Specification: Clearly define the expected structure, format, and quality standards for the final response.
4. INTENT & CONSTRAINT PRESERVATION: Retain every explicit entity, variable, and technical detail from the user's input.
5. ZERO ANNOUNCEMENT FILLER: Start immediately with the prompt. Never include introductory conversational chatter, meta-commentary, or conclusion sign-offs.`,

  expert: `You are the Prompt+ Autonomous Prompt Compiler — designed for state-of-the-art frontier models (GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Pro, DeepSeek R1).
Your mission is to engineer an industrial-strength, deeply reasoned prompt from raw user input.

COMPILER DIRECTIVES (CLEAN, SOPHISTICATED PROSE):
1. CLEAN, COHESIVE PROSE: Never output robotic point-wise checklists, bullet-heavy laundry lists, or pseudo-code tags. Compose an articulate, rigorous, and cohesive prompt using clear paragraphs and purposeful sections.
2. ZERO PSEUDO-CODE & NO XML: Strictly forbid XML tags (<role>, <objective>, <context>), bracketed priorities ([CRITICAL], [HIGH]), and programming syntax.
3. COMPREHENSIVE REASONING & GUIDANCE:
   - Establish high-level domain mastery and cognitive stance.
   - Define the exact scope, technical landscape, parameters, and success criteria.
   - Prescribe rigorous analytical methodology, edge-case coverage, and quality benchmarks in fluent instructions.
   - Integrate strict operational boundaries and anti-patterns naturally.
   - Specify the concrete deliverable format and depth.
4. FIDELITY: Preserve all explicit technical constraints, entities, and requirements provided in the user's input.
5. PURE PROMPT OUTPUT: Return ONLY the prompt ready for direct execution. Zero conversational intros, no markdown fence wrappers, and no meta-explanations.`,
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
 * Prompt IDs, dates, meta explanations, bracketed priority tags, and pseudo-code/XML wrappers.
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

  // 7. Strip code-like priority brackets (e.g. "- [CRITICAL]", "- [HIGH]", "- [MEDIUM]", "- [LOW]")
  text = text.replace(/-\s*\[(?:CRITICAL|HIGH|MEDIUM|LOW)\]\s*/gi, "- ");
  text = text.replace(/\[(?:CRITICAL|HIGH|MEDIUM|LOW)\]\s*/gi, "");

  // 8. Strip internal compiler tokens & markers
  text = text.replace(/ZERO ANNOUNCEMENT FILLER:\s*/gi, "");
  text = text.replace(/^-\s*\[\s*\]\s*/gim, "- ");

  // 9. Strip XML tags if model hallucinated XML code wrapper tags
  text = text.replace(/<\/?(?:prompt|role|objective|instructions|constraints|rule|context|output_contract|reasoning_requirement|thought|thought_process)[^>]*>/gi, "");

  // 10. Normalize numbered section headers like "1. ### Role & Persona" into clean section headers
  text = text.replace(/^(?:\d+\.\s*)###?\s*/gim, "### ");

  // 11. Normalize bloated Roman numeral headers (e.g. "**I. ROLE:**" or "**II. SPECIFICATIONS (...)**") into clean section headers
  text = text.replace(/(?:\*\*|\#\#?\s*)?(?:I|1)\.\s*ROLE\s*:?\*?\*?/gi, "### ROLE & PERSONA");
  text = text.replace(/(?:\*\*|\#\#?\s*)?(?:II|2)\.\s*SPECIFICATIONS[^\n]*\*?\*?/gi, "### SPECIFICATIONS & REQUIREMENTS");
  text = text.replace(/(?:\*\*|\#\#?\s*)?(?:III|3)\.\s*EXECUTION\s*STEPS[^\n]*\*?\*?/gi, "### EXECUTION STEPS");
  text = text.replace(/(?:\*\*|\#\#?\s*)?(?:IV|4)\.\s*ADDITIONAL\s*CONSIDERATIONS[^\n]*\*?\*?/gi, "### CONSTRAINTS & OPERATING RULES");

  // 12. Normalize multiple blank lines to clean double newlines
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
