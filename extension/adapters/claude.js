window.PromptPlusClaudeAdapter = {
  name: "claude",
  detect() {
    return window.location.hostname.includes("claude.ai");
  },
  getPromptInput() {
    const el = document.querySelector("div[contenteditable='true'], textarea");
    return el ? el.innerText || el.value || "" : null;
  },
  async insertPrompt(text) {
    const el = document.querySelector("div[contenteditable='true'], textarea");
    if (!el) return;
    if (el.tagName === "TEXTAREA") {
      el.value = text;
    } else {
      el.innerText = text;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  },
};
