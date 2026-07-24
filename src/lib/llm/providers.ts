export interface LLMRequestOptions {
  provider: "openai" | "anthropic";
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

  if (provider === "anthropic") {
    const model = options.model || "claude-3-5-sonnet-20241022";
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic API error (${response.status})`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";
    const tokensIn = data.usage?.input_tokens || userPrompt.length;
    const tokensOut = data.usage?.output_tokens || content.length;

    return {
      content,
      tokensIn,
      tokensOut,
      provider: "anthropic",
      model,
    };
  }

  // Default: OpenAI
  const model = options.model || "gpt-4o-mini";
  const bodyPayload: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  };

  if (responseFormatJson) {
    bodyPayload.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const tokensIn = data.usage?.prompt_tokens || userPrompt.length;
  const tokensOut = data.usage?.completion_tokens || content.length;

  return {
    content,
    tokensIn,
    tokensOut,
    provider: "openai",
    model,
  };
}
