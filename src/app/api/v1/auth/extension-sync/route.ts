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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [userRecord, userKeys, monthlyUsed, recentPrompts] = await Promise.all([
      getDb().user.findUnique({
        where: { id: session.user.id },
        select: { avatar: true, name: true, email: true },
      }).catch(() => null),
      getDb().apiKey.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { provider: true },
      }).catch(() => []),
      getDb().usageLog.count({
        where: {
          userId: session.user.id,
          action: "enhance",
          createdAt: { gte: startOfMonth },
        },
      }).catch(() => 0),
      getDb().prompt.findMany({
        where: { userId: session.user.id, deletedAt: null },
        select: { id: true, title: true, enhancedText: true, originalText: true, category: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }).catch(() => []),
    ]);

    const connectedProviders = userKeys.map((k) => k.provider);
    const monthlyLimit = 100;
    const remaining = Math.max(0, monthlyLimit - monthlyUsed);

    return jsonResponse(
      {
        authenticated: true,
        user: {
          id: session.user.id,
          name: userRecord?.name || session.user.name || "Prompt+ User",
          email: userRecord?.email || session.user.email,
          avatar: userRecord?.avatar || session.user.image || "https://api.dicebear.com/7.x/bottts/svg?seed=promptplus_arch",
        },
        quota: {
          monthlyUsed,
          monthlyLimit,
          remaining,
          usagePercentage: Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100)),
        },
        savedBlocks,
        connectedProviders,
        recentPrompts,
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
