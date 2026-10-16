import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), csrf: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/csrf", () => ({ validateCsrf: mocks.csrf }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { withAuth } from "@/lib/api/with-auth";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "owner", email: "owner@example.com" } });
  mocks.csrf.mockReturnValue({ valid: true });
});

describe("withAuth", () => {
  it("ignores a developer API-key header instead of scanning stored keys", async () => {
    mocks.auth.mockResolvedValue(null);
    const handler = withAuth(async () => new Response("ok"));
    const req = new NextRequest("http://localhost/api/v1/prompts", {
      headers: { authorization: "Bearer pp_live_0123456789abcdef" },
    });
    expect((await handler(req)).status).toBe(401);
  });

  it("returns a generic 500 without internal error details", async () => {
    const handler = withAuth(async () => {
      throw new Error('relation "users" does not exist at 10.0.0.1');
    });
    const res = await handler(new NextRequest("http://localhost/api/v1/prompts"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).not.toMatch(/relation|10\.0\.0\.1/);
    expect(body.requestId).toBeTruthy();
  });
});
