export type AIPlatform = "chatgpt" | "claude" | "gemini" | "deepseek" | "perplexity";

export function openAIPlatform(
  platform: AIPlatform,
  text: string,
  onNotify?: (message: string, type: "success" | "error" | "info") => void
): void {
  const cleanText = text ? text.trim() : "";
  if (!cleanText) {
    if (onNotify) onNotify("No prompt text to send", "error");
    return;
  }

  // 1. Always copy text to clipboard as primary or fallback
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(cleanText).catch(() => {});
  }

  // 2. Construct safe target URLs
  let targetUrl = "";
  const platformName =
    platform === "chatgpt"
      ? "ChatGPT"
      : platform === "claude"
      ? "Claude"
      : platform === "gemini"
      ? "Gemini"
      : platform === "deepseek"
      ? "DeepSeek"
      : "Perplexity";

  const encodedShort = encodeURIComponent(cleanText.slice(0, 1200));

  switch (platform) {
    case "chatgpt":
      targetUrl = `https://chatgpt.com/?q=${encodedShort}`;
      break;
    case "claude":
      targetUrl = `https://claude.ai/new`;
      break;
    case "gemini":
      targetUrl = `https://gemini.google.com/app`;
      break;
    case "deepseek":
      targetUrl = `https://chat.deepseek.com/`;
      break;
    case "perplexity":
      targetUrl = `https://www.perplexity.ai/?q=${encodedShort}`;
      break;
  }

  if (onNotify) {
    onNotify(`Copied prompt to clipboard! Opening ${platformName}...`, "success");
  }

  // 3. Open in new tab safely
  if (typeof window !== "undefined") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}
