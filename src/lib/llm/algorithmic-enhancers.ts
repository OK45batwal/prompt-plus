// Algorithmic Meta-Prompt Synthesizer Engine for production-grade, zero-filler prompt enhancement
export type EnhanceLevel = "quick" | "deep" | "expert";

export function synthesizeAlgorithmicPrompt(userInput: string, level: EnhanceLevel = "deep"): string {
  const text = (userInput || "").trim();
  if (!text) return "";

  // 1. Task Classification & Domain Intelligence
  let role = "Senior Domain Expert & AI Architect";
  let domain = "Technical Execution & Problem Solving";
  let steps: string[] = [];
  let formatSpecs: string[] = [];

  if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html|git|docker|aws|backend|frontend)\b/i.test(text)) {
    role = "Principal Software Architect & Lead Full-Stack Engineer";
    domain = "Production Software Engineering & Systems Design";
    steps = [
      "Deconstruct technical requirements and identify implicit edge cases.",
      "Formulate a clean, modular architecture following SOLID and DRY principles.",
      "Provide complete, production-ready code with strict typing, comprehensive inline documentation, and robust error handling.",
      "Include clear instructions for running, testing, and validating the implementation."
    ];
    formatSpecs = [
      "Use clean Markdown syntax with language-specific fenced code blocks (e.g., ```python, ```typescript).",
      "Avoid pseudo-code or truncated placeholders unless explicitly requested.",
      "Provide exact setup and execution commands."
    ];
  } else if (/\b(write|blog|article|email|post|essay|copy|letter|content|draft|story|headline|tweet|linkedin|newsletter)\b/i.test(text)) {
    role = "Elite Copywriter & Technical Content Director";
    domain = "Strategic Editorial & High-Conversion Copywriting";
    steps = [
      "Identify target audience demographic, intent, and primary value proposition.",
      "Outline core narrative arc using persuasive copywriting frameworks (e.g., AIDA or PAS).",
      "Draft compelling, highly readable content with dynamic pacing and strong hook headings.",
      "Refine tone, eliminate fluff, and insert clear call-to-action (CTA) statements."
    ];
    formatSpecs = [
      "Format using clean typography with scannable headers, bold emphasis, and structured bullet lists.",
      "Ensure an engaging, professional tone matching the target audience."
    ];
  } else if (/\b(market|seo|ad|sales|growth|strategy|plan|campaign|brand|funnel|customer|lead|pitch|product|launch)\b/i.test(text)) {
    role = "Chief Marketing Officer & Growth Strategy Lead";
    domain = "Growth Marketing, Funnel Optimization & Market Positioning";
    steps = [
      "Conduct target market segment analysis and competitor positioning assessment.",
      "Define key performance indicators (KPIs) and measurable conversion goals.",
      "Develop actionable multi-channel campaign tactics and audience messaging.",
      "Provide execution timelines, budget allocation guidelines, and risk mitigations."
    ];
    formatSpecs = [
      "Present as an executive strategy document with executive summary, data tables, and bulleted action items."
    ];
  } else if (/\b(data|analyze|analysis|report|chart|graph|dataset|metric|insights|forecast|statistics|excel|csv|analytics)\b/i.test(text)) {
    role = "Staff Data Scientist & Enterprise Analytics Architect";
    domain = "Quantitative Analysis & Business Intelligence";
    steps = [
      "Define analytical scope, target metrics, and data validation standards.",
      "Outline step-by-step statistical methods and analytical methodology.",
      "Synthesize core findings into actionable strategic business recommendations.",
      "Provide data visualization schemas or query scripts for reproducibility."
    ];
    formatSpecs = [
      "Format using clear data tables, structured metrics breakdowns, and executive key takeaways."
    ];
  } else {
    role = "Senior AI Specialist & Master Prompt Architect";
    domain = "Comprehensive Technical & Operational Execution";
    steps = [
      "Analyze the core objective and decompose it into logical execution phases.",
      "Identify critical constraints, background context, and quality criteria.",
      "Execute thorough, step-by-step resolution with actionable recommendations.",
      "Review output against accuracy, completeness, and clarity standards."
    ];
    formatSpecs = [
      "Use clear Markdown hierarchy with explicit headers, concise summaries, and bullet points."
    ];
  }

  // 2. Synthesize Level-Conditioned Meta-Prompt Framework
  if (level === "quick") {
    return `### Role & Persona
Act as an elite ${role} specializing in ${domain}.

### Objective
"${text}"

### Constraints & Output Rules
- Provide a direct, highly structured response with zero conversational introductory fluff.
- Deliver actionable results organized under logical headers and bullet points.`;
  }

  const stepsFormatted = steps.map((s, i) => `${i + 1}. **Phase ${i + 1}**: ${s}`).join("\n");
  const formatFormatted = formatSpecs.map(f => `- ${f}`).join("\n");

  const expertCoT = level === "expert"
    ? `\n\n### Reasoning & Self-Correction Protocol
Before generating the final answer, apply chain-of-thought planning:
1. Deconstruct the user's core intent and potential edge cases.
2. Outline key components before writing the full solution.
3. Verify that zero required details or code implementation steps are left out.`
    : "";

  return `### Role & Persona
Act as an elite ${role}. You possess authoritative expertise in ${domain}. Your goal is to solve the prompt below with maximum technical depth, precision, and production quality.

### Core Objective
"${text}"

### Non-Negotiable Directives & Constraints
- **Tone & Style**: Professional, authoritative, actionable, and hype-free. Zero filler or conversational introductory text (do NOT say "Sure, here is your answer").
- **Accuracy**: Provide fully realized, production-grade solutions. Omit placeholder comments or incomplete stubs.
- **Completeness**: Address all direct and implicit requirements in the objective.

### Step-by-Step Execution Plan
${stepsFormatted}${expertCoT}

### Output Format Requirements
${formatFormatted}
- Ensure clean Markdown structure with clear section headers, bold key concepts, and copy-paste ready blocks.`;
}
