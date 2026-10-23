// @public-route
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { getTemplatesQuerySchema, createTemplateSchema } from "@/lib/validations/templates";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { OFFICIAL_TEMPLATES } from "@/lib/official-templates";

export const revalidate = 3600; // Cache template listings for 1 hour


export async function GET(request: NextRequest) {
  // Public template browsing allowed
  const { searchParams } = new URL(request.url);
  const queryResult = getTemplatesQuerySchema.safeParse({
    category: searchParams.get("category"),
    model: searchParams.get("model"),
    search: searchParams.get("search"),
    isOfficial: searchParams.get("isOfficial"),
  });

  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: queryResult.error.flatten() },
      { status: 400 }
    );
  }

  const { category, model, search, isOfficial } = queryResult.data;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (model) where.model = model;
  if (typeof isOfficial === "boolean") where.isOfficial = isOfficial;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
    ];
  }

  const dbTemplates = await getDb().template.findMany({
    where,
    orderBy: { usageCount: "desc" },
  }).catch(() => []);

  // Filter fallback official templates
  let fallback = OFFICIAL_TEMPLATES;
  if (category) fallback = fallback.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    fallback = fallback.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.prompt.toLowerCase().includes(q));
  }

  // Merge database templates and official fallback templates (deduplicating by id)
  const existingIds = new Set(dbTemplates.map((t) => t.id));
  const combined = [...dbTemplates, ...fallback.filter((f) => !existingIds.has(f.id))];

  return jsonResponse({ data: combined });
}

export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();
  const validation = createTemplateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { title, name, description, category, model, prompt } = validation.data;

  const template = await getDb().template.create({
    data: {
      title: title || name || "Untitled Template",
      description,
      category,
      model: model || null,
      isOfficial: false, // Always set to false for API creations
      prompt,
    },
  });

  return jsonResponse({ data: template }, { status: 201 });
});
