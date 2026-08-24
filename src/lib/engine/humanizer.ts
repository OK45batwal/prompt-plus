/**
 * Humanizer & Anti-AI Cliché Engine
 * Enforces natural human tone, eliminates robotic AI jargon, and injects authentic conversational cadence.
 */

export const BANNED_AI_CLICHES = [
  "delve into",
  "delve",
  "testament to",
  "tapestry of",
  "tapestry",
  "in today's fast-paced digital world",
  "in conclusion",
  "it is important to remember",
  "as an ai language model",
  "game-changer",
  "game changer",
  "unleash your potential",
  "unleash",
  "beacon of",
  "pivotal role",
  "foster a culture",
  "seamless integration",
  "seamlessly",
  "moreover",
  "furthermore",
  "embark on a journey",
  "dive deep",
  "dive into",
  "let's explore",
  "navigating the complexities",
  "plethora of",
  "myriad of",
];

export interface HumanizeOptions {
  persona?: "conversational_peer" | "technical_direct" | "executive_pragmatic" | "thought_partner";
  targetModel?: "chatgpt" | "claude" | "gemini" | "deepseek" | "general";
  banCliches?: boolean;
}

/**
 * Builds strict anti-cliché and human natural voice constraints for AI prompts.
 */
export function buildHumanVoiceDirectives(options: HumanizeOptions = {}): string {
  const {
    persona = "conversational_peer",
    targetModel = "general",
    banCliches = true,
  } = options;

  const clicheNotice = banCliches
    ? `\n- **STRICT ANTI-CLICHÉ PROTOCOL**: Never use robotic AI buzzwords or filler phrases. Explicitly avoid: "${BANNED_AI_CLICHES.slice(0, 10).join('", "')}", and similar boilerplate.`
    : "";

  let personaGuideline = "";
  if (persona === "conversational_peer") {
    personaGuideline = `Write in a natural, authentic, human voice — like an experienced, trusted peer discussing practical solutions over coffee. Use engaging sentence variety, conversational transitions, and zero corporate fluff.`;
  } else if (persona === "technical_direct") {
    personaGuideline = `Write with direct engineering clarity. Eliminate preamble and pleasantries. Provide production-ready code with concise, high-signal explanations and practical trade-off analysis.`;
  } else if (persona === "executive_pragmatic") {
    personaGuideline = `Write from the perspective of an executive decision-maker. Be concise, actionable, and metric-oriented. Focus on ROI, operational realities, and clear prioritized next steps.`;
  } else {
    personaGuideline = `Act as an insightful thought partner. Ground advice in first-principles thinking, anticipate subtle edge cases, and challenge unexamined assumptions with practical counter-examples.`;
  }

  if (targetModel === "claude") {
    return `<voice_and_tone_guidelines>
  <persona>${personaGuideline}</persona>
  <style_rules>
    <rule>Vary sentence length for natural human cadence.</rule>
    <rule>Eliminate introductory fluff (e.g. "Certainly! Here is...") and concluding meta-summaries.</rule>${clicheNotice}
  </style_rules>
</voice_and_tone_guidelines>`;
  }

  return `### HUMAN VOICE & TONE PROTOCOL
- **Tone Profile**: ${personaGuideline}
- **Cadence & Style**: Write with dynamic human rhythm. Keep explanations grounded, authentic, and free of introductory meta-commentary.${clicheNotice}`;
}

/**
 * Synthesizes a raw user prompt into a high-impact, humanized Master Prompt.
 */
export function synthesizeHumanizedPrompt(
  rawInput: string,
  options: HumanizeOptions = {}
): string {
  const text = (rawInput || "").trim();
  if (!text) return "";

  const cleanInput = text.replace(
    /^(please|can you|help me|i want to|i need to|how to|write|create|build|fix|generate|make)\s+/i,
    ""
  );
  const subject = cleanInput.length > 0 ? cleanInput : text;
  const directives = buildHumanVoiceDirectives(options);

  return `### TASK & OBJECTIVE
Execute this task with authentic human expertise, pragmatic depth, and zero artificial fluff:
"${text}"

${directives}

### SCOPE & SPECIFICATIONS
- **Subject Matter**: "${subject}"
- **Quality Constraint**: Deliver immediately useful, complete results without placeholders or unverified assumptions.

### STEP-BY-STEP EXECUTION
1. Analyze the core objective for "${subject}" from first principles.
2. Provide concrete, actionable deliverables structured with clear, scannable formatting.
3. Validate output against real-world usability and edge conditions.

### DELIVERABLES
Deliver the final output in clean Markdown.`;
}
