import { NextRequest, NextResponse } from "next/server";

function scorePrompt(text: string) {
  const wc = text.split(/\s+/).length;
  return {
    total: Math.min(100, wc * 2),
    dimensions: { clarity: 60, specificity: 50, structure: 40, context: 45, length: 50, actionability: 45 },
    strengths: [], weaknesses: [], recommendations: ["Add more specific details"],
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { promptId, text } = body;
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  return NextResponse.json({ data: { promptId, ...scorePrompt(text) } });
}
