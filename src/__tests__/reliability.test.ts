import { describe, it, expect, vi } from "vitest";
import { logger } from "@/lib/logger";
import {
  LLMError,
  InvalidApiKeyError,
  RateLimitQuotaError,
  ProviderServerError,
} from "@/lib/llm/providers";
import { withAuth } from "@/lib/api/with-auth";
import { NextRequest } from "next/server";
import { z } from "zod";

vi.mock("next-auth", () => ({
  default: vi.fn().mockImplementation(() => ({
    auth: vi.fn().mockResolvedValue({
      user: { id: "test-user-123", email: "user@example.com" },
    }),
  })),
}));

describe("Phase 2 High Reliability & Architecture Tests", () => {
  describe("Structured Logging Utility", () => {
    it("should format log entries as JSON string with timestamp and level", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.info("Test log message", { userId: "user-1" });

      expect(spy).toHaveBeenCalled();
      const lastCallArg = spy.mock.calls[0][0];
      const parsed = JSON.parse(lastCallArg);

      expect(parsed.level).toBe("info");
      expect(parsed.message).toBe("Test log message");
      expect(parsed.userId).toBe("user-1");
      expect(parsed.timestamp).toBeDefined();

      spy.mockRestore();
    });
  });

  describe("Typed LLM Error Classification", () => {
    it("should construct InvalidApiKeyError with 401 status", () => {
      const err = new InvalidApiKeyError("openai", "Invalid API key");
      expect(err).toBeInstanceOf(LLMError);
      expect(err.statusCode).toBe(401);
      expect(err.provider).toBe("openai");
    });

    it("should construct RateLimitQuotaError with 429 status", () => {
      const err = new RateLimitQuotaError("anthropic", "Quota exceeded");
      expect(err.statusCode).toBe(429);
      expect(err.provider).toBe("anthropic");
    });

    it("should construct ProviderServerError with 502 status", () => {
      const err = new ProviderServerError("openai", "500 Internal Error");
      expect(err.statusCode).toBe(502);
    });
  });

  describe("withAuth Schema Validation Wrapper", () => {
    it("should validate JSON body and return 400 when schema fails", async () => {
      const testSchema = z.object({
        title: z.string().min(3),
      });

      const handler = withAuth(
        async (_req, { body }) => {
          return new Response(JSON.stringify({ title: body?.title }), { status: 200 });
        },
        { schema: testSchema }
      );

      const req = new NextRequest("http://localhost/api/v1/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "ab" }),
      });

      const res = await handler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toBe("Validation failed");
    });
  });
});
