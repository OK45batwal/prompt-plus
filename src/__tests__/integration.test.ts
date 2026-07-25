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


});
