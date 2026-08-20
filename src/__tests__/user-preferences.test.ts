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

  it("should validate API key structure via POST /api/v1/api-keys/test", async () => {
    const validReq = new NextRequest("http://localhost:3000/api/v1/api-keys/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "openai",
        apiKey: "sk-proj-1234567890123456789012345",
      }),
    });

    const resValid = await testApiKey(validReq);
    expect(resValid.status).toBe(200);
    const jsonValid = await resValid.json();
    expect(jsonValid.success).toBe(true);

    const invalidReq = new NextRequest("http://localhost:3000/api/v1/api-keys/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "openai",
        apiKey: "invalid_key",
      }),
    });

    const resInvalid = await testApiKey(invalidReq);
    expect(resInvalid.status).toBe(400);
  });
});
