import { describe, expect, it } from "vitest";
import { providerForModel } from "@/lib/llm/server-api-key";

describe("providerForModel", () => {
  it.each([
    ["gpt-4o-mini", "openai"],
    ["gpt-4o", "openai"],
    ["claude-3-5-sonnet", "anthropic"],
    ["google/gemini-2.0-flash-exp:free", "openrouter"],
    ["deepseek/deepseek-r1:free", "openrouter"],
    ["meta/llama-3.1-8b-instruct", "nvidia"],
    ["nvidia/llama-3.1-nemotron-70b-instruct", "nvidia"],
    ["google/gemma-2-9b-it", "nvidia"],
    ["mistralai/mistral-7b-instruct", "nvidia"],
  ])("maps %s to %s so the key and the model stay on one provider", (model, provider) => {
    expect(providerForModel(model)).toBe(provider);
  });

  it("does not route an OpenRouter-only slug to NVIDIA", () => {
    expect(providerForModel("anthropic/claude-3.5-sonnet")).toBe("anthropic");
    expect(providerForModel("")).toBe("openai");
  });
});
