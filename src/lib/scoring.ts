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
  const hasRole = /\[ROLE|PERSONA|Act as|You are an?\]/i.test(clean);
  const hasConstraints = /\[CONSTRAINTS?|FORMAT|REQUIREMENTS?|Rules?\]/i.test(clean);
  const hasSteps = /\[STEPS?|INSTRUCTIONS?|1\.|2\.|3\.\]/i.test(clean);
  const hasContext = /\[CONTEXT|BACKGROUND\]/i.test(clean);

  const clarity = Math.min(95, Math.max(45, 50 + (wordCount > 10 ? 25 : 10) + (hasRole ? 15 : 0)));
  const specificity = Math.min(98, Math.max(40, 45 + (hasConstraints ? 25 : 10) + (wordCount > 25 ? 20 : 5)));
  const structure = Math.min(95, Math.max(35, 40 + (hasSteps ? 30 : 10) + (clean.includes("\n") ? 15 : 0)));
  const contextScore = Math.min(95, Math.max(35, 40 + (hasContext ? 30 : 10) + (wordCount > 30 ? 15 : 5)));
  const lengthScore = Math.min(95, Math.max(40, wordCount >= 30 && wordCount <= 300 ? 90 : wordCount < 30 ? 60 : 75));
  const actionability = Math.min(98, Math.max(45, 50 + (hasSteps ? 25 : 10) + (hasConstraints ? 15 : 0)));

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
    ],
    weaknesses: [
      !hasContext ? "Lacks deep background context" : "Could refine examples",
      wordCount < 20 ? "Short length might produce generic response" : "Can add edge-case rules",
    ],
    recommendations: [
      "Specify output format explicitly (Markdown, JSON, or bulleted list)",
      "Add negative constraints (e.g. 'Do not include intro/outro fluff')",
    ],
  };
}
