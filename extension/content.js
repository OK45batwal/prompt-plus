(function () {
  let modalEl = null;
  let selectedTone = "human";

  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const kbdShortcut = isMac ? "⌘↵" : "Ctrl+↵";

  // One tone vocabulary for the dock, the modal and the popup.
  const TONE_OPTIONS = [
    { key: "human", label: "Natural", short: "Natural" },
    { key: "code", label: "Technical", short: "Tech" },
    { key: "exec", label: "Executive", short: "Exec" },
    { key: "copy", label: "Marketing", short: "Marketing" },
    { key: "deep", label: "Reasoning", short: "Reasoning" },
  ];
  const PACE = { steady: "Steady pace", heavy: "Heavy usage", accelerating: "Growing faster", decelerating: "Slowing down" };
  const paceLabel = (rate) => PACE[rate] || "Pace unknown";

  const ICONS = {
    sparkle: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
    chevron: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
    zap: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    close: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  // The shared review renderer owns escaping and diffing for both hosts.
  const { escapeHtml, highlight } = window.PromptPlusDiff;



  function ensureStylesInjected() {
    if (document.getElementById("pp-styles-v2")) return;
    const style = document.createElement("style");
    style.id = "pp-styles-v2";
    style.textContent = `
      .pp-unified-dock,
      .pp-floating-trigger {
        position: fixed !important;
        display: inline-flex !important;
        align-items: center !important;
        box-sizing: border-box !important;
        height: 30px !important;
        border-radius: 9999px !important;
        background: rgba(13, 14, 22, 0.94) !important;
        border: 1px solid rgba(255, 255, 255, 0.14) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04) !important;
        backdrop-filter: blur(24px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif !important;
        z-index: 99999999 !important;
        user-select: none !important;
        color: #ffffff !important;
        padding: 3px 5px 3px 4px !important;
        gap: 5px !important;
        font-size: 11px !important;
        letter-spacing: -0.01em !important;
        transition: border-color 0.2s ease,
                    box-shadow 0.2s ease,
                    transform 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }

      .pp-unified-dock:hover,
      .pp-floating-trigger:hover {
        border-color: rgba(99, 102, 241, 0.55) !important;
        box-shadow: 0 6px 26px rgba(0, 0, 0, 0.6), 0 0 16px rgba(99, 102, 241, 0.25) !important;
      }

      .pp-dock-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        height: 22px !important;
        padding: 0 8px 0 5px !important;
        border-radius: 9999px !important;
        /* White reads at 6.3:1 on this indigo gradient; dark ink is 3.4:1 and fails. */
        background: linear-gradient(180deg, #6366f1 0%, #4338ca 100%) !important;
        border: 1px solid rgba(255, 255, 255, 0.35) !important;
        color: #ffffff !important;
        cursor: pointer !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        line-height: 1 !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4),
                    0 2px 8px rgba(99, 102, 241, 0.45) !important;
        transition: all 0.15s ease !important;
        flex-shrink: 0 !important;
      }

      .pp-dock-btn:hover {
        background: linear-gradient(180deg, #818cf8 0%, #6366f1 100%) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5),
                    0 3px 14px rgba(99, 102, 241, 0.6) !important;
        transform: translateY(-0.5px) !important;
      }

      .pp-dock-btn:active {
        transform: translateY(0.5px) !important;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3),
                    0 1px 4px rgba(99, 102, 241, 0.4) !important;
      }

      .pp-dock-btn:focus-visible {
        outline: 2px solid rgba(165, 180, 252, 0.9) !important;
        outline-offset: 2px !important;
      }

      .pp-dock-icon {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 13px !important;
        height: 13px !important;
      }

      .pp-dock-kbd {
        font-size: 8.5px !important;
        padding: 1px 3.5px !important;
        border-radius: 3px !important;
        background: rgba(0, 0, 0, 0.28) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: rgba(255, 255, 255, 0.85) !important;
        line-height: 1 !important;
        font-weight: 600 !important;
      }

      .pp-dock-sep {
        width: 1px !important;
        height: 14px !important;
        background: rgba(255, 255, 255, 0.14) !important;
        flex-shrink: 0 !important;
      }

      .pp-dock-runway {
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        padding: 0 4px !important;
        height: 22px !important;
        cursor: default !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
      }

      .pp-runway-dot {
        width: 6px !important;
        height: 6px !important;
        border-radius: 50% !important;
        background: #10b981 !important;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.6) !important;
        flex-shrink: 0 !important;
      }

      .pp-runway-model {
        font-size: 10.5px !important;
        font-weight: 700 !important;
        color: #f1f5f9 !important;
      }

      .pp-runway-tokens {
        font-size: 10px !important;
        font-weight: 600 !important;
        color: #34d399 !important;
      }

      .pp-runway-pct {
        font-size: 9.5px !important;
        font-weight: 700 !important;
        color: #94a3b8 !important;
      }

      .pp-dock-tones {
        display: inline-flex !important;
        align-items: center !important;
        gap: 2px !important;
        flex-shrink: 0 !important;
      }

      .pp-dock-tone {
        background: transparent !important;
        border: 1px solid transparent !important;
        color: #94a3b8 !important;
        font-size: 9.5px !important;
        font-weight: 600 !important;
        padding: 1.5px 5px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        transition: all 0.12s ease !important;
      }

      .pp-dock-tone:hover {
        background: rgba(255, 255, 255, 0.08) !important;
        color: #ffffff !important;
      }

      .pp-dock-tone.active {
        background: rgba(99, 102, 241, 0.25) !important;
        border-color: rgba(99, 102, 241, 0.45) !important;
        color: #a5b4fc !important;
      }

      .pp-dock-studio-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 3px !important;
        background: transparent !important;
        border: none !important;
        padding: 2px 5px !important;
        border-radius: 4px !important;
        color: #94a3b8 !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.12s ease !important;
        flex-shrink: 0 !important;
      }

      .pp-dock-studio-btn:hover {
        color: #ffffff !important;
        background: rgba(255, 255, 255, 0.08) !important;
      }

      /* Floating Modal Studio */
      .pp-floating-modal {
        position: fixed !important;
        z-index: 100000000 !important;
        width: 380px !important;
        max-width: calc(100vw - 32px) !important;
        background: rgba(12, 12, 16, 0.96) !important;
        border: 1px solid rgba(99, 102, 241, 0.45) !important;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(99, 102, 241, 0.25) !important;
        backdrop-filter: blur(24px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(24px) saturate(160%) !important;
        border-radius: 14px !important;
        padding: 12px 14px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif !important;
        color: #f4f4f5 !important;
        user-select: none !important;
        animation: ppModalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }

      @keyframes ppModalIn {
        from { opacity: 0; transform: translateY(8px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .pp-modal-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
      }

      .pp-modal-title {
        display: flex !important;
        align-items: center !important;
        gap: 7px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        color: #ffffff !important;
      }

      .pp-model-badge {
        font-size: 9px !important;
        font-weight: 700 !important;
        padding: 2px 7px !important;
        border-radius: 4px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
      }

      .pp-status-dot {
        width: 5px !important;
        height: 5px !important;
        border-radius: 50% !important;
        display: inline-block !important;
      }

      .pp-modal-close-btn {
        background: transparent !important;
        border: none !important;
        color: #71717a !important;
        font-size: 12px !important;
        cursor: pointer !important;
        padding: 4px 6px !important;
        border-radius: 6px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.15s ease !important;
      }
      .pp-modal-close-btn:hover {
        color: #ffffff !important;
        background: rgba(255, 255, 255, 0.08) !important;
      }

      .pp-tone-row {
        display: flex !important;
        gap: 4px !important;
        overflow-x: auto !important;
        padding-bottom: 2px !important;
      }

      .pp-tone-chip {
        font-size: 10px !important;
        font-weight: 600 !important;
        padding: 4px 9px !important;
        border-radius: 6px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.09) !important;
        color: #a1a1aa !important;
        cursor: pointer !important;
        white-space: nowrap !important;
        transition: all 0.15s ease !important;
      }
      .pp-tone-chip:hover {
        color: #ffffff !important;
        background: rgba(255, 255, 255, 0.1) !important;
        border-color: rgba(255, 255, 255, 0.18) !important;
      }
      .pp-tone-chip.active {
        background: rgba(99, 102, 241, 0.25) !important;
        border-color: rgba(99, 102, 241, 0.65) !important;
        color: #a5b4fc !important;
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.25) !important;
      }

      .pp-modal-preview {
        background: rgba(0, 0, 0, 0.5) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 9px !important;
        padding: 8px 10px !important;
        font-size: 11.5px !important;
        line-height: 1.45 !important;
        color: #e4e4e7 !important;
        max-height: 100px !important;
        overflow-y: auto !important;
        white-space: pre-wrap !important;
        user-select: text !important;
      }

      .pp-modal-actions {
        display: flex !important;
        gap: 6px !important;
      }

      .pp-modal-btn-primary {
        flex: 1 !important;
        height: 36px !important;
        border-radius: 8px !important;
        background: linear-gradient(180deg, #6366f1 0%, #4338ca 100%) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        color: #04141c !important;
        font-size: 11.5px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4) !important;
        transition: all 0.15s ease !important;
      }
      .pp-modal-btn-primary:hover {
        filter: brightness(1.08) !important;
        transform: translateY(-1px) !important;
      }
      .pp-modal-btn-primary:active {
        transform: translateY(0) !important;
      }

      .pp-modal-btn-sub {
        height: 36px !important;
        padding: 0 12px !important;
        border-radius: 8px !important;
        background: rgba(255, 255, 255, 0.06) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        color: #ffffff !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 5px !important;
        transition: all 0.15s ease !important;
      }
      .pp-modal-btn-sub:hover {
        background: rgba(255, 255, 255, 0.12) !important;
      }

      /* Shared review diff. Scoped by panel id so host page <del>/<ins> are untouched. */
      #pp-enhancement-preview del,
      #pp-enhancement-preview ins {
        text-decoration: none !important;
        border-radius: 3px !important;
        padding: 0 2px !important;
      }
      #pp-enhancement-preview del { background: #7f1d1d !important; color: #fecaca !important; }
      #pp-enhancement-preview ins { background: #14532d !important; color: #bbf7d0 !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  ensureStylesInjected();

  function detectChatbot() {
    const loc = typeof window !== "undefined" && window.location ? window.location : (typeof location !== "undefined" ? location : { hostname: "", pathname: "" });
    const host = (loc.hostname || "").toLowerCase();
    const path = (loc.pathname || "").toLowerCase();
    if (host.includes("chatgpt") || host.includes("chat.openai") || host.includes("oaistatic")) return "chatgpt";
    if (host.includes("claude.ai") || host.includes("anthropic")) return "claude";
    if (host.includes("gemini.google") || host.includes("bard.google")) return "gemini";
    if (host.includes("aistudio.google")) return "aistudio";
    if (host.includes("deepseek")) return "deepseek";
    if (host.includes("grok") || host.includes("x.ai") || (host.includes("x.com") && path.includes("grok"))) return "grok";
    if (host.includes("perplexity")) return "perplexity";
    if (host.includes("copilot.microsoft") || (host.includes("bing.com") && path.includes("chat"))) return "copilot";
    if (host.includes("meta.ai")) return "meta";
    if (host.includes("poe.com")) return "poe";
    if (host.includes("mistral.ai")) return "mistral";
    if (host.includes("huggingface.co/chat")) return "huggingchat";
    if (host.includes("groq.com")) return "groq";
    return "general";
  }

  function isSidebarElement(el) {
    if (!el || typeof el.closest !== "function") return false;
    try {
      return Boolean(
        el.closest("aside, nav, [role='navigation'], #sidebar, .sidebar, header, [aria-label*='Search' i], [placeholder*='Search' i], [aria-label*='Notebook' i]")
      );
    } catch {
      return false;
    }
  }

  function isVisible(el) {
    if (!el) return false;
    try {
      const style = typeof window !== "undefined" && typeof window.getComputedStyle === "function" ? window.getComputedStyle(el) : (el.style || {});
      const rect = typeof el.getBoundingClientRect === "function" ? el.getBoundingClientRect() : null;
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        (!rect || (rect.width > 0 && rect.height > 0))
      );
    } catch {
      return true;
    }
  }

  function getInput() {
    const bot = detectChatbot();

    // 1. Google Gemini & Google AI Studio
    if (bot === "gemini" || bot === "aistudio") {
      const geminiSelectors = [
        "rich-textarea .ql-editor",
        "rich-textarea div[contenteditable='true']",
        "rich-textarea textarea",
        "input-area-v2 div[contenteditable='true']",
        "div.input-area div[contenteditable='true']",
        "div[aria-label*='Enter a prompt']",
        "div[aria-label*='Ask Gemini']",
        "textarea[aria-label*='prompt']",
        "textarea[placeholder*='Ask Gemini']"
      ];
      for (const s of geminiSelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 2. ChatGPT (OpenAI)
    if (bot === "chatgpt") {
      const chatgptSelectors = [
        "#prompt-textarea",
        "div[id='prompt-textarea']",
        "div[contenteditable='true']#prompt-textarea",
        "textarea[data-id='root']",
        "textarea#prompt-textarea",
        "textarea[placeholder*='Message ChatGPT']",
        "textarea[placeholder*='Ask anything']"
      ];
      for (const s of chatgptSelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 3. Claude (Anthropic)
    if (bot === "claude") {
      const claudeSelectors = [
        "div[contenteditable='true'].ProseMirror",
        "fieldset div[contenteditable='true']",
        "div.ProseMirror",
        "div[contenteditable='true'][role='textbox']"
      ];
      for (const s of claudeSelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 4. DeepSeek
    if (bot === "deepseek") {
      const deepseekSelectors = [
        "textarea#chat-input",
        "textarea[placeholder*='DeepSeek']",
        "div[contenteditable='true']#chat-input",
        "textarea"
      ];
      for (const s of deepseekSelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 5. Grok (xAI)
    if (bot === "grok") {
      const grokSelectors = [
        "textarea[placeholder*='Ask Grok']",
        "textarea[placeholder*='Grok']",
        "div[contenteditable='true'][data-placeholder*='Grok']",
        "div[contenteditable='true'][role='textbox']",
        "textarea"
      ];
      for (const s of grokSelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 6. Perplexity AI
    if (bot === "perplexity") {
      const perplexitySelectors = [
        "textarea[placeholder*='Ask anything']",
        "textarea[placeholder*='Ask follow-up']",
        "textarea[placeholder*='Ask']",
        "div[data-lexical-editor='true']",
        "div[contenteditable='true'][role='textbox']",
        "div[contenteditable='true']",
        "textarea"
      ];
      for (const s of perplexitySelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 7. Microsoft Copilot
    if (bot === "copilot") {
      const copilotSelectors = [
        "textarea#userInput",
        "textarea[placeholder*='Message Copilot']",
        "div[contenteditable='true'][role='textbox']",
        "textarea"
      ];
      for (const s of copilotSelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 8. Meta AI, Poe, Mistral, HuggingChat
    const platformSelectors = [
      "textarea[placeholder*='Ask Meta']",
      "textarea[class*='ChatMessageInput']",
      "textarea[placeholder*='Talk to']",
      "textarea[placeholder*='Ask Le Chat']",
      "textarea[placeholder*='Ask anything']"
    ];
    for (const s of platformSelectors) {
      const el = document.querySelector(s);
      if (el && isVisible(el) && !isSidebarElement(el)) return el;
    }

    // 9. Universal heuristic fallback
    const fallbackSelectors = [
      "form textarea",
      "main div[contenteditable='true']",
      "main textarea",
      "div[contenteditable='true'][role='textbox']",
      "div[contenteditable='true']",
      "textarea[placeholder*='Message']",
      "textarea[placeholder*='Ask']",
      "textarea[placeholder*='prompt']",
      "textarea[placeholder*='chat']",
      "textarea"
    ];
    for (const s of fallbackSelectors) {
      const el = document.querySelector(s);
      if (el && isVisible(el) && !isSidebarElement(el)) return el;
    }
    return null;
  }

  function getText(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      return el.value || "";
    }
    if (el.isContentEditable) {
      return el.innerText || el.textContent || "";
    }
    return "";
  }

  function setText(el, val) {
    if (!el) return;
    el.focus();

    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
      if (descriptor && descriptor.set) {
        descriptor.set.call(el, val);
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (el.isContentEditable || el.getAttribute("contenteditable") === "true") {
      try {
        // Multi-strategy rich-text injection (Quill, ProseMirror, Slate, Lexical)
        document.execCommand("selectAll", false, null);
        const success = document.execCommand("insertText", false, val);
        if (!success || !el.innerText || !el.innerText.trim()) {
          el.innerHTML = "";
          const p = document.createElement("p");
          p.innerText = val;
          el.appendChild(p);
        }
      } catch {
        el.innerHTML = "";
        const p = document.createElement("p");
        p.innerText = val;
        el.appendChild(p);
      }
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: val }));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function showToast(msg) {
    const existing = document.getElementById("pp-inpage-toast");
    if (existing) {
      try { existing.remove(); } catch {}
    }
    const t = document.createElement("div");
    t.id = "pp-inpage-toast";
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "rgba(10,10,12,0.92)", color: "#f1f5f9", padding: "8px 18px", borderRadius: "12px",
      fontSize: "12px", fontWeight: "600", zIndex: "100000001", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", transition: "all 0.3s ease"
    });
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translate(-50%, 10px)";
      setTimeout(() => { try { t.remove(); } catch {} }, 300);
    }, 2800);
  }

  function synthesizeLocalPrompt(text, tone) {
    return globalThis.PromptPlusSynthesis.synthesizeLocalPrompt(text, { tone });
  }

  let enhancementPending = false;
  async function enhanceText(text, tone) {
    try {
      const response = await new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 55000);
        chrome.runtime.sendMessage({ action: "enhancePrompt", text, tone, mode: "api" }, (result) => {
          clearTimeout(timer);
          if (chrome.runtime.lastError) resolve(null);
          else resolve(result);
        });
      });
      if (response?.success && response.data?.enhanced) {
        return { text: response.data.enhanced, source: response.data.source === "engine" ? "Deterministic engine" : response.data.source === "local-template" ? "Local template (offline)" : "Cloud model" };
      }
    } catch { /* Explicit local fallback below. */ }
    return { text: synthesizeLocalPrompt(text, tone), source: "Local template (offline)" };
  }

  let closeEnhancementPreview = null;
  function showEnhancementPreview(input, original, enhanced, source) {
    closeEnhancementPreview?.();
    const panel = document.createElement("section");
    panel.id = "pp-enhancement-preview";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Review enhancement");
    panel.tabIndex = -1;
    Object.assign(panel.style, {
      position: "fixed", bottom: "90px", right: "16px", width: "min(520px, calc(100vw - 32px))",
      maxHeight: "70vh", overflow: "auto", padding: "20px", borderRadius: "16px",
      background: "#111318", color: "#f1f5f9", border: "1px solid #475569",
      boxShadow: "0 16px 48px #0008", zIndex: "100000002", font: "13px/1.6 system-ui, sans-serif"
    });
    const beforeTokens = window.PromptPlusTokenizer.countTokens(original);
    const afterTokens = window.PromptPlusTokenizer.countTokens(enhanced);
    const delta = afterTokens - beforeTokens;
    const diff = highlight(original, enhanced);
    panel.innerHTML = `
      <strong style="font-size:16px">Review enhancement</strong>
      <p style="color:#cbd5e1;margin:6px 0">${escapeHtml(source)}</p>
      <p id="pp-preview-tokens" style="margin:8px 0">Estimated tokens: ${beforeTokens} → ${afterTokens} (${delta > 0 ? "+" : ""}${delta})</p>
      <div style="max-height:38vh;overflow:auto">
        <p style="font-weight:600">Original</p><div style="white-space:pre-wrap;overflow-wrap:anywhere" data-preview="original">${diff.before}</div>
        <p style="font-weight:600;margin-top:12px">Enhanced</p><div style="white-space:pre-wrap;overflow-wrap:anywhere" data-preview="enhanced">${diff.after}</div>
      </div>
      <div style="display:flex;gap:12px;margin-top:16px">
        <button type="button" id="pp-preview-accept" style="padding:8px 14px;border-radius:8px;background:#f1f5f9;color:#111318">Accept · Tab</button>
        <button type="button" id="pp-preview-keep" style="padding:8px 14px;border-radius:8px;background:#334155;color:#fff">Keep original · Esc</button>
      </div>`;
    const close = () => {
      document.removeEventListener("keydown", onKey, true);
      panel.remove();
      closeEnhancementPreview = null;
      if (input.isConnected) input.focus();
    };
    const accept = () => {
      if (!input.isConnected || getText(input) !== original) {
        close();
        showToast("Your input changed. Enhance again to review your latest text.");
        return;
      }
      close();
      setText(input, enhanced);
      showToast("Enhancement accepted");
    };
    const onKey = (event) => {
      if (event.key !== "Escape" && !(event.key === "Tab" && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape") close(); else accept();
    };
    panel.querySelector("#pp-preview-accept").addEventListener("click", accept);
    panel.querySelector("#pp-preview-keep").addEventListener("click", close);
    document.body.appendChild(panel);
    document.addEventListener("keydown", onKey, true);
    closeEnhancementPreview = close;
    panel.focus();
  }

  async function enhanceInPlace(input, raw, tone) {
    if (enhancementPending || !raw.trim()) return;
    const initialText = getText(input);
    enhancementPending = true;
    showToast("Enhancing your prompt…");
    try {
      const result = await enhanceText(raw, tone);
      if (getText(input) !== initialText) {
        showToast("Input changed while enhancing. Try again to use your latest text.");
        return;
      }
      showEnhancementPreview(input, initialText, result.text, result.source);
    } finally { enhancementPending = false; }
  }

  function getModelContextInfo() {
    const bot = detectChatbot();
    if (bot === "gemini") {
      return { botKey: "GEMINI", name: "Gemini 2.0 / 1.5", maxContext: 1000000, tag: "1,000K Context", color: "#3b82f6" };
    }
    if (bot === "aistudio") {
      return { botKey: "AISTUDIO", name: "Google AI Studio", maxContext: 2000000, tag: "2,000K Context", color: "#4285f4" };
    }
    if (bot === "claude") {
      return { botKey: "CLAUDE", name: "Claude 3.5 Sonnet", maxContext: 200000, tag: "200K Context", color: "#d97706" };
    }
    if (bot === "chatgpt") {
      return { botKey: "CHATGPT", name: "ChatGPT (GPT-4o)", maxContext: 128000, tag: "128K Context", color: "#10a37f" };
    }
    if (bot === "deepseek") {
      return { botKey: "DEEPSEEK", name: "DeepSeek R1", maxContext: 128000, tag: "128K Context", color: "#6366f1" };
    }
    if (bot === "grok") {
      return { botKey: "GROK", name: "Grok 3 (xAI)", maxContext: 128000, tag: "128K Context", color: "#ec4899" };
    }
    if (bot === "perplexity") {
      return { botKey: "PERPLEXITY", name: "Perplexity AI", maxContext: 32000, tag: "32K Context", color: "#20b2aa" };
    }
    if (bot === "copilot") {
      return { botKey: "COPILOT", name: "Microsoft Copilot", maxContext: 128000, tag: "128K Context", color: "#0078d4" };
    }
    if (bot === "meta") {
      return { botKey: "META", name: "Meta Llama 3", maxContext: 128000, tag: "128K Context", color: "#0668e1" };
    }
    if (bot === "mistral") {
      return { botKey: "MISTRAL", name: "Mistral Le Chat", maxContext: 128000, tag: "128K Context", color: "#ea580c" };
    }
    if (bot === "poe") {
      return { botKey: "POE", name: "Poe AI", maxContext: 128000, tag: "128K Context", color: "#8b5cf6" };
    }
    if (bot === "huggingchat") {
      return { botKey: "HUGGINGCHAT", name: "HuggingChat", maxContext: 32000, tag: "32K Context", color: "#f59e0b" };
    }
    return { botKey: "AI", name: "Universal Chatbot", maxContext: 128000, tag: "128K Context", color: "#6366f1" };
  }

  function formatK(num) {
    if (num == null) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  }

  let latestAnalysis = null;

  // Open the in-page panel
  function openFloatingModal(inputEl) {
    if (modalEl) {
      modalEl.remove();
      modalEl = null;
    }

    const currentVal = getText(inputEl).trim();
    const tokenCount = currentVal.length > 0 ? (window.PromptPlusTokenizer ? window.PromptPlusTokenizer.countTokens(currentVal) : Math.ceil(currentVal.length / 3.8)) : 0;
    const modelInfo = getModelContextInfo();

    const limit = latestAnalysis?.contextLimit || modelInfo.maxContext || 128000;
    const totalTokens = (latestAnalysis?.totalTokens || 0) + tokenCount;
    const pct = Math.min(100, Math.max(0, Math.round((totalTokens / limit) * 100)));
    const modelName = latestAnalysis?.modelName || modelInfo.name;
    const turnCount = latestAnalysis?.turnCount || 0;
    const burn = latestAnalysis?.burnRate || "steady";

    let color = "#10b981";
    if (pct >= 80) color = "#ef4444";
    else if (pct >= 60) color = "#f59e0b";

    modalEl = document.createElement("div");
    modalEl.className = "pp-floating-modal";

    modalEl.innerHTML = `
      <div class="pp-modal-header">
        <div class="pp-modal-title">
          <span class="pp-dock-icon" style="width:16px;height:16px;background:linear-gradient(135deg,#6366f1,#4338ca);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;">${ICONS.sparkle}</span>
          <span>Prompt+</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="pp-model-badge" style="color:${color};">
            <span class="pp-status-dot" style="background:${color};box-shadow:0 0 8px ${color}80;"></span>
            ${escapeHtml(modelName)}
          </span>
          <button type="button" class="pp-modal-close-btn" id="pp-modal-close" aria-label="Close">${ICONS.close}</button>
        </div>
      </div>

      <!-- Live chat usage for the open conversation -->
      <div style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08);border-radius:9px;padding:8px 10px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-weight:700;color:#ffffff;letter-spacing:-0.01em;">Chat usage</span>
            <span id="pp-modal-burn-badge" style="font-size:9.5px;padding:1px 5px;border-radius:4px;background:rgba(255,255,255,0.08);color:#94a3b8;">${paceLabel(burn)}</span>
          </div>
          <span id="pp-modal-rem-badge" style="font-weight:700;color:${color};background:${color}22;padding:1.5px 7px;border-radius:4px;border:1px solid ${color}44;">Visible messages only</span>
        </div>
        <div style="width:100%;height:4.5px;border-radius:9999px;background:rgba(255,255,255,0.1);overflow:hidden;">
          <div id="pp-modal-runway-bar" style="height:100%;border-radius:9999px;background:${color};width:${Math.min(100, Math.max(3, pct))}%;box-shadow:0 0 8px ${color}80;transition:width 0.3s ease;"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;font-size:9.5px;color:#a1a1aa;text-align:center;">
          <div style="background:rgba(255,255,255,0.04);border-radius:4px;padding:2px 0;">Used: <strong id="pp-modal-used-tok" style="color:#fff;">${formatK(totalTokens)}</strong></div>
          <div style="background:rgba(255,255,255,0.04);border-radius:4px;padding:2px 0;">Limit: <strong style="color:#fff;">${latestAnalysis?.contextLimitKnown ? formatK(limit) : "—"}</strong></div>
          <div style="background:rgba(255,255,255,0.04);border-radius:4px;padding:2px 0;">Turns: <strong id="pp-modal-turn-count" style="color:#fff;">${turnCount}</strong></div>
          <div style="background:rgba(255,255,255,0.04);border-radius:4px;padding:2px 0;">Left: <strong id="pp-modal-est-msgs" style="color:#34d399;">—</strong></div>
        </div>
      </div>

      <div class="pp-tone-row" role="group" aria-label="Tone">
        ${TONE_OPTIONS.map((t) => `<div class="pp-tone-chip ${selectedTone === t.key ? "active" : ""}" data-tone="${t.key}">${t.label}</div>`).join("")}
      </div>

      <div class="pp-modal-preview" id="pp-modal-preview" contenteditable="true" spellcheck="false" placeholder="Type prompt idea or click Optimize...">
        ${escapeHtml(currentVal) || "Type your prompt idea in the chatbox below or type directly here..."}
      </div>

      <div class="pp-modal-actions">
        <button type="button" class="pp-modal-btn-primary" id="pp-modal-replace-btn">
          ${ICONS.zap}
          <span>Optimize & Review</span>
          <kbd class="pp-trigger-kbd" style="margin-left: 4px; background: rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.2); color: #ffffff;">${kbdShortcut}</kbd>
        </button>
        <button type="button" class="pp-modal-btn-sub" id="pp-modal-copy-btn" title="Copy result">
          ${ICONS.copy}
          <span>Copy</span>
        </button>
      </div>
    `;

    document.body.appendChild(modalEl);

    // Position modal right above the input box
    const card = resolveChatCapsule(inputEl) || inputEl;
    const rect = card.getBoundingClientRect();
    const modalHeight = modalEl.offsetHeight || 280;
    const modalWidth = modalEl.offsetWidth || 380;

    let top = rect.top - modalHeight - 12;
    if (top < 12) top = rect.top + 8;
    let left = rect.right - modalWidth;
    if (left < 16) left = 16;

    modalEl.style.top = `${Math.round(top)}px`;
    modalEl.style.left = `${Math.round(left)}px`;

    const closeModal = () => {
      if (modalEl) {
        document.removeEventListener("keydown", handleModalKeydown, true);
        document.removeEventListener("click", handleOutsideClick);
        modalEl.remove();
        modalEl = null;
      }
    };

    const handleModalKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
        if (inputEl) inputEl.focus();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        modalEl.querySelector("#pp-modal-replace-btn")?.click();
      }
    };

    const handleOutsideClick = (e) => {
      if (modalEl && !modalEl.contains(e.target) && !e.target.closest(".pp-unified-dock") && !e.target.closest(".pp-floating-trigger")) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleModalKeydown, true);
    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 50);

    modalEl.querySelector("#pp-modal-close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeModal();
    });

    modalEl.querySelectorAll(".pp-tone-chip").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        modalEl.querySelectorAll(".pp-tone-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        selectedTone = chip.getAttribute("data-tone") || "code";

        const dock = document.querySelector(".pp-unified-dock");
        if (dock) {
          dock.querySelectorAll(".pp-dock-tone").forEach((b) => {
            b.classList.toggle("active", b.getAttribute("data-tone") === selectedTone);
          });
        }
      });
    });

    modalEl.querySelector("#pp-modal-replace-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const previewEl = modalEl.querySelector("#pp-modal-preview");
      const previewText = previewEl ? previewEl.innerText.trim() : "";
      const raw = previewText && previewText !== "Type your prompt idea in the chatbox below or type directly here..." ? previewText : getText(inputEl).trim();
      if (!raw) {
        showToast("⚠️ Type your prompt idea first!");
        return;
      }
      void enhanceInPlace(inputEl, raw, selectedTone);
      closeModal();
    });

    modalEl.querySelector("#pp-modal-copy-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const previewEl = modalEl.querySelector("#pp-modal-preview");
      const previewText = previewEl ? previewEl.innerText.trim() : "";
      const raw = previewText && previewText !== "Type your prompt idea in the chatbox below or type directly here..." ? previewText : getText(inputEl).trim();
      if (!raw) { showToast("Enter a prompt first."); return; }
      const masterPrompt = synthesizeLocalPrompt(raw, selectedTone);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(masterPrompt).then(() => {
          showToast("Local template (offline) copied");
        });
      } else {
        showToast("✓ Master prompt compiled!");
      }
    });
  }

  function resolveChatCapsule(input) {
    if (!input) return null;

    // 1. If inside a form with reasonable composer dimensions, use that form
    const form = input.closest("form");
    if (form) {
      const rect = form.getBoundingClientRect();
      if (rect.height >= 24 && rect.height <= 340 && rect.width >= 200) {
        return form;
      }
    }

    // 2. Look for composer or prompt wrapper
    let cur = input.parentElement;
    for (let i = 0; i < 4 && cur && cur !== document.body; i++) {
      const cls = (cur.className || "").toString().toLowerCase();
      const rect = cur.getBoundingClientRect();
      if (rect.height >= 24 && rect.height <= 340 && rect.width >= 200) {
        if (
          cls.includes("composer") ||
          cls.includes("input-area") ||
          cls.includes("chat-input") ||
          cls.includes("prosemirror") ||
          cur.getAttribute("role") === "region"
        ) {
          return cur;
        }
      }
      cur = cur.parentElement;
    }

    // 3. Fallback: immediate parent if it has reasonable size
    if (input.parentElement) {
      const r = input.parentElement.getBoundingClientRect();
      if (r.height >= 24 && r.width >= 200) {
        return input.parentElement;
      }
    }

    return input;
  }

  // Inject sleek unified prompt action dock
  function injectFloatingButton() {
    if (!document.body) return;
    ensureStylesInjected();

    const existing = document.querySelector(".pp-unified-dock, .pp-floating-trigger");
    if (existing) {
      if (document.body.contains(existing._targetInput) && isVisible(existing._targetInput)) {
        positionFloatingButton(existing, existing._targetInput);
        return;
      }
      try { existing.remove(); } catch { /* ignore */ }
    }

    const input = getInput();
    if (!input || !input.parentElement) return;

    const rect = input.getBoundingClientRect();
    if (!rect || rect.width === 0) { setTimeout(injectFloatingButton, 800); return; }

    const dock = document.createElement("div");
    dock.className = "pp-unified-dock";
    dock._targetInput = input;

    const model = getModelContextInfo();

    const activeModelName = latestAnalysis?.modelName || model.name;

    dock.innerHTML = `
      <button type="button" class="pp-dock-btn" id="pp-dock-enhance" title="Compile & Enhance Prompt in-place (${kbdShortcut})">
        <span class="pp-dock-icon">${ICONS.sparkle}</span>
        <span class="pp-dock-label">Enhance</span>
        <kbd class="pp-dock-kbd">${kbdShortcut}</kbd>
      </button>

      <div class="pp-dock-sep"></div>

      <div class="pp-dock-runway" id="pp-dock-runway" title="Tokens visible in this conversation">
        <span class="pp-runway-dot" id="pp-runway-dot"></span>
        <span class="pp-runway-model" id="pp-runway-model">${escapeHtml(activeModelName)}</span>
        <span class="pp-runway-tokens" id="pp-runway-tokens">measuring…</span>
        <span class="pp-runway-pct" id="pp-runway-pct"></span>
      </div>

      <div class="pp-dock-sep"></div>

      <div class="pp-dock-tones">
        ${TONE_OPTIONS.slice(0, 3).map((t) => `<button type="button" class="pp-dock-tone ${selectedTone === t.key ? "active" : ""}" data-tone="${t.key}" title="${t.label} tone">${t.short}</button>`).join("")}
      </div>

      <button type="button" class="pp-dock-studio-btn" id="pp-dock-studio-btn" title="Chat usage, tone and enhance" aria-label="Open panel">
        <span>More</span>
        ${ICONS.chevron}
      </button>
    `;

    document.body.appendChild(dock);
    positionFloatingButton(dock, input);

    // Live typing listener to show instant typed token cost
    const updateTypingTokens = () => {
      const val = getText(input).trim();
      const typedTokens = val.length > 0 ? (window.PromptPlusTokenizer ? window.PromptPlusTokenizer.countTokens(val) : Math.ceil(val.length / 3.8)) : 0;
      const tokEl = dock.querySelector("#pp-runway-tokens");
      if (tokEl) {
        const curLimit = latestAnalysis?.contextLimit || model.maxContext;
        const curUsed = (latestAnalysis?.totalTokens || 0) + typedTokens;
        const curRem = Math.max(0, curLimit - curUsed);
        tokEl.textContent = !latestAnalysis?.contextLimitKnown ? `~${formatK(curUsed)} tokens visible` : typedTokens > 0 ? `${formatK(curRem)} left · +${formatK(typedTokens)} tok` : `${formatK(curRem)} left`;
      }
    };
    input.addEventListener("input", updateTypingTokens);

    setupDraggable(dock);

    // Quick Tone Switcher Handlers
    dock.querySelectorAll(".pp-dock-tone").forEach((toneBtn) => {
      toneBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectedTone = toneBtn.getAttribute("data-tone") || "human";
        dock.querySelectorAll(".pp-dock-tone").forEach((b) => b.classList.remove("active"));
        toneBtn.classList.add("active");

        const tone = TONE_OPTIONS.find((t) => t.key === selectedTone);
        showToast(`Tone: ${tone ? tone.label : selectedTone}`);
      });
    });

    // Primary Enhance Action
    dock.querySelector("#pp-dock-enhance")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dock._hasMoved && dock._hasMoved()) return;
      const raw = getText(input).trim();
      if (raw) {
        void enhanceInPlace(input, raw, selectedTone);
      } else {
        openFloatingModal(input);
      }
    });

    // One opener for the panel. The usage readout above is not a button.
    dock.querySelector("#pp-dock-studio-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFloatingModal(input);
    });

    let rafPending = false;
    const schedulePosition = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (document.body.contains(dock) && document.body.contains(input)) {
          positionFloatingButton(dock, input);
        }
      });
    };

    input.addEventListener("input", schedulePosition);
    input.addEventListener("focus", schedulePosition);
    input.addEventListener("blur", schedulePosition);
    input.addEventListener("keyup", schedulePosition);

    const capsule = resolveChatCapsule(input) || input;
    try {
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => schedulePosition());
        ro.observe(input);
        if (capsule && capsule !== input) ro.observe(capsule);
      }
    } catch {}

    window.addEventListener("scroll", schedulePosition, { passive: true });
    window.addEventListener("resize", schedulePosition, { passive: true });
  }

  function positionFloatingButton(trigger, input) {
    if (!input || !trigger) return;
    if (!document.body.contains(input) || isSidebarElement(input)) {
      trigger.style.setProperty("display", "none", "important");
      return;
    }

    const customPosStr = localStorage.getItem("pp_dock_custom_pos");
    if (customPosStr) {
      try {
        const pos = JSON.parse(customPosStr);
        if (typeof pos.top === "number" && typeof pos.left === "number") {
          const clampedTop = Math.max(8, Math.min(window.innerHeight - 40, pos.top));
          const clampedLeft = Math.max(8, Math.min(window.innerWidth - 220, pos.left));
          trigger.style.removeProperty("right");
          trigger.style.setProperty("top", `${clampedTop}px`, "important");
          trigger.style.setProperty("left", `${clampedLeft}px`, "important");
          trigger.style.setProperty("display", "inline-flex", "important");
          return;
        }
      } catch {}
    }

    const capsule = resolveChatCapsule(input) || input;
    const rect = capsule.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0 || rect.bottom <= 0 || rect.top >= window.innerHeight) {
      trigger.style.setProperty("display", "none", "important");
      return;
    }

    const dockHeight = 30;
    const viewportWidth = window.innerWidth;

    // Ergonomic placement: docked 8px directly above the top-right edge of the chat input
    let top = rect.top - dockHeight - 8;
    if (top < 10) {
      top = rect.top + 8;
    }

    const rightOffset = Math.max(12, Math.min(viewportWidth - 40, viewportWidth - rect.right + 4));

    trigger.style.removeProperty("left");
    trigger.style.setProperty("right", `${Math.round(rightOffset)}px`, "important");
    trigger.style.setProperty("top", `${Math.round(top)}px`, "important");
    trigger.style.setProperty("display", "inline-flex", "important");
  }

  function setupDraggable(trigger) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let moved = false;

    trigger.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("button") || e.target.closest(".pp-dock-btn")) {
        return;
      }
      isDragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = trigger.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      trigger.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        moved = true;
      }
      const newLeft = Math.max(8, Math.min(window.innerWidth - trigger.offsetWidth - 8, initialLeft + dx));
      const newTop = Math.max(8, Math.min(window.innerHeight - trigger.offsetHeight - 8, initialTop + dy));
      trigger.style.removeProperty("right");
      trigger.style.setProperty("left", `${newLeft}px`, "important");
      trigger.style.setProperty("top", `${newTop}px`, "important");
    });

    document.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      trigger.style.transition = "";
      if (moved) {
        const rect = trigger.getBoundingClientRect();
        localStorage.setItem("pp_dock_custom_pos", JSON.stringify({ top: rect.top, left: rect.left }));
      }
    });

    trigger.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      localStorage.removeItem("pp_dock_custom_pos");
      localStorage.removeItem("pp_btn_custom_pos");
      trigger.style.removeProperty("left");
      showToast("✓ Dock position reset to default");
      if (trigger._targetInput) {
        positionFloatingButton(trigger, trigger._targetInput);
      }
    });

    trigger._hasMoved = () => moved;
  }

  // Keyboard shortcut listener:
  // 1. Cmd+Shift+P / Ctrl+Shift+P (global toggle or enhance)
  // 2. Cmd+Enter / Ctrl+Enter (while focused in chat input, matching dock kbd badge)
  document.addEventListener("keydown", (e) => {
    const isCmdShiftP = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "P" || e.key === "p");
    const input = getInput();
    const isFocusedInInput = input && (document.activeElement === input || input.contains(document.activeElement));
    const isCmdEnter = (e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "Enter" && isFocusedInInput;

    if (isCmdShiftP || isCmdEnter) {
      if (modalEl) return; // Handled by modal's own keydown listener
      if (input) {
        const text = getText(input);
        if (text && text.trim()) {
          e.preventDefault();
          e.stopPropagation();
          showToast("⚡ Compiling master prompt in-place...");
          void enhanceInPlace(input, text, selectedTone);
        } else if (isCmdShiftP) {
          e.preventDefault();
          e.stopPropagation();
          openFloatingModal(input);
        }
      }
    }
  }, true);

  // Update Dock UI when new conversation audit runs
  function updateDockRunwayUI(analysis) {
    if (!analysis) return;
    latestAnalysis = analysis;

    const dock = document.querySelector(".pp-unified-dock");
    if (!dock) return;

    const dot = dock.querySelector("#pp-runway-dot");
    const modelEl = dock.querySelector("#pp-runway-model");
    const tokEl = dock.querySelector("#pp-runway-tokens");
    const pctEl = dock.querySelector("#pp-runway-pct");

    const pct = analysis.percentUsed != null ? Math.round(analysis.percentUsed) : 0;
    const remainingK = formatK(analysis.tokensRemaining || 0);

    if (modelEl && analysis.modelName) {
      modelEl.textContent = analysis.modelName;
    }

    if (tokEl) {
      tokEl.textContent = analysis.contextLimitKnown ? `~${remainingK} left` : `~${formatK(analysis.totalTokens || 0)} tokens visible`;
      if (pct >= 80) {
        tokEl.style.color = "#f87171";
      } else if (pct >= 60) {
        tokEl.style.color = "#fbbf24";
      } else {
        tokEl.style.color = "#34d399";
      }
    }

    if (pctEl) {
      pctEl.textContent = analysis.contextLimitKnown ? `~${pct}%` : "";
      pctEl.style.color = pct >= 80 ? "#f87171" : pct >= 60 ? "#fbbf24" : "#94a3b8";
    }

    if (dot) {
      if (pct >= 80) {
        dot.style.background = "#ef4444";
        dot.style.boxShadow = "0 0 8px rgba(239, 68, 68, 0.7)";
      } else if (pct >= 60) {
        dot.style.background = "#f59e0b";
        dot.style.boxShadow = "0 0 8px rgba(245, 158, 11, 0.7)";
      } else {
        dot.style.background = "#10b981";
        dot.style.boxShadow = "0 0 8px rgba(16, 185, 129, 0.7)";
      }
    }

    if (modalEl) {
      const modalRemBadge = modalEl.querySelector("#pp-modal-rem-badge");
      const modalBar = modalEl.querySelector("#pp-modal-runway-bar");
      const modalUsed = modalEl.querySelector("#pp-modal-used-tok");
      const modalTurns = modalEl.querySelector("#pp-modal-turn-count");
      const modalLeft = modalEl.querySelector("#pp-modal-est-msgs");
      const modalBurn = modalEl.querySelector("#pp-modal-burn-badge");

      const color = pct >= 80 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#10b981";

      if (modalRemBadge) {
        modalRemBadge.textContent = analysis.contextLimitKnown ? `~${remainingK} left (~${pct}% used)` : "Visible messages only";
        modalRemBadge.style.color = color;
        modalRemBadge.style.background = `${color}22`;
        modalRemBadge.style.borderColor = `${color}44`;
      }
      if (modalBar) {
        modalBar.style.width = `${Math.min(100, Math.max(3, pct))}%`;
        modalBar.style.background = color;
      }
      if (modalUsed) modalUsed.textContent = formatK(analysis.totalTokens || 0);
      if (modalTurns) modalTurns.textContent = String(analysis.turnCount || 0);
      if (modalLeft) modalLeft.textContent = !analysis.contextLimitKnown ? "—" : `~${analysis.estimatedMessagesLeft || 100}`;
      if (modalBurn && analysis.burnRate) modalBurn.textContent = paceLabel(analysis.burnRate);
    }
  }

  // ---------- Chatbot Adapter & Runway Bridge ----------
  function getActiveAdapter() {
    if (window.PromptPlusChatGPTAdapter && window.PromptPlusChatGPTAdapter.detect()) return window.PromptPlusChatGPTAdapter;
    if (window.PromptPlusClaudeAdapter && window.PromptPlusClaudeAdapter.detect()) return window.PromptPlusClaudeAdapter;
    if (window.PromptPlusGeminiAdapter && window.PromptPlusGeminiAdapter.detect()) return window.PromptPlusGeminiAdapter;
    if (window.PromptPlusDeepSeekAdapter && window.PromptPlusDeepSeekAdapter.detect()) return window.PromptPlusDeepSeekAdapter;
    if (window.PromptPlusGrokAdapter && window.PromptPlusGrokAdapter.detect()) return window.PromptPlusGrokAdapter;
    if (window.PromptPlusPerplexityAdapter && window.PromptPlusPerplexityAdapter.detect()) return window.PromptPlusPerplexityAdapter;

    const bot = detectChatbot();
    if (bot === "chatgpt" && window.PromptPlusChatGPTAdapter) return window.PromptPlusChatGPTAdapter;
    if (bot === "claude" && window.PromptPlusClaudeAdapter) return window.PromptPlusClaudeAdapter;
    if ((bot === "gemini" || bot === "aistudio") && window.PromptPlusGeminiAdapter) return window.PromptPlusGeminiAdapter;
    if (bot === "deepseek" && window.PromptPlusDeepSeekAdapter) return window.PromptPlusDeepSeekAdapter;
    if (bot === "grok" && window.PromptPlusGrokAdapter) return window.PromptPlusGrokAdapter;
    if (bot === "perplexity" && window.PromptPlusPerplexityAdapter) return window.PromptPlusPerplexityAdapter;

    return null;
  }

  function initConversationRunway() {
    const adapter = getActiveAdapter();
    const bot = detectChatbot();

    function runConversationAudit() {
      try {
        let activeModel = { name: "AI Model", limit: 128000, family: "default" };
        let turns = [];

        if (adapter) {
          if (typeof adapter.getActiveModel === "function") {
            activeModel = adapter.getActiveModel();
          }
          if (typeof adapter.getConversationTurns === "function") {
            turns = adapter.getConversationTurns();
          }
        } else {
          const info = getModelContextInfo();
          activeModel = { name: info.name, limit: info.maxContext, family: bot };
        }

        let analysis;
        if (window.PromptPlusTokenizer && typeof window.PromptPlusTokenizer.analyzeConversation === "function") {
          analysis = window.PromptPlusTokenizer.analyzeConversation(turns, activeModel.limit, activeModel.family);
        } else {
          analysis = {
            totalTokens: 0,
            contextLimit: activeModel.limit,
            tokensRemaining: activeModel.limit,
            percentUsed: 0,
            turnCount: turns.length,
            userTokens: 0,
            aiTokens: 0,
            avgTokensPerTurn: 0,
            avgTokensPerExchange: 0,
            estimatedMessagesLeft: Math.floor(activeModel.limit / 800),
            burnRate: "steady",
          };
        }

        analysis.platform = adapter?.name || bot;
        analysis.modelName = activeModel.name;
        analysis.contextLimit = activeModel.limit;
        // Chat-product capacity is not established by an API model limit.
        analysis.contextLimitKnown = false;
        analysis.estimated = true;

        latestAnalysis = analysis;

        // 1. Update In-Place Unified Dock & Modal
        updateDockRunwayUI(analysis);

        // 2. Broadcast to Background Service Worker for extension popup and badge
        if (chrome?.runtime?.sendMessage) {
          chrome.runtime.sendMessage({
            action: "tokenUpdate",
            contextLimitKnown: analysis.contextLimitKnown,
            platform: analysis.platform,
            modelName: analysis.modelName,
            contextLimit: analysis.contextLimit,
            conversationTokens: analysis.totalTokens,
            tokensRemaining: analysis.tokensRemaining,
            percentUsed: analysis.percentUsed,
            turnCount: analysis.turnCount,
            userTokens: analysis.userTokens,
            aiTokens: analysis.aiTokens,
            avgTokensPerTurn: analysis.avgTokensPerTurn,
            avgTokensPerExchange: analysis.avgTokensPerExchange,
            estimatedMessagesLeft: analysis.estimatedMessagesLeft,
            burnRate: analysis.burnRate,
            largestTurnTokens: analysis.largestTurnTokens,
          }).catch(() => {});
        }
      } catch {
        // Suppress audit errors during live streaming DOM changes
      }
    }

    setTimeout(runConversationAudit, 800);
    setTimeout(runConversationAudit, 2200);

    const ObserverClass = typeof MutationObserver !== "undefined" ? MutationObserver : (typeof window !== "undefined" ? window.MutationObserver : null);
    let auditDebounce = null;
    if (ObserverClass && document.body) {
      const conversationObserver = new ObserverClass((records) => {
        if (records.every((record) => {
          const element = record.target.nodeType === 1 ? record.target : record.target.parentElement;
          return element?.closest?.(".pp-unified-dock, .pp-floating-modal");
        })) return;
        if (auditDebounce) clearTimeout(auditDebounce);
        auditDebounce = setTimeout(runConversationAudit, 350);
      });
      conversationObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    window.addEventListener("popstate", () => setTimeout(runConversationAudit, 500));
    window.addEventListener("hashchange", () => setTimeout(runConversationAudit, 500));
  }

  // Observe DOM changes with debounced MutationObserver to re-inject efficiently when new chat views render
  const ObserverClass = typeof MutationObserver !== "undefined" ? MutationObserver : (typeof window !== "undefined" ? window.MutationObserver : null);
  let reinjectTimer = null;
  if (ObserverClass) {
    const domObserver = new ObserverClass(() => {
      if (reinjectTimer) return;
      reinjectTimer = setTimeout(() => {
        reinjectTimer = null;
        const input = getInput();
        if (input && !document.querySelector(".pp-unified-dock")) {
          injectFloatingButton();
        }
      }, 400);
    });

    if (document.body) {
      domObserver.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        if (document.body) domObserver.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  if (document.body) {
    initConversationRunway();
    injectFloatingButton();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      initConversationRunway();
      injectFloatingButton();
    });
  }

  window.addEventListener("focus", () => {
    const input = getInput();
    if (input) injectFloatingButton();
  });

  // ---------- Chrome Runtime Message Handler (Popup & Background Bridge) ----------
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!request || !request.action) return false;

      // 1. Inject Enhanced Prompt from Popup "Use in Active Tab"
      if (request.action === "injectEnhanced") {
        const input = getInput();
        if (input && request.enhanced) {
          showEnhancementPreview(input, getText(input), request.enhanced, "Prompt+ enhancement");
          sendResponse({ success: true, pendingReview: true });
        } else if (request.enhanced) {
          const active = document.activeElement;
          if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT" || active.isContentEditable)) {
            showEnhancementPreview(active, getText(active), request.enhanced, "Prompt+ enhancement");
            sendResponse({ success: true, pendingReview: true });
          } else {
            showToast("⚠️ Could not detect chat input box");
            sendResponse({ success: false, error: "No input field detected" });
          }
        } else {
          sendResponse({ success: false, error: "Empty prompt" });
        }
        return true;
      }

      // 2. Enhance Selected Text from Context Menu
      if (request.action === "enhanceSelection") {
        const raw = request.text || "";
        if (raw.trim()) {
          void enhanceText(raw, selectedTone).then(({ text: enhanced, source }) => {
          const input = getInput();
          if (input) {
            showEnhancementPreview(input, getText(input), enhanced, source);
          } else {
            navigator.clipboard?.writeText(enhanced);
            showToast("✓ Selection enhanced & copied to clipboard!");
          }
          showToast(source);
          sendResponse({ success: true, enhanced });
          }).catch(() => sendResponse({ success: false, error: "Enhancement failed" }));
        } else {
          sendResponse({ success: false, error: "Empty selection" });
        }
        return true;
      }

      // 3. Open Floating Studio Panel via Keyboard Shortcut
      if (request.action === "openEnhancePanel") {
        const input = getInput() || document.activeElement;
        openFloatingModal(input);
        sendResponse({ success: true });
        return true;
      }

      // 4. Retrieve Active Draft Prompt from Current Tab Input
      if (request.action === "getActivePrompt") {
        const input = getInput();
        const text = input ? getText(input).trim() : "";
        sendResponse({ success: true, text });
        return true;
      }

      // 5. Ping query
      if (request.action === "ping") {
        sendResponse({ success: true, bot: detectChatbot(), hasInput: Boolean(getInput()) });
        return true;
      }

      return false;
    });
  }
})();
