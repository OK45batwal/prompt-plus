import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import {
  extractIntent,
  parseTextToPromptIR,
  generateCandidates,
  validatePromptIR,
  calculateHybridScore,
  routeToOptimalModel,
  scanPromptSecurity,
  addConstraint,
  addExample,
} from "@/lib/prompt-engine";
import { z } from "zod";

const optimizeSchema = z.object({
  text: z.string().min(1, "Text is required"),
  taskType: z.string().optional(),
  answers: z.record(z.string(), z.string()).optional(),
  targetModel: z.string().optional(),
  privacyPreference: z.enum(["public", "private_cloud", "local_only"]).optional(),
});

export const POST = withAuth(
  async (request: NextRequest, { requestId }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400, requestId });
    }

    const parseResult = optimizeSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonResponse({ error: "Validation failed", details: parseResult.error.flatten() }, { status: 400, requestId });
    }

    const { text, answers, privacyPreference } = parseResult.data;

    // 1. Security Scan
    const security = scanPromptSecurity(text);

    // 2. Intent Extraction
    const intent = extractIntent(text);

    // 3. Build Base PromptIR & incorporate user answers to adaptive questions
    let baseIR = parseTextToPromptIR(text);
    if (answers) {
      for (const [field, val] of Object.entries(answers)) {
        if (val) {
          baseIR = addConstraint(baseIR, `User specified ${field.replace(/_/g, " ")}: ${val}`, "high", "user");
        }
      }
    }

    // 4. Generate Candidate Prompts (4 Candidates)
    const candidates = generateCandidates(baseIR, intent.taskType, intent.complexity);

    // 5. Score & Validate Candidates
    const scoredCandidates = candidates.map((cand) => {
      const validation = validatePromptIR(cand.ir);
      const hybridScore = calculateHybridScore(text, cand);
      return {
        ...cand,
        validation,
        hybridScore,
      };
    });

    // Pick top candidate
    const selectedCandidate = [...scoredCandidates].sort((a, b) => b.hybridScore.totalScore - a.hybridScore.totalScore)[0];

    // 6. Model Router Recommendation
    const modelRouting = routeToOptimalModel({
      taskType: intent.taskType,
      complexity: intent.complexity,
      privacyPreference,
    });

    return jsonResponse(
      {
        success: true,
        data: {
          security,
          intent,
          selectedCandidate,
          candidates: scoredCandidates,
          modelRouting,
        },
      },
      { requestId }
    );
  },
  { schema: optimizeSchema }
);
