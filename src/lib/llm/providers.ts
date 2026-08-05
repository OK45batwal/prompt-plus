export interface LLMOptions {
  provider?: "openai" | "anthropic" | "openrouter" | "nvidia" | "google";
  apiKey?: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
}

export interface LLMResponse {
  content: string;
  tokensIn?: number;
  tokensOut?: number;
  model: string;
  provider: string;
}

export class LLMError extends Error {
  provider: string;
  statusCode?: number;

  constructor(message: string, provider: string, statusCode?: number) {
    super(message);
    this.name = "LLMError";
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

const OPENROUTER_FREE_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "deepseek/deepseek-r1:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "qwen/qwen-2.5-coder-32b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];

interface CacheEntry {
  response: LLMResponse;
  expiresAt: number;
}

export const llmResponseCache = new Map<string, CacheEntry>();

export function getLLMCacheStats() {
  const now = Date.now();
  let validCount = 0;
  for (const [, entry] of llmResponseCache) {
    if (now < entry.expiresAt) validCount++;
  }
  return { totalEntries: llmResponseCache.size, activeEntries: validCount };
}

export function clearLLMCache() {
  llmResponseCache.clear();
}

export function detectProviderFromKey(apiKey: string, fallbackProvider: LLMOptions["provider"] = "openrouter"): NonNullable<LLMOptions["provider"]> {
  if (!apiKey) return fallbackProvider || "openrouter";
  const k = apiKey.trim();
  if (k.startsWith("nvapi-")) return "nvidia";
  if (k.startsWith("sk-or-")) return "openrouter";
  if (k.startsWith("sk-ant-")) return "anthropic";
  if (k.startsWith("sk-proj-") || k.startsWith("sk-admin-") || k.startsWith("sk-")) return "openai";
  return fallbackProvider || "openrouter";
}

export async function callLLM(options: LLMOptions): Promise<LLMResponse> {
  const {
    apiKey = "",
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 4096,
    responseFormatJson = false,
  } = options;

  let provider = options.provider || "openrouter";

  // Auto-route based on API key prefix if provided
  if (apiKey) {
    provider = detectProviderFromKey(apiKey, provider);
  }

  // Auto-select free OpenRouter model if no API key is provided
  if (!apiKey && provider !== "openrouter") {
    provider = "openrouter";
    options.model = "google/gemini-2.0-flash-exp:free";
  }

  // Strip any internal suffix like ::openrouter, ::nvidia, ::openai, etc.
  let reqModel = options.model || "";
  if (reqModel) {
    reqModel = reqModel.replace(/::(openrouter|nvidia|openai|anthropic)/gi, "").replace(/^openrouter\//gi, "").trim();
  }

  const isOpenRouter = provider === "openrouter";
  const isAnthropic = provider === "anthropic";
  const isNvidia = provider === "nvidia";

  let model =
    reqModel ||
    (isOpenRouter
      ? "google/gemini-2.0-flash-exp:free"
      : isAnthropic
      ? "claude-3-5-sonnet-20241022"
      : isNvidia
      ? "meta/llama-3.3-70b-instruct"
      : "gpt-4o-mini");

  if (isNvidia) {
    const clean = model.toLowerCase();
    if (clean.includes("llama-3.3") || clean.includes("llama3.3") || clean.includes("llama3")) {
      model = "meta/llama-3.3-70b-instruct";
    } else if (clean.includes("nemotron")) {
      model = "nvidia/llama-3.1-nemotron-70b-instruct";
    } else if (clean.includes("gemma")) {
      model = "google/gemma-2-27b-it";
    } else if (clean.includes("mistral")) {
      model = "mistralai/mistral-7b-instruct-v0.3";
    } else if (!model.includes("/")) {
      model = "meta/llama-3.3-70b-instruct";
    }
  } else if (isOpenRouter) {
    const clean = model.toLowerCase();
    if (!apiKey) {
      // Free mode (no API key) — map to active 100% free OpenRouter models
      if (clean.includes("deepseek") || clean.includes("r1")) {
        model = "deepseek/deepseek-r1:free";
      } else if (clean.includes("qwen") || clean.includes("coder")) {
        model = "qwen/qwen-2.5-coder-32b-instruct:free";
      } else if (clean.includes("mistral")) {
        model = "mistralai/mistral-7b-instruct:free";
      } else if (clean.includes("llama-3.1") || clean.includes("llama3")) {
        model = "meta-llama/llama-3.1-8b-instruct:free";
      } else {
        model = "google/gemini-2.0-flash-exp:free";
      }
    } else {
      // Paid mode (API key supplied) — use full model slugs
      if (clean.includes("llama-3.3")) {
        model = "meta-llama/llama-3.3-70b-instruct";
      }
    }
  }

  // Cache check for instant <5ms responses on repeated prompts
  const cacheKey = `${provider}:${model}:${userPrompt.slice(0, 300)}:${systemPrompt.slice(0, 100)}`;
  const cached = llmResponseCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.response;
  }

  const url = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : isAnthropic
    ? "https://api.anthropic.com/v1/messages"
    : isNvidia
    ? "https://integrate.api.nvidia.com/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(isOpenRouter
      ? {
          ...(apiKey && apiKey.trim() ? { Authorization: `Bearer ${apiKey}` } : {}),
          "HTTP-Referer": "https://promptplus.vercel.app",
          "X-Title": "Prompt+",
        }
      : isAnthropic
      ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
      : apiKey && apiKey.trim()
      ? { Authorization: `Bearer ${apiKey}` }
      : {}),
  };

  const body = isAnthropic
    ? { model, system: systemPrompt, messages: [{ role: "user", content: userPrompt }], max_tokens: maxTokens, temperature }
    : {
        model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature,
        max_tokens: maxTokens,
        ...(responseFormatJson && !isNvidia && !isOpenRouter ? { response_format: { type: "json_object" } } : {}),
      };

  let res: Response | null = null;
  let data: Record<string, unknown> = {};
  let lastErrMessage = "";

  // Ultra-fast retry loop: 8 seconds per attempt for rapid failover
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const attemptTimeout = setTimeout(() => controller.abort(), 8000);

    try {
      res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
      data = await res.json().catch(() => ({}));
      clearTimeout(attemptTimeout);
      if (res.ok) break;
      if (res.status < 500 && res.status !== 429 && res.status !== 404 && res.status !== 400) break;
      lastErrMessage = (data as { error?: { message?: string } })?.error?.message || `${provider} API error (${res.status})`;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 400));
    } catch (err: unknown) {
      clearTimeout(attemptTimeout);
      lastErrMessage = err instanceof Error && err.name === "AbortError" ? "Request timed out after 8s" : `${provider} connection failed`;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 400));
    }
  }

  if (!res || !res.ok) {
    if (res?.status === 401) {
      const hint = isNvidia
        ? "Invalid NVIDIA API Key. Check your key in API Vault or choose an OpenRouter free model."
        : isOpenRouter
        ? "Invalid OpenRouter API Key. Check your key in API Vault."
        : isAnthropic
        ? "Invalid Anthropic API Key. Check your key in API Vault."
        : "Invalid OpenAI API Key. Check your key in API Vault.";
      throw new LLMError(hint, provider, 401);
    }

    // Automatic Failover: If primary provider/model returns 404/400 ("No endpoints found"), try active free OpenRouter models in sequence
    for (const fallbackModel of OPENROUTER_FREE_MODELS) {
      if (fallbackModel !== model) {
        try {
          return await callLLM({
            userPrompt,
            systemPrompt,
            temperature,
            maxTokens,
            provider: "openrouter",
            apiKey: "",
            model: fallbackModel,
          });
        } catch {
          // Try next free model in list
        }
      }
    }

    throw new LLMError(lastErrMessage || `${provider} API error (${res?.status || 500})`, provider, res?.status);
  }

  const parsed = data as {
    content?: Array<{ text?: string }>;
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  };

  const textOutput = isAnthropic
    ? parsed.content?.[0]?.text || ""
    : parsed.choices?.[0]?.message?.content || "";

  const responseResult: LLMResponse = {
    content: textOutput,
    tokensIn: parsed.usage?.prompt_tokens,
    tokensOut: parsed.usage?.completion_tokens,
    model: parsed.model || model,
    provider,
  };

  if (textOutput) {
    llmResponseCache.set(cacheKey, {
      response: responseResult,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
  }

  return responseResult;
}
