import { NextRequest, NextResponse } from "next/server";

// One-click enhancement: Analyze + Enhance + Score
// This is the main API that powers the "Enhance" button

interface AnalysisResult {
  intent: string;
  category: string;
  complexity: number;
  confidence: number;
  entities: string[];
  context: string[];
  keywords: string[];
}

interface EnhancedPrompt {
  enhanced: string;
  explanation: string;
  improvements: { aspect: string; change: string; reason: string }[];
  estimatedQuality: number;
}

interface ScoreResult {
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

function analyzePrompt(text: string): AnalysisResult {
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  let intent = "content_generation";
  if (lowerText.includes("code") || lowerText.includes("function")) {
    intent = "code_generation";
  } else if (lowerText.includes("image") || lowerText.includes("picture")) {
    intent = "image_generation";
  } else if (lowerText.includes("email") || lowerText.includes("message")) {
    intent = "email";
  }

  let category = "other";
  if (lowerText.includes("blog") || lowerText.includes("article")) category = "blog_post";
  else if (lowerText.includes("tutorial") || lowerText.includes("how to")) category = "tutorial";
  else if (lowerText.includes("function") || lowerText.includes("api")) category = "function";

  let complexity: 1 | 2 | 3 | 4 | 5 = 1;
  if (wordCount > 50) complexity = 2;
  if (wordCount > 100) complexity = 3;
  if (wordCount > 200) complexity = 4;

  let confidence = 0.6;
  if (text.length > 50) confidence = 0.7;
  if (text.length > 100) confidence = 0.8;
  if (text.length > 200) confidence = 0.85;

  const entities: string[] = [];
  const technicalTerms = ["api", "json", "html", "css", "javascript", "python", "react", "node"];
  technicalTerms.forEach((term) => {
    if (lowerText.includes(term)) entities.push(term);
  });

  const context: string[] = [];
  if (lowerText.includes("web") || lowerText.includes("website")) context.push("web_development");
  if (lowerText.includes("business") || lowerText.includes("company")) context.push("business");

  const keywords = text.split(/\s+/).filter((w) => w.length > 4).slice(0, 10);

  return { intent, category, complexity, confidence, entities, context, keywords };
}

function enhancePrompt(
  text: string,
  model: string,
  category: string,
  analysis: AnalysisResult
): EnhancedPrompt {
  const lowerText = text.toLowerCase();

  let role = "Act as a helpful and knowledgeable assistant. ";
  if (analysis.intent === "code_generation") {
    role = "Act as a senior software engineer with 15+ years of experience. ";
  } else if (analysis.intent === "content_generation") {
    role = "Act as a professional content writer and copywriter. ";
  } else if (analysis.intent === "email") {
    role = "Act as a professional email correspondence specialist. ";
  } else if (analysis.intent === "image_generation") {
    role = "Act as a professional photographer and visual artist. ";
  }

  let structure = "";
  if (lowerText.includes("list") || lowerText.includes("bullet")) {
    structure = "Use bullet points and clear formatting. ";
  } else if (lowerText.includes("step") || lowerText.includes("how")) {
    structure = "Structure as a step-by-step guide. ";
  }

  let format = "";
  if (lowerText.includes("json")) format = "Respond in valid JSON format. ";
  else if (lowerText.includes("markdown")) format = "Use Markdown formatting with headers and sections. ";
  else if (analysis.intent === "code_generation") format = "Include code examples with syntax highlighting. ";

  const enhanced = [role, structure, format, text, ". Be specific, accurate, and comprehensive."]
    .filter(Boolean)
    .join("");

  const improvements = [
    { aspect: "Role", change: "Added expert role", reason: "Defines the AI's expertise" },
    { aspect: "Structure", change: "Improved organization", reason: "Makes output more scannable" },
    { aspect: "Specificity", change: "Added quality requirements", reason: "Ensures detailed responses" },
  ];

  let estimatedQuality = 70;
  if (enhanced.length > text.length * 1.5) estimatedQuality += 10;
  if (analysis.entities.length > 0) estimatedQuality += 5;

  return {
    enhanced,
    explanation: "Added expert role, structure, and quality requirements.",
    improvements,
    estimatedQuality: Math.min(95, estimatedQuality),
  };
}

function scorePrompt(text: string): ScoreResult {
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  let clarity = 60;
  if (wordCount > 10) clarity += 10;
  if (wordCount > 30) clarity += 10;
  if (wordCount > 50) clarity += 5;

  let specificity = 50;
  if (lowerText.includes("specific") || lowerText.includes("exactly")) specificity += 15;
  if (/\d/.test(text)) specificity += 10;
  if (lowerText.includes("example")) specificity += 10;

  let structure = 40;
  if (lowerText.includes("step")) structure += 15;
  if (lowerText.includes("list")) structure += 15;
  if (text.includes("\n")) structure += 5;

  let context = 45;
  if (lowerText.includes("audience") || lowerText.includes("for")) context += 10;
  if (lowerText.includes("goal") || lowerText.includes("objective")) context += 10;

  let lengthScore = 50;
  if (wordCount >= 20 && wordCount <= 200) lengthScore = 90;
  else if (wordCount >= 10 && wordCount <= 500) lengthScore = 80;

  let actionability = 45;
  const actionVerbs = ["create", "write", "generate", "explain", "analyze", "design", "build", "implement", "review", "compare"];
  actionVerbs.forEach((verb) => {
    if (lowerText.includes(verb)) actionability += 10;
  });

  const total = Math.round(
    (clarity * 0.2 + specificity * 0.2 + structure * 0.2 + context * 0.15 + lengthScore * 0.1 + actionability * 0.15)
  );

  const strengths: string[] = [];
  if (clarity > 70) strengths.push("Clear and easy to understand");
  if (specificity > 70) strengths.push("Specific requirements provided");
  if (structure > 70) strengths.push("Well-structured prompt");
  if (actionability > 70) strengths.push("Clear action items");

  const weaknesses: string[] = [];
  if (clarity < 60) weaknesses.push("Could be clearer");
  if (specificity < 60) weaknesses.push("Needs more specific details");
  if (structure < 60) weaknesses.push("Structure could be improved");

  const recommendations: string[] = [];
  if (clarity < 70) recommendations.push("Add more specific details");
  if (specificity < 70) recommendations.push("Include concrete examples");
  if (structure < 70) recommendations.push("Use numbered lists to organize");
  if (wordCount < 15) recommendations.push("Add more details to guide the AI");
  if (wordCount > 300) recommendations.push("Consider breaking into smaller prompts");

  return {
    total,
    dimensions: { clarity, specificity, structure, context, length: lengthScore, actionability },
    strengths,
    weaknesses,
    recommendations,
  };
}

// POST /api/v1/prompts/enhance-all
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { promptId, text, model, category } = body;

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const analysis = analyzePrompt(text);
  const enhanced = enhancePrompt(text, model || "gpt-4", category || analysis.category, analysis);
  const scoring = scorePrompt(text);

  // Score the enhanced version
  const enhancedScoring = scorePrompt(enhanced.enhanced);

  return NextResponse.json({
    data: {
      promptId,
      original: {
        text,
        score: scoring.total,
        analysis,
      },
      enhanced: {
        text: enhanced.enhanced,
        score: enhancedScoring.total,
        explanation: enhanced.explanation,
        improvements: enhanced.improvements,
        estimatedQuality: enhanced.estimatedQuality,
      },
      comparison: {
        scoreImprovement: enhancedScoring.total - scoring.total,
      },
      scoring,
      enhancedScoring,
    },
  });
}
