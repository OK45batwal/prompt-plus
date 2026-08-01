import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "prompt-plus-extension.zip");

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Extension zip file not found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="prompt-plus-extension.zip"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
