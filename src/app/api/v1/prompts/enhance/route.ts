import { NextRequest, NextResponse } from "next/server";

// AI Enhancement Engine
// This simulates AI prompt enhancement for the MVP
// In production, this would call OpenAI/Anthropic/etc.

interface EnhancedPrompt {
  original: string;
  enhanced: string;
  explanation: string;
  improvements: { aspect: string; change: string; reason: string }[];
  model: string;
  category: string;
  estimatedQuality: number;
}

function enhancePrompt(
  text: string,
  model: string,
  category?: string,
  tone?: string,
  length?: string
): EnhancedPrompt {
  // Determine the best enhancement strategy based on category and intent
  const lowerText = text.toLowerCase();

  // Role-based enhancement
  let role = "";
  if (lowerText.includes("code") || lowerText.includes("function")) {
    role = "Act as a senior software engineer with 15+ years of experience. ";
  } else if (lowerText.includes("write") || lowerText.includes("content")) {
    role = "Act as a professional content writer and copywriter. ";
  } else if (lowerText.includes("analyze") || lowerText.includes("data")) {
    role = "Act as a data analyst expert. ";
  } else if (lowerText.includes("teach") || lowerText.includes("explain")) {
    role = "Act as a patient and knowledgeable teacher. ";
  } else if (lowerText.includes("image") || lowerText.includes("picture")) {
    role = "Act as a professional photographer and visual artist. ";
  } else {
    role = "Act as a helpful and knowledgeable assistant. ";
  }

  // Context enhancement
  let context = "";
  if (lowerText.includes("beginner") || lowerText.includes("simple")) {
    context = "Write for a beginner audience. ";
  } else if (lowerText.includes("expert") || lowerText.includes("advanced")) {
    context = "Write for an expert audience. ";
  }

  // Structure enhancement
  let structure = "";
  if (lowerText.includes("list") || lowerText.includes("bullet")) {
    structure = "Use bullet points and clear formatting. ";
  } else if (lowerText.includes("step") || lowerText.includes("how")) {
    structure = "Structure as a step-by-step guide. ";
  } else if (lowerText.includes("compare") || lowerText.includes("vs")) {
    structure = "Compare and contrast the options clearly. ";
  }

  // Format specification
  let format = "";
  if (lowerText.includes("json")) {
    format = "Respond in valid JSON format. ";
  } else if (lowerText.includes("markdown")) {
    format = "Use Markdown formatting with headers and sections. ";
  } else if (lowerText.includes("code")) {
    format = "Include code examples with syntax highlighting. ";
  }

  // Quality requirements
  const qualityRequirements = [
    "Be specific and actionable.",
    "Include examples where helpful.",
    "Ensure accuracy and completeness.",
  ];

  // Tone specification
  let toneSpec = "";
  if (tone) {
    toneSpec = `Write in a ${tone} tone. `;
  } else if (lowerText.includes("formal") || lowerText.includes("professional")) {
    toneSpec = "Use a professional and formal tone. ";
  } else if (lowerText.includes("casual") || lowerText.includes("friendly")) {
    toneSpec = "Use a casual and friendly tone. ";
  } else if (lowerText.includes("funny") || lowerText.includes("humor")) {
    toneSpec = "Include humor and wit while remaining professional. ";
  }

  // Length specification
  let lengthSpec = "";
  if (length === "short") {
    lengthSpec = "Keep it concise and to the point. ";
  } else if (length === "medium") {
    lengthSpec = "Provide a moderately detailed response. ";
  } else if (length === "long") {
    lengthSpec = "Provide comprehensive and detailed coverage. ";
  }

  // Combine all parts
  const enhanced = [
    role,
    context,
    structure,
    format,
    toneSpec,
    lengthSpec,
    text,
    ". ",
    qualityRequirements.join(" "),
  ]
    .filter(Boolean)
    .join("");

  // Improvements made
  const improvements = [
    {
      aspect: "Role",
      change: "Added expert role",
      reason: "Defines the AI's expertise and perspective",
    },
    {
      aspect: "Structure",
      change: "Improved organization",
      reason: "Makes the output more scannable and useful",
    },
    {
      aspect: "Specificity",
      change: "Added quality requirements",
      reason: "Ensures detailed, actionable responses",
    },
  ];

  // Estimate quality (1-100)
  let estimatedQuality = 70;
  if (enhanced.length > text.length * 1.5) estimatedQuality += 10;
  if (role) estimatedQuality += 5;
  if (structure) estimatedQuality += 5;
  if (format) estimatedQuality += 5;
  if (qualityRequirements.length > 0) estimatedQuality += 5;

  return {
    original: text,
    enhanced,
    explanation: "Added expert role, structure, and quality requirements to improve output relevance and clarity.",
    improvements,
    model,
    category: category || "other",
    estimatedQuality: Math.min(95, estimatedQuality),
  };
}

// POST /api/v1/prompts/enhance
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { promptId, text, model, category, tone, length } = body;

  if (!text) {
    return NextResponse.json(
      { error: "text is required" },
      { status: 400 }
    );
  }

  const enhanced = enhancePrompt(text, model, category, tone, length);

  return NextResponse.json({
    data: {
      promptId,
      ...enhanced,
    },
  });
}
