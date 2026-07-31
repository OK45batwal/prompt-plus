import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { checkIpRateLimit, extractClientIp, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params;
  const ip = extractClientIp(request);

  const rateCheck = checkIpRateLimit(`tpluse:${ip}`, 60, 60 * 60 * 1000);
  const rateLimitHeaders = getRateLimitHeaders(rateCheck);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests from this address. Try again later." },
      { status: 429, headers: { ...rateLimitHeaders, "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) } }
    );
  }

  try {
    const template = await getDb().template.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return NextResponse.json(
      { data: { id: template.id, usageCount: template.usageCount } },
      { headers: rateLimitHeaders }
    );
  } catch {
    return NextResponse.json({ error: "Template not found" }, { status: 404, headers: rateLimitHeaders });
  }
}
