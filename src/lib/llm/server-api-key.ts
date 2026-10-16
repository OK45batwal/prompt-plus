type ResolvableProvider = "openai" | "anthropic" | "openrouter" | "nvidia";

const FALLBACK_ORDER: ResolvableProvider[] = ["nvidia", "openrouter", "openai", "anthropic"];

/** Which server provider serves this model id. Keeps the key and the model on the same provider. */
export function providerForModel(model: string): ResolvableProvider {
  const m = (model || "").toLowerCase();
  if (/^(meta|nvidia)\//.test(m) || m.startsWith("google/gemma") || m.includes("mistral-7b")) return "nvidia";
  if (m.includes("claude")) return "anthropic";
  if (m.includes("/") || m.includes(":")) return "openrouter";
  return "openai";
}

export function resolveServerApiKey(
  preferred?: string
): { apiKey: string; provider: ResolvableProvider } {
  const serverKeys: Record<ResolvableProvider, string | undefined> = {
    nvidia: process.env.NVIDIA_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };

  const pref = (preferred || "") as ResolvableProvider;
  if (serverKeys[pref]) return { apiKey: serverKeys[pref]!, provider: pref };

  for (const p of FALLBACK_ORDER) {
    if (serverKeys[p]) return { apiKey: serverKeys[p]!, provider: p };
  }

  // Zero-key free fallback to OpenRouter free models
  return { apiKey: "", provider: "openrouter" };
}
