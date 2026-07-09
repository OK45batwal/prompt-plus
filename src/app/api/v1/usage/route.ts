import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/usage - Get usage stats
export async function GET(request: NextRequest) {
  // Free tier limits
  const FREE_DAILY_LIMIT = 20;
  const FREE_MONTHLY_LIMIT = 500;

  // Mock usage data
  const usage = {
    daily: {
      used: 5,
      limit: FREE_DAILY_LIMIT,
      remaining: FREE_DAILY_LIMIT - 5,
      resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
    },
    monthly: {
      used: 47,
      limit: FREE_MONTHLY_LIMIT,
      remaining: FREE_MONTHLY_LIMIT - 47,
      resetsAt: new Date(new Date().setDate(1)).toISOString(),
    },
    totalPrompts: 156,
    totalEnhancements: 89,
    averageScore: 72,
  };

  return NextResponse.json({ data: usage });
}

// POST /api/v1/usage/track - Track usage event
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, details } = body;

  // Mock event
  const event = {
    id: `evt-${Date.now()}`,
    action,
    details,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({ data: event }, { status: 201 });
}
