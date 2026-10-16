/* Shared deterministic fallback for web, popup, and content scripts. No model runs here. */
(function (root) {
  function synthesizeLocalPrompt(input, options = {}) {
    const text = String(input || "").trim();
    if (!text) return "";
    const tones = { human: "Use clear, natural language.", code: "Explain technical decisions concisely.", copy: "Use direct, audience-appropriate language.", exec: "Keep recommendations concise and actionable.", deep: "Explain relevant assumptions and tradeoffs." };
    const context = (options.context || []).filter(Boolean);
    return [
      "### Task", text,
      context.length ? "### Context\n" + context.join("\n") : "",
      "### Instructions",
      "Preserve the task's intent, constraints, and requested output format.",
      "Do not invent facts, requirements, or results. Identify missing information when it prevents a correct answer.",
      tones[options.tone] || "Use clear, concise language.",
      options.level === "expert" ? "Check the result against the stated requirements and disclose any unresolved limitations." : "",
    ].filter(Boolean).join("\n\n");
  }
  const api = { synthesizeLocalPrompt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PromptPlusSynthesis = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
