import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const session = await auth().catch(() => null);
    if (!session?.user?.id) {
      return NextResponse.json({ authenticated: false }, { headers: corsHeaders });
    }

    const user = await getDb().user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, avatar: true },
    }).catch(() => null);

    if (!user) {
      return NextResponse.json({ authenticated: false }, { headers: corsHeaders });
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          avatar: user.avatar || null,
        },
      },
      { headers: corsHeaders }
    );
  } catch {
    return NextResponse.json({ authenticated: false }, { headers: corsHeaders });
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
