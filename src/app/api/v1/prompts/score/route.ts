import { NextRequest, NextResponse } from "next/server";

// Prompt Scoring Engine
// Evaluates prompts across multiple dimensions

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

function scorePrompt(text: string): ScoreResult {
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).filter((s) => s.trim()).length;

  // Clarity score (1-100)
  let clarity = 60;
  if (wordCount > 10) clarity += 10;
  if (wordCount > 30) clarity += 10;
  if (sentenceCount > 1) clarity += 5;
  if (lowerText.includes("specific") || lowerText.includes("clear")) clarity += 5;
  if (!lowerText.includes("maybe") && !lowerText.includes("might")) clarity += 5;

  // Specificity score (1-100)
  let specificity = 50;
  if (lowerText.includes("exactly") || lowerText.includes("specifically")) specificity += 15;
  if (lowerText.includes("number") || lowerText.includes("count") || /\d/.test(text)) specificity += 10;
  if (lowerText.includes("example")) specificity += 10;
  if (lowerText.includes("format")) specificity += 5;
  if (wordCount > 20) specificity += 5;

  // Structure score (1-100)
  let structure = 40;
  if (lowerText.includes("step")) structure += 15;
  if (lowerText.includes("list") || lowerText.includes("bullet")) structure += 15;
  if (lowerText.includes("heading") || lowerText.includes("section")) structure += 10;
  if (sentenceCount > 3) structure += 5;
  if (text.includes("\n")) structure += 5;

  // Context score (1-100)
  let context = 45;
  if (lowerText.includes("background") || lowerText.includes("context")) context += 15;
  if (lowerText.includes("audience") || lowerText.includes("for")) context += 10;
  if (lowerText.includes("goal") || lowerText.includes("objective")) context += 10;
  if (lowerText.includes("example")) context += 5;

  // Length score (1-100)
  let lengthScore = 50;
  if (wordCount >= 10 && wordCount <= 500) lengthScore = 80;
  if (wordCount >= 20 && wordCount <= 200) lengthScore = 90;
  if (wordCount < 10) lengthScore = 30;
  if (wordCount > 500) lengthScore = 60;

  // Actionability score (1-100)
  let actionability = 45;
  const actionVerbs = ["create", "write", "generate", "explain", "analyze", "design", "build", "implement", "review", "compare"];
  actionVerbs.forEach((verb) => {
    if (lowerText.includes(verb)) actionability += 10;
  });
  if (lowerText.includes("output") || lowerText.includes("result")) actionability += 5;

  // Calculate total
  const total = Math.round(
    (clarity * 0.2 + specificity * 0.2 + structure * 0.2 + context * 0.15 + lengthScore * 0.1 + actionability * 0.15)
  );

  // Strengths
  const strengths: string[] = [];
  if (clarity > 70) strengths.push("Clear and easy to understand");
  if (specificity > 70) strengths.push("Specific requirements provided");
  if (structure > 70) strengths.push("Well-structured prompt");
  if (context > 70) strengths.push("Good context provided");
  if (actionability > 70) strengths.push("Clear action items");

  // Weaknesses
  const weaknesses: string[] = [];
  if (clarity < 60) weaknesses.push("Could be clearer");
  if (specificity < 60) weaknesses.push("Needs more specific details");
  if (structure < 60) weaknesses.push("Structure could be improved");
  if (context < 60) weaknesses.push("Missing context");
  if (lengthScore < 60) weaknesses.push("Prompt length not optimal");

  // Recommendations
  const recommendations: string[] = [];
  if (clarity < 70) recommendations.push("Add more specific details about what you want");
  if (specificity < 70) recommendations.push("Include concrete examples or requirements");
  if (structure < 70) recommendations.push("Use numbered lists or sections to organize your prompt");
  if (context < 70) recommendations.push("Provide background information and target audience");
  if (actionability < 70) recommendations.push("Start with a clear action verb (write, create, explain)");
  if (wordCount < 15) recommendations.push("Add more details to guide the AI better");
  if (wordCount > 300) recommendations.push("Consider breaking into smaller, focused prompts");

  return {
    total,
    dimensions: {
      clarity,
      specificity,
      structure,
      context,
      length: lengthScore,
      actionability,
    },
    strengths,
    weaknesses,
    recommendations,
  };
}

// POST /api/v1/prompts/score
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { promptId, text } = body;

  if (!text) {
    return NextResponse.json(
      { error: "text is required" },
      { status: 400 }
    );
  }

  const scoring = scorePrompt(text);

  return NextResponse.json({
    data: {
      promptId,
      ...scoring,
    },
  });
}
