import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";

  try {
    // DB ping check compatible with SQLite and Neon PostgreSQL
    await getDb().user.findFirst({ select: { id: true } });
  } catch {
    dbStatus = "disconnected";
  }

  const isHealthy = dbStatus === "connected";
  const latencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      latencyMs,
      environment: process.env.NODE_ENV || "development",
    },
    { status: isHealthy ? 200 : 503 }
  );
}
