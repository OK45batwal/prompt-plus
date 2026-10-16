/**
 * Prompt+ Perplexity Adapter with Real-Time Conversation & Model Scraper
 */
(function (global) {
  "use strict";

  const PerplexityAdapter = {
    name: "perplexity",

    detect() {
      return window.location.hostname.toLowerCase().includes("perplexity.ai");
    },

    getPromptInput() {
      const el = document.querySelector(
        "textarea[placeholder*='Ask anything'], textarea[placeholder*='Ask follow-up'], textarea"
      );
      return el ? el.value || el.innerText || "" : null;
    },

    async insertPrompt(text) {
      const el = document.querySelector(
        "textarea[placeholder*='Ask anything'], textarea[placeholder*='Ask follow-up'], textarea"
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
      return {
        name: "Perplexity Pro",
        limit: 32768,
        family: "perplexity",
      };
    },

    getConversationTurns() {
      const turns = [];
      const messages = document.querySelectorAll("div.border-borderMain, div[class*='answer-wrapper'], div.space-y-4 > div");

      messages.forEach((node) => {
        const text = (node.innerText || "").trim();
        if (text && text.length > 5) {
          const isUser = Boolean(node.querySelector("[class*='query']") || node.className.includes("query"));
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
    module.exports = PerplexityAdapter;
  } else {
    global.PromptPlusPerplexityAdapter = PerplexityAdapter;
  }
})(typeof window !== "undefined" ? window : globalThis);
