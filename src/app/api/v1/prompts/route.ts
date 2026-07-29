import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";
import { paginationSchema } from "@/lib/validations/common";
import { createPromptSchema } from "@/lib/validations/prompts";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queryResult = paginationSchema.safeParse({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    search: searchParams.get("search"),
  });

  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Invalid pagination query parameters", details: queryResult.error.flatten() },
      { status: 400 }
    );
  }

  const { page, pageSize, search } = queryResult.data;
  const userId = session.user.id;
  const offset = (page - 1) * pageSize;

  const where = {
    userId,
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { originalText: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [prompts, total] = await Promise.all([
    getDb().prompt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: pageSize,
    }),
    getDb().prompt.count({ where }),
  ]);

  return NextResponse.json({ data: prompts, total, page, pageSize, hasMore: offset + pageSize < total });
}

export const POST = withAuth(
  async (req, context) => {
    const { userId, requestId, body } = context;
    const { originalText, model, category, tone, length } = body!;

    const prompt = await getDb().prompt.create({
      data: {
        userId,
        originalText,
        model,
        category: category || null,
        tone: tone || null,
        length: length || null,
      },
    });

    return jsonResponse(
      { data: { id: prompt.id, originalText: prompt.originalText, model: prompt.model, category: prompt.category, tone: prompt.tone, length: prompt.length, createdAt: prompt.createdAt } },
      { status: 201, requestId }
    );
  },
  { schema: createPromptSchema }
);
