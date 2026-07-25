import { describe, it, expect, vi, beforeEach } from "vitest";
import { jsonResponse } from "@/lib/api/response-headers";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { revalidate } from "@/app/api/v1/templates/route";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  default: vi.fn().mockImplementation(() => ({
    auth: vi.fn(),
  })),
}));

describe("Polish & Utility Enhancements (#26 - #33)", () => {
  beforeEach(() => {
    resetRateLimit("test-polish-user");
  });

  describe("Item #26 & #32: Response Headers & X-RateLimit-* Support", () => {
    it("should attach X-RateLimit-* and x-request-id headers when provided", () => {
      const rateLimit = checkRateLimit("test-polish-user", 5);
      const res = jsonResponse(
        { data: "success" },
        {
          rateLimit,
          requestId: "req-abc-123",
        }
      );

      expect(res.headers.get("x-request-id")).toBe("req-abc-123");
      expect(res.headers.get("X-RateLimit-Limit")).toBe("20");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("15");
      expect(res.headers.get("X-RateLimit-Reset")).not.toBeNull();
    });

    it("should return default headers when options are omitted", () => {
      const res = jsonResponse({ ok: true });
      expect(res.status).toBe(200);
      expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
    });
  });

  describe("Item #29: Template Route Revalidation Caching", () => {
    it("should export revalidate constant set to 3600 seconds", () => {
      expect(revalidate).toBe(3600);
    });
  });
});
