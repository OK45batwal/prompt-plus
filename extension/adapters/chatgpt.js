window.PromptPlusChatGPTAdapter = {
  name: "chatgpt",
  detect() {
    return window.location.hostname.includes("chatgpt.com") || window.location.hostname.includes("chat.openai.com");
  },
  getPromptInput() {
    const el = document.querySelector("#prompt-textarea, textarea[data-id='root']");
    return el ? el.value || el.innerText || "" : null;
  },
  async insertPrompt(text) {
    const el = document.querySelector("#prompt-textarea, textarea[data-id='root']");
    if (!el) return;
    if (el.tagName === "TEXTAREA") {
      el.value = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      el.innerText = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
};
