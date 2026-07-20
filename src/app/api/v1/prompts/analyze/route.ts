import { NextRequest, NextResponse } from "next/server";

function analyzePrompt(text: string) {
  const wc = text.split(/\s+/).length;
  const keywords = text.split(/\s+/).filter((w) => w.length > 4).slice(0, 10);
  return {
    intent: "content_generation", category: "other", complexity: wc > 50 ? 2 : 1,
    confidence: 0.6, entities: [], context: [], keywords,
    missing: [], suggestions: [],
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { promptId, text } = body;
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  return NextResponse.json({ data: { promptId, ...analyzePrompt(text) } });
}
