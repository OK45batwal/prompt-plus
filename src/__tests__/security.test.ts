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
      delete process.env.AUTH_SECRET;
      delete process.env.NEXTAUTH_SECRET;

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

    it("should support distributed rate limiting via checkIpRateLimitAsync", async () => {
      const { checkIpRateLimitAsync } = await import("@/lib/rate-limit");
      const key = "ip-async-test";
      const res = await checkIpRateLimitAsync(key, 5, 60_000);
      expect(res.allowed).toBe(true);
      expect(res.limit).toBe(5);
    });
  });

  describe("Server API Key Resolver", () => {
    it("should return null when no server keys are configured", () => {
      delete process.env.NVIDIA_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      const res = resolveServerApiKey("openai");
      expect(res).toBeNull();
    });

    it("should prefer the requested provider when its key exists", () => {
      process.env.OPENAI_API_KEY = "sk-test";
      process.env.NVIDIA_API_KEY = "nvapi-test";
      const result = resolveServerApiKey("openai");
      expect(result?.provider).toBe("openai");
      expect(result?.apiKey).toBe("sk-test");
    });

    it("should fall back in a fixed priority order when the preferred key is missing", () => {
      delete process.env.OPENAI_API_KEY;
      process.env.NVIDIA_API_KEY = "nvapi-test";
      process.env.OPENROUTER_API_KEY = "sk-or-test";
      const result = resolveServerApiKey("openai");
      expect(result?.provider).toBe("openrouter");
      expect(result?.apiKey).toBe("sk-or-test");
    });

    it("should return null for an unknown preferred provider with no configured keys", () => {
      delete process.env.NVIDIA_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      const res = resolveServerApiKey("google");
      expect(res).toBeNull();
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
    it("never re-routes a request to the provider whose prefix the key resembles", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 })
      );

      const { callLLM } = await import("@/lib/llm/providers");
      const res = await callLLM({
        provider: "openai",
        apiKey: "nvapi-test12345",
        systemPrompt: "You are a test assistant.",
        userPrompt: "test",
      });

      // The caller's provider is authoritative, so an NVIDIA-shaped key is not
      // silently spent against NVIDIA when OpenAI was requested.
      expect(res.provider).toBe("openai");
      expect(fetchSpy.mock.calls[0][0]).toBe("https://api.openai.com/v1/chat/completions");
      fetchSpy.mockRestore();
    });
  });

  describe("API Route Security Enforcer Gate", () => {
    it("should pass static analysis route security check on all API v1 routes", async () => {
      const { execSync } = await import("child_process");
      const output = execSync("node scripts/check-api-routes.mjs", { encoding: "utf-8" });
      expect(output).toContain("API Route Security Gate: API v1/v2 routes use withAuth");
    });
  });
});
});
