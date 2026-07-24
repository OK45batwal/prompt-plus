import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/prisma";
import { paginationSchema } from "@/lib/validations/common";
import { createCollectionSchema } from "@/lib/validations/collections";

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
      { error: "Invalid pagination parameters", details: queryResult.error.flatten() },
      { status: 400 }
    );
  }

  const { page, pageSize } = queryResult.data;
  const userId = session.user.id;
  const offset = (page - 1) * pageSize;

  const where = { userId };

  const [collections, total] = await Promise.all([
    db.collection.findMany({
      where,
      orderBy: { name: "asc" },
      skip: offset,
      take: pageSize,
      include: {
        _count: { select: { prompts: true } },
      },
    }),
    db.collection.count({ where }),
  ]);

  const data = collections.map((c) => ({
    ...c,
    prompt_count: c._count.prompts,
    _count: undefined,
  }));

  return NextResponse.json({ data, total, page, pageSize, hasMore: offset + pageSize < total });
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

  const parseResult = createCollectionSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { name, description, color, icon } = parseResult.data;
  const userId = session.user.id;

  const collection = await db.collection.create({
    data: {
      userId,
      name,
      description: description || null,
      color: color || "#000",
      icon: icon || "folder",
    },
  });

  return NextResponse.json({ data: { id: collection.id, name: collection.name, description: collection.description, color: collection.color, icon: collection.icon } }, { status: 201 });
}
