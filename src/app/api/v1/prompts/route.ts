import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * pageSize;

  const where = search ? `WHERE title LIKE ? OR original_text LIKE ?` : "";
  const params: string[] = [];
  if (search) params.push(`%${search}%`, `%${search}%`);

  const prompts = db.prepare(`SELECT * FROM prompts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
  const total = (db.prepare(`SELECT count(*) as count FROM prompts ${where}`).get(...params) as any).count;

  return NextResponse.json({ data: prompts, total, page, pageSize, hasMore: offset + pageSize < total });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { originalText, model, category, tone, length } = body;
  if (!originalText || !model) return NextResponse.json({ error: "originalText and model are required" }, { status: 400 });

  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  db.prepare(`INSERT INTO prompts (id, user_id, original_text, model, category, tone, length, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, "cm0000000000000000000001", originalText, model, category || null, tone || null, length || null, now, now);

  return NextResponse.json({ data: { id, originalText, model, category, tone, length, createdAt: now } }, { status: 201 });
}
