import crypto from "crypto";

export interface LLMOptions {
  provider?: "openai" | "anthropic" | "openrouter" | "nvidia" | "google";
  apiKey?: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
  _retryDepth?: number;
  tenantId?: string;
  bypassCache?: boolean;
  disableFailover?: boolean;
  maxAttempts?: 1 | 2;
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

// Process-local keyed digest: neither prompt content nor credential suffixes appear in keys.
const cacheSalt = crypto.randomBytes(32);
export function createLLMCacheKey(input: Record<string, unknown>): string {
  const canonical = Object.keys(input).sort().map((key) => [key, input[key] ?? null]);
  return crypto.createHmac("sha256", cacheSalt).update(JSON.stringify(canonical)).digest("hex");
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

  // The caller's provider is authoritative: a key is never re-routed to whichever
  // provider its prefix looks like, which used to bill the wrong account silently.
  const provider = options.provider || "openrouter";

  if (!apiKey.trim()) throw new LLMError("An API key is required for cloud enhancement.", provider, 401);

  // Strip any internal suffix like ::openrouter, ::nvidia, ::openai, etc.
  let reqModel = options.model || "";
  if (reqModel) {
    reqModel = reqModel.replace(/::(openrouter|nvidia|openai|anthropic)/gi, "").replace(/^openrouter\//gi, "").trim();
  }

  const isOpenRouter = provider === "openrouter";
  const isAnthropic = provider === "anthropic";
  const isNvidia = provider === "nvidia";
  const isGoogle = provider === "google";

  const model =
    reqModel ||
    (isOpenRouter
      ? "nvidia/nemotron-3.5-super-vl:free"
      : isAnthropic
      ? "claude-3-5-sonnet-20241022"
      : isNvidia
      ? "meta/llama-3.3-70b-instruct"
      : isGoogle
      ? "gemini-3.8-flash"
      : "gpt-4o-mini");

  const cacheKey = createLLMCacheKey({ tenantId: options.tenantId, apiKey, provider, model, systemPrompt, userPrompt, temperature, maxTokens, responseFormatJson });
  // Anonymous/server calls without a trusted tenant have no shared cache.
  const cacheEnabled = !options.bypassCache && Boolean(options.tenantId);
  const cached = cacheEnabled ? llmResponseCache.get(cacheKey) : undefined;
  if (cached && Date.now() < cached.expiresAt) return cached.response;
  if (cached) llmResponseCache.delete(cacheKey);

  const url = isGoogle
    ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
    : isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : isAnthropic
    ? "https://api.anthropic.com/v1/messages"
    : isNvidia
    ? "https://integrate.api.nvidia.com/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(isGoogle
      ? { "x-goog-api-key": apiKey }
      : isOpenRouter
      ? {
          ...(apiKey && apiKey.trim() ? { Authorization: `Bearer ${apiKey}` } : {}),
          "HTTP-Referer": "https://prompt-plus-three.vercel.app",
          "X-Title": "Prompt+",
        }
      : isAnthropic
      ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
      : apiKey && apiKey.trim()
      ? { Authorization: `Bearer ${apiKey}` }
      : {}),
  };

  const body = isGoogle
    ? {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          ...(responseFormatJson ? { responseMimeType: "application/json" } : {}),
        },
      }
    : isAnthropic
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

  // Resilient serverless timeout: 20 seconds max per attempt
  for (let attempt = 1; attempt <= (options.maxAttempts ?? 2); attempt++) {
    const controller = new AbortController();
    const attemptTimeout = setTimeout(() => controller.abort(), 20000);

    try {
      res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
      data = await res.json().catch(() => ({}));
      clearTimeout(attemptTimeout);
      if (res.ok) break;
      // Read the provider's message before deciding whether to retry, otherwise a
      // rejected 4xx request reports only the HTTP status.
      lastErrMessage = (data as { error?: { message?: string } })?.error?.message || `${provider} API error (${res.status})`;
      if (res.status !== 429 && res.status < 500) break;
      if (attempt < (options.maxAttempts ?? 2)) await new Promise((r) => setTimeout(r, 500));
    } catch (err: unknown) {
      clearTimeout(attemptTimeout);
      lastErrMessage = err instanceof Error && err.name === "AbortError" ? "Request timed out after 20s" : `${provider} connection failed`;
      if (attempt < (options.maxAttempts ?? 2)) await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!res || !res.ok) {
    if (res?.status === 401) {
      const hint = isNvidia
        ? "Invalid NVIDIA API Key. Check your key in API Vault."
        : isOpenRouter
        ? "Invalid OpenRouter API Key. Check your key in API Vault."
        : isAnthropic
        ? "Invalid Anthropic API Key. Check your key in API Vault."
        : "Invalid OpenAI API Key. Check your key in API Vault.";
      throw new LLMError(hint, provider, 401);
    }

    throw new LLMError(lastErrMessage || `${provider} API error (${res?.status || 500})`, provider, res?.status);
  }

  const parsed = data as {
    content?: Array<{ text?: string }>;
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    promptFeedback?: { blockReason?: string };
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    modelVersion?: string;
  };

  const textOutput = isGoogle
    ? (parsed.candidates?.[0]?.content?.parts || []).map((part) => part.text || "").join("")
    : isAnthropic
    ? parsed.content?.[0]?.text || ""
    : parsed.choices?.[0]?.message?.content || "";

  if (isGoogle && !textOutput) {
    const block = parsed.promptFeedback?.blockReason || parsed.candidates?.[0]?.finishReason;
    throw new LLMError(`Google returned no text${block ? ` (${block})` : ""}.`, provider, 400);
  }

  const responseResult: LLMResponse = {
    content: textOutput,
    tokensIn: isGoogle ? parsed.usageMetadata?.promptTokenCount : parsed.usage?.prompt_tokens,
    tokensOut: isGoogle ? parsed.usageMetadata?.candidatesTokenCount : parsed.usage?.completion_tokens,
    model: (isGoogle ? parsed.modelVersion : parsed.model) || model,
    provider,
  };

  if (textOutput && cacheEnabled) {
    if (llmResponseCache.size >= 500) {
      const oldest = llmResponseCache.keys().next().value;
      if (oldest !== undefined) llmResponseCache.delete(oldest);
    }
    llmResponseCache.set(cacheKey, {
      response: responseResult,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
  }

  return responseResult;
}
