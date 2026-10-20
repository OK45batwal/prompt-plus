import { beforeEach, describe, expect, it, vi } from "vitest";
import { MODELS, MODEL_ALIASES, getModelById, accessLabel, canIncurProviderCharges } from "@/lib/models";
import { resolveModelCredentials } from "@/lib/llm/resolve-credentials";
import { callLLM } from "@/lib/llm/providers";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  getDb: () => ({ apiKey: { findFirst: mocks.findFirst } }),
}));
vi.mock("@/lib/crypto", () => ({
  decrypt: (value: string) => {
    if (value === "broken") throw new Error("cannot decrypt");
    return "decrypted-key";
  },
  encrypt: (value: string) => value,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  mocks.findFirst.mockResolvedValue(null);
});

describe("model catalog", () => {
  it("has one row per id and per provider/model pair", () => {
    expect(new Set(MODELS.map((m) => m.id)).size).toBe(MODELS.length);
    expect(new Set(MODELS.map((m) => `${m.provider}:${m.rawModel}`)).size).toBe(MODELS.length);
  });

  it("never labels a paid or unpublished model as free", () => {
    for (const model of MODELS) {
      if (model.access === "free") {
        expect(model.pricing.inputPer1M).toBe(0);
        expect(model.pricing.outputPer1M).toBe(0);
        expect(model.pricing.verifiedAt).not.toBeNull();
      }
      if (model.access === "paid" || model.access === "unknown") {
        expect(model.pricing.sourceUrl).toMatch(/^https:\/\//);
        expect(canIncurProviderCharges(model)).toBe(true);
      }
    }
  });

  it("does not quote a price without the date it was verified", () => {
    for (const model of MODELS) {
      if (model.pricing.inputPer1M !== null && model.access !== "unknown") {
        expect(model.pricing.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("labels free tiers differently from free models", () => {
    const freeTier = MODELS.find((m) => m.access === "free_tier_available");
    expect(freeTier && accessLabel(freeTier)).toBe("Free tier available");
    const free = MODELS.find((m) => m.access === "free");
    expect(free && accessLabel(free)).toBe("Free model");
  });

  it("resolves every stored alias to a real model", () => {
    for (const [alias, target] of Object.entries(MODEL_ALIASES)) {
      expect(getModelById(alias)?.id).toBe(target);
    }
  });

  it("includes a direct Gemini model and an OpenRouter paid Gemini", () => {
    const direct = MODELS.find((m) => m.provider === "google");
    const viaRouter = MODELS.find((m) => m.provider === "openrouter" && m.rawModel.includes("gemini"));
    expect(direct?.rawModel).toBe("gemini-3.8-flash");
    expect(viaRouter?.pricing.inputPer1M).toBeGreaterThan(0);
  });
});

describe("credential resolver", () => {
  it("rejects an unknown model", async () => {
    const result = await resolveModelCredentials({ userId: "u", modelId: "not-a-model" });
    expect(result).toMatchObject({ ok: false, status: 400, code: "model_not_found" });
  });

  it("requires explicit consent before a paid run and does not touch the database", async () => {
    const result = await resolveModelCredentials({ userId: "u", modelId: "openai-gpt4o" });
    expect(result).toMatchObject({ ok: false, status: 402, code: "paid_consent_required" });
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("treats a free tier as potentially billable until the user consents", async () => {
    // Google bills API usage to a project, so a free-tier model is not proof this
    // particular request is free.
    const gemini = MODELS.find((m) => m.id === "google-gemini-38-flash")!;
    expect(gemini.access).toBe("free_tier_available");
    expect(canIncurProviderCharges(gemini)).toBe(true);

    const result = await resolveModelCredentials({ userId: "u", modelId: "google-gemini-38-flash" });
    expect(result).toMatchObject({ ok: false, status: 402, code: "paid_consent_required" });
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("does not require consent for a model the provider serves free", async () => {
    const free = MODELS.find((m) => m.access === "free")!;
    expect(canIncurProviderCharges(free)).toBe(false);
    const result = await resolveModelCredentials({ userId: "u", modelId: free.id });
    expect(result.ok).toBe(false);
    expect(result).not.toMatchObject({ code: "paid_consent_required" });
  });

  it("requires a key for the model's own provider", async () => {
    const result = await resolveModelCredentials({ userId: "u", modelId: "google-gemini-38-flash", paidConsent: true });
    expect(result).toMatchObject({ ok: false, status: 400, code: "missing_key", provider: "google" });
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: "u", provider: "google" }),
    }));
  });

  it("returns the catalog provider and exact API model", async () => {
    mocks.findFirst.mockResolvedValue({ apiKeyEnc: "ciphertext" });
    const result = await resolveModelCredentials({ userId: "u", modelId: "google-gemini-38-flash", paidConsent: true });
    expect(result).toMatchObject({
      ok: true,
      provider: "google",
      apiKey: "decrypted-key",
      source: "user",
      model: { rawModel: "gemini-3.8-flash" },
    });
  });

  it("reports a key that cannot be decrypted instead of calling a provider", async () => {
    mocks.findFirst.mockResolvedValue({ apiKeyEnc: "broken" });
    const result = await resolveModelCredentials({ userId: "u", modelId: "google-gemini-38-flash", paidConsent: true });
    expect(result).toMatchObject({ ok: false, code: "key_decrypt_failed", provider: "google" });
  });

  it("returns 503, not access, when credentials cannot be read", async () => {
    mocks.findFirst.mockRejectedValue(new Error("db down"));
    const result = await resolveModelCredentials({ userId: "u", modelId: "google-gemini-38-flash", paidConsent: true });
    expect(result).toMatchObject({ ok: false, status: 503, code: "credentials_unavailable" });
  });
});

describe("Gemini adapter", () => {
  const geminiResponse = {
    candidates: [{ content: { parts: [{ text: '{"ok":true}' }] }, finishReason: "STOP" }],
    usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 7 },
    modelVersion: "gemini-3.8-flash",
  };

  it("calls the native API with its own auth header and generation config", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(geminiResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await callLLM({
      provider: "google",
      apiKey: "AIza-test",
      model: "gemini-3.8-flash",
      systemPrompt: "system",
      userPrompt: "user",
      responseFormatJson: true,
      maxTokens: 512,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent");
    expect(init.headers["x-goog-api-key"]).toBe("AIza-test");
    expect(init.headers.Authorization).toBeUndefined();
    const body = JSON.parse(init.body);
    expect(body.systemInstruction.parts[0].text).toBe("system");
    expect(body.contents[0].parts[0].text).toBe("user");
    expect(body.generationConfig).toMatchObject({ maxOutputTokens: 512, responseMimeType: "application/json" });

    expect(result).toMatchObject({
      content: '{"ok":true}',
      provider: "google",
      model: "gemini-3.8-flash",
      tokensIn: 11,
      tokensOut: 7,
    });
  });

  it("surfaces a blocked response instead of returning empty text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ candidates: [{ finishReason: "SAFETY" }], promptFeedback: { blockReason: "SAFETY" } }),
      { status: 200 }
    )));

    await expect(callLLM({ provider: "google", apiKey: "k", model: "gemini-3.8-flash", systemPrompt: "s", userPrompt: "u" }))
      .rejects.toThrow(/no text \(SAFETY\)/);
  });

  it("does not retry a rejected request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { message: "API key not valid" } }),
      { status: 400 }
    ));
    vi.stubGlobal("fetch", fetchMock);

    await expect(callLLM({ provider: "google", apiKey: "bad", model: "gemini-3.8-flash", systemPrompt: "s", userPrompt: "u" }))
      .rejects.toThrow("API key not valid");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
