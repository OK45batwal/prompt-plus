import { NextRequest, NextResponse } from "next/server";

// AI Analysis Engine
// This simulates AI analysis for the MVP
// In production, this would call OpenAI/Anthropic/etc.

interface AnalysisResult {
  intent: string;
  category: string;
  complexity: number;
  confidence: number;
  entities: string[];
  context: string[];
  keywords: string[];
  missing: { field: string; label: string; priority: string }[];
  suggestions: { text: string; impact: string; category: string }[];
}

function analyzePrompt(text: string): AnalysisResult {
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;
  const charCount = text.length;

  // Intent detection
  let intent = "content_generation";
  if (lowerText.includes("code") || lowerText.includes("function") || lowerText.includes("program")) {
    intent = "code_generation";
  } else if (lowerText.includes("image") || lowerText.includes("picture") || lowerText.includes("photo")) {
    intent = "image_generation";
  } else if (lowerText.includes("email") || lowerText.includes("message")) {
    intent = "email";
  } else if (lowerText.includes("analyze") || lowerText.includes("data") || lowerText.includes("chart")) {
    intent = "data_analysis";
  } else if (lowerText.includes("teach") || lowerText.includes("explain") || lowerText.includes("learn")) {
    intent = "education";
  }

  // Category detection
  let category = "other";
  if (lowerText.includes("blog") || lowerText.includes("article") || lowerText.includes("post")) {
    category = "blog_post";
  } else if (lowerText.includes("tutorial") || lowerText.includes("how to")) {
    category = "tutorial";
  } else if (lowerText.includes("email") || lowerText.includes("newsletter")) {
    category = "email";
  } else if (lowerText.includes("function") || lowerText.includes("api")) {
    category = "function";
  } else if (lowerText.includes("review") || lowerText.includes("feedback")) {
    category = "code_review";
  }

  // Complexity calculation (1-5)
  let complexity: 1 | 2 | 3 | 4 | 5 = 1;
  if (wordCount > 50) complexity = 2;
  if (wordCount > 100) complexity = 3;
  if (wordCount > 200) complexity = 4;
  if (wordCount > 500) complexity = 5;

  // Confidence based on specificity
  let confidence = 0.6;
  if (charCount > 50) confidence = 0.7;
  if (charCount > 100) confidence = 0.8;
  if (charCount > 200) confidence = 0.85;
  if (charCount > 500) confidence = 0.9;

  // Entity extraction (simplified)
  const entities: string[] = [];
  const technicalTerms = ["api", "json", "html", "css", "javascript", "python", "react", "node"];
  technicalTerms.forEach((term) => {
    if (lowerText.includes(term)) entities.push(term);
  });

  // Context detection
  const context: string[] = [];
  if (lowerText.includes("web") || lowerText.includes("website")) context.push("web_development");
  if (lowerText.includes("business") || lowerText.includes("company")) context.push("business");
  if (lowerText.includes("marketing") || lowerText.includes("sales")) context.push("marketing");

  // Keyword extraction (simplified)
  const keywords = text
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 10);

  // Missing requirements
  const missing: { field: string; label: string; priority: string }[] = [];
  if (!lowerText.includes("audience") && !lowerText.includes("for")) {
    missing.push({ field: "audience", label: "Target audience", priority: "high" });
  }
  if (!lowerText.includes("tone") && !lowerText.includes("style")) {
    missing.push({ field: "tone", label: "Tone of voice", priority: "medium" });
  }
  if (!lowerText.includes("length") && !lowerText.includes("word") && !lowerText.includes("detail")) {
    missing.push({ field: "length", label: "Desired length", priority: "low" });
  }
  if (!lowerText.includes("format") && !lowerText.includes("structure")) {
    missing.push({ field: "format", label: "Output format", priority: "low" });
  }

  // Suggestions
  const suggestions: { text: string; impact: string; category: string }[] = [];
  if (missing.length > 0) {
    suggestions.push({
      text: "Specify your target audience for more relevant results",
      impact: "high",
      category: "clarity",
    });
  }
  if (charCount < 20) {
    suggestions.push({
      text: "Provide more detail about what you want to achieve",
      impact: "high",
      category: "completeness",
    });
  }
  if (!lowerText.includes("example")) {
    suggestions.push({
      text: "Add examples of the expected output",
      impact: "medium",
      category: "specificity",
    });
  }

  return {
    intent,
    category,
    complexity,
    confidence,
    entities,
    context,
    keywords,
    missing,
    suggestions,
  };
}

// POST /api/v1/prompts/analyze
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { promptId, text } = body;

  if (!text) {
    return NextResponse.json(
      { error: "text is required" },
      { status: 400 }
    );
  }

  const analysis = analyzePrompt(text);

  return NextResponse.json({
    data: {
      promptId,
      ...analysis,
    },
  });
}
