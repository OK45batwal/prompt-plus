import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { extractIntent, detectContextGaps, generateAdaptiveQuestions, scanPromptSecurity } from "@/lib/prompt-engine";
import { z } from "zod";

const analyzeSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

export const maxDuration = 60;

export const POST = withAuth(
  async (request: NextRequest, { requestId }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = analyzeSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400, requestId });
    }

    const { text } = parseResult.data;

    // 1. Security & Privacy Scan
    const security = scanPromptSecurity(text);

    // 2. Intent & Task Classification
    const intent = extractIntent(text);

    // 3. Gap Analysis & Adaptive Question Engine
    const gaps = detectContextGaps(text, intent);
    const questions = generateAdaptiveQuestions(gaps, 3);

    return jsonResponse(
      {
        success: true,
        data: {
          security,
          intent,
          gaps,
          adaptiveQuestions: questions,
        },
      },
      { requestId }
    );
  },
  { schema: analyzeSchema }
);
