window.PromptPlusGeminiAdapter = {
  name: "gemini",
  detect() {
    return window.location.hostname.includes("gemini.google.com");
  },
  getPromptInput() {
    const el = document.querySelector("div[contenteditable='true'], textarea, rich-textarea");
    return el ? el.innerText || el.value || "" : null;
  },
  async insertPrompt(text) {
    const el = document.querySelector("div[contenteditable='true'], textarea, rich-textarea");
    if (!el) return;
    if (el.tagName === "TEXTAREA") {
      el.value = text;
    } else {
      el.innerText = text;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  },
};
