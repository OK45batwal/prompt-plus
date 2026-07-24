import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";
import { getTemplatesQuerySchema, createTemplateSchema } from "@/lib/validations/templates";

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
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const templates = await getDb().template.findMany({
    where,
    orderBy: { usageCount: "desc" },
  });

  return NextResponse.json({ data: templates });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parseResult = createTemplateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description, prompt, category, models, isOfficial } = parseResult.data;

  const template = await getDb().template.create({
    data: {
      title: name,
      description: description || null,
      category: category || "other",
      prompt,
      variables: [],
      model: models?.[0] || null,
      isOfficial: isOfficial || false,
    },
  });

  return NextResponse.json({ data: { id: template.id, name: template.title, description: template.description, prompt: template.prompt, category: template.category, isOfficial: template.isOfficial } }, { status: 201 });
}
