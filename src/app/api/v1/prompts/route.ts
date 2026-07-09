import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/prompts - List prompts
// Uses mock data for now (no database required)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || "";

  // Mock data for MVP
  const mockPrompts = [
    {
      id: "1",
      title: "Blog Post Introduction",
      originalText: "Write an introduction for a blog post about AI",
      enhancedText: "Act as a professional content writer. Write an engaging introduction for a blog post about artificial intelligence...",
      model: "gpt-4",
      category: "Blog Post",
      score: 85,
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Email Follow-up",
      originalText: "Follow up on the meeting",
      enhancedText: "Act as a professional email specialist. Write a follow-up email after a business meeting...",
      model: "claude-3",
      category: "Email",
      score: 78,
      createdAt: new Date().toISOString(),
    },
  ];

  return NextResponse.json({
    data: mockPrompts,
    total: mockPrompts.length,
    page,
    pageSize,
    hasMore: false,
  });
}

// POST /api/v1/prompts - Create prompt
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { originalText, model, category, tone, length } = body;

  if (!originalText || !model) {
    return NextResponse.json(
      { error: "originalText and model are required" },
      { status: 400 }
    );
  }

  // Mock create
  const prompt = {
    id: `new-${Date.now()}`,
    originalText,
    model,
    category,
    tone,
    length,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ data: prompt }, { status: 201 });
}
