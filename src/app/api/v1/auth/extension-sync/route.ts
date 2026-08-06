// @public-route
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://")) return true;
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) return true;
  if (origin === "https://prompt-plus-three.vercel.app" || origin.endsWith(".vercel.app")) return true;
  return false;
}

function getCorsHeaders(request: NextRequest) {
  const reqOrigin = request.headers.get("origin");
  const allowed = isAllowedOrigin(reqOrigin);
  const targetOrigin = allowed && reqOrigin ? reqOrigin : "https://prompt-plus-three.vercel.app";

  return {
    "Access-Control-Allow-Origin": targetOrigin,
    ...(allowed ? { "Access-Control-Allow-Credentials": "true" } : {}),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

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
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
