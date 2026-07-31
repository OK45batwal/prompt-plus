import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { checkIpRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  const rateCheck = checkIpRateLimit(`tpluse:${ip}`, 60, 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests from this address. Try again later." },
      { status: 429 }
    );
  }

  try {
    const template = await getDb().template.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return NextResponse.json({ data: { id: template.id, usageCount: template.usageCount } });
  } catch {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
}
