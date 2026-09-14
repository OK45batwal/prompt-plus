// @public-route
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db/prisma";
import { jsonResponse } from "@/lib/api/response-headers";

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return jsonResponse(
        { success: false, error: "Authentication required to save prompts to cloud library." },
        { status: 401, requestId }
      );
    }

    let body: {
      originalText?: string;
      enhancedText?: string;
      category?: string;
      tone?: string;
      model?: string;
      score?: number;
    };

    try {
      body = await request.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const originalText = (body.originalText || "").trim();
    const enhancedText = (body.enhancedText || "").trim();

    if (!originalText && !enhancedText) {
      return jsonResponse(
        { success: false, error: "Prompt text is required" },
        { status: 400, requestId }
      );
    }

    if (originalText.length > 50000 || enhancedText.length > 50000) {
      return jsonResponse(
        { success: false, error: "Prompt text exceeds maximum allowed length of 50,000 characters." },
        { status: 400, requestId }
      );
    }

    const title = originalText.length > 50
      ? originalText.slice(0, 50).trim() + "…"
      : originalText || "Extension Prompt";

    const rawScore = typeof body.score === "number" ? body.score : 95;
    const clampedScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    const savedPrompt = await getDb().prompt.create({
      data: {
        userId: session.user.id,
        title,
        originalText: originalText || enhancedText,
        enhancedText: enhancedText || originalText,
        category: body.category || "General",
        tone: body.tone || "code",
        model: body.model || "promptplus-v2",
        score: clampedScore,
      },
      select: {
        id: true,
        title: true,
        originalText: true,
        enhancedText: true,
        category: true,
        tone: true,
        model: true,
        score: true,
        createdAt: true,
      },
    });

    // Record usage log
    await getDb().usageLog.create({
      data: {
        userId: session.user.id,
        action: "extension_save",
        model: body.model || "promptplus-v2",
        tokensOut: Math.round(enhancedText.length / 4),
      },
    }).catch((err) => {
      console.error("[save-prompt] Failed to record usage log:", err);
    });

    return jsonResponse(
      {
        success: true,
        data: savedPrompt,
        message: "Prompt saved to Cloud Library successfully",
      },
      { status: 201, requestId }
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save prompt",
      },
      { status: 500, requestId }
    );
  }
}
