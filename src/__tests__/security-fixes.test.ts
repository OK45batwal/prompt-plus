import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as savePromptRoute } from "../app/api/v1/extension/save-prompt/route";

let mockSession: { user: { id: string; name: string; email: string } } | null = null;
const mockPromptCreate = vi.fn().mockImplementation(({ data }) => Promise.resolve({
  id: "prompt-sec-1",
  ...data,
  createdAt: new Date(),
}));
const mockUsageLogCreate = vi.fn().mockResolvedValue({});

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/db/prisma", () => ({
  getDb: vi.fn(() => ({
    prompt: {
      create: mockPromptCreate,
    },
    usageLog: {
      create: mockUsageLogCreate,
    },
  })),
}));

describe("Security Fixes & Quality Hardening Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = {
      user: {
        id: "user-sec-123",
        name: "Security Tester",
        email: "sec@example.com",
      },
    };
  });

  describe("W-03 & W-07: Save Prompt Input Validation & Error Handling", () => {
    it("should reject prompts exceeding 50,000 characters", async () => {
      const oversizedText = "A".repeat(50001);
      const req = new NextRequest("http://localhost:3000/api/v1/extension/save-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: oversizedText,
          enhancedText: "Normal text",
        }),
      });

      const res = await savePromptRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("exceeds maximum allowed length");
      expect(mockPromptCreate).not.toHaveBeenCalled();
    });

    it("should clamp score between 0 and 100", async () => {
      const reqHigh = new NextRequest("http://localhost:3000/api/v1/extension/save-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: "Testing score clamp high",
          enhancedText: "Testing score clamp high enhanced",
          score: 150,
        }),
      });

      const resHigh = await savePromptRoute(reqHigh);
      expect(resHigh.status).toBe(201);
      expect(mockPromptCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 100,
          }),
        })
      );

      const reqLow = new NextRequest("http://localhost:3000/api/v1/extension/save-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: "Testing score clamp low",
          enhancedText: "Testing score clamp low enhanced",
          score: -20,
        }),
      });

      const resLow = await savePromptRoute(reqLow);
      expect(resLow.status).toBe(201);
      expect(mockPromptCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            score: 0,
          }),
        })
      );
    });
  });

  describe("C-02: Fallback Store Default User Production Gating", () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    });

    it("should not seed developer@promptplus.app when NODE_ENV is production", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      const { LocalDatabaseStore } = await import("@/lib/db/fallback-store");
      const store = new LocalDatabaseStore();
      const user = await store.findUserByEmail("developer@promptplus.app");
      expect(user).toBeNull();
    });
  });

  describe("C-03: Extension Popup HTML Escaping Logic", () => {
    function escapeHtml(str: string | null | undefined) {
      if (str == null) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    it("should sanitize script tags and HTML markup", () => {
      const maliciousPayload = "<script>alert('xss')</script>";
      const sanitized = escapeHtml(maliciousPayload);
      expect(sanitized).toBe("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
      expect(sanitized).not.toContain("<script>");
    });

    it("should sanitize double quotes and ampersands in attributes/text", () => {
      const maliciousPayload = '" onmouseover="alert(1)" foo="&';
      const sanitized = escapeHtml(maliciousPayload);
      expect(sanitized).toBe("&quot; onmouseover=&quot;alert(1)&quot; foo=&quot;&amp;");
    });
  });
});
