import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { diagnosePromptFailures, executeAutomaticPromptRepairLoop, PromptCandidate } from "@/lib/prompt-engine";
import { z } from "zod";

const repairSchema = z.object({
  candidate: z.any(),
  failureOutputs: z.array(z.string()).min(1, "At least one failure output required"),
});

export const POST = withAuth(
  async (request: NextRequest, { requestId }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = repairSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400, requestId });
    }

    const { candidate, failureOutputs } = parseResult.data;

    const diagnoses = diagnosePromptFailures(candidate as PromptCandidate, failureOutputs);
    const repairResult = executeAutomaticPromptRepairLoop(candidate as PromptCandidate, diagnoses, 3);

    return jsonResponse(
      {
        success: true,
        data: {
          diagnoses,
          ...repairResult,
        },
      },
      { requestId }
    );
  },
  { schema: repairSchema }
);
