import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/prisma", () => ({ getDb: () => ({ user: { findUnique: mocks.findUnique } }) }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { verifySessionAccount } from "@/lib/auth/account";
import { validateCsrf } from "@/lib/auth/csrf";
import { withAuth } from "@/lib/api/with-auth";

const verifiedUser = (overrides: Record<string, unknown> = {}) => ({
  id: "user-1",
  authVersion: 3,
  emailVerified: new Date(),
  deletedAt: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "user-1", authVersion: 3 } });
  mocks.findUnique.mockResolvedValue(verifiedUser());
});

describe("JWT session revocation", () => {
  it("accepts a token whose version matches the database", async () => {
    await expect(verifySessionAccount("user-1", 3)).resolves.toMatchObject({ ok: true });
  });

  it("rejects a token minted before a password change or sign-out-everywhere", async () => {
    await expect(verifySessionAccount("user-1", 2)).resolves.toMatchObject({
      ok: false,
      status: 401,
      reason: "revoked",
    });
  });

  it("rejects tokens without a version claim instead of assuming the current version", async () => {
    await expect(verifySessionAccount("user-1", undefined)).resolves.toMatchObject({
      ok: false,
      status: 401,
      reason: "revoked",
    });
  });

  it("rejects deleted accounts", async () => {
    mocks.findUnique.mockResolvedValue(verifiedUser({ deletedAt: new Date() }));
    await expect(verifySessionAccount("user-1", 3)).resolves.toMatchObject({ ok: false, status: 401, reason: "deleted" });
  });

  it("rejects unknown accounts", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(verifySessionAccount("user-1", 3)).resolves.toMatchObject({
      ok: false,
      status: 401,
      reason: "unknown-user",
    });
  });

  it("reports database failure as temporary and never as access granted", async () => {
    mocks.findUnique.mockRejectedValue(new Error("connection refused"));
    await expect(verifySessionAccount("user-1", 3)).resolves.toMatchObject({
      ok: false,
      status: 503,
      reason: "unavailable",
    });
  });

  it("stops a revoked session inside withAuth", async () => {
    mocks.findUnique.mockResolvedValue(verifiedUser({ authVersion: 4 }));
    const handler = withAuth(async () => new Response("private"));
    const res = await handler(new NextRequest("http://localhost:3000/api/v1/prompts"));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("revoked");
  });

  it("returns 503, not data, while the account store is unavailable", async () => {
    mocks.findUnique.mockRejectedValue(new Error("connection refused"));
    const handler = withAuth(async () => new Response("private"));
    const res = await handler(new NextRequest("http://localhost:3000/api/v1/prompts"));
    expect(res.status).toBe(503);
  });

  it("serves a handler when the token is current", async () => {
    const handler = withAuth(async () => new Response("private"));
    const res = await handler(new NextRequest("http://localhost:3000/api/v1/prompts"));
    expect(res.status).toBe(200);
  });
});

describe("CSRF origin policy", () => {
  const post = (headers: Record<string, string>) =>
    new NextRequest("https://prompt-plus-three.vercel.app/api/v1/prompts", {
      method: "POST",
      headers: { "content-type": "application/json", host: "prompt-plus-three.vercel.app", ...headers },
      body: "{}",
    });

  it("ignores an arbitrary Authorization header on a cookie request", () => {
    const result = validateCsrf(post({ Authorization: "Bearer anything", origin: "https://evil.example" }));
    expect(result.valid).toBe(false);
  });

  it("accepts the deployment's own origin", () => {
    const result = validateCsrf(
      post({ origin: "https://prompt-plus-three.vercel.app", "x-forwarded-proto": "https" })
    );
    expect(result.valid).toBe(true);
  });

  it("rejects a matching host on the wrong port", () => {
    const result = validateCsrf(
      post({ origin: "https://prompt-plus-three.vercel.app:8443", "x-forwarded-proto": "https" })
    );
    expect(result.valid).toBe(false);
  });

  it("rejects a different scheme on the same host", () => {
    const result = validateCsrf(
      post({ origin: "http://prompt-plus-three.vercel.app", "x-forwarded-proto": "https" })
    );
    expect(result.valid).toBe(false);
  });

  it("keeps the extension client header working without an origin", () => {
    const result = validateCsrf(
      new NextRequest("https://prompt-plus-three.vercel.app/api/v1/extension/save-prompt", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-promptplus-client": "chrome-extension",
          host: "prompt-plus-three.vercel.app",
        },
        body: "{}",
      })
    );
    expect(result.valid).toBe(true);
  });
});
