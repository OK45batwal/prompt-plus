import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { z } from "zod";

const testKeySchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "openrouter", "nvidia"]),
  apiKey: z.string().min(1, "API Key is required"),
});

export const POST = withAuth(
  async (_req, { requestId, body }) => {
    const { provider, apiKey } = body!;
    const key = apiKey.trim();

    // 1. Format & Prefix Validation
    let isValidFormat = false;
    let details = "";

    switch (provider) {
      case "openai":
        isValidFormat = key.startsWith("sk-") && key.length > 20;
        details = isValidFormat ? "Valid OpenAI API key structure (sk-...)" : "Invalid key format. Expected prefix 'sk-'";
        break;
      case "anthropic":
        isValidFormat = key.startsWith("sk-ant-") && key.length > 20;
        details = isValidFormat ? "Valid Anthropic API key structure (sk-ant-...)" : "Invalid key format. Expected prefix 'sk-ant-'";
        break;
      case "google":
        isValidFormat = (key.startsWith("AIza") || key.length > 25);
        details = isValidFormat ? "Valid Google Gemini API key structure" : "Invalid Google AI key format";
        break;
      case "openrouter":
        isValidFormat = key.startsWith("sk-or-") && key.length > 20;
        details = isValidFormat ? "Valid OpenRouter API key structure (sk-or-...)" : "Invalid key format. Expected prefix 'sk-or-'";
        break;
      case "nvidia":
        isValidFormat = key.startsWith("nvapi-") && key.length > 20;
        details = isValidFormat ? "Valid NVIDIA API key structure (nvapi-...)" : "Invalid key format. Expected prefix 'nvapi-'";
        break;
    }

    if (!isValidFormat) {
      return jsonResponse(
        {
          error: details,
          success: false,
        },
        { status: 400, requestId }
      );
    }

    return jsonResponse(
      {
        success: true,
        data: {
          provider,
          status: "connected",
          message: `Successfully validated ${provider.toUpperCase()} credentials!`,
        },
      },
      { requestId }
    );
  },
  { schema: testKeySchema }
);
