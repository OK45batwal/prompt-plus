/**
 * Prompt+ ChatGPT Adapter with Real-Time Conversation & Sub-Model Token Scraper
 */
(function (global) {
  "use strict";

  const ChatGPTAdapter = {
    name: "chatgpt",

    detect() {
      const host = window.location.hostname.toLowerCase();
      return host.includes("chatgpt.com") || host.includes("chat.openai.com");
    },

    getPromptInput() {
      const el = document.querySelector(
        "#prompt-textarea, textarea[data-id='root'], div[contenteditable='true']#prompt-textarea, textarea#prompt-textarea"
      );
      return el ? el.value || el.innerText || "" : null;
    },

    async insertPrompt(text) {
      const el = document.querySelector(
        "#prompt-textarea, textarea[data-id='root'], div[contenteditable='true']#prompt-textarea, textarea#prompt-textarea"
      );
      if (!el) return;
      el.focus();

      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
        const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
        if (descriptor && descriptor.set) {
          descriptor.set.call(el, text);
        } else {
          el.value = text;
        }
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
      // 1. Inspect model dropdown or button text
      const candidates = [
        "[data-testid='model-switcher']",
        "[aria-label*='Model' i]",
        "button[id*='radix'] span",
        ".model-selector",
        "[data-testid='chat-model-selector']",
        "header button[aria-haspopup='menu']",
      ];

      let detectedName = "GPT-4o";
      let limit = 128000;

      for (const sel of candidates) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          const txt = (el.textContent || "").trim();
          if (txt.includes("o1-mini") || txt.includes("o3-mini")) {
            return { name: txt || "o3-mini", limit: 200000, family: "chatgpt" };
          }
          if (txt.includes("o1") || txt.includes("o3")) {
            return { name: "o1", limit: 200000, family: "chatgpt" };
          }
          if (txt.includes("4o mini") || txt.includes("4o-mini")) {
            return { name: "GPT-4o mini", limit: 128000, family: "chatgpt" };
          }
          if (txt.includes("4o") || txt.includes("GPT-4o")) {
            return { name: "GPT-4o", limit: 128000, family: "chatgpt" };
          }
          if (txt.includes("GPT-4")) {
            return { name: "GPT-4", limit: 32768, family: "chatgpt" };
          }
        }
      }

      // 2. Check URL parameters e.g. ?model=o1
      const urlParams = new URLSearchParams(window.location.search);
      const modelParam = urlParams.get("model");
      if (modelParam) {
        if (modelParam.includes("o1")) return { name: "o1", limit: 200000, family: "chatgpt" };
        if (modelParam.includes("o3")) return { name: "o3-mini", limit: 200000, family: "chatgpt" };
        if (modelParam.includes("mini")) return { name: "GPT-4o mini", limit: 128000, family: "chatgpt" };
      }

      return { name: detectedName, limit, family: "chatgpt" };
    },

    getConversationTurns() {
      const turns = [];
      // Select standard ChatGPT message containers
      const messageElements = document.querySelectorAll(
        "[data-message-id], [data-message-author-role], article, div[class*='agent-turn']"
      );

      if (messageElements.length > 0) {
        messageElements.forEach((el) => {
          const roleAttr = el.getAttribute("data-message-author-role");
          let role = "user";

          if (roleAttr) {
            role = roleAttr === "assistant" ? "assistant" : "user";
          } else if (
            el.querySelector(".markdown") ||
            el.querySelector("[data-message-author-role='assistant']") ||
            el.className.includes("agent-turn")
          ) {
            role = "assistant";
          }

          // Extract text content cleanly (skip action buttons/copiers)
          const contentNode = el.querySelector(".whitespace-pre-wrap, .markdown, div[class*='text-message']") || el;
          const text = contentNode ? (contentNode.innerText || contentNode.textContent || "").trim() : "";
          if (text) {
            turns.push({ role, text });
          }
        });
      }

      return turns;
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = ChatGPTAdapter;
  } else {
    global.PromptPlusChatGPTAdapter = ChatGPTAdapter;
  }
})(typeof window !== "undefined" ? window : globalThis);
