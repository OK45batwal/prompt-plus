import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: {
      daily: { used: 5, limit: 20, remaining: 15, resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString() },
      monthly: { used: 47, limit: 500, remaining: 453, resetsAt: new Date(new Date().setDate(1)).toISOString() },
      totalPrompts: 156, totalEnhancements: 89, averageScore: 72,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, details } = body;
  return NextResponse.json({ data: { id: `evt-${Date.now()}`, action, details, timestamp: new Date().toISOString() } }, { status: 201 });
}
