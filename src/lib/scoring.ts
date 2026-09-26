export interface PromptScoreResult {
  total: number;
  dimensions: {
    clarity: number;
    specificity: number;
    structure: number;
    context: number;
    length: number;
    actionability: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export function calculateDynamicPromptScore(text: string): PromptScoreResult {
  const clean = text ? text.trim() : "";
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;

  // Header-aware and keyword-aware regexes: matches markdown headers (### ROLE), bracket tags ([ROLE]), and natural phrasing
  const hasRole = /(?:###?\s*(?:ROLE|PERSONA)|\[(?:ROLE|PERSONA)\]|\b(?:Act as|You are an?|As an?)\b)/i.test(clean);
  const hasConstraints = /(?:###?\s*(?:CONSTRAINTS?|FORMAT|REQUIREMENTS?|RULES?|OUTPUT CONTRACT)|\[(?:CONSTRAINTS?|FORMAT|REQUIREMENTS?|RULES?)\]|\b(?:rules?|constraints?|must not|do not|never|required)\b)/i.test(clean);
  const hasSteps = /(?:###?\s*(?:STEPS?|INSTRUCTIONS?|EXECUTION|WORKFLOW)|\[(?:STEPS?|INSTRUCTIONS?)\]|\b(?:step[-\s]\d+|\b1\.\s+\w+|\b2\.\s+\w+))/i.test(clean);
  const hasContext = /(?:###?\s*(?:CONTEXT|BACKGROUND|REFERENCE|DOMAIN)|\[(?:CONTEXT|BACKGROUND)\]|\b(?:context|background|scenario|use[- ]case)\b)/i.test(clean);
  const hasExamples = /(?:###?\s*(?:EXAMPLES?|FEW-SHOT)|\[(?:EXAMPLES?)\]|\b(?:example\s*\d*|sample\s*input)\b)/i.test(clean);

  // Scoring logic with balanced dimension factors
  const clarity = Math.min(98, Math.max(40, 45 + (wordCount >= 10 ? 25 : wordCount * 2) + (hasRole ? 20 : 0)));
  const specificity = Math.min(98, Math.max(35, 40 + (hasConstraints ? 25 : 5) + (wordCount >= 25 ? 20 : 5) + (hasExamples ? 10 : 0)));
  const structure = Math.min(98, Math.max(35, 40 + (hasSteps ? 25 : 5) + (clean.includes("\n") ? 15 : 0) + (clean.includes("###") ? 15 : 0)));
  const contextScore = Math.min(98, Math.max(35, 40 + (hasContext ? 30 : 5) + (wordCount >= 30 ? 15 : 5)));
  const lengthScore = Math.min(98, Math.max(30, wordCount >= 30 && wordCount <= 400 ? 95 : wordCount < 10 ? 40 : wordCount < 30 ? 65 : 80));
  const actionability = Math.min(98, Math.max(40, 45 + (hasSteps ? 25 : 5) + (hasConstraints ? 20 : 5)));

  const total = Math.round(
    clarity * 0.2 +
    specificity * 0.2 +
    structure * 0.2 +
    contextScore * 0.15 +
    lengthScore * 0.1 +
    actionability * 0.15
  );

  return {
    total,
    dimensions: {
      clarity: Math.round(clarity),
      specificity: Math.round(specificity),
      structure: Math.round(structure),
      context: Math.round(contextScore),
      length: Math.round(lengthScore),
      actionability: Math.round(actionability),
    },
    strengths: [
      hasRole ? "Defines clear AI persona/role" : "Concise intent",
      hasConstraints ? "Includes explicit output constraints" : "Direct instructions",
      ...(hasSteps ? ["Structured into progressive execution steps"] : []),
    ],
    weaknesses: [
      !hasContext ? "Lacks deep background context" : "Could refine examples",
      wordCount < 20 ? "Short length might produce generic response" : "Can add edge-case rules",
      ...(!hasConstraints ? ["Missing explicit output format or negative constraints"] : []),
    ],
    recommendations: [
      !hasConstraints ? "Specify output format explicitly (Markdown, JSON, or bulleted list)" : "Add negative constraints (e.g. 'Do not include intro/outro fluff')",
      !hasContext ? "Provide background context and real-world target audience" : "Include concrete input/output examples to anchor the model",
    ],
  };
}
