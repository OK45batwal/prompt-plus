import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/collections - List collections
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  // Mock data
  const mockCollections = [
    {
      id: "1",
      name: "Blog Writing",
      description: "Prompts for creating blog posts and articles",
      promptCount: 12,
      icon: "📝",
      color: "#3b82f6",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Email Templates",
      description: "Professional email prompts",
      promptCount: 8,
      icon: "📧",
      color: "#10b981",
      createdAt: new Date().toISOString(),
    },
  ];

  return NextResponse.json({
    data: mockCollections,
    total: mockCollections.length,
    page,
    pageSize,
    hasMore: false,
  });
}

// POST /api/v1/collections - Create collection
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, icon, color } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Mock create
  const collection = {
    id: `new-${Date.now()}`,
    name,
    description,
    icon: icon || "folder",
    color: color || "#000000",
    promptCount: 0,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ data: collection }, { status: 201 });
}
