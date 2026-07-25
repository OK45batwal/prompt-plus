export interface LLMRequestOptions {
  provider: "openai" | "anthropic" | "openrouter" | "google";
  apiKey: string;
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
}

export interface LLMResponse {
  content: string;
  tokensIn: number;
  tokensOut: number;
  provider: string;
  model: string;
}

export class LLMError extends Error {
  constructor(message: string, public provider: string, public statusCode?: number) {
    super(message);
    this.name = "LLMError";
  }
}

export class InvalidApiKeyError extends LLMError {
  constructor(provider: string, message?: string) {
    super(message || `Invalid API key for ${provider}`, provider, 401);
    this.name = "InvalidApiKeyError";
  }
}

export class RateLimitQuotaError extends LLMError {
  constructor(provider: string, message?: string) {
    super(message || `Rate limit / quota exceeded for ${provider}`, provider, 429);
    this.name = "RateLimitQuotaError";
  }
}

export class ProviderServerError extends LLMError {
  constructor(provider: string, message?: string) {
    super(message || `${provider} server error`, provider, 502);
    this.name = "ProviderServerError";
  }
}

export async function callLLM(options: LLMRequestOptions): Promise<LLMResponse> {
  const {
    provider,
    apiKey,
    systemPrompt = "You are a helpful AI assistant.",
    userPrompt,
    temperature = 0.7,
    maxTokens = 1000,
    responseFormatJson = false,
  } = options;

  const isOpenRouter = provider === "openrouter";
  const isAnthropic = provider === "anthropic";

  const model =
    options.model ||
    (isOpenRouter
      ? "openai/gpt-4o-mini"
      : isAnthropic
      ? "claude-3-5-sonnet-20241022"
      : "gpt-4o-mini");

  const url = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : isAnthropic
    ? "https://api.anthropic.com/v1/messages"
    : "https://api.openai.com/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(isOpenRouter
      ? {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://prompt-plus-three.vercel.app",
          "X-Title": "Prompt+",
        }
      : isAnthropic
      ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
      : { Authorization: `Bearer ${apiKey}` }),
  };

  const body = isAnthropic
    ? { model, system: systemPrompt, messages: [{ role: "user", content: userPrompt }], max_tokens: maxTokens, temperature }
    : {
        model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature,
        max_tokens: maxTokens,
        ...(responseFormatJson ? { response_format: { type: "json_object" } } : {}),
      };

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errMsg = data.error?.message || `${provider} API error (${res.status})`;
    if (res.status === 401 || res.status === 403) {
      throw new InvalidApiKeyError(provider, errMsg);
    }
    if (res.status === 429) {
      throw new RateLimitQuotaError(provider, errMsg);
    }
    if (res.status >= 500) {
      throw new ProviderServerError(provider, errMsg);
    }
    throw new LLMError(errMsg, provider, res.status);
  }

  const text = (isAnthropic ? data.content?.[0]?.text : data.choices?.[0]?.message?.content) || "";

  return {
    content: text,
    tokensIn: (isAnthropic ? data.usage?.input_tokens : data.usage?.prompt_tokens) || userPrompt.length,
    tokensOut: (isAnthropic ? data.usage?.output_tokens : data.usage?.completion_tokens) || text.length,
    provider,
    model,
  };
}
