import { describe, it, expect, vi } from "vitest";
import { GET as getHealth } from "@/app/api/health/route";
import { GET as getOpenApi } from "@/app/api/v1/openapi/route";
import { extractTemplateVariables } from "@/app/api/v1/templates/route";
import { apiSuccess, apiError } from "@/lib/api/response-headers";

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

  describe("OpenAPI Specification Endpoint (/api/v1/openapi)", () => {
    it("should return OpenAPI 3.0.3 specification JSON", async () => {
      const res = await getOpenApi();
      expect(res.status).toBe(200);

      const spec = await res.json();
      expect(spec.openapi).toBe("3.0.3");
      expect(spec.info.title).toContain("Prompt+");
      expect(spec.paths["/prompts"]).toBeDefined();
      expect(spec.paths["/templates"]).toBeDefined();
      expect(spec.paths["/prompts/enhance-ai"]).toBeDefined();
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

  describe("Uniform API Envelopes (apiSuccess / apiError)", () => {
    it("should format successful responses with success: true and data", async () => {
      const res = apiSuccess({ id: "123", title: "Test" }, { requestId: "req-1" });
      const json = await res.json();

      expect(json.success).toBe(true);
      expect(json.data.title).toBe("Test");
      expect(res.headers.get("x-request-id")).toBe("req-1");
    });

    it("should format error responses with success: false and error message", async () => {
      const res = apiError("Invalid payload", { status: 400 });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe("Invalid payload");
    });
  });
});
