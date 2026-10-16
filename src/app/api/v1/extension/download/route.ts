// @public-route
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import manifest from "../../../../../../extension/manifest.json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // A fixed public asset keeps server file tracing scoped to the release archive.
    const archive = await readFile(path.join(process.cwd(), "public", "prompt-plus-extension.zip"));
    return new NextResponse(archive, { headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="prompt-plus-extension-v${manifest.version}.zip"`,
      "Cache-Control": "no-store",
    } });
  } catch {
    return NextResponse.json({ error: "Extension release is unavailable" }, { status: 404 });
  }
}
