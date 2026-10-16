import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "test-user-123" } }),
}));

import { GET as getPreferences, PATCH as patchPreferences } from "@/app/api/v1/user/preferences/route";
import { POST as testApiKey } from "@/app/api/v1/api-keys/test/route";

describe("User Preferences & API Key Validator", () => {
  it("should return default user preferences", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/user/preferences");
    const res = await getPreferences(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.enableAutoCorrect).toBe(true);
    expect(json.data.developerRole).toBe("Prompt Architect");
  });

  it("should update user preferences via PATCH", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultEngineMode: "algorithmic",
        developerRole: "AI / ML Researcher",
      }),
    });

    const res = await patchPreferences(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.preferences.defaultEngineMode).toBe("algorithmic");
    expect(json.data.preferences.developerRole).toBe("AI / ML Researcher");
  });

  it("really probes the provider via POST /api/v1/api-keys/test", async () => {
    const requestBody = { provider: "openai", apiKey: "sk-proj-1234567890123456789012345" };
    const makeRequest = () =>
      new NextRequest("http://localhost:3000/api/v1/api-keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

    // A key the provider accepts is reported as connected.
    const accepted = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", accepted);
    const okRes = await testApiKey(makeRequest());
    expect(okRes.status).toBe(200);
    expect((await okRes.json()).success).toBe(true);
    expect(accepted).toHaveBeenCalledWith("https://api.openai.com/v1/models", expect.anything());

    // A key the provider rejects is a failure, not a success.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    const rejectedRes = await testApiKey(makeRequest());
    expect(rejectedRes.status).toBe(400);
    expect((await rejectedRes.json()).success).toBe(false);

    // An unreachable provider is reported as such, never as validated.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await testApiKey(makeRequest())).status).toBe(502);

    vi.unstubAllGlobals();
  });
});
