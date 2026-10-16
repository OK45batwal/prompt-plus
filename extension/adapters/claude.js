/**
 * Prompt+ Claude Adapter with Real-Time Conversation & Sub-Model Token Scraper
 */
(function (global) {
  "use strict";

  const ClaudeAdapter = {
    name: "claude",

    detect() {
      return window.location.hostname.toLowerCase().includes("claude.ai");
    },

    getPromptInput() {
      const el = document.querySelector(
        "div[contenteditable='true'].ProseMirror, fieldset div[contenteditable='true'], div[contenteditable='true'][role='textbox'], textarea"
      );
      return el ? el.innerText || el.value || "" : null;
    },

    async insertPrompt(text) {
      const el = document.querySelector(
        "div[contenteditable='true'].ProseMirror, fieldset div[contenteditable='true'], div[contenteditable='true'][role='textbox'], textarea"
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
      // Look for Claude model badge or selector
      const selectors = [
        "[data-testid='model-selector-dropdown']",
        "button[aria-haspopup='dialog']",
        ".font-tiempos",
        "[class*='ModelSelector']",
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        const txt = (el?.textContent || "").toLowerCase();
        if (txt.includes("opus")) return { name: "Claude 3 Opus", limit: 200000, family: "claude" };
        if (txt.includes("3.7") || txt.includes("sonnet")) return { name: "Claude 3.7 Sonnet", limit: 200000, family: "claude" };
        if (txt.includes("haiku")) return { name: "Claude 3.5 Haiku", limit: 200000, family: "claude" };
      }

      return { name: "Claude 3.5 Sonnet", limit: 200000, family: "claude" };
    },

    getConversationTurns() {
      const turns = [];
      const messageContainers = document.querySelectorAll(
        "[data-testid='chat-message'], .font-claude-message, [data-is-streaming], div[class*='MessageContainer'], div[class*='ChatTurn']"
      );

      if (messageContainers.length > 0) {
        messageContainers.forEach((el) => {
          const isUser = Boolean(
            el.closest("[data-testid='user-message']") ||
            el.querySelector("[data-testid='user-message']") ||
            el.className.includes("UserMessage")
          );

          const content = el.querySelector(".standard-markdown, div[class*='font-user-message'], [class*='contents']") || el;
          const text = (content.innerText || content.textContent || "").trim();
          if (text) {
            turns.push({
              role: isUser ? "user" : "assistant",
              text,
            });
          }
        });
      } else {
        // Fallback for Claude's grid/column message layout
        const genericTurns = document.querySelectorAll("div.grid.grid-cols-1 > div");
        genericTurns.forEach((turnEl) => {
          const text = (turnEl.innerText || "").trim();
          if (text && text.length > 5) {
            const isUser = turnEl.querySelector("[class*='user']") != null;
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
    module.exports = ClaudeAdapter;
  } else {
    global.PromptPlusClaudeAdapter = ClaudeAdapter;
  }
})(typeof window !== "undefined" ? window : globalThis);
