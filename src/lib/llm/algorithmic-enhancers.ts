// Algorithmic Meta-Prompt Synthesizer Engine for production-grade, zero-filler prompt enhancement
import { detectImplicitTone } from "./meta-prompt";

export type EnhanceLevel = "quick" | "deep" | "expert";

export function synthesizeAlgorithmicPrompt(userInput: string, level: EnhanceLevel = "deep"): string {
  const text = (userInput || "").trim();
  if (!text) return "";

  // 1. Dynamic Tone & Intent Intelligence
  const detectedTone = detectImplicitTone(text);
  const cleanInput = text.replace(/^(please|can you|help me|i want to|i need to|how to|write|create|build|fix)\s+/i, "");
  const subjectTopic = cleanInput.length > 0 ? cleanInput : text;

  // 2. Domain & Persona Mapping
  let role = "Senior Subject Matter Expert & Systems Architect";
  let domain = "Technical Execution & Problem Solving";
  let focusAreas = ["production standards", "clarity", "edge case handling"];

  if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix)\b/i.test(text)) {
    role = "Principal Software Engineer & Technical Architect";
    domain = "Production Software Engineering";
    focusAreas = ["clean modular architecture", "strict typing", "error resilience", "performance optimization"];
  } else if (/\b(write|blog|article|email|post|essay|copy|letter|content|draft|story|headline|tweet|linkedin)\b/i.test(text)) {
    role = "Elite Content Director & Strategic Copywriter";
    domain = "High-Impact Copywriting & Editorial Strategy";
    focusAreas = ["narrative pacing", "target audience hooks", "conversion positioning", "scannable formatting"];
  } else if (/\b(market|seo|ad|sales|growth|strategy|plan|campaign|brand|funnel|customer|lead|product)\b/i.test(text)) {
    role = "Chief Growth Strategist & Marketing Director";
    domain = "Growth Marketing & Product Strategy";
    focusAreas = ["market positioning", "acquisition channels", "conversion funnels", "measurable KPIs"];
  } else if (/\b(data|analyze|analysis|report|chart|graph|dataset|metric|insights|statistics|excel)\b/i.test(text)) {
    role = "Staff Data Scientist & Analytics Architect";
    domain = "Quantitative Business Intelligence";
    focusAreas = ["statistical validation", "reproducible methodology", "data visualization schemas", "executive insights"];
  }

  // 3. Fluid Custom Output Generation
  const personaText = `Act as a ${role} with deep expertise in ${domain}.`;
  const toneText = `Tone & Style: Maintain a ${detectedTone.toLowerCase()} tone matching the target audience for "${subjectTopic}".`;

  if (level === "quick") {
    return `${personaText}

${toneText}

### Core Request
"${text}"

### Actionable Directives
- Provide a direct, highly structured solution for "${subjectTopic}".
- Focus on ${focusAreas.join(", ")}.
- Omit conversational introductory text and disclaimers.`;
  }

  const stepsText = [
    `Analyze the core requirements for "${subjectTopic}" and outline key execution components.`,
    `Execute a complete, end-to-end solution incorporating ${focusAreas.join(", ")}.`,
    `Review and refine the output against production standards and edge cases.`
  ].map((step, idx) => `${idx + 1}. ${step}`).join("\n");

  const expertCoT = level === "expert"
    ? `\n\n### Reasoning Requirement
Before generating the final answer, perform a step-by-step chain-of-thought analysis of edge cases and requirements for "${subjectTopic}".`
    : "";

  return `${personaText}

### Core Intent & Goal
"${text}"

### Execution Context & Directives
- **Target Subject**: "${subjectTopic}"
- **Tone Profile**: ${detectedTone}
- **Quality Focus**: Ensure ${focusAreas.join(", ")}.
- **Output Standards**: Deliver complete, un-truncated, production-ready results. Omit placeholders or conversational fluff.

### Step-by-Step Methodology
${stepsText}${expertCoT}

### Expected Deliverables & Formatting
- Present response with clear, logical Markdown headings, bullet points, and code/text blocks ready for immediate deployment.`;
}


