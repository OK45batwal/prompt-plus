import { NextRequest, NextResponse } from "next/server";

function buildSystemPrompt(category?: string, tone?: string, length?: string): string {
  let sp = "You are an expert prompt engineer. Transform the user's prompt into an optimized version. Be concise but comprehensive.";
  if (category) sp += `\n\nThe prompt is for: ${category}`;
  if (tone) sp += `\nTone preference: ${tone}`;
  if (length) sp += `\nDesired response length: ${length}`;
  return sp;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, model, category, tone, length } = body;
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ data: { enhanced: `Act as an expert assistant. ${text} Be specific and thorough.`, provider: "local", model: "local-enhancement" } });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: buildSystemPrompt(category, tone, length) },
          { role: "user", content: `Transform this prompt into an optimized version:\n\n"${text}"\n\nProvide the enhanced prompt directly, without explanations.` },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    if (!response.ok) throw new Error((await response.json()).error?.message || "OpenAI API error");
    const data = await response.json();
    return NextResponse.json({ data: { enhanced: data.choices[0].message.content, provider: "openai", model: "gpt-4", usage: data.usage } });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json({ data: { enhanced: `Act as an expert assistant. ${text} Be specific and thorough.`, provider: "local-fallback", model: "local-enhancement", error: error instanceof Error ? error.message : "API error" } });
  }
}
