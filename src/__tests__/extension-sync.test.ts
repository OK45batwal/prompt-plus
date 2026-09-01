import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as savePromptRoute } from "../app/api/v1/extension/save-prompt/route";
import { GET as extensionSyncRoute } from "../app/api/v1/auth/extension-sync/route";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  getDb: vi.fn(() => ({
    prompt: {
      create: vi.fn().mockResolvedValue({
        id: "prompt-sync-123",
        title: "Test Extension Prompt",
        originalText: "Build auth middleware",
        enhancedText: "### ROLE & PERSONA\nSenior Engineer...",
        category: "Development",
        tone: "code",
        model: "promptplus-v2",
        score: 96,
        createdAt: new Date(),
      }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=test",
      }),
    },
    apiKey: {
      findMany: vi.fn().mockResolvedValue([{ provider: "openai", isActive: true }]),
    },
    usageLog: {
      create: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(12),
    },
  })),
}));

describe("Extension Web Sync & Save Endpoints (v2.1.3.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/v1/extension/save-prompt should reject unauthenticated requests", async () => {
    const { auth } = await import("@/lib/auth/config");
    vi.mocked(auth).mockResolvedValue(null as any);

    const req = new NextRequest("http://localhost:3000/api/v1/extension/save-prompt", {
      method: "POST",
      body: JSON.stringify({ originalText: "hello", enhancedText: "hello world" }),
    });

    const res = await savePromptRoute(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("POST /api/v1/extension/save-prompt should save compiled prompt for authenticated session", async () => {
    const { auth } = await import("@/lib/auth/config");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", name: "Test User", email: "test@example.com" },
    } as any);

    const req = new NextRequest("http://localhost:3000/api/v1/extension/save-prompt", {
      method: "POST",
      body: JSON.stringify({
        originalText: "Build auth middleware",
        enhancedText: "### ROLE & PERSONA\nSenior Engineer...",
        category: "Development",
        tone: "code",
        score: 96,
      }),
    });

    const res = await savePromptRoute(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe("prompt-sync-123");
    expect(json.data.score).toBe(96);
  });

  it("GET /api/v1/auth/extension-sync should return authenticated user state and quota", async () => {
    const { auth } = await import("@/lib/auth/config");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", name: "Test User", email: "test@example.com" },
    } as any);

    const req = new NextRequest("http://localhost:3000/api/v1/auth/extension-sync");
    const res = await extensionSyncRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.authenticated).toBe(true);
    expect(json.user.name).toBe("Test User");
    expect(json.quota.monthlyLimit).toBe(100);
  });
});
