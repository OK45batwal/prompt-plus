type ResolvableProvider = "openai" | "anthropic" | "openrouter" | "nvidia" | "google";

const FALLBACK_ORDER: ResolvableProvider[] = ["openrouter", "nvidia", "google", "openai", "anthropic"];

/** Which server provider serves this model id. Keeps the key and the model on the same provider. */
export function providerForModel(model: string): ResolvableProvider {
  const m = (model || "").toLowerCase();
  if (m.startsWith("gemini")) return "google";
  if (m.includes(":") || m.startsWith("anthropic/")) return "openrouter";
  if (/^(meta|nvidia)\//.test(m) || m.startsWith("google/gemma") || m.includes("mistral-7b")) return "nvidia";
  if (m.includes("claude")) return "anthropic";
  if (m.includes("/") || m.includes(":")) return "openrouter";
  return "openai";
}

export function resolveServerApiKey(
  preferred?: string
): { apiKey: string; provider: ResolvableProvider } | null {
  const serverKeys: Record<ResolvableProvider, string | undefined> = {
    nvidia: process.env.NVIDIA_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_API_KEY,
  };

  const pref = (preferred || "") as ResolvableProvider;
  if (serverKeys[pref]?.trim()) return { apiKey: serverKeys[pref]!, provider: pref };

  for (const p of FALLBACK_ORDER) {
    if (serverKeys[p]?.trim()) return { apiKey: serverKeys[p]!, provider: p };
  }

  return null;
}

export function defaultModelForProvider(provider: string): string {
  return ({ openai: "gpt-4o-mini", anthropic: "claude-3-5-sonnet-20241022", openrouter: "nvidia/nemotron-3.5-super-vl:free", nvidia: "meta/llama-3.3-70b-instruct", google: "gemini-2.0-flash" } as Record<string, string>)[provider] || "gpt-4o-mini";
}
