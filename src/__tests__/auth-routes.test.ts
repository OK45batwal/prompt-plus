import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth to simulate unauthenticated state (auth() returns null)
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

import { GET as getPrompts, POST as postPrompts } from "@/app/api/v1/prompts/route";
import { GET as getCollections } from "@/app/api/v1/collections/route";

describe("Auth-Protected API Routes", () => {
  it("GET /api/v1/prompts should return 401 when unauthenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/prompts");
    const res = await getPrompts(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("POST /api/v1/prompts should return 401 when unauthenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/prompts", {
      method: "POST",
      body: JSON.stringify({ originalText: "Test", model: "gpt-4" }),
    });
    const res = await postPrompts(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/collections should return 401 when unauthenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/collections");
    const res = await getCollections(req);
    expect(res.status).toBe(401);
  });
});
