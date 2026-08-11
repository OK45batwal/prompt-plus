import { describe, it, expect } from "vitest";
import { POST as extensionOptimizeRoute } from "../app/api/v2/extension/optimize/route";
import { NextRequest } from "next/server";

describe("API v2 Endpoints", () => {

  it("POST /api/v2/extension/optimize should optimize prompt without requiring session auth", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/extension/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Build a Next.js ecommerce app" }),
    });

    const res = await extensionOptimizeRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.enhanced).toBeDefined();
    expect(json.data.score).toBeGreaterThan(50);
  });
});
