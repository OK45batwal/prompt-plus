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
  let provider = options.provider;
  const {
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
    options.model = "meta/llama-3.3-70b-instruct";
  } else if (provider === "openai" && apiKey.startsWith("nvapi-")) {
    provider = "nvidia";
    options.model = "meta/llama-3.3-70b-instruct";
  } else if (provider === "openai" && apiKey.startsWith("sk-or-")) {
    provider = "openrouter";
    options.model = "meta-llama/llama-3.3-70b-instruct:free";
  }

  // Strip any internal suffix like ::openrouter, ::nvidia, ::openai, etc.
  if (options.model) {
    options.model = options.model.replace(/::(openrouter|nvidia|openai|anthropic)/gi, "").replace(/^openrouter\//gi, "").trim();
  }

  const isOpenRouter = provider === "openrouter";
  const isAnthropic = provider === "anthropic";
  const isNvidia = provider === "nvidia";

  let model =
    options.model ||
    (isOpenRouter
      ? "meta-llama/llama-3.3-70b-instruct:free"
      : isAnthropic
      ? "claude-3-5-sonnet-20241022"
      : isNvidia
      ? "meta/llama-3.3-70b-instruct"
      : "gpt-4o-mini");

  if (isNvidia) {
    if (model === "nvidia/llama-3.3-70b-instruct" || model.includes("llama-3.3")) {
      model = "meta/llama-3.3-70b-instruct";
    } else if (model.includes("nemotron")) {
      model = "nvidia/llama-3.1-nemotron-70b-instruct";
    } else if (model.includes("gemma")) {
      model = "google/gemma-2-27b-it";
    } else if (model.includes("mistral")) {
      model = "mistralai/mistral-7b-instruct-v0.3";
    }
  } else if (isOpenRouter) {
    const clean = model.toLowerCase();
    if (!model || model === "default" || clean.includes("gpt-4o-mini")) {
      model = "meta-llama/llama-3.3-70b-instruct:free";
    } else if (clean.includes("llama-3.3") || clean.includes("llama3.3") || clean.includes("llama-3")) {
      model = "meta-llama/llama-3.3-70b-instruct:free";
    } else if (clean.includes("gemini") || clean.includes("flash")) {
      model = "google/gemini-2.0-flash-exp:free";
    } else if (clean.includes("deepseek") || clean.includes("r1")) {
      model = "deepseek/deepseek-r1:free";
    } else if (clean.includes("qwen")) {
      model = "qwen/qwen-2.5-coder-32b-instruct:free";
    } else if (clean.includes("mistral")) {
      model = "mistralai/mistral-7b-instruct:free";
    } else if (clean.includes("phi")) {
      model = "microsoft/phi-3-medium-128k-instruct:free";
    }
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
          "HTTP-Referer": "https://prompt-plus-three.vercel.app",
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
        ...(responseFormatJson && !isNvidia ? { response_format: { type: "json_object" } } : {}),
      };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  
  let res: Response | null = null;
  let data: Record<string, unknown> = {};
  let lastErrMessage = "";

  // Retry loop for transient 5xx / timeout network errors
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
      data = await res.json().catch(() => ({}));
      if (res.ok) break;
      if (res.status < 500 && res.status !== 429) break; // Don't retry client errors (400, 401, 403)
      lastErrMessage = (data as { error?: { message?: string } })?.error?.message || `${provider} API error (${res.status})`;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * attempt));
    } catch (err: unknown) {
      lastErrMessage = err instanceof Error && err.name === "AbortError" ? "Request timed out after 30s" : `${provider} connection failed`;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  clearTimeout(timeout);

  if (!res || !res.ok) {
    if (res?.status === 401) {
      const hint = isNvidia
        ? "Invalid NVIDIA API Key (expected nvapi-...). Check your key in API Vault or choose an OpenRouter free model."
        : isOpenRouter
        ? "Invalid OpenRouter API Key (expected sk-or-...). Check your key in API Vault."
        : isAnthropic
        ? "Invalid Anthropic API Key (expected sk-ant-...). Check your key in API Vault."
        : "Invalid OpenAI API Key (expected sk-...). Check your key in API Vault.";
      throw new LLMError(hint, provider, 401);
    }

    // Failover: If primary provider or model returns 404/5xx, fallback to primary working free model
    if (res?.status === 404 || (!isOpenRouter && provider !== "openrouter")) {
      try {
        return await callLLM({
          ...options,
          provider: "openrouter",
          apiKey: "",
          model: "meta-llama/llama-3.3-70b-instruct:free",
        });
      } catch {
        // Ignore fallback error and throw primary error
      }
    }

    throw new LLMError(lastErrMessage || `${provider} API error (${res?.status || 500})`, provider, res?.status);
  }

  const parsed = data as {
    content?: Array<{ text?: string }>;
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { input_tokens?: number; output_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  };

  const text = (isAnthropic ? parsed.content?.[0]?.text : parsed.choices?.[0]?.message?.content) || "";

  return {
    content: text,
    tokensIn: (isAnthropic ? parsed.usage?.input_tokens : parsed.usage?.prompt_tokens) || userPrompt.length,
    tokensOut: (isAnthropic ? parsed.usage?.output_tokens : parsed.usage?.completion_tokens) || text.length,
    provider,
    model,
  };
}
