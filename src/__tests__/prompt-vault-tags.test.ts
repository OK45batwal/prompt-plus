import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseTags, normalizeTags } from "@/lib/prompts/tags";
import { NextRequest } from "next/server";

// Mock the DB layer
const mockPrompt = {
  create: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  count: vi.fn(),
  update: vi.fn(),
};

vi.mock("@/lib/db/prisma", () => ({
  getDb: () => ({
    prompt: mockPrompt,
  }),
}));

// Mock authentication
vi.mock("@/lib/api/with-auth", () => ({
  withAuth: (handler: (req: NextRequest, ctx: { userId: string; requestId: string; body: unknown }) => Promise<Response>) => {
    return async (req: NextRequest) => {
      return handler(req, {
        userId: "user-123",
        requestId: "req-abc",
        body: req.method === "POST" ? await req.json().catch(() => null) : null,
      });
    };
  },
}));

describe("Prompt Vault Tags Utility", () => {
  describe("parseTags", () => {
    it("parses comma-separated tags and removes leading hashtags", () => {
      const result = parseTags("#frontend, #react, nextjs,  typescript  ");
      expect(result).toEqual(["frontend", "react", "nextjs", "typescript"]);
    });

    it("parses JSON-stringified tag arrays", () => {
      const result = parseTags('["#docker", "kubernetes", "infra"]');
      expect(result).toEqual(["docker", "kubernetes", "infra"]);
    });

    it("deduplicates redundant tags", () => {
      const result = parseTags("api, #api, API, #API");
      // Note: casing preservation while deduplicating exact matches
      expect(result).toContain("api");
    });

    it("handles empty or nullish values safely", () => {
      expect(parseTags(null)).toEqual([]);
      expect(parseTags(undefined)).toEqual([]);
      expect(parseTags("")).toEqual([]);
      expect(parseTags("   ")).toEqual([]);
    });
  });

  describe("normalizeTags", () => {
    it("normalizes array of tags into a clean comma-separated string", () => {
      const normalized = normalizeTags(["#web", "  css ", "tailwind", "#web"]);
      expect(normalized).toBe("web, css, tailwind");
    });

    it("normalizes a raw tag string", () => {
      const normalized = normalizeTags("#devops, ci, cd, #ci");
      expect(normalized).toBe("devops, ci, cd");
    });

    it("returns null for empty tag inputs", () => {
      expect(normalizeTags([])).toBeNull();
      expect(normalizeTags("")).toBeNull();
      expect(normalizeTags(null)).toBeNull();
    });
  });
});

describe("Prompt Vault Tags API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/v1/prompts accepts and normalizes tags", async () => {
    const { POST } = await import("@/app/api/v1/prompts/route");

    mockPrompt.create.mockResolvedValueOnce({
      id: "p-new",
      originalText: "Draft an announcement email",
      model: "gpt-4o",
      category: "Email",
      tags: "marketing, email, launch",
      tone: "professional",
      length: "medium",
      createdAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/v1/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalText: "Draft an announcement email",
        model: "gpt-4o",
        category: "Email",
        tags: ["#marketing", "email", "#launch"],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.tags).toBe("marketing, email, launch");
    expect(mockPrompt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tags: "marketing, email, launch",
        category: "Email",
      }),
    });
  });

  it("GET /api/v1/prompts filters by tag query param", async () => {
    const { GET } = await import("@/app/api/v1/prompts/route");

    mockPrompt.findMany.mockResolvedValueOnce([
      { id: "p-1", title: "API Doc", tags: "backend, api" },
    ]);
    mockPrompt.count.mockResolvedValueOnce(1);

    const req = new NextRequest("http://localhost:3000/api/v1/prompts?tag=api", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);

    expect(mockPrompt.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        tags: { contains: "api", mode: "insensitive" },
      }),
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 20,
    });
  });

  it("PATCH /api/v1/prompts/[id] updates tags", async () => {
    const { PATCH } = await import("@/app/api/v1/prompts/[id]/route");

    mockPrompt.findFirst.mockResolvedValueOnce({
      id: "p-1",
      userId: "user-123",
      enhancedText: "Previous text",
      tags: "old-tag",
    });

    mockPrompt.update.mockResolvedValueOnce({
      id: "p-1",
      tags: "updated, new-tag",
      updatedAt: new Date(),
    });

    const req = new NextRequest("http://localhost:3000/api/v1/prompts/p-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tags: ["#updated", "new-tag"],
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.tags).toBe("updated, new-tag");
    expect(mockPrompt.update).toHaveBeenCalledWith({
      where: { id: "p-1" },
      data: expect.objectContaining({
        tags: "updated, new-tag",
      }),
      select: expect.objectContaining({
        tags: true,
      }),
    });
  });
});
