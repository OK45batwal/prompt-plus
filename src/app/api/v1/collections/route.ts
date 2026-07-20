import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const offset = (page - 1) * pageSize;

  const collections = db.prepare(`SELECT c.*, (SELECT count(*) FROM prompts WHERE collection_id = c.id) as prompt_count FROM collections c ORDER BY c.name LIMIT ? OFFSET ?`).all(pageSize, offset);
  const total = (db.prepare(`SELECT count(*) as count FROM collections`).get() as any).count;

  return NextResponse.json({ data: collections, total, page, pageSize, hasMore: offset + pageSize < total });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, color, icon } = body;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const id = `c_${Date.now()}`;
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  db.prepare(`INSERT INTO collections (id, user_id, name, description, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, "cm0000000000000000000001", name, description || null, color || "#000", icon || "folder", now, now);

  return NextResponse.json({ data: { id, name, description, color, icon } }, { status: 201 });
}
