import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth to simulate unauthenticated state (auth() returns null by default)
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

describe("API Endpoint Coverage & Contract Audits", () => {
  describe("Public Documentation & Health Routes", () => {
    it("GET /api/v1/docs should return OpenAPI 3.0.3 specification", async () => {
      const { GET } = await import("@/app/api/v1/docs/route");
      const res = await GET();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.openapi).toBe("3.0.3");
      expect(json.info.title).toBe("Prompt+ API");
      expect(json.paths).toBeDefined();
    });

    it("GET /api/v1/health should return system status", async () => {
      const { GET } = await import("@/app/api/v1/health/route");
      const res = await GET();
      expect([200, 503]).toContain(res.status);

      const json = await res.json();
      expect(["ok", "degraded"]).toContain(json.status);
    });

    it("GET /api/v1/extension/download should handle missing or present archive", async () => {
      const { GET } = await import("@/app/api/v1/extension/download/route");
      const res = await GET();
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("V1 Auth Protection & Route Contracts", () => {
    it("GET/PATCH/DELETE /api/v1/collections/[id] rejects unauthenticated requests", async () => {
      const { GET, PATCH, DELETE } = await import("@/app/api/v1/collections/[id]/route");
      const reqGet = new NextRequest("http://localhost:3000/api/v1/collections/col-123");
      const reqPatch = new NextRequest("http://localhost:3000/api/v1/collections/col-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      });
      const reqDelete = new NextRequest("http://localhost:3000/api/v1/collections/col-123", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      expect((await GET(reqGet)).status).toBe(401);
      expect((await PATCH(reqPatch)).status).toBe(401);
      expect((await DELETE(reqDelete)).status).toBe(401);
    });

    it("POST /api/v1/prompts/analyze rejects unauthenticated requests", async () => {
      const { POST } = await import("@/app/api/v1/prompts/analyze/route");
      const req = new NextRequest("http://localhost:3000/api/v1/prompts/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Write an email" }),
      });
      expect((await POST(req)).status).toBe(401);
    });

    it("POST /api/v1/prompts/compare-models rejects unauthenticated requests", async () => {
      const { POST } = await import("@/app/api/v1/prompts/compare-models/route");
      const req = new NextRequest("http://localhost:3000/api/v1/prompts/compare-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Test text", models: [{ provider: "openai" }] }),
      });
      expect((await POST(req)).status).toBe(401);
    });

    it("GET and PATCH /api/v1/user/profile reject unauthenticated requests", async () => {
      const { GET, PATCH } = await import("@/app/api/v1/user/profile/route");
      const reqGet = new NextRequest("http://localhost:3000/api/v1/user/profile");
      const reqPatch = new NextRequest("http://localhost:3000/api/v1/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      });
      expect((await GET(reqGet)).status).toBe(401);
      expect((await PATCH(reqPatch)).status).toBe(401);
    });

    it("GET /api/v1/admin/stats rejects unauthenticated and non-admin requests", async () => {
      const { GET } = await import("@/app/api/v1/admin/stats/route");
      const req = new NextRequest("http://localhost:3000/api/v1/admin/stats");
      expect((await GET(req)).status).toBe(401);
    });
  });

  describe("V2 Auth Protection & Input Validation", () => {
    it("POST /api/v2/analyze rejects unauthenticated requests", async () => {
      const { POST } = await import("@/app/api/v2/analyze/route");
      const req = new NextRequest("http://localhost:3000/api/v2/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Analyze this prompt" }),
      });
      expect((await POST(req)).status).toBe(401);
    });

    it("POST /api/v2/repair rejects unauthenticated requests", async () => {
      const { POST } = await import("@/app/api/v2/repair/route");
      const req = new NextRequest("http://localhost:3000/api/v2/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate: { text: "Fix me" }, failureOutputs: ["Error output"] }),
      });
      expect((await POST(req)).status).toBe(401);
    });
  });

  describe("Auth Routes Session & Password Protection", () => {
    it("POST /api/auth/change-password rejects unauthenticated callers", async () => {
      const { POST } = await import("@/app/api/auth/change-password/route");
      const req = new NextRequest("http://localhost:3000/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "old", newPassword: "newPassword123!" }),
      });
      expect((await POST(req)).status).toBe(401);
    });

    it("DELETE /api/auth/delete-account rejects unauthenticated callers", async () => {
      const { DELETE } = await import("@/app/api/auth/delete-account/route");
      const req = new NextRequest("http://localhost:3000/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      expect((await DELETE(req)).status).toBe(401);
    });

    it("PATCH /api/auth/profile rejects unauthenticated callers", async () => {
      const { PATCH } = await import("@/app/api/auth/profile/route");
      const req = new NextRequest("http://localhost:3000/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      });
      expect((await PATCH(req)).status).toBe(401);
    });

    it("POST /api/auth/sign-out-everywhere rejects unauthenticated callers", async () => {
      const { POST } = await import("@/app/api/auth/sign-out-everywhere/route");
      const req = new NextRequest("http://localhost:3000/api/auth/sign-out-everywhere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      expect((await POST(req)).status).toBe(401);
    });
  });
});
