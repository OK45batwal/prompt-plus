// @public-route
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api/response-headers";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";
import { EXTENSION_VERSION } from "@/lib/version";
import { EXTENSION_CURATED_BLUEPRINTS } from "@/lib/extension-blueprints";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-PromptPlus-Client, X-Requested-With",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}


export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    let userBlueprints: Array<{ id: string; title: string; category: string; desc: string; text: string }> = [];

    // Check optional authenticated session for user's own cloud saved prompts
    try {
      const session = await auth();
      if (session?.user?.id) {
        const savedPrompts = await getDb().prompt.findMany({
          where: { userId: session.user.id, deletedAt: null },
          select: {
            id: true,
            title: true,
            category: true,
            enhancedText: true,
            originalText: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        userBlueprints = savedPrompts.map((p) => ({
          id: p.id,
          title: p.title || "Untitled Blueprint",
          category: p.category || "Cloud",
          desc: p.originalText ? p.originalText.slice(0, 90) + (p.originalText.length > 90 ? "…" : "") : "Cloud prompt",
          text: p.enhancedText || p.originalText,
        }));
      }
    } catch {
      // Gracefully continue with curated templates if DB is unavailable
    }

    return jsonResponse(
      {
        success: true,
        version: EXTENSION_VERSION,
        data: {
          curated: EXTENSION_CURATED_BLUEPRINTS,
          userPrompts: userBlueprints,
        },
      },
      {
        requestId,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: (error as Error).message || "Failed to fetch extension templates",
        data: {
          curated: EXTENSION_CURATED_BLUEPRINTS,
          userPrompts: [],
        },
      },
      {
        status: 500,
        requestId,
        headers: corsHeaders,
      }
    );
  }
}
