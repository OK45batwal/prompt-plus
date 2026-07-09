import { NextRequest, NextResponse } from "next/server";

// Real OpenAI Integration
// This endpoint calls OpenAI to enhance prompts

interface EnhanceRequest {
  text: string;
  model: string;
  category?: string;
  tone?: string;
  length?: string;
}

// Build the system prompt for enhancement
function buildSystemPrompt(category?: string, tone?: string, length?: string): string {
  let systemPrompt = `You are an expert prompt engineer. Your task is to take a user's rough prompt idea and transform it into a professional, optimized prompt that will produce the best possible results from AI models.

Rules:
1. Keep the original intent intact
2. Add specificity and clarity
3. Include role assignment when appropriate
4. Add structure (headers, lists, sections)
5. Specify output format when relevant
6. Add quality requirements
7. Be concise but comprehensive`;

  if (category) {
    systemPrompt += `\n\nThe prompt is for: ${category}`;
  }

  if (tone) {
    systemPrompt += `\nTone preference: ${tone}`;
  }

  if (length) {
    systemPrompt += `\nDesired response length: ${length}`;
  }

  return systemPrompt;
}

// Build the user message
function buildUserPrompt(text: string): string {
  return `Transform this prompt into an optimized version:

"${text}"

Provide the enhanced prompt directly, without explanations. The enhanced prompt should be ready to use.`;
}

// POST /api/v1/prompts/enhance-ai
export async function POST(request: NextRequest) {
  const body: EnhanceRequest = await request.json();
  const { text, model, category, tone, length } = body;

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  // Check for OpenAI API key
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback to local enhancement if no API key
    return NextResponse.json({
      data: {
        enhanced: enhanceLocally(text, category, tone),
        provider: "local",
        model: "local-enhancement",
      },
    });
  }

  try {
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: buildSystemPrompt(category, tone, length) },
          { role: "user", content: buildUserPrompt(text) },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    const enhanced = data.choices[0].message.content;

    return NextResponse.json({
      data: {
        enhanced,
        provider: "openai",
        model: "gpt-4",
        usage: data.usage,
      },
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to local enhancement
    return NextResponse.json({
      data: {
        enhanced: enhanceLocally(text, category, tone),
        provider: "local-fallback",
        model: "local-enhancement",
        error: error instanceof Error ? error.message : "API error",
      },
    });
  }
}

// Local enhancement fallback
function enhanceLocally(text: string, category?: string, tone?: string): string {
  const lowerText = text.toLowerCase();

  // Role
  let role = "Act as a helpful and knowledgeable assistant. ";
  if (lowerText.includes("code") || lowerText.includes("function")) {
    role = "Act as a senior software engineer with 15+ years of experience. ";
  } else if (lowerText.includes("write") || lowerText.includes("content")) {
    role = "Act as a professional content writer. ";
  } else if (lowerText.includes("email")) {
    role = "Act as a professional communication specialist. ";
  } else if (lowerText.includes("analyze") || lowerText.includes("data")) {
    role = "Act as a data analyst expert. ";
  } else if (lowerText.includes("teach") || lowerText.includes("explain")) {
    role = "Act as a patient and knowledgeable teacher. ";
  }

  // Structure
  let structure = "";
  if (lowerText.includes("list") || lowerText.includes("bullet")) {
    structure = "Use bullet points and clear formatting. ";
  } else if (lowerText.includes("step") || lowerText.includes("how")) {
    structure = "Structure as a step-by-step guide. ";
  }

  // Tone
  let toneSpec = "";
  if (tone) {
    toneSpec = `Write in a ${tone.toLowerCase()} tone. `;
  }

  // Combine
  return [role, structure, toneSpec, text, ". Be specific, accurate, and comprehensive."]
    .filter(Boolean)
    .join("");
}
