import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createKeyHint, GET as getApiKeys, POST as postApiKey, DELETE as deleteApiKey } from "@/app/api/v1/api-keys/route";
import { DELETE as deletePrompts } from "@/app/api/v1/prompts/route";
import { POST as enhanceAi } from "@/app/api/v1/prompts/enhance-ai/route";

// Mock next-auth
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user_test_456", email: "test@example.com" } }),
}));

// Mock DB
const mockApiKeys: any[] = [];
const mockPrompts: any[] = [];

vi.mock("@/lib/db/prisma", () => ({
  getDb: () => ({
    apiKey: {
      findMany: vi.fn().mockImplementation(async ({ where }) => {
        return mockApiKeys.filter((k) => k.userId === where.userId && (where.isActive === undefined || k.isActive === where.isActive));
      }),
      findFirst: vi.fn().mockImplementation(async ({ where }) => {
        return mockApiKeys.find(
          (k) =>
            k.userId === where.userId &&
            (where.provider === undefined || k.provider === where.provider) &&
            (where.isActive === undefined || k.isActive === where.isActive)
        ) || null;
      }),
      deleteMany: vi.fn().mockImplementation(async ({ where }) => {
        const initial = mockApiKeys.length;
        for (let i = mockApiKeys.length - 1; i >= 0; i--) {
          const k = mockApiKeys[i];
          if (k.userId === where.userId && (!where.provider || k.provider === where.provider) && (!where.id || k.id === where.id)) {
            mockApiKeys.splice(i, 1);
          }
        }
        return { count: initial - mockApiKeys.length };
      }),
      create: vi.fn().mockImplementation(async ({ data }) => {
        const item = { id: `key_${Date.now()}`, ...data, createdAt: new Date() };
        mockApiKeys.push(item);
        return item;
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    prompt: {
      updateMany: vi.fn().mockImplementation(async ({ where, data }) => {
        let count = 0;
        for (const p of mockPrompts) {
          if (p.userId === where.userId && (!where.id || (typeof where.id === "object" ? where.id.in.includes(p.id) : p.id === where.id))) {
            p.deletedAt = data.deletedAt;
            count++;
          }
        }
        return { count };
      }),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "p1" }),
      update: vi.fn().mockResolvedValue({ id: "p1" }),
    },
    usageLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  }),
}));

describe("API Key Hint & Cross-Device Masking", () => {
  it("should create accurate, secure masked hints for OpenAI keys", () => {
    const hint = createKeyHint("sk-proj-1234567890abcdef9988");
    expect(hint).toBe("sk-proj-••••••••9988");
  });

  it("should create accurate masked hints for Anthropic and Google keys", () => {
    const anthropicHint = createKeyHint("sk-ant-api03-abcdef12345678");
    expect(anthropicHint).toBe("sk-ant-••••••••5678");

    const googleHint = createKeyHint("AIzaSyD-1234567890abcdef1234");
    expect(googleHint).toBe("AIza••••••••1234");
  });

  it("should securely store and return keyHint on GET /api/v1/api-keys", async () => {
    const saveReq = new NextRequest("http://localhost:3000/api/v1/api-keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        provider: "openai",
        apiKey: "sk-proj-abc123456789xyz9876",
      }),
    });

    const saveRes = await postApiKey(saveReq);
    expect(saveRes.status).toBe(201);
    const saveJson = await saveRes.json();
    expect(saveJson.data.keyHint).toBe("sk-proj-••••••••9876");

    const getReq = new NextRequest("http://localhost:3000/api/v1/api-keys");
    const getRes = await getApiKeys(getReq);
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.data).toHaveLength(1);
    expect(getJson.data[0].provider).toBe("openai");
    expect(getJson.data[0].keyHint).toBe("sk-proj-••••••••9876");
  });
});

describe("Strict API Key Enforcement on Prompt Enhancement", () => {
  beforeEach(() => {
    mockApiKeys.length = 0;
  });

  it("should return 402 API_KEY_REQUIRED when user has no stored or passed API key", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/prompts/enhance-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        text: "Write a high-converting landing page headline",
        model: "gpt-4o-mini",
        provider: "openai",
      }),
    });

    const res = await enhanceAi(req);
    expect(res.status).toBe(402);
    const json = await res.json();
    expect(json.code).toBe("API_KEY_REQUIRED");
    expect(json.error).toContain("API key required");
  });
});

describe("History Deletion Features", () => {
  beforeEach(() => {
    mockPrompts.length = 0;
    mockPrompts.push(
      { id: "p1", userId: "user_test_456", text: "Prompt 1", deletedAt: null },
      { id: "p2", userId: "user_test_456", text: "Prompt 2", deletedAt: null },
      { id: "p3", userId: "user_test_456", text: "Prompt 3", deletedAt: null }
    );
  });

  it("should clear all history with ?all=true", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/prompts?all=true", {
      method: "DELETE",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const res = await deletePrompts(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("History cleared successfully");
    expect(json.count).toBe(3);
    expect(mockPrompts.every((p) => p.deletedAt !== null)).toBe(true);
  });

  it("should delete a single prompt with ?id=p1", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/prompts?id=p1", {
      method: "DELETE",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const res = await deletePrompts(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Prompt deleted successfully");
    expect(mockPrompts.find((p) => p.id === "p1")?.deletedAt).toBeInstanceOf(Date);
  });

  it("should bulk delete specific prompt IDs", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/prompts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ ids: ["p1", "p2"] }),
    });

    const res = await deletePrompts(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Prompts deleted successfully");
    expect(json.count).toBe(2);
  });
});
