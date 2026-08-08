// Algorithmic Meta-Prompt Synthesizer Engine for production-grade, zero-filler prompt enhancement
import { detectImplicitTone } from "./meta-prompt";

export type EnhanceLevel = "quick" | "deep" | "expert";

export function synthesizeAlgorithmicPrompt(userInput: string, level: EnhanceLevel = "deep"): string {
  const text = (userInput || "").trim();
  if (!text) return "";

  // 1. Dynamic Tone & Subject Intelligence
  const detectedTone = detectImplicitTone(text);
  const cleanInput = text.replace(/^(please|can you|help me|i want to|i need to|how to|write|create|build|fix|generate|make)\s+/i, "");
  const subjectTopic = cleanInput.length > 0 ? cleanInput : text;

  // 2. Domain Categorization & Dynamic Persona Engineering
  let role = "Senior Subject Matter Expert & Systems Architect";
  let domain = "Execution & Strategic Analysis";
  let section1Header = "Key Requirements & Constraints";
  let section2Header = "Execution & Implementation Guidelines";
  let directives = [
    `Analyze the core requirements for "${subjectTopic}" and address implicit edge cases.`,
    `Deliver an authoritative, highly structured solution matching the requested tone ("${detectedTone}").`,
    `Ensure output is ready for immediate production deployment with zero conversational fluff.`,
  ];

  if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html)\b/i.test(text)) {
    role = "Principal Software Engineer & Technical Architect";
    domain = "Production Software Engineering";
    section1Header = "Architecture & Technical Specifications";
    section2Header = "Implementation & Code Guidelines";
    directives = [
      `Design a clean, modular, production-ready architecture for "${subjectTopic}".`,
      `Incorporate strict typing, comprehensive error handling, and performance optimizations.`,
      `Provide executable, self-contained code blocks with clear inline documentation.`,
    ];
  } else if (/\b(write|blog|article|email|post|essay|copy|letter|content|draft|story|headline|tweet|linkedin|newsletter)\b/i.test(text)) {
    role = "Elite Content Director & Strategic Copywriter";
    domain = "High-Impact Copywriting & Editorial Strategy";
    section1Header = "Audience Hook & Narrative Strategy";
    section2Header = "Content Directives & Structural Flow";
    directives = [
      `Craft an engaging narrative hook tailored to the target audience for "${subjectTopic}".`,
      `Maintain a ${detectedTone.toLowerCase()} tone with scannable formatting, subheadings, and clear takeaways.`,
      `Eliminate passive voice, repetitive boilerplate, and generic introductory filler.`,
    ];
  } else if (/\b(market|seo|ad|sales|growth|strategy|plan|campaign|brand|funnel|customer|lead|product|business)\b/i.test(text)) {
    role = "Chief Growth Strategist & Marketing Director";
    domain = "Growth Marketing & Product Strategy";
    section1Header = "Strategic Positioning & Target Objectives";
    section2Header = "Action Plan & Conversion Framework";
    directives = [
      `Define clear market positioning and acquisition channels for "${subjectTopic}".`,
      `Provide actionable conversion tactics with measurable KPIs and milestones.`,
      `Structure the output for executive review with high scannability.`,
    ];
  } else if (/\b(data|analyze|analysis|report|chart|graph|dataset|metric|insights|statistics|excel|math)\b/i.test(text)) {
    role = "Staff Data Scientist & Analytics Architect";
    domain = "Quantitative Business Intelligence";
    section1Header = "Data Methodology & Analytical Framework";
    section2Header = "Insights & Actionable Recommendations";
    directives = [
      `Apply rigorous analytical methodology to evaluate data for "${subjectTopic}".`,
      `Highlight statistically significant trends, anomalies, and key performance metrics.`,
      `Present findings in clear data tables, structured summaries, and executive recommendations.`,
    ];
  }

  // 3. Fluid Level Compilation
  if (level === "quick") {
    return `Act as a ${role} specializing in ${domain}.

Objective: Deliver a direct, high-impact solution for "${text}".

### Directives
- **Tone Profile**: ${detectedTone}
- ${directives[0]}
- ${directives[1]}
- Provide a complete, un-truncated response formatted cleanly in Markdown. Omit introductory disclaimers.`;
  }

  const cotRequirement = level === "expert"
    ? `\n\n### Reasoning Requirement\nBefore generating the final answer, perform a step-by-step chain-of-thought analysis covering requirements, potential trade-offs, and edge cases for "${subjectTopic}".`
    : "";

  return `You are a ${role} with deep expertise in ${domain}.

Your objective is to execute the following request with production-grade precision:
"${text}"

### ${section1Header}
- **Target Subject**: "${subjectTopic}"
- **Tone & Persona**: ${detectedTone}
- **Quality Standard**: Deliver complete, unabridged solutions without placeholders or assumptions.

### ${section2Header}
1. ${directives[0]}
2. ${directives[1]}
3. ${directives[2]}${cotRequirement}

### Deliverables & Formatting Specs
- Present the final response with clear Markdown headers, bulleted lists, and structured blocks ready for immediate real-world application.`;
}


