/**
 * Prompt+ Gemini Adapter with Real-Time Conversation & Sub-Model Token Scraper
 */
(function (global) {
  "use strict";

  const GeminiAdapter = {
    name: "gemini",

    detect() {
      const host = window.location.hostname.toLowerCase();
      return host.includes("gemini.google.com") || host.includes("aistudio.google.com");
    },

    getPromptInput() {
      const el = document.querySelector(
        "rich-textarea .ql-editor, rich-textarea div[contenteditable='true'], rich-textarea textarea, input-area-v2 div[contenteditable='true'], div.input-area div[contenteditable='true'], div[aria-label*='Enter a prompt'], div[aria-label*='Ask Gemini'], textarea"
      );
      return el ? el.innerText || el.value || "" : null;
    },

    async insertPrompt(text) {
      const el = document.querySelector(
        "rich-textarea .ql-editor, rich-textarea div[contenteditable='true'], rich-textarea textarea, input-area-v2 div[contenteditable='true'], div.input-area div[contenteditable='true'], div[aria-label*='Enter a prompt'], div[aria-label*='Ask Gemini'], textarea"
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
      } else {
        try {
          document.execCommand("selectAll", false, null);
          const ok = document.execCommand("insertText", false, text);
          if (!ok) {
            el.innerText = text;
          }
        } catch {
          el.innerText = text;
        }
        el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },

    getActiveModel() {
      // Look for Gemini model selector dropdown
      const selectors = [
        ".model-picker-btn",
        "button[aria-label*='model' i]",
        "[data-test-id*='model-dropdown']",
        "mat-select",
        "ms-picker",
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        const txt = (el?.textContent || "").toLowerCase();
        if (txt.includes("1.5 pro")) return { name: "Gemini 1.5 Pro", limit: 2000000, family: "gemini" };
        if (txt.includes("2.5 pro") || txt.includes("pro")) return { name: "Gemini 2.5 Pro", limit: 1000000, family: "gemini" };
        if (txt.includes("flash") || txt.includes("2.0")) return { name: "Gemini 2.0 Flash", limit: 1000000, family: "gemini" };
      }

      return { name: "Gemini 2.0 Flash", limit: 1000000, family: "gemini" };
    },

    getConversationTurns() {
      const turns = [];
      const userQueries = document.querySelectorAll("user-query, .user-query-container, [data-test-id='user-query']");
      const modelResponses = document.querySelectorAll("model-response, .model-response-container, [data-test-id='model-response']");

      // Check if structured custom elements exist
      if (userQueries.length > 0 || modelResponses.length > 0) {
        // Collect in DOM order
        const allItems = document.querySelectorAll(
          "user-query, model-response, .user-query-container, .model-response-container"
        );
        allItems.forEach((node) => {
          const isUser = node.tagName.toLowerCase().includes("user") || node.className.includes("user");
          const text = (node.innerText || node.textContent || "").trim();
          if (text) {
            turns.push({
              role: isUser ? "user" : "assistant",
              text,
            });
          }
        });
      } else {
        // Fallback for conversation-container or chat-history
        const messages = document.querySelectorAll(".conversation-container message-content, div[class*='chat-turn']");
        messages.forEach((node) => {
          const text = (node.innerText || "").trim();
          if (text) {
            const isUser = Boolean(node.closest("[class*='user']") || node.className.includes("user"));
            turns.push({
              role: isUser ? "user" : "assistant",
              text,
            });
          }
        });
      }

      return turns;
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = GeminiAdapter;
  } else {
    global.PromptPlusGeminiAdapter = GeminiAdapter;
  }
})(typeof window !== "undefined" ? window : globalThis);
