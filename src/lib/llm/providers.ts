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
  "mistralai/mistral-small-24b-instruct-2501:free",
  "google/gemma-2-9b-it:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

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
    if (apiKey.startsWith("nvapi-")) provider = "nvidia";
    else if (apiKey.startsWith("sk-or-")) provider = "openrouter";
    else if (apiKey.startsWith("sk-ant-")) provider = "anthropic";
    else if (apiKey.startsWith("sk-")) provider = "openai";
  }

  // Auto-select free OpenRouter model if no API key is provided
  if (!apiKey && provider !== "openrouter") {
    provider = "openrouter";
    options.model = "google/gemini-2.0-flash-exp:free";
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
      ? "google/gemini-2.0-flash-exp:free"
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
    if (!apiKey) {
      // Free mode (no API key) — map to active 100% free OpenRouter models
      if (clean.includes("deepseek") || clean.includes("r1")) {
        model = "deepseek/deepseek-r1:free";
      } else if (clean.includes("qwen") || clean.includes("coder")) {
        model = "qwen/qwen-2.5-coder-32b-instruct:free";
      } else if (clean.includes("mistral")) {
        model = "mistralai/mistral-small-24b-instruct-2501:free";
      } else if (clean.includes("gemma")) {
        model = "google/gemma-2-9b-it:free";
      } else if (clean.includes("llama-3.1") || clean.includes("llama3")) {
        model = "meta-llama/llama-3.1-8b-instruct:free";
      } else if (clean.includes("llama-3.3")) {
        // If user specifically requests llama 3.3 in free mode, map to paid slug if key exists, else free flash
        model = "google/gemini-2.0-flash-exp:free";
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
        ...(responseFormatJson && !isNvidia && !isOpenRouter ? { response_format: { type: "json_object" } } : {}),
      };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let res: Response | null = null;
  let data: Record<string, unknown> = {};
  let lastErrMessage = "";

  // Retry loop for transient network errors
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
      data = await res.json().catch(() => ({}));
      if (res.ok) break;
      if (res.status < 500 && res.status !== 429 && res.status !== 404 && res.status !== 400) break;
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
        ? "Invalid NVIDIA API Key. Check your key in API Vault or choose an OpenRouter free model."
        : isOpenRouter
        ? "Invalid OpenRouter API Key. Check your key in API Vault."
        : isAnthropic
        ? "Invalid Anthropic API Key. Check your key in API Vault."
        : "Invalid OpenAI API Key. Check your key in API Vault.";
      throw new LLMError(hint, provider, 401);
    }

    // Failover: If primary model is unavailable (e.g. 404/400), try active free OpenRouter models in sequence
    for (const fallbackModel of OPENROUTER_FREE_MODELS) {
      if (fallbackModel !== model) {
        try {
          return await callLLM({
            ...options,
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

  return {
    content: textOutput,
    tokensIn: parsed.usage?.prompt_tokens,
    tokensOut: parsed.usage?.completion_tokens,
    model: parsed.model || model,
    provider,
  };
}
