// @public-route
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { jsonResponse } from "@/lib/api/response-headers";
import { getSavedContextBlocks } from "@/lib/context-memory";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const session = await auth();

    if (!session || !session.user) {
      return jsonResponse(
        {
          authenticated: false,
          user: null,
          savedBlocks: [],
          message: "No active Web Session found. Using local client storage.",
        },
        { requestId }
      );
    }

    // Retrieve default saved context blocks and connected API key providers for authenticated user
    const savedBlocks = getSavedContextBlocks();
    const { getDb } = await import("@/lib/db/prisma");
    const userKeys = await getDb().apiKey.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { provider: true },
    }).catch(() => []);

    const connectedProviders = userKeys.map((k) => k.provider);

    return jsonResponse(
      {
        authenticated: true,
        user: {
          id: session.user.id,
          name: session.user.name || "Prompt+ User",
          email: session.user.email,
        },
        savedBlocks,
        connectedProviders,
        syncedAt: new Date().toISOString(),
      },
      { requestId }
    );
  } catch (error) {
    return jsonResponse(
      {
        authenticated: false,
        error: error instanceof Error ? error.message : "Sync check failed",
      },
      { status: 500, requestId }
    );
  }
}
