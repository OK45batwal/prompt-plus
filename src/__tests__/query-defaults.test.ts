import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-a" } }),
}));
vi.mock("@/lib/auth/account", () => ({
  verifySessionAccount: async () => ({ ok: true, user: { id: "user-a", authVersion: 0, emailVerified: null } }),
  sessionCheckMessage: () => "invalid session",
}));

const mocks = vi.hoisted(() => ({
  findMany: vi.fn().mockResolvedValue([]),
  count: vi.fn().mockResolvedValue(0),
  templateFindMany: vi.fn().mockRejectedValue(new Error("db unavailable")),
}));

vi.mock("@/lib/db/prisma", () => ({
  getDb: () => ({
    prompt: { findMany: mocks.findMany, count: mocks.count },
    collection: { findMany: mocks.findMany, count: mocks.count },
    template: { findMany: mocks.templateFindMany },
  }),
}));

import { GET as getPrompts } from "@/app/api/v1/prompts/route";
import { GET as getCollections } from "@/app/api/v1/collections/route";
import { GET as getTemplates } from "@/app/api/v1/templates/route";

// URLSearchParams.get() returns null for an absent parameter. Routes must translate
// that to "not provided" so schema defaults apply instead of failing validation.
describe("query parameters with defaults", () => {
  it("lists prompts with no query string", async () => {
    const res = await getPrompts(new NextRequest("http://localhost:3000/api/v1/prompts"));
    expect(res.status).toBe(200);
  });

  it("lists collections with no query string", async () => {
    const res = await getCollections(new NextRequest("http://localhost:3000/api/v1/collections"));
    expect(res.status).toBe(200);
  });

  it("serves official templates when the database is unavailable and no filters are set", async () => {
    const res = await getTemplates(new NextRequest("http://localhost:3000/api/v1/templates"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });
});
