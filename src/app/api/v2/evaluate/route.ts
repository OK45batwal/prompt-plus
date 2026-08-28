import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { runRealPromptEvaluation } from "@/lib/prompt-engine";
import { z } from "zod";

const evaluateSchema = z.object({
  originalPrompt: z.string().min(1, "Original prompt required"),
  candidateText: z.string().min(1, "Candidate text required"),
  targetModel: z.string().optional(),
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

    const parseResult = evaluateSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400, requestId });
    }

    const { originalPrompt, candidateText, targetModel } = parseResult.data;

    const evaluation = await runRealPromptEvaluation(
      originalPrompt,
      candidateText,
      targetModel || "google/gemini-2.0-flash-exp:free"
    );

    return jsonResponse(
      {
        success: true,
        data: evaluation,
      },
      { requestId }
    );
  },
  { schema: evaluateSchema }
);
