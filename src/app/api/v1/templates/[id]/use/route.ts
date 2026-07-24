import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params;

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
