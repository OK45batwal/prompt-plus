import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  send: vi.fn(),
  budget: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  getDb: () => ({ user: { findUnique: mocks.findUnique, create: mocks.create } }),
}));
vi.mock("@/lib/email", () => ({ sendOtpEmail: mocks.send }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/rate-limit", () => ({
  checkIpRateLimitAsync: mocks.budget,
  extractClientIp: () => "1.2.3.4",
  getRateLimitHeaders: () => ({}),
  rateLimitStatus: () => 429,
  rateLimitMessage: () => "Rate limited",
}));

import { POST } from "@/app/api/auth/signup/route";

const request = (body: object) =>
  new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const valid = { name: "Ada", email: "Ada@Example.com", password: "supersecret123" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  mocks.budget.mockResolvedValue({ allowed: true });
  mocks.send.mockResolvedValue({ sent: true });
});

describe("signup hardening", () => {
  it("answers a registered email exactly like a fresh signup and creates nothing", async () => {
    mocks.findUnique.mockResolvedValue({ id: "existing" });
    const res = await POST(request(valid));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ needsVerification: true, email: "ada@example.com" });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("fails closed instead of writing to the local store when the database is down", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.1:5432"));
    const res = await POST(request(valid));
    expect(res.status).toBe(503);
    expect(await res.text()).not.toMatch(/ECONNREFUSED|10\.0\.0\.1/);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
