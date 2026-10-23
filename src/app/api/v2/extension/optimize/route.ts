// @public-route: deterministic extension fallback with IP rate limits and CORS.
import { NextRequest, NextResponse } from "next/server";
import { jsonResponse } from "@/lib/api/response-headers";
import { executeLoopEngineering } from "@/lib/prompt-engine";
import { logger } from "@/lib/logger";
import { checkIpRateLimitAsync, extractClientIp, getRateLimitHeaders, rateLimitStatus, rateLimitMessage } from "@/lib/rate-limit";
import { z } from "zod";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-PromptPlus-Client, X-Requested-With, Authorization" };
export async function OPTIONS() { return new NextResponse(null, { headers: cors }); }
const schema = z.object({ text: z.string().trim().min(1).max(10000), zeroFluff: z.boolean().optional() });

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const rate = await checkIpRateLimitAsync(`ext:${extractClientIp(request)}`, 120, 60 * 60 * 1000);
    if (!rate.allowed) return jsonResponse({ error: rateLimitMessage(rate) }, { status: rateLimitStatus(rate), requestId, headers: { ...cors, ...getRateLimitHeaders(rate) } });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonResponse({ error: "A text prompt of 1–10,000 characters is required" }, { status: 400, requestId, headers: cors });
    const result = executeLoopEngineering(parsed.data.text, { zeroFluff: parsed.data.zeroFluff !== false });
    const { security, intent, hybridScore: score, finalPrompt: cleanedText } = result;
    const durationMs = Date.now() - startTime;

    return jsonResponse(
      {
        success: true,
        data: {
          enhanced: cleanedText,
          provider: "engine",
          source: "engine",
          model: "promptplus-engine",
          score: score.totalScore,
          hybridScore: score,
          security,
          intent,
          latencyMs: durationMs,
        },
      },
      {
        requestId,
        headers: {
          ...cors,
          "X-Response-Time-Ms": String(durationMs),
          "Cache-Control": "private, no-cache",
        },
      }
    );
  } catch (error) {
    logger.error("Extension optimize failed", { requestId, error: error instanceof Error ? error.message : String(error) });
    return jsonResponse({ error: "The engine could not process this prompt. Please retry." }, { status: 500, requestId, headers: cors });
  }
}
