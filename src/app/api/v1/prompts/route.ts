import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { paginationSchema } from "@/lib/validations/common";
import { createPromptSchema } from "@/lib/validations/prompts";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export const GET = withAuth(
  async (request: NextRequest, { userId, requestId }) => {
    const { searchParams } = new URL(request.url);
    const queryResult = paginationSchema.safeParse({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      search: searchParams.get("search"),
    });

    if (!queryResult.success) {
      return jsonResponse(
        { error: "Invalid pagination query parameters", details: queryResult.error.flatten() },
        { status: 400, requestId }
      );
    }

    const { page, pageSize, search } = queryResult.data;
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

    return jsonResponse({ data: prompts, total, page, pageSize, hasMore: offset + pageSize < total }, { requestId });
  }
);

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

export const DELETE = withAuth(
  async (request: NextRequest, { userId, requestId }) => {
    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get("all") === "true";
    const singleId = searchParams.get("id");

    if (clearAll) {
      const result = await getDb().prompt.updateMany({
        where: {
          userId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return jsonResponse(
        { message: "History cleared successfully", count: result.count },
        { requestId }
      );
    }

    if (singleId) {
      const result = await getDb().prompt.updateMany({
        where: {
          id: singleId,
          userId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return jsonResponse(
        { message: "Prompt deleted successfully", count: result.count },
        { requestId }
      );
    }

    // Try reading JSON body for bulk IDs
    let body: { ids?: string[] } = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const result = await getDb().prompt.updateMany({
        where: {
          id: { in: body.ids },
          userId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return jsonResponse(
        { message: "Prompts deleted successfully", count: result.count },
        { requestId }
      );
    }

    return jsonResponse(
      { error: "Provide ?all=true, ?id=<promptId>, or a JSON body with { ids: string[] }" },
      { status: 400, requestId }
    );
  }
);

