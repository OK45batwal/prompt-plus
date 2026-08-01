import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("next-auth", () => ({
  default: vi.fn().mockImplementation(() => ({
    auth: vi.fn(),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

import { encrypt, decrypt } from "@/lib/crypto";
import { getProviders } from "@/lib/auth/config";
import { checkIpRateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { resolveServerApiKey } from "@/lib/llm/server-api-key";
import { NextRequest } from "next/server";

describe("Phase 1 Security & Correctness Hardening", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Issue #1 & #5: OAuth Providers and Secret Checks", () => {
    it("should omit GitHub/Google providers when environment variables are missing", () => {
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const providers = getProviders();
      expect(providers).toHaveLength(1); // Credentials only
      expect((providers[0] as { id: string }).id).toBe("credentials");
    });

    it("should include GitHub provider when environment variables are set", () => {
      process.env.GITHUB_CLIENT_ID = "test-gh-id";
      process.env.GITHUB_CLIENT_SECRET = "test-gh-secret";
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const providers = getProviders();
      const providerIds = providers.map((p) => (p as { id: string }).id);
      expect(providerIds).toContain("github");
      expect(providerIds).toContain("credentials");
    });
  });

  describe("Issue #4: Encryption Key Production Strictness", () => {
    it("should throw in production if ENCRYPTION_KEY is unset or too short", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt("secret-data")).toThrow(
        "FATAL: ENCRYPTION_KEY must be set in production environment variables"
      );
    });

    it("should work in development mode with fallback key", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      delete process.env.ENCRYPTION_KEY;

      const encrypted = encrypt("secret-data");
      expect(encrypted).toContain(":");
      expect(decrypt(encrypted)).toBe("secret-data");
    });

    it("should work in production if valid 32-character key is supplied", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.ENCRYPTION_KEY = "12345678901234567890123456789012";

      const encrypted = encrypt("prod-secret-data");
      expect(decrypt(encrypted)).toBe("prod-secret-data");
    });
  });

  describe("Issue #3: IP Rate Limiting", () => {
    it("should allow requests within the window and block after the limit", () => {
      const key = "ip-test-1";
      checkIpRateLimit(key, 3, 60_000);
      checkIpRateLimit(key, 3, 60_000);
      const res3 = checkIpRateLimit(key, 3, 60_000);
      const res4 = checkIpRateLimit(key, 3, 60_000);
      expect(res3.allowed).toBe(true);
      expect(res4.allowed).toBe(false);
    });
  });

  describe("Server API Key Resolver", () => {
    it("should return null when no server keys are configured", () => {
      delete process.env.NVIDIA_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      expect(resolveServerApiKey("openai")).toBeNull();
    });

    it("should prefer the requested provider when its key exists", () => {
      process.env.OPENAI_API_KEY = "sk-test";
      process.env.NVIDIA_API_KEY = "nvapi-test";
      const result = resolveServerApiKey("openai");
      expect(result?.provider).toBe("openai");
      expect(result?.apiKey).toBe("sk-test");
    });

    it("should fall back to the first configured server key in priority order", () => {
      delete process.env.OPENAI_API_KEY;
      process.env.NVIDIA_API_KEY = "nvapi-test";
      process.env.OPENROUTER_API_KEY = "sk-or-test";
      const result = resolveServerApiKey("openai");
      expect(result?.provider).toBe("nvidia");
      expect(result?.apiKey).toBe("nvapi-test");
    });

    it("should return null for an unknown preferred provider with no configured keys", () => {
      delete process.env.NVIDIA_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      expect(resolveServerApiKey("google")).toBeNull();
    });
  });

  describe("Issue #6: CSRF Protection", () => {
    it("should allow safe HTTP GET requests without anti-CSRF headers", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/prompts", { method: "GET" });
      const result = validateCsrf(req);
      expect(result.valid).toBe(true);
    });

    it("should reject state-changing POST requests missing custom headers/json content-type", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/prompts", { method: "POST" });
      const result = validateCsrf(req);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Missing anti-CSRF protection headers");
    });

    it("should accept state-changing POST requests with application/json content-type", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/prompts", {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost:3000" },
      });
      const result = validateCsrf(req);
      expect(result.valid).toBe(true);
    });

    it("should reject POST requests when Origin hostname does not match Host header", () => {
      const req = new NextRequest("http://localhost:3000/api/v1/prompts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "localhost:3000",
          origin: "http://evil-attacker.com",
        },
      });
      const result = validateCsrf(req);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("CSRF origin mismatch");
    });
  describe("Provider Key Prefix Auto-Detection", () => {
    it("should correctly auto-route OpenAI sk- prefix to openai provider", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 })
      );

      const { callLLM } = await import("@/lib/llm/providers");
      const res = await callLLM({
        provider: "nvidia",
        apiKey: "sk-proj-test12345",
        userPrompt: "test",
      });

      expect(res.provider).toBe("openai");
      fetchSpy.mockRestore();
    });

    it("should correctly auto-route sk-or- prefix to openrouter provider", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 })
      );

      const { callLLM } = await import("@/lib/llm/providers");
      const res = await callLLM({
        provider: "nvidia",
        apiKey: "sk-or-v1-test12345",
        userPrompt: "test",
      });

      expect(res.provider).toBe("openrouter");
      fetchSpy.mockRestore();
    });

    it("should correctly auto-route nvapi- prefix to nvidia provider", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 })
      );

      const { callLLM } = await import("@/lib/llm/providers");
      const res = await callLLM({
        provider: "openai",
        apiKey: "nvapi-test12345",
        userPrompt: "test",
      });

      expect(res.provider).toBe("nvidia");
      fetchSpy.mockRestore();
    });
  });

  describe("API Route Security Enforcer Gate", () => {
    it("should pass static analysis route security check on all API v1 routes", async () => {
      const { execSync } = await import("child_process");
      const output = execSync("node scripts/check-api-routes.mjs", { encoding: "utf-8" });
      expect(output).toContain("API Route Security Gate: All mutating API v1 routes strictly enforce withAuth");
    });
  });
});
});
