/**
 * Zero-Fluff Prompt Response Cleaner & Latency Optimizer
 *
 * Strips conversational preamble, empty markdown section headers, redundant filler,
 * and multiple blank lines to deliver crisp, high-density prompt instructions.
 */

export interface CleanPromptOptions {
  zeroFluff?: boolean;
  maxTokensHint?: number;
}

export function cleanPromptResponse(rawText: string, options: CleanPromptOptions = {}): string {
  if (!rawText || !rawText.trim()) return "";

  let cleaned = rawText.trim();

  // 1. Remove conversational preamble sentences
  const preambleRegex = /^(?:sure|certainly|here is|here's|below is|of course)[^:\n]*:\s*/i;
  cleaned = cleaned.replace(preambleRegex, "");

  // 2. Remove empty section headers (e.g. "### BACKGROUND CONTEXT\n\n###")
  const emptyHeaderRegex = /###?\s+[^\n]+\n+(?=\n*###?|\s*$)/gi;
  cleaned = cleaned.replace(emptyHeaderRegex, "");

  // 3. Remove redundant filler phrases if zeroFluff option is enabled
  if (options.zeroFluff) {
    const fillerPhrases = [
      /Please make sure to /gi,
      /Kindly ensure that /gi,
      /It is very important that /gi,
      /As an AI assistant, /gi,
      /Remember to /gi,
    ];
    for (const regex of fillerPhrases) {
      cleaned = cleaned.replace(regex, "");
    }
  }

  // 4. Normalize multiple blank lines to clean double newlines (\n\n)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}
