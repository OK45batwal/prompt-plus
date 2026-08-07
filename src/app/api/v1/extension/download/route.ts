// @public-route
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const cwd = /* turbopackIgnore: true */ process.cwd();
  // Check for the freshly packaged zip in public/ or dist/
  const candidatePaths = [
    path.join(cwd, "public", "prompt-plus-extension-v1.1.0.zip"),
    path.join(cwd, "dist", "prompt-plus-extension-v1.1.0.zip"),
    path.join(cwd, "public", "prompt-plus-extension.zip"),
  ];

  let targetPath = "";
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    return NextResponse.json({ error: "Extension zip file not found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(targetPath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="prompt-plus-extension-v1.1.0.zip"',
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
