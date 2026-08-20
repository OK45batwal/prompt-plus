// @public-route
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const cwd = /* turbopackIgnore: true */ process.cwd();
  // Resolve current version from the packaged manifest so the download always tracks releases
  let version = "1.1.0";
  try {
    const manifestPath = path.join(cwd, "extension", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      if (manifest.version) version = String(manifest.version);
    }
  } catch {
    // fall back to default version below
  }

  const versionedName = `prompt-plus-extension-v${version}.zip`;
  // Prefer the versioned package for the current release, then fall back to the generic copy
  const candidatePaths = [
    path.join(cwd, "public", versionedName),
    path.join(cwd, "dist", versionedName),
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
      "Content-Disposition": `attachment; filename="${versionedName}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
