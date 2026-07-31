type ResolvableProvider = "openai" | "anthropic" | "openrouter" | "nvidia";

const FALLBACK_ORDER: ResolvableProvider[] = ["nvidia", "openrouter", "openai", "anthropic"];

export function resolveServerApiKey(
  preferred?: string
): { apiKey: string; provider: ResolvableProvider } | null {
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
  return null;
}
