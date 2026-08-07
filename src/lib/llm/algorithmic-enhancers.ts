// Algorithmic Meta-Prompt Synthesizer Engine for production-grade, zero-filler prompt enhancement
export type EnhanceLevel = "quick" | "deep" | "expert";

export function synthesizeAlgorithmicPrompt(userInput: string, level: EnhanceLevel = "deep"): string {
  const text = (userInput || "").trim();
  if (!text) return "";

  // 1. Dynamic Subject & Intent Extraction
  const cleanInput = text.replace(/^(please|can you|help me|i want to|i need to|how to|write|create|build|fix)\s+/i, "");
  const subjectTopic = cleanInput.length > 0 ? cleanInput : text;

  // 2. Domain & Persona Intelligence Mapping
  let role = "Senior Domain Expert & Systems Architect";
  let domain = "Technical Execution & Problem Solving";
  let domainFocus = "production standards, error resilience, and optimal design patterns";

  if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html|git|docker|aws|backend|frontend)\b/i.test(text)) {
    role = "Principal Software Architect & Lead Engineer";
    domain = "Production Software Engineering & Architecture";
    domainFocus = "strict typing, modular separation of concerns, comprehensive error handling, and performance optimization";
  } else if (/\b(write|blog|article|email|post|essay|copy|letter|content|draft|story|headline|tweet|linkedin|newsletter)\b/i.test(text)) {
    role = "Elite Copywriter & Technical Editorial Director";
    domain = "Strategic Editorial & High-Conversion Copywriting";
    domainFocus = "narrative pacing, persuasive hooks, target audience engagement, and high-impact scannable formatting";
  } else if (/\b(market|seo|ad|sales|growth|strategy|plan|campaign|brand|funnel|customer|lead|pitch|product|launch)\b/i.test(text)) {
    role = "Chief Marketing Officer & Growth Strategy Director";
    domain = "Growth Marketing, Funnel Optimization & Market Positioning";
    domainFocus = "conversion rate optimization, data-backed positioning, acquisition channels, and measurable KPIs";
  } else if (/\b(data|analyze|analysis|report|chart|graph|dataset|metric|insights|forecast|statistics|excel|csv|analytics)\b/i.test(text)) {
    role = "Staff Data Scientist & Enterprise Analytics Architect";
    domain = "Quantitative Analytics & Business Intelligence";
    domainFocus = "statistical rigor, data validation, reproducible metrics, and actionable executive insights";
  }

  // 3. Dynamic Execution Steps Tailored to User Subject
  const customSteps = [
    `Deconstruct the core request regarding "${subjectTopic}", identifying all underlying goals, assumptions, and implicit requirements.`,
    `Formulate an exhaustive implementation strategy tailored specifically to "${subjectTopic}", adhering to ${domainFocus}.`,
    `Execute the complete solution for "${subjectTopic}" with zero placeholders, missing sections, or truncated code/content.`,
    `Validate the output against real-world production standards, edge cases, and quality criteria.`
  ];

  const customSpecs = [
    `Deliver fully realized, end-to-end results for "${subjectTopic}" without using filler or conversational disclaimers.`,
    `Organize the final response using clear Markdown headers, bold key takeaways, and scannable bullet points.`,
    `Include complete, copy-paste ready implementations, code snippets, or structured templates where applicable.`
  ];

  if (level === "quick") {
    return `### Role & Persona
Act as an elite ${role} specializing in ${domain}.

### Core Request & Intent
"${text}"

### Strict Directives & Output Rules
- Solve the core request regarding "${subjectTopic}" directly and comprehensively.
- Focus on ${domainFocus}.
- Do NOT include conversational introductory fluff (e.g., "Sure, here is..."). Provide immediate actionable output.`;
  }

  const stepsFormatted = customSteps.map((s, i) => `${i + 1}. **Phase ${i + 1} (${s.slice(0, 35)}...)**: ${s}`).join("\n");
  const formatFormatted = customSpecs.map(f => `- ${f}`).join("\n");

  const expertCoT = level === "expert"
    ? `\n\n### Reasoning & Self-Correction Protocol
Before finalizing the output for "${subjectTopic}", execute a step-by-step chain-of-thought analysis:
1. Identify all potential edge cases, potential pitfalls, and implicit constraints related to "${subjectTopic}".
2. Draft a complete structural outline ensuring no critical details or execution phases are missed.
3. Review and refine the output to ensure maximum clarity, accuracy, and depth.`
    : "";

  return `### Role & Persona
Act as an elite ${role}. You possess authoritative expertise in ${domain}. Your objective is to address and resolve the prompt below with maximum technical depth, custom accuracy, and production quality.

### Core Objective
"${text}"

### Non-Negotiable Directives
- **Domain Focus**: Apply ${domainFocus} specifically to "${subjectTopic}".
- **Tone & Style**: Authoritative, professional, precise, and hype-free. Eliminate conversational introductory text.
- **Completeness**: Provide a fully expanded, comprehensive solution for "${subjectTopic}". Omit placeholder comments, incomplete stubs, or vague summaries.

### Detailed Execution Methodology
${stepsFormatted}${expertCoT}

### Output Formatting & Quality Requirements
${formatFormatted}
- Ensure clean Markdown structure with explicit headers, bold key terms, and ready-to-use production assets for "${subjectTopic}".`;
}

