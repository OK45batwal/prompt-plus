import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api/response-headers";
import {
  extractIntent,
  parseTextToPromptIR,
  generateCandidates,
  calculateHybridScore,
  scanPromptSecurity,
  cleanPromptResponse,
} from "@/lib/prompt-engine";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  let body: { text?: string; zeroFluff?: boolean };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
  }

  const text = (body.text || "").trim();
  if (!text) {
    return jsonResponse({ error: "Text prompt is required" }, { status: 400, requestId });
  }

  const security = scanPromptSecurity(text);
  const intent = extractIntent(text);
  const baseIR = parseTextToPromptIR(text);
  const candidates = generateCandidates(baseIR, intent.taskType, intent.complexity);

  const selectedCandidate = candidates[1] || candidates[0]; // Production-grade candidate
  const score = calculateHybridScore(text, selectedCandidate);

  // Apply zero-fluff cleaning for fast, high-density responses
  const cleanedText = cleanPromptResponse(selectedCandidate.renderedText, {
    zeroFluff: body.zeroFluff !== false,
  });

  const durationMs = Date.now() - startTime;

  return jsonResponse(
    {
      success: true,
      data: {
        enhanced: cleanedText,
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
        "X-Response-Time-Ms": String(durationMs),
        "Cache-Control": "private, no-cache",
      },
    }
  );
}
