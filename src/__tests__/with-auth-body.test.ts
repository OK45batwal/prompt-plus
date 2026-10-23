import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-a" } }),
}));
vi.mock("@/lib/auth/account", () => ({
  verifySessionAccount: async () => ({ ok: true, user: { id: "user-a", authVersion: 0, emailVerified: null } }),
  sessionCheckMessage: () => "invalid session",
}));

import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

const handler = vi.fn(async (_req: NextRequest, { body }: { body?: unknown }) =>
  jsonResponse({ received: body ?? null })
);

function request(body: string, contentType = "application/json") {
  return new NextRequest("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}

describe("withAuth request bodies", () => {
  it("rejects malformed JSON before the handler runs", async () => {
    handler.mockClear();
    const route = withAuth(handler);
    const res = await route(request("{not json"));
    expect(res.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it("allows an empty body when the route has no schema", async () => {
    handler.mockClear();
    const route = withAuth(handler);
    const res = await route(request(""));
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("validates against the schema and passes the parsed value", async () => {
    const schema = z.object({ name: z.string() });
    const route = withAuth(async (_req, { body }) => jsonResponse({ name: body?.name ?? null }), { schema });

    const bad = await route(request(JSON.stringify({ name: 1 })));
    expect(bad.status).toBe(400);

    const good = await route(request(JSON.stringify({ name: "Ada" })));
    expect(good.status).toBe(200);
    expect((await good.json()).name).toBe("Ada");
  });
});
