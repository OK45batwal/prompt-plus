/**
 * Prompt+ Grok Adapter with Real-Time Conversation & Model Scraper
 */
(function (global) {
  "use strict";

  const GrokAdapter = {
    name: "grok",

    detect() {
      const host = window.location.hostname.toLowerCase();
      return host.includes("grok.com") || host.includes("x.ai") || (host.includes("x.com") && window.location.pathname.includes("grok"));
    },

    getPromptInput() {
      const el = document.querySelector(
        "textarea[placeholder*='Ask Grok'], textarea[placeholder*='Grok'], div[contenteditable='true'][data-placeholder*='Grok'], div[contenteditable='true'][role='textbox'], textarea"
      );
      return el ? el.value || el.innerText || "" : null;
    },

    async insertPrompt(text) {
      const el = document.querySelector(
        "textarea[placeholder*='Ask Grok'], textarea[placeholder*='Grok'], div[contenteditable='true'][data-placeholder*='Grok'], div[contenteditable='true'][role='textbox'], textarea"
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
        name: "Grok 3",
        limit: 128000,
        family: "grok",
      };
    },

    getConversationTurns() {
      const turns = [];
      const messages = document.querySelectorAll("div[data-testid*='message'], div[class*='message-row'], div[class*='response']");

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
    module.exports = GrokAdapter;
  } else {
    global.PromptPlusGrokAdapter = GrokAdapter;
  }
})(typeof window !== "undefined" ? window : globalThis);
