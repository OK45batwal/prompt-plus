import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { getTemplatesQuerySchema, createTemplateSchema } from "@/lib/validations/templates";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

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

  const templates = await getDb().template.findMany({
    where,
    orderBy: { usageCount: "desc" },
  });

  return NextResponse.json({ data: templates });
}

export function extractTemplateVariables(prompt: string): Array<{ name: string; label: string; type: string; required: boolean }> {
  const matches = prompt.matchAll(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
  const varsMap = new Map<string, { name: string; label: string; type: string; required: boolean }>();

  for (const match of matches) {
    const varName = match[1].trim();
    if (varName && !varsMap.has(varName)) {
      varsMap.set(varName, {
        name: varName,
        label: varName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        type: "text",
        required: true,
      });
    }
  }

  return Array.from(varsMap.values());
}

export const POST = withAuth(
  async (req, context) => {
    const { requestId, body } = context;
    const { name, description, prompt, category, models } = body!;
    const variables = extractTemplateVariables(prompt);

    const template = await getDb().template.create({
      data: {
        title: name,
        description: description || null,
        category: category || "other",
        prompt,
        variables,
        model: models?.[0] || null,
        isOfficial: false,
      },
    });

    return jsonResponse(
      {
        data: {
          id: template.id,
          name: template.title,
          description: template.description,
          prompt: template.prompt,
          variables,
          category: template.category,
          isOfficial: template.isOfficial,
        },
      },
      { status: 201, requestId }
    );
  },
  { schema: createTemplateSchema }
);
