import { describe, it, expect, vi } from "vitest";
import { GET as getHealth } from "@/app/api/health/route";
import { extractTemplateVariables } from "@/app/api/v1/templates/route";

vi.mock("next-auth", () => ({
  default: vi.fn().mockImplementation(() => ({
    auth: vi.fn(),
  })),
}));

describe("Phase 3 Integration & Developer Experience Tests", () => {
  describe("Health Check Endpoint (/api/health)", () => {
    it("should return system readiness status and database connection state", async () => {
      const res = await getHealth();
      expect([200, 503]).toContain(res.status);

      const json = await res.json();
      expect(["ok", "degraded"]).toContain(json.status);
      expect(["connected", "disconnected"]).toContain(json.database);
      expect(json.uptime).toBeGreaterThanOrEqual(0);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe("Template Variable Extraction Helper", () => {
    it("should automatically extract {{placeholders}} from template text", () => {
      const text = "Write a blog post about {{topic}} for {{target_audience}} in {{language}} tone.";
      const vars = extractTemplateVariables(text);

      expect(vars).toHaveLength(3);
      expect(vars.map((v) => v.name)).toEqual(["topic", "target_audience", "language"]);
      expect(vars[1].label).toBe("Target Audience");
    });

    it("should return empty array if no placeholders exist", () => {
      const text = "Write a simple essay without variables.";
      const vars = extractTemplateVariables(text);
      expect(vars).toHaveLength(0);
    });
  });

  describe("CSRF Protection on Mutating V1 Routes", () => {
    it("should reject POST /api/v1/prompts/share missing CSRF headers", async () => {
      const { auth } = await import("@/lib/auth/config");
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-123" } } as never);

      const { POST: sharePost } = await import("@/app/api/v1/prompts/share/route");
      const { NextRequest } = await import("next/server");
      const req = new NextRequest("http://localhost:3000/api/v1/prompts/share", {
        method: "POST",
        body: JSON.stringify({ promptId: "p1" }),
      });
      const res = await sharePost(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("CSRF validation failed");
    });

    it("should reject DELETE /api/v1/prompts/share missing CSRF headers", async () => {
      const { auth } = await import("@/lib/auth/config");
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-123" } } as never);

      const { DELETE: shareDelete } = await import("@/app/api/v1/prompts/share/route");
      const { NextRequest } = await import("next/server");
      const req = new NextRequest("http://localhost:3000/api/v1/prompts/share?promptId=p1", {
        method: "DELETE",
      });
      const res = await shareDelete(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("CSRF validation failed");
    });

    it("should reject POST /api/v1/prompts/[id]/versions missing CSRF headers", async () => {
      const { auth } = await import("@/lib/auth/config");
      vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-123" } } as never);

      const { POST: createVersionPost } = await import("@/app/api/v1/prompts/[id]/versions/route");
      const { NextRequest } = await import("next/server");
      const req = new NextRequest("http://localhost:3000/api/v1/prompts/p1/versions", {
        method: "POST",
        body: JSON.stringify({ text: "v2" }),
      });
      const res = await createVersionPost(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("CSRF validation failed");
    });
  });
});
