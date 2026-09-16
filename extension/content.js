(function () {
  let modalEl = null;
  let selectedTone = "code";
  let userQuota = null;

  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const kbdShortcut = isMac ? "⌘↵" : "Ctrl+↵";

  const ICONS = {
    sparkle: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
    chevron: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
    zap: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    close: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }[c]));
  }

  const TRUSTED_BRIDGE_ORIGINS = new Set([
    "https://prompt-plus-three.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]);

  // Web Platform Session Bridge: Listen for authenticated sessions broadcast by Prompt+ Web Platform
  if (
    location.hostname === "prompt-plus-three.vercel.app" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  ) {
    window.addEventListener("message", (event) => {
      if (!TRUSTED_BRIDGE_ORIGINS.has(event.origin)) return;
      if (event.data && event.data.source === "promptplus_web" && event.data.type === "SESSION_UPDATE") {
        try {
          if (chrome?.runtime?.sendMessage) {
            chrome.runtime.sendMessage({
              action: "saveSessionFromWeb",
              user: event.data.user,
              quota: event.data.quota,
              savedBlocks: event.data.savedBlocks,
            });
          }
        } catch {
          // Ignore background disconnection
        }
      }
    });
  }

  // Fetch initial cached quota
  try {
    if (chrome?.storage?.local) {
      chrome.storage.local.get("pp_web_session", (d) => {
        if (d?.pp_web_session?.quota) {
          userQuota = d.pp_web_session.quota;
        }
      });
    }
  } catch { /* ignore */ }

  function ensureStylesInjected() {
    if (document.getElementById("pp-styles-v2")) return;
    const style = document.createElement("style");
    style.id = "pp-styles-v2";
    style.textContent = `
      .pp-floating-trigger {
        position: fixed !important;
        display: inline-flex !important;
        align-items: center !important;
        box-sizing: border-box !important;
        height: 28px !important;
        border-radius: 9999px !important;
        background: rgba(12, 12, 16, 0.94) !important;
        border: 1px solid rgba(99, 102, 241, 0.38) !important;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45), 0 0 12px rgba(99, 102, 241, 0.22) !important;
        backdrop-filter: blur(20px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif !important;
        z-index: 99999999 !important;
        cursor: pointer !important;
        user-select: none !important;
        transition: width 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                    padding 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                    border-color 0.2s ease,
                    box-shadow 0.2s ease,
                    transform 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
        color: #ffffff !important;
        padding: 3px 6px 3px 4px !important;
        overflow: hidden !important;
      }

      .pp-floating-trigger.pp-idle {
        width: 28px !important;
        padding: 0 !important;
        justify-content: center !important;
        border-color: rgba(99, 102, 241, 0.28) !important;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4), 0 0 8px rgba(99, 102, 241, 0.16) !important;
      }

      .pp-floating-trigger.pp-idle:hover {
        width: auto !important;
        padding: 3px 6px 3px 4px !important;
        border-color: rgba(99, 102, 241, 0.65) !important;
        box-shadow: 0 8px 26px rgba(0, 0, 0, 0.55), 0 0 16px rgba(99, 102, 241, 0.35) !important;
      }

      .pp-floating-trigger:hover {
        transform: translateY(-1px) scale(1.01) !important;
        border-color: rgba(99, 102, 241, 0.7) !important;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.6), 0 0 18px rgba(99, 102, 241, 0.35) !important;
      }

      .pp-floating-trigger:active {
        transform: translateY(0) scale(0.98) !important;
      }

      .pp-trigger-icon {
        width: 20px !important;
        height: 20px !important;
        min-width: 20px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: #ffffff !important;
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35) !important;
        flex-shrink: 0 !important;
      }

      .pp-trigger-content {
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        margin-left: 5px !important;
        white-space: nowrap !important;
        transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.24s cubic-bezier(0.16, 1, 0.3, 1) !important;
        max-width: 320px !important;
        opacity: 1 !important;
      }

      .pp-floating-trigger.pp-idle .pp-trigger-content {
        opacity: 0 !important;
        max-width: 0 !important;
        margin-left: 0 !important;
        pointer-events: none !important;
      }

      .pp-floating-trigger.pp-idle:hover .pp-trigger-content {
        opacity: 1 !important;
        max-width: 320px !important;
        margin-left: 5px !important;
        pointer-events: auto !important;
      }

      .pp-trigger-primary {
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        cursor: pointer !important;
        color: #ffffff !important;
      }
      .pp-trigger-primary:hover .pp-trigger-label {
        color: #e0e7ff !important;
      }

      .pp-trigger-label {
        font-size: 11px !important;
        font-weight: 700 !important;
        letter-spacing: -0.01em !important;
        color: #ffffff !important;
        transition: color 0.15s ease !important;
      }

      .pp-trigger-kbd {
        font-size: 8.5px !important;
        font-family: inherit !important;
        color: #a1a1aa !important;
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        padding: 1px 4px !important;
        border-radius: 3px !important;
        line-height: 1 !important;
      }

      .pp-trigger-sep {
        width: 1px !important;
        height: 12px !important;
        background: rgba(255, 255, 255, 0.14) !important;
        margin: 0 1px !important;
      }

      .pp-trigger-token-badge {
        font-size: 9px !important;
        font-weight: 600 !important;
        padding: 1.5px 5px !important;
        border-radius: 9999px !important;
        background: rgba(255, 255, 255, 0.06) !important;
        color: #a1a1aa !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        letter-spacing: -0.01em !important;
      }

      .pp-trigger-more {
        background: transparent !important;
        border: none !important;
        padding: 2px 4px !important;
        border-radius: 4px !important;
        color: #a1a1aa !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
      }

      .pp-trigger-more:hover {
        color: #ffffff !important;
        background: rgba(255, 255, 255, 0.12) !important;
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
        color: #c7d2fe !important;
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
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        color: #ffffff !important;
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
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  ensureStylesInjected();

  function detectChatbot() {
    const host = location.hostname.toLowerCase();
    if (host.includes("chatgpt") || host.includes("chat.openai") || host.includes("oaistatic")) return "chatgpt";
    if (host.includes("claude.ai") || host.includes("anthropic")) return "claude";
    if (host.includes("gemini.google") || host.includes("bard.google")) return "gemini";
    if (host.includes("aistudio.google")) return "aistudio";
    if (host.includes("deepseek")) return "deepseek";
    if (host.includes("grok") || host.includes("x.ai") || (host.includes("x.com") && location.pathname.includes("grok"))) return "grok";
    if (host.includes("perplexity")) return "perplexity";
    if (host.includes("copilot.microsoft") || (host.includes("bing.com") && location.pathname.includes("chat"))) return "copilot";
    if (host.includes("meta.ai")) return "meta";
    if (host.includes("poe.com")) return "poe";
    if (host.includes("mistral.ai")) return "mistral";
    if (host.includes("huggingface.co/chat")) return "huggingchat";
    if (host.includes("groq.com")) return "groq";
    return "general";
  }

  function isSidebarElement(el) {
    if (!el) return false;
    return Boolean(
      el.closest("aside, nav, [role='navigation'], #sidebar, .sidebar, header, [aria-label*='Search' i], [placeholder*='Search' i], [aria-label*='Notebook' i]")
    );
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
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
        "div[contenteditable='true'][role='textbox']",
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
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (el.isContentEditable) {
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

  function getChatContainer(input) {
    let parent = input.parentElement;
    for (let i = 0; i < 6 && parent; i++) {
      const style = window.getComputedStyle(parent);
      if (
        (parent.tagName === "FORM" ||
          parent.classList.contains("relative") ||
          parent.classList.contains("input-area") ||
          parent.classList.contains("input-area-v2") ||
          style.position === "relative" ||
          style.position === "sticky") &&
        parent.offsetWidth > 280
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return input;
  }

  function showToast(msg) {
    const t = document.createElement("div");
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
      setTimeout(() => t.remove(), 300);
    }, 2800);
  }

  function synthesizeLocalPrompt(userInput, tone = "code") {
    const text = (userInput || "").trim();
    if (!text) return "";
    const cleanInput = text.replace(/^(please|can you|help me|i want to|i need to|how to|write|create|build|fix|generate|make)\s+/i, "");
    const subject = cleanInput.length > 0 ? cleanInput : text;
    const bot = detectChatbot();

    let role = "Senior Subject Matter Expert & Principal Architect";
    let toneStr = "Technically Rigorous, Production-Grade";
    let sec1 = "SPECIFICATIONS & ARCHITECTURAL CONSTRAINTS";
    let sec2 = "IMPLEMENTATION PROTOCOL";
    let antiCliche = "- **STRICT ANTI-CLICHÉ PROTOCOL**: Never use robotic AI buzzwords ('delve into', 'tapestry', 'testament', 'in conclusion', 'as an AI', 'game changer', 'unleash', 'seamlessly').";

    if (tone === "human") {
      role = "Experienced Senior Peer & Pragmatic Thought Partner";
      toneStr = "Authentic, Human-Sounding, Natural Cadence & Zero Fluff";
      sec1 = "CORE GOAL & AUTHENTIC HUMAN CONTEXT";
      sec2 = "PRAGMATIC EXECUTION STEPS";
      antiCliche = "- **STRICT HUMAN VOICE MANDATE**: Write naturally like an experienced human peer. Vary sentence length for organic rhythm. Eliminate preamble ('Certainly! Here is...') and concluding summaries. Explicitly avoid all AI buzzwords and corporate fluff.";
    } else if (tone === "copy") {
      role = "Elite Conversion Copywriter & Brand Strategist";
      toneStr = "High-Conversion, Punchy & Action-Oriented";
      sec1 = "AUDIENCE HOOK & VALUE DIRECTIVES";
      sec2 = "NARRATIVE EXECUTION STEPS";
    } else if (tone === "exec") {
      role = "Senior Management Consultant & Executive Director";
      toneStr = "Concise, Strategic & Metric-Driven";
      sec1 = "STRATEGIC OBJECTIVES & CONSTRAINTS";
      sec2 = "ACTIONABLE ROADMAP & DECISION STEPS";
    } else if (tone === "deep") {
      role = "Lead AI Research Scientist & Deep Logic Reasoner";
      toneStr = "Exhaustive, First-Principles Reasoning";
      sec1 = "CORE HYPOTHESES & LOGICAL CONSTRAINTS";
      sec2 = "STEP-BY-STEP DEDUCTION & VALIDATION";
    }

    if (bot === "claude") {
      return `<role_and_objective>
  <persona>${role}</persona>
  <task>${text}</task>
</role_and_objective>

<specifications>
  <subject>${subject}</subject>
  <tone_profile>${toneStr}</tone_profile>
  <anti_cliche_mandate>${antiCliche.replace("- **STRICT ANTI-CLICHÉ PROTOCOL**: ", "").replace("- **STRICT HUMAN VOICE MANDATE**: ", "")}</anti_cliche_mandate>
</specifications>

<execution_steps>
  <step>1. Analyze objective from first principles.</step>
  <step>2. Provide direct, production-grade output formatted cleanly without meta commentary.</step>
</execution_steps>`;
    }

    return `### ROLE & PERSONA
You are an authoritative ${role}. Execute this task with highest precision:
"${text}"

### ${sec1}
- **Subject**: "${subject}"
- **Tone Profile**: ${toneStr}
${antiCliche}
- **Quality Constraint**: Deliver complete, immediately usable results without placeholders or conversational fluff.

### ${sec2}
1. Analyze core requirements for "${subject}" and anticipate implicit edge cases.
2. Structure output with modular sections, scannable Markdown headers, and concrete code/examples.
3. Validate solution against real-world usability, scalability, and performance.

### DELIVERABLES & OUTPUT FORMAT
- Deliver complete, immediately usable results formatted in clean Markdown.`;
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

  // Open Floating Optimizer Modal
  function openFloatingModal(inputEl) {
    if (modalEl) {
      modalEl.remove();
      modalEl = null;
    }

    const currentVal = getText(inputEl).trim();
    const tokenCount = Math.ceil(currentVal.length / 3.8);
    const modelInfo = getModelContextInfo();
    const freeTokens = Math.max(0, modelInfo.maxContext - tokenCount);
    const freeK = (freeTokens / 1000).toFixed(1);
    const usedPct = Math.min(100, Math.max(1, (tokenCount / modelInfo.maxContext) * 100)).toFixed(2);
    const freePct = (100 - parseFloat(usedPct)).toFixed(1);

    modalEl = document.createElement("div");
    modalEl.className = "pp-floating-modal";

    modalEl.innerHTML = `
      <div class="pp-modal-header">
        <div class="pp-modal-title">
          <span class="pp-trigger-icon" style="width:18px;height:18px;min-width:18px;font-size:10px;">${ICONS.sparkle}</span>
          <span>Prompt+ Studio</span>
          <span class="pp-model-badge" style="color:${modelInfo.color};">
            <span class="pp-status-dot" style="background:${modelInfo.color};"></span>
            ${modelInfo.name}
          </span>
        </div>
        <button type="button" class="pp-modal-close-btn" id="pp-modal-close" aria-label="Close">${ICONS.close}</button>
      </div>

      <!-- Real-Time Token Context Remaining Telemetry Card -->
      <div style="background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.08);border-radius:9px;padding:7px 10px;display:flex;flex-direction:column;gap:5px;">
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:10.5px;">
          <span style="font-weight:700;color:#ffffff;letter-spacing:-0.01em;">Remaining Context</span>
          <span style="font-weight:700;color:#10b981;background:rgba(16,185,129,0.14);padding:1.5px 7px;border-radius:4px;border:1px solid rgba(16,185,129,0.28);">${freeK}K tokens free (${freePct}%)</span>
        </div>
        <div style="width:100%;height:4.5px;border-radius:9999px;background:rgba(255,255,255,0.1);overflow:hidden;">
          <div style="height:100%;border-radius:9999px;background:linear-gradient(90deg,#6366f1 0%,#10b981 100%);width:${Math.max(8, freePct)}%;box-shadow:0 0 8px rgba(16,185,129,0.4);"></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:9.5px;color:#a1a1aa;">
          <span>Prompt Load: ~${tokenCount} tokens</span>
          <span>Max Window: ${(modelInfo.maxContext / 1000).toFixed(0)}K tokens</span>
        </div>
      </div>

      <div class="pp-tone-row">
        <div class="pp-tone-chip ${selectedTone === "human" ? "active" : ""}" data-tone="human">Natural Human</div>
        <div class="pp-tone-chip ${selectedTone === "code" ? "active" : ""}" data-tone="code">Tech Architect</div>
        <div class="pp-tone-chip ${selectedTone === "copy" ? "active" : ""}" data-tone="copy">Conversion Copy</div>
        <div class="pp-tone-chip ${selectedTone === "exec" ? "active" : ""}" data-tone="exec">Executive Brief</div>
        <div class="pp-tone-chip ${selectedTone === "deep" ? "active" : ""}" data-tone="deep">Deep Reasoner</div>
      </div>

      <div class="pp-modal-preview" id="pp-modal-preview">
        ${escapeHtml(currentVal) || "Type your prompt idea in the chatbox below..."}
      </div>

      <div class="pp-modal-actions">
        <button type="button" class="pp-modal-btn-primary" id="pp-modal-replace-btn">
          ${ICONS.zap}
          <span>Optimize & Replace</span>
          <kbd class="pp-trigger-kbd" style="margin-left: 4px; background: rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.2); color: #ffffff;">${kbdShortcut}</kbd>
        </button>
        <button type="button" class="pp-modal-btn-sub" id="pp-modal-copy-btn" title="Copy Master Prompt">
          ${ICONS.copy}
          <span>Copy</span>
        </button>
      </div>
    `;

    document.body.appendChild(modalEl);

    // Position modal right above the input box
    const card = getChatContainer(inputEl) || inputEl;
    const rect = card.getBoundingClientRect();
    const modalHeight = modalEl.offsetHeight || 260;
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
      if (modalEl && !modalEl.contains(e.target) && !e.target.closest(".pp-floating-trigger")) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleModalKeydown, true);
    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 50);

    // Event handlers with stopPropagation to prevent host page cancellation
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
      });
    });

    modalEl.querySelector("#pp-modal-replace-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const raw = getText(inputEl).trim();
      if (!raw) {
        showToast("⚠️ Type your prompt idea in the chat box first!");
        return;
      }
      const masterPrompt = synthesizeLocalPrompt(raw, selectedTone);
      setText(inputEl, masterPrompt);
      showToast("✓ Master prompt compiled & replaced in chat!");
      closeModal();
    });

    modalEl.querySelector("#pp-modal-copy-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const raw = getText(inputEl).trim();
      const masterPrompt = synthesizeLocalPrompt(raw || "Build full stack scalable app", selectedTone);
      navigator.clipboard.writeText(masterPrompt);
      showToast("✓ Copied Master Prompt!");
    });
  }

  function resolveChatCapsule(input) {
    if (!input) return null;
    let cur = input.parentElement;
    let best = input;
    for (let i = 0; i < 8 && cur && cur !== document.body; i++) {
      const tag = cur.tagName.toLowerCase();
      const cls = (cur.className || "").toString().toLowerCase();
      if (
        tag === "input-area-v2" ||
        tag === "form" ||
        tag === "fieldset" ||
        cls.includes("input-area") ||
        cls.includes("chat-input") ||
        cls.includes("composer-parent") ||
        cls.includes("text-input-field") ||
        cls.includes("conversation-compose") ||
        cls.includes("prosemirror-focused") ||
        cls.includes("bottom-composer") ||
        cls.includes("chat-composer") ||
        cur.getAttribute("role") === "region" ||
        cur.offsetWidth > 380
      ) {
        best = cur;
      }
      cur = cur.parentElement;
    }
    return best;
  }

  // Inject sleek floating trigger button
  function injectFloatingButton() {
    if (!document.body) return;
    ensureStylesInjected();

    const existing = document.querySelector(".pp-floating-trigger");
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

    const trigger = document.createElement("div");
    trigger.className = "pp-floating-trigger";
    trigger._targetInput = input;

    const model = getModelContextInfo();
    const initialVal = getText(input).trim();
    const initialTokens = initialVal.length > 0 ? Math.ceil(initialVal.length / 3.8) : 0;
    const initialFreeK = Math.max(0, (model.maxContext - initialTokens) / 1000).toFixed(0);
    const badgeLabel = initialTokens > 0 ? `${initialFreeK}K free · ~${initialTokens} tok` : `${initialFreeK}K free`;

    if (initialTokens === 0) {
      trigger.classList.add("pp-idle");
    }

    trigger.innerHTML = `
      <div class="pp-trigger-icon" title="Prompt+ (Click to enhance or expand)">
        ${ICONS.sparkle}
      </div>
      <div class="pp-trigger-content">
        <div class="pp-trigger-primary" id="pp-trigger-primary" title="Click to enhance prompt in-place">
          <span class="pp-trigger-label">Enhance</span>
          <kbd class="pp-trigger-kbd">${kbdShortcut}</kbd>
        </div>
        <div class="pp-trigger-sep"></div>
        <span class="pp-trigger-token-badge" id="pp-trigger-tok">${badgeLabel}</span>
        <button type="button" class="pp-trigger-more" id="pp-trigger-more" title="Open Studio Modal" aria-label="Open Studio">
          ${ICONS.chevron}
        </button>
      </div>
    `;

    document.body.appendChild(trigger);
    positionFloatingButton(trigger, input);

    // Live typing token count & morph state
    const updateTokens = () => {
      const val = getText(input).trim();
      const tokens = val.length > 0 ? Math.ceil(val.length / 3.8) : 0;
      const m = getModelContextInfo();
      const freeK = Math.max(0, (m.maxContext - tokens) / 1000).toFixed(0);
      const tokBadge = trigger.querySelector("#pp-trigger-tok");
      if (tokBadge) {
        tokBadge.textContent = tokens > 0 ? `${freeK}K free · ~${tokens} tok` : `${freeK}K free`;
      }
      if (tokens === 0) {
        trigger.classList.add("pp-idle");
      } else {
        trigger.classList.remove("pp-idle");
      }
    };
    input.addEventListener("input", updateTokens);
    updateTokens();

    setupDraggable(trigger);

    // Reliable click handlers
    trigger.querySelector("#pp-trigger-more")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFloatingModal(input);
    });

    trigger.querySelector("#pp-trigger-primary")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (trigger._hasMoved && trigger._hasMoved()) return;
      const raw = getText(input).trim();
      if (raw) {
        const masterPrompt = synthesizeLocalPrompt(raw, selectedTone);
        setText(input, masterPrompt);
        showToast("✓ Prompt enhanced in-place!");
      } else {
        openFloatingModal(input);
      }
    });

    // Outer trigger click fallback (e.g. clicking the icon or when idle)
    trigger.addEventListener("click", (e) => {
      if (e.target.closest("#pp-trigger-more") || e.target.closest("#pp-trigger-primary")) return;
      e.preventDefault();
      e.stopPropagation();
      if (trigger._hasMoved && trigger._hasMoved()) return;
      const raw = getText(input).trim();
      if (trigger.classList.contains("pp-idle") || !raw) {
        openFloatingModal(input);
      } else {
        const masterPrompt = synthesizeLocalPrompt(raw, selectedTone);
        setText(input, masterPrompt);
        showToast("✓ Prompt enhanced in-place!");
      }
    });

    let rafPending = false;
    const schedulePosition = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (document.body.contains(trigger) && document.body.contains(input)) {
          positionFloatingButton(trigger, input);
        }
      });
    };

    // Dynamic Text Field Observers: Follows the chatbot input as it grows, shrinks, or moves
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

    // Check if user has saved a custom dragged position
    const customPosStr = localStorage.getItem("pp_btn_custom_pos");
    if (customPosStr) {
      try {
        const pos = JSON.parse(customPosStr);
        if (typeof pos.top === "number" && typeof pos.left === "number") {
          const clampedTop = Math.max(8, Math.min(window.innerHeight - 40, pos.top));
          const clampedLeft = Math.max(8, Math.min(window.innerWidth - 140, pos.left));
          trigger.style.removeProperty("right");
          trigger.style.setProperty("top", `${clampedTop}px`, "important");
          trigger.style.setProperty("left", `${clampedLeft}px`, "important");
          trigger.style.setProperty("display", "inline-flex", "important");
          return;
        }
      } catch {}
    }

    // Find the full outermost active prompt capsule
    const capsule = resolveChatCapsule(input) || input;
    const rect = capsule.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0 || rect.top < 0) {
      trigger.style.setProperty("display", "none", "important");
      return;
    }

    const triggerHeight = 28;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Ergonomic vertical placement with clean 12px separation
    let top = 0;
    if (rect.bottom + triggerHeight + 18 < viewportHeight) {
      top = rect.bottom + 12;
    } else {
      top = rect.top - triggerHeight - 12;
    }

    if (top < 10) top = 10;
    if (top + triggerHeight > viewportHeight - 10) top = viewportHeight - triggerHeight - 10;

    // Anchor to right edge of capsule so morph expansions expand naturally to the left
    const rightOffset = Math.max(16, Math.min(viewportWidth - 36, viewportWidth - rect.right + 6));

    trigger.style.removeProperty("left");
    trigger.style.setProperty("right", `${Math.round(rightOffset)}px`, "important");
    trigger.style.setProperty("top", `${Math.round(top)}px`, "important");
    trigger.style.setProperty("display", "inline-flex", "important");
  }

  // Draggable support for floating button
  function setupDraggable(trigger) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let moved = false;

    trigger.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
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
        localStorage.setItem("pp_btn_custom_pos", JSON.stringify({ top: rect.top, left: rect.left }));
      }
    });

    // Double click resets position to default anchor
    trigger.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      localStorage.removeItem("pp_btn_custom_pos");
      trigger.style.removeProperty("left");
      showToast("✓ Button position reset to default");
      if (trigger._targetInput) {
        positionFloatingButton(trigger, trigger._targetInput);
      }
    });

    trigger._hasMoved = () => moved;
  }

  // Keyboard shortcut listener: Cmd+Shift+P / Ctrl+Shift+P to enhance in-place
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "P" || e.key === "p")) {
      e.preventDefault();
      const input = getInput();
      if (input) {
        const text = getText(input);
        if (text && text.trim()) {
          showToast("⚡ Compiling master prompt in-place...");
          const master = synthesizeLocalPrompt(text, selectedTone);
          setText(input, master);
          showToast("✓ Prompt optimized in-place!");
        } else {
          openFloatingModal(input);
        }
      }
    }
  });

  // Observe DOM changes with debounced MutationObserver to re-inject efficiently when new chat views render
  let reinjectTimer = null;
  const domObserver = new MutationObserver(() => {
    if (reinjectTimer) return;
    reinjectTimer = setTimeout(() => {
      reinjectTimer = null;
      const input = getInput();
      if (input && !document.querySelector(".pp-floating-trigger")) {
        injectFloatingButton();
      }
    }, 400);
  });

  if (document.body) {
    domObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      domObserver.observe(document.body, { childList: true, subtree: true });
    });
  }

  window.addEventListener("focus", () => {
    const input = getInput();
    if (input) injectFloatingButton();
  });
})();
