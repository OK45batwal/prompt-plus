import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const model = searchParams.get("model") || "";
  const search = searchParams.get("search") || "";

  let where = "1=1";
  const params: any[] = [];
  if (category) { where += " AND category = ?"; params.push(category); }
  if (model) { where += " AND model = ?"; params.push(model); }
  if (search) { where += " AND (title LIKE ? OR description LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

  const templates = db.prepare(`SELECT * FROM templates WHERE ${where} ORDER BY usage_count DESC`).all(...params);

  return NextResponse.json({ data: templates });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, prompt, category, models } = body;
  if (!name || !prompt) return NextResponse.json({ error: "name and prompt are required" }, { status: 400 });

  const id = `t_${Date.now()}`;
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  db.prepare(`INSERT INTO templates (id, title, description, category, prompt, variables, model, is_official, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, name, description || null, category || "other", prompt, "[]", models?.[0] || null, 0, now, now);

  return NextResponse.json({ data: { id, name, description, prompt, category } }, { status: 201 });
}
