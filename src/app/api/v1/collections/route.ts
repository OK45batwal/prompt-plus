import { NextRequest } from "next/server";
import { getDb } from "@/lib/db/prisma";
import { paginationSchema } from "@/lib/validations/common";
import { createCollectionSchema } from "@/lib/validations/collections";
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
        { error: "Invalid pagination parameters", details: queryResult.error.flatten() },
        { status: 400, requestId }
      );
    }

    const { page, pageSize } = queryResult.data;
    const offset = (page - 1) * pageSize;

  const where = { userId };

  const [collections, total] = await Promise.all([
    getDb().collection.findMany({
      where,
      orderBy: { name: "asc" },
      skip: offset,
      take: pageSize,
      include: {
        _count: { select: { prompts: true } },
      },
    }),
    getDb().collection.count({ where }),
  ]);

  const data = collections.map((c) => ({
    ...c,
    prompt_count: c._count.prompts,
    _count: undefined,
  }));

    return jsonResponse({ data, total, page, pageSize, hasMore: offset + pageSize < total }, { requestId });
  }
);

export const POST = withAuth(
  async (req, context) => {
    const { userId, requestId, body } = context;
    const { name, description, color, icon } = body!;

    const collection = await getDb().collection.create({
      data: {
        userId,
        name,
        description: description || null,
        color: color || "#000",
        icon: icon || "folder",
      },
    });

    return jsonResponse(
      { data: { id: collection.id, name: collection.name, description: collection.description, color: collection.color, icon: collection.icon } },
      { status: 201, requestId }
    );
  },
  { schema: createCollectionSchema }
);
