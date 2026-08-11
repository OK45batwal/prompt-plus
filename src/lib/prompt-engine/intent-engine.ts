import { TaskType, IntentExtractionResult, PromptIR } from "./types";

export function classifyTaskType(input: string): TaskType {
  const text = (input || "").toLowerCase();

  if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|refactor|error|fix|architecture|component|git|endpoint|database|prisma|html|css|app|mobile|software|build)\b/i.test(text)) {
    return "coding";
  }
  if (/\b(research|study|paper|investigate|literature|sources|evidence|citations|academic|findings|survey)\b/i.test(text)) {
    return "research";
  }
  if (/\b(data|csv|json|analytics|dataframe|pandas|statistics|metrics|excel|visualization|chart)\b/i.test(text)) {
    return "data_analysis";
  }
  if (/\b(image|picture|photo|logo|illustration|graphic|render|draw|midjourney|dall-e|stable diffusion|aspect ratio)\b/i.test(text)) {
    return "image_generation";
  }
  if (/\b(video|animating|scene|script|storyboard|frame|footage|motion)\b/i.test(text)) {
    return "video_generation";
  }
  if (/\b(marketing|sales|ad|copywriter|landing page|cta|campaign|newsletter|email|pitch|convert|seo)\b/i.test(text)) {
    return "marketing";
  }
  if (/\b(strategy|business|executive|kpi|growth|roadmap|summary|proposal|monetization|pitch deck)\b/i.test(text)) {
    return "business";
  }
  if (/\b(write|essay|article|blog|story|novel|dialogue|script|poem|content)\b/i.test(text)) {
    return "writing";
  }
  if (/\b(rewrite|paraphrase|proofread|edit|polish|rephrase|improve wording)\b/i.test(text)) {
    return "rewriting";
  }
  if (/\b(summarize|summary|tldr|bullet points|key takeaways|digest|condense)\b/i.test(text)) {
    return "summarization";
  }
  if (/\b(analyze|analysis|evaluate|critique|audit|assessment|pros and cons|swot)\b/i.test(text)) {
    return "analysis";
  }
  if (/\b(teach|explain|learn|tutor|course|lesson|concept|quiz|education|student)\b/i.test(text)) {
    return "education";
  }
  if (/\b(plan|schedule|milestone|project plan|timeline|todo|tasks|workflow)\b/i.test(text)) {
    return "planning";
  }
  if (/\b(prompt|system prompt|metaprompt|few-shot|chain-of-thought|gpt|claude|gemini)\b/i.test(text)) {
    return "prompt_engineering";
  }
  if (/\b(automate|cron|script|pipeline|github action|bot|webhook)\b/i.test(text)) {
    return "automation";
  }
  if (/\b(creative|brainstorm|ideas|concept|game|fantasy|fiction)\b/i.test(text)) {
    return "creative";
  }

  return "general";
}

export function extractIntent(input: string): IntentExtractionResult {
  const taskType = classifyTaskType(input);
  const clean = input ? input.trim() : "";
  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  let complexity: IntentExtractionResult["complexity"] = "low";
  if (wordCount > 50 || /\b(architecture|framework|multi-step|comprehensive|enterprise|system|integration)\b/i.test(clean)) {
    complexity = "expert";
  } else if (wordCount > 25 || /\b(detailed|full|scalable|complete)\b/i.test(clean)) {
    complexity = "high";
  } else if (wordCount > 10) {
    complexity = "medium";
  }

  // Domain extraction
  let domain = "general";
  if (taskType === "coding") domain = "software_engineering";
  else if (taskType === "marketing" || taskType === "business") domain = "business_marketing";
  else if (taskType === "data_analysis") domain = "data_science";
  else if (taskType === "research") domain = "academic_research";
  else if (taskType === "image_generation" || taskType === "video_generation") domain = "digital_media";

  // Target audience extraction
  let audience: string | undefined;
  if (/\bstudent(s)?\b/i.test(clean)) audience = "students";
  else if (/\bexecutive(s)?|ceo|cto|manager\b/i.test(clean)) audience = "executives";
  else if (/\bdeveloper(s)?|engineer(s)?\b/i.test(clean)) audience = "developers";
  else if (/\bcustomer(s)?|client(s)?|user(s)?\b/i.test(clean)) audience = "end_users";

  // Identify unknowns & assumptions
  const assumptions: string[] = [];
  const unknowns: string[] = [];

  if (taskType === "coding") {
    if (!/\b(typescript|javascript|python|go|rust|java|c\+\+|swift)\b/i.test(clean)) {
      unknowns.push("Target programming language / framework");
    }
    if (!/\b(unit|test|e2e|playwright|jest|vitest)\b/i.test(clean)) {
      assumptions.push("Testing requirements assumed based on standard conventions");
    }
  }

  if (taskType === "writing" || taskType === "marketing") {
    if (!/\b(formal|casual|persuasive|technical|authoritative)\b/i.test(clean)) {
      unknowns.push("Desired tone of voice");
    }
  }

  return {
    domain,
    taskType,
    goal: clean.slice(0, 120),
    audience,
    complexity,
    outputType: taskType === "coding" ? "source_code_and_docs" : "markdown_document",
    assumptions,
    unknowns,
  };
}

/**
 * Calculates Intent Preservation Score (0 - 100)
 * Compares original intent goals against candidate PromptIR representation.
 */
export function calculateIntentPreservationScore(intent: IntentExtractionResult, candidateIR: PromptIR): number {
  let score = 100;
  const goalKeywords = intent.goal.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const renderedCandidate = (candidateIR.objective + " " + (candidateIR.role || "")).toLowerCase();

  // Keyword retention check
  let matched = 0;
  for (const kw of goalKeywords) {
    if (renderedCandidate.includes(kw)) matched++;
  }

  const keywordRetentionRatio = goalKeywords.length > 0 ? matched / goalKeywords.length : 1.0;
  if (keywordRetentionRatio < 0.5) {
    score -= 30;
  } else if (keywordRetentionRatio < 0.8) {
    score -= 15;
  }

  // Audience preservation check
  if (intent.audience && candidateIR.audience) {
    if (!candidateIR.audience.toLowerCase().includes(intent.audience.toLowerCase())) {
      score -= 20;
    }
  }

  return Math.max(0, score);
}
