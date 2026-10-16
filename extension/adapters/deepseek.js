/**
 * Prompt+ DeepSeek Adapter with Real-Time Conversation & Sub-Model Token Scraper
 */
(function (global) {
  "use strict";

  const DeepSeekAdapter = {
    name: "deepseek",

    detect() {
      const host = window.location.hostname.toLowerCase();
      return host.includes("chat.deepseek.com") || host.includes("deepseek.com");
    },

    getPromptInput() {
      const el = document.querySelector(
        "textarea#chat-input, textarea[placeholder*='DeepSeek'], div[contenteditable='true']#chat-input, textarea"
      );
      return el ? el.value || el.innerText || "" : null;
    },

    async insertPrompt(text) {
      const el = document.querySelector(
        "textarea#chat-input, textarea[placeholder*='DeepSeek'], div[contenteditable='true']#chat-input, textarea"
      );
      if (!el) return;
      el.focus();

      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        const proto = el.tagName === "TEXTAREA" ? (window.HTMLTextAreaElement?.prototype || HTMLTextAreaElement.prototype) : (window.HTMLInputElement?.prototype || HTMLInputElement.prototype);
        const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
        if (descriptor && descriptor.set) {
          descriptor.set.call(el, text);
        } else {
          el.value = text;
        }
        el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (el.isContentEditable || el.getAttribute("contenteditable") === "true") {
        try {
          document.execCommand("selectAll", false, null);
          const ok = document.execCommand("insertText", false, text);
          if (!ok) el.innerText = text;
        } catch {
          el.innerText = text;
        }
        el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },

    getActiveModel() {
      // Check if DeepSeek R1 (reasoner) or V3 is active
      const reasonerBtn = document.querySelector("button[class*='think'], div[class*='reasoner']");
      const isR1 = reasonerBtn && (reasonerBtn.getAttribute("aria-checked") === "true" || reasonerBtn.className.includes("active"));
      return {
        name: isR1 ? "DeepSeek R1" : "DeepSeek V3",
        limit: 128000,
        family: "deepseek",
      };
    },

    getConversationTurns() {
      const turns = [];
      const messages = document.querySelectorAll(
        ".chat-message-list > div, div[class*='chat-message'], div[class*='bubble']"
      );

      messages.forEach((node) => {
        const text = (node.innerText || "").trim();
        if (text && text.length > 3) {
          const isUser = Boolean(node.querySelector("[class*='user']") || node.className.includes("user"));
          turns.push({
            role: isUser ? "user" : "assistant",
            text,
          });
        }
      });

      return turns;
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = DeepSeekAdapter;
  } else {
    global.PromptPlusDeepSeekAdapter = DeepSeekAdapter;
  }
})(typeof window !== "undefined" ? window : globalThis);
