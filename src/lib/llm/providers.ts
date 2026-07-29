export interface LLMRequestOptions {
  provider: "openai" | "anthropic" | "openrouter" | "google" | "nvidia";
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

export async function callLLM(options: LLMRequestOptions): Promise<LLMResponse> {
  let {
    provider,
    apiKey,
    systemPrompt = "You are a helpful AI assistant.",
    userPrompt,
    temperature = 0.7,
    maxTokens = 1000,
    responseFormatJson = false,
  } = options;

  // Auto-detect key prefix mismatch to prevent 401 errors
  if (provider === "nvidia" && !apiKey.startsWith("nvapi-")) {
    if (apiKey.startsWith("sk-or-")) {
      provider = "openrouter";
      options.model = options.model?.includes("llama") ? "meta-llama/llama-3.3-70b-instruct:free" : "meta-llama/llama-3.3-70b-instruct:free";
    } else if (apiKey.startsWith("sk-ant-")) {
      provider = "anthropic";
      options.model = "claude-3-5-sonnet-20241022";
    } else if (apiKey.startsWith("sk-")) {
      provider = "openai";
      options.model = "gpt-4o-mini";
    }
  } else if (provider === "openrouter" && apiKey.startsWith("nvapi-")) {
    provider = "nvidia";
    options.model = "nvidia/llama-3.3-70b-instruct";
  } else if (provider === "openai" && apiKey.startsWith("nvapi-")) {
    provider = "nvidia";
    options.model = "nvidia/llama-3.3-70b-instruct";
  } else if (provider === "openai" && apiKey.startsWith("sk-or-")) {
    provider = "openrouter";
    options.model = "meta-llama/llama-3.3-70b-instruct:free";
  }

  const isOpenRouter = provider === "openrouter";
  const isAnthropic = provider === "anthropic";
  const isNvidia = provider === "nvidia";

  const model =
    options.model ||
    (isOpenRouter
      ? "meta-llama/llama-3.3-70b-instruct:free"
      : isAnthropic
      ? "claude-3-5-sonnet-20241022"
      : isNvidia
      ? "nvidia/llama-3.3-70b-instruct"
      : "gpt-4o-mini");

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal }).catch((err: unknown) => {
    clearTimeout(timeout);
    throw new LLMError(err instanceof Error && err.name === "AbortError" ? "Request timed out after 30s" : `${provider} request failed`, provider);
  });
  clearTimeout(timeout);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      const hint = isNvidia
        ? "Invalid NVIDIA API Key (expected nvapi-...). Please check your key in API Vault or choose an OpenRouter free model."
        : isOpenRouter
        ? "Invalid OpenRouter API Key (expected sk-or-...). Check your key in API Vault."
        : isAnthropic
        ? "Invalid Anthropic API Key (expected sk-ant-...). Check your key in API Vault."
        : "Invalid OpenAI API Key (expected sk-...). Check your key in API Vault.";
      throw new LLMError(hint, provider, 401);
    }
    const errMsg = data.error?.message || `${provider} API error (${res.status})`;
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
