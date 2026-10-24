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
    close: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    transfer: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`
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
        height: 36px !important;
        padding: 0 6px 0 5px !important;
        gap: 6px !important;
        border-radius: 9999px !important;
        background: rgba(10, 13, 20, 0.94) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
        backdrop-filter: blur(24px) saturate(190%) !important;
        -webkit-backdrop-filter: blur(24px) saturate(190%) !important;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif !important;
        z-index: 99999999 !important;
        user-select: none !important;
        color: #f4f4f5 !important;
        font-size: 11px !important;
        letter-spacing: -0.01em !important;
        transition: border-color 0.2s ease, box-shadow 0.2s ease,
                    transform 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }

      .pp-unified-dock:hover,
      .pp-floating-trigger:hover {
        border-color: rgba(34, 211, 238, 0.5) !important;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(6, 182, 212, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
      }

      /* One filled action; the rest are quiet ghosts, so the dock has hierarchy. */
      .pp-dock-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        height: 26px !important;
        padding: 0 11px 0 9px !important;
        border-radius: 9999px !important;
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #06b6d4 100%) !important;
        border: 1px solid rgba(255, 255, 255, 0.35) !important;
        color: #ffffff !important;
        cursor: pointer !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        line-height: 1 !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45),
                    0 3px 14px rgba(124, 58, 237, 0.45) !important;
        transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease, filter 0.15s ease !important;
        flex-shrink: 0 !important;
      }

      .pp-dock-btn:hover {
        filter: brightness(1.1) !important;
        transform: translateY(-1px) !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65),
                    0 6px 22px rgba(139, 92, 246, 0.6) !important;
      }

      .pp-dock-btn:active {
        transform: translateY(0.5px) scale(0.985) !important;
        filter: brightness(0.97) !important;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3),
                    0 1px 4px rgba(124, 58, 237, 0.3) !important;
      }

      .pp-dock-btn:focus-visible {
        outline: 2px solid rgba(168, 85, 247, 0.9) !important;
        outline-offset: 2px !important;
      }

      .pp-dock-icon {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 13px !important;
        height: 13px !important;
      }

      /* Dark-ink chip, so the shortcut reads as part of the button it sits in. */
      .pp-dock-kbd {
        font-size: 9px !important;
        padding: 2px 4px !important;
        border-radius: 5px !important;
        background: rgba(4, 20, 28, 0.16) !important;
        border: 1px solid rgba(4, 20, 28, 0.16) !important;
        color: #04141c !important;
        opacity: 0.82 !important;
        line-height: 1 !important;
        font-weight: 700 !important;
      }

      .pp-dock-sep {
        width: 1px !important;
        height: 16px !important;
        background: rgba(255, 255, 255, 0.1) !important;
        flex-shrink: 0 !important;
      }

      .pp-dock-runway {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 0 2px !important;
        height: 26px !important;
        cursor: default !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
      }

      .pp-runway-dot {
        width: 6px !important;
        height: 6px !important;
        border-radius: 50% !important;
        background: #34d399 !important;
        box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.14) !important;
        flex-shrink: 0 !important;
      }

      .pp-runway-model {
        font-size: 10.5px !important;
        font-weight: 600 !important;
        color: rgba(244, 244, 245, 0.86) !important;
      }

      .pp-runway-tokens {
        font-size: 10px !important;
        font-weight: 600 !important;
        color: #67e8f9 !important;
      }

      .pp-runway-pct {
        font-size: 9.5px !important;
        font-weight: 700 !important;
        color: rgba(244, 244, 245, 0.5) !important;
      }

      /* Tone switches read as one control rather than three loose labels. */
      .pp-dock-tones {
        display: inline-flex !important;
        align-items: center !important;
        gap: 2px !important;
        padding: 2px !important;
        border-radius: 9999px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        flex-shrink: 0 !important;
      }

      .pp-dock-tone {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        height: 20px !important;
        padding: 0 8px !important;
        border-radius: 9999px !important;
        background: transparent !important;
        border: 1px solid transparent !important;
        color: rgba(244, 244, 245, 0.62) !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        line-height: 1 !important;
        cursor: pointer !important;
        transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease !important;
      }

      .pp-dock-tone:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #ffffff !important;
      }

      .pp-dock-tone.active {
        background: rgba(6, 182, 212, 0.22) !important;
        border-color: rgba(34, 211, 238, 0.45) !important;
        color: #67e8f9 !important;
      }

      .pp-dock-ghost-btn,
      .pp-dock-studio-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
        height: 26px !important;
        padding: 0 9px !important;
        border-radius: 9999px !important;
        background: transparent !important;
        border: 1px solid transparent !important;
        color: rgba(244, 244, 245, 0.66) !important;
        font-size: 10.5px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease !important;
        flex-shrink: 0 !important;
      }

      .pp-dock-ghost-btn:hover,
      .pp-dock-studio-btn:hover {
        background: rgba(255, 255, 255, 0.08) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
        color: #ffffff !important;
      }

      /* Context menu. The dock lives on the composer's bottom edge, so this opens upward. */
      .pp-dock-menu {
        position: absolute !important;
        bottom: calc(100% + 8px) !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 272px !important;
        max-width: calc(100vw - 24px) !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
        padding: 10px !important;
        border-radius: 14px !important;
        background: rgba(12, 12, 16, 0.97) !important;
        border: 1px solid rgba(6, 182, 212, 0.4) !important;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7) !important;
        backdrop-filter: blur(20px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(160%) !important;
        z-index: 100000000 !important;
        font-size: 11px !important;
        text-align: left !important;
      }

      .pp-dock-menu[hidden] {
        display: none !important;
      }

      .pp-dock-menu-title {
        margin: 0 !important;
        font-size: 9.5px !important;
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
        color: rgba(244, 244, 245, 0.45) !important;
      }

      .pp-dock-menu-status {
        margin: 0 !important;
        color: rgba(244, 244, 245, 0.72) !important;
        line-height: 1.5 !important;
      }

      .pp-dock-menu-note {
        margin: 0 !important;
        color: rgba(244, 244, 245, 0.4) !important;
        line-height: 1.45 !important;
      }

      .pp-dock-menu-item {
        display: flex !important;
        align-items: center !important;
        width: 100% !important;
        min-height: 30px !important;
        padding: 0 10px !important;
        border-radius: 9px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        color: #f4f4f5 !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        font-family: inherit !important;
        text-align: left !important;
        cursor: pointer !important;
        transition: background 0.12s ease, border-color 0.12s ease !important;
      }

      .pp-dock-menu-item:hover:not([disabled]) {
        background: rgba(6, 182, 212, 0.16) !important;
        border-color: rgba(34, 211, 238, 0.4) !important;
      }

      .pp-dock-menu-item:focus-visible {
        outline: 2px solid rgba(103, 232, 249, 0.9) !important;
        outline-offset: 1px !important;
      }

      .pp-dock-menu-item[disabled] {
        opacity: 0.42 !important;
        cursor: default !important;
      }

      .pp-dock-menu-item.primary {
        background: linear-gradient(180deg, #22d3ee 0%, #0891b2 100%) !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
        color: #04141c !important;
      }

      /* Motion here is decoration, so it yields to the user's setting. */
      @media (prefers-reduced-motion: reduce) {
        .pp-unified-dock,
        .pp-floating-trigger,
        .pp-dock-btn,
        .pp-dock-tone,
        .pp-dock-ghost-btn,
        .pp-dock-studio-btn,
        .pp-dock-menu-item {
          transition: none !important;
        }
      }

      /* Floating Modal Studio */
      .pp-floating-modal {
        position: fixed !important;
        z-index: 100000000 !important;
        width: 380px !important;
        max-width: calc(100vw - 32px) !important;
        background: rgba(12, 12, 16, 0.96) !important;
        border: 1px solid rgba(6, 182, 212, 0.45) !important;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(6, 182, 212, 0.25) !important;
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
        background: rgba(6, 182, 212, 0.25) !important;
        border-color: rgba(6, 182, 212, 0.65) !important;
        color: #67e8f9 !important;
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.25) !important;
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
      .pp-modal-preview:empty::before {
        content: attr(data-placeholder);
        color: #71717a !important;
        pointer-events: none !important;
      }

      .pp-modal-actions {
        display: flex !important;
        gap: 6px !important;
      }

      .pp-modal-btn-primary {
        flex: 1 !important;
        height: 36px !important;
        border-radius: 8px !important;
        background: linear-gradient(180deg, #06b6d4 0%, #0e7490 100%) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        color: #04141c !important;
        font-size: 11.5px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4) !important;
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
      /* Host pages routinely kill outlines; the panel must keep a visible focus ring. */
      #pp-enhancement-preview button:focus-visible {
        outline: 2px solid #67e8f9 !important;
        outline-offset: 2px !important;
      }
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

  // ---------- Chat context handoff ----------
  // One saved conversation, reused on another chatbot. The saved copy holds only
  // text an adapter could read from the page, so attachments never travel.
  const CONTEXT_KEY = "pp_chat_context_v1";
  let savedContext = null;

  function loadSavedContext(cb) {
    try {
      chrome.storage.local.get(CONTEXT_KEY, (res) => {
        savedContext = !chrome.runtime.lastError && res && res[CONTEXT_KEY] ? res[CONTEXT_KEY] : null;
        cb(savedContext);
      });
    } catch {
      cb(null);
    }
  }

  function saveChatContext(ctx, cb) {
    try {
      chrome.storage.local.set({ [CONTEXT_KEY]: ctx }, () => {
        if (chrome.runtime.lastError) {
          cb(chrome.runtime.lastError.message || "storage unavailable");
          return;
        }
        savedContext = ctx;
        cb(null);
      });
    } catch (err) {
      cb(err && err.message ? err.message : "storage unavailable");
    }
  }

  function clearSavedContext(cb) {
    try {
      chrome.storage.local.remove(CONTEXT_KEY, () => { savedContext = null; cb(); });
    } catch {
      savedContext = null;
      cb();
    }
  }

  function buildContextText(ctx) {
    const when = new Date(ctx.savedAt).toLocaleString();
    const head =
      "Prompt+ chat context\n" +
      `From ${ctx.platformName} — ${ctx.turns.length} visible message${ctx.turns.length === 1 ? "" : "s"}, saved ${when}\n` +
      "Text visible in that tab only. Attachments and files are not included.";
    const body = ctx.turns
      .map((t) => `${t.role === "user" ? "Me" : "Assistant"}: ${String(t.text).trim()}`)
      .join("\n\n");
    return `${head}\n\n---\n\n${body}`;
  }

  const turnLabel = (n) => `${n} visible message${n === 1 ? "" : "s"}`;

  function readVisibleTurns() {
    const adapter = getActiveAdapter();
    const turns = adapter && typeof adapter.getConversationTurns === "function" ? adapter.getConversationTurns() : [];
    return (Array.isArray(turns) ? turns : []).filter((t) => t && typeof t.text === "string" && t.text.trim());
  }

  // What the dock, the popup and the review panel all call the chat you are on.
  // Taken from the chat family rather than the live audit, so a context saved
  // before the first audit and one saved after it describe themselves the same way.
  function chatPlatformLabel() {
    const info = getModelContextInfo();
    return (info && info.name) || (latestAnalysis && latestAnalysis.modelName) || "This chat";
  }

  function saveThisChatContext(cb) {
    const turns = readVisibleTurns();
    if (!turns.length) {
      cb({ ok: false, reason: "No visible messages on this page." });
      return;
    }
    const ctx = { turns, platformName: chatPlatformLabel(), savedAt: Date.now() };
    saveChatContext(ctx, (error) => cb(error ? { ok: false, reason: error } : { ok: true, ctx }));
  }

  // One review step for every handoff, whether it starts in the dock or the popup:
  // the page's own draft on the left, the saved conversation on the right.
  function openContextTransfer(input, saved) {
    if (!input || !saved || !Array.isArray(saved.turns) || !saved.turns.length) return false;
    showEnhancementPreview(
      input,
      getText(input),
      buildContextText(saved),
      `Saved context from ${saved.platformName} · ${turnLabel(saved.turns.length)}`,
      {
        title: "Review context transfer",
        acceptLabel: "Insert context",
        appliedTitle: "Context inserted",
        undoneTitle: "Context insert undone",
        originalLabel: "Your draft",
        enhancedLabel: "Context to insert",
      }
    );
    return true;
  }

  // The popup writes the same key, so a save there must show up in an open dock menu.
  try {
    chrome.storage.onChanged?.addListener((changes, area) => {
      if (area === "local" && changes[CONTEXT_KEY]) savedContext = changes[CONTEXT_KEY].newValue || null;
    });
  } catch { /* storage unavailable */ }

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

  // Non-modal review panel. It never contains or traps focus: Tab and Shift+Tab
  // walk through it and back into the host page normally, the host stays
  // interactive, and Tab never applies anything. role="dialog" without
  // aria-modal is the non-modal form of dialog, so aria-modal and focus
  // containment are deliberately omitted here.
  let closeEnhancementPreview = null;
  // One review renderer for every insert path, so the diff, token estimate and
  // guarded Undo behave identically whether a model or a saved context filled it.
  const REVIEW_LABELS = {
    title: "Review enhancement",
    acceptLabel: "Apply enhancement",
    appliedTitle: "Enhancement applied",
    undoneTitle: "Enhancement undone",
    originalLabel: "Original",
    enhancedLabel: "Enhanced",
  };

  function showEnhancementPreview(input, original, enhanced, source, labels) {
    const copy = { ...REVIEW_LABELS, ...(labels || {}) };
    closeEnhancementPreview?.();
    // Escape/dismiss returns focus to whatever held it before the panel opened.
    const previouslyFocused = document.activeElement;
    const panel = document.createElement("section");
    panel.id = "pp-enhancement-preview";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", copy.title);
    panel.setAttribute("aria-keyshortcuts", "Escape");
    panel.tabIndex = -1;
    Object.assign(panel.style, {
      position: "fixed", bottom: "90px", right: "16px", width: "min(520px, calc(100vw - 32px))",
      maxHeight: "75vh", overflow: "auto", padding: "18px 20px", borderRadius: "18px",
      background: "rgba(13, 17, 26, 0.96)", color: "#f4f4f5",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: "0 24px 64px rgba(0, 0, 0, 0.75), 0 0 24px rgba(6, 182, 212, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      zIndex: "100000002", font: "12.5px/1.55 -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif"
    });
    const beforeTokens = window.PromptPlusTokenizer.countTokens(original);
    const afterTokens = window.PromptPlusTokenizer.countTokens(enhanced);
    const delta = afterTokens - beforeTokens;
    const diff = highlight(original, enhanced);
    // The key is part of the text, not just the colour: red/green alone is not readable.
    const legend = diff.changed
      ? `<p id="pp-preview-legend" style="margin:4px 0 10px;font-size:11px;color:#94a3b8">Key:
           <span style="background:rgba(239,68,68,0.2);color:#fca5a5;border:1px solid rgba(239,68,68,0.3);border-radius:4px;padding:1px 5px">Removed</span>
           <span style="background:rgba(16,185,129,0.2);color:#86efac;border:1px solid rgba(16,185,129,0.3);border-radius:4px;padding:1px 5px">Added</span>
         </p>`
      : "";
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:7px;">
          <span style="width:18px;height:18px;border-radius:6px;background:linear-gradient(135deg,#06b6d4,#0e7490);display:inline-flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 2px 8px rgba(6,182,212,0.35);">${ICONS.sparkle}</span>
          <strong style="font-size:15px;letter-spacing:-0.01em;color:#fff;">${copy.title}</strong>
        </div>
        <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:9999px;background:rgba(6,182,212,0.14);border:1px solid rgba(6,182,212,0.3);color:#67e8f9;">${escapeHtml(source)}</span>
      </div>
      <p id="pp-preview-tokens" style="margin:4px 0 10px;font-size:11.5px;color:#94a3b8;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">Estimated tokens: <span style="color:#e2e8f0;font-weight:600;">${beforeTokens}</span> → <span style="color:#22d3ee;font-weight:700;">${afterTokens}</span> (<span style="color:${delta <= 0 ? "#34d399" : "#fbbf24"};font-weight:600;">${delta > 0 ? "+" : ""}${delta}</span>)</p>
      ${legend}
      <div style="max-height:42vh;overflow:auto;display:flex;flex-direction:column;gap:10px;padding-right:2px;">
        <div style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px;">
          <p style="font-weight:700;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">${copy.originalLabel}</p>
          <div style="white-space:pre-wrap;overflow-wrap:anywhere;color:#cbd5e1;font-size:12px;line-height:1.5;" data-preview="original">${diff.before}</div>
        </div>
        <div style="background:rgba(6,182,212,0.04);border:1px solid rgba(6,182,212,0.2);border-radius:10px;padding:10px 12px;box-shadow:inset 0 0 16px rgba(6,182,212,0.03);">
          <p style="font-weight:700;font-size:11px;color:#22d3ee;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">${copy.enhancedLabel}</p>
          <div style="white-space:pre-wrap;overflow-wrap:anywhere;color:#f1f5f9;font-size:12px;line-height:1.5;" data-preview="enhanced">${diff.after}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">
        <button type="button" id="pp-preview-accept" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 16px;border-radius:9999px;background:linear-gradient(180deg,#22d3ee 0%,#0891b2 100%);color:#04141c;font-weight:700;font-size:12px;border:1px solid rgba(255,255,255,0.3);box-shadow:0 4px 14px rgba(6,182,212,0.4);cursor:pointer;transition:transform 0.15s ease;">
          <span>${copy.acceptLabel}</span>
          <kbd style="font-size:9px;padding:1px 4px;border-radius:4px;background:rgba(4,20,28,0.2);color:#04141c;font-weight:700;">↵</kbd>
        </button>
        <button type="button" id="pp-preview-keep" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 14px;border-radius:9999px;background:rgba(255,255,255,0.07);color:#f1f5f9;font-weight:600;font-size:12px;border:1px solid rgba(255,255,255,0.1);cursor:pointer;transition:background 0.15s ease;">
          <span>Keep original</span>
          <kbd style="font-size:9px;padding:1px 4px;border-radius:4px;background:rgba(255,255,255,0.1);color:#94a3b8;">Esc</kbd>
        </button>
      </div>`;
    const close = () => {
      document.removeEventListener("keydown", onKey, true);
      panel.removeEventListener("keydown", stopPanelKeys);
      panel.remove();
      closeEnhancementPreview = null;
      if (previouslyFocused && previouslyFocused.isConnected && typeof previouslyFocused.focus === "function") previouslyFocused.focus();
      else if (input.isConnected) input.focus();
    };
    // Host composers normalise whitespace (a contenteditable turns blank lines
    // into paragraphs), so Undo is guarded against what the composer really holds
    // after our write, not against the string we asked it to hold.
    let applied = enhanced;
    const accept = () => {
      if (!input.isConnected || getText(input) !== original) {
        close();
        showToast("Your input changed. Review your latest text again before applying.");
        return;
      }
      setText(input, enhanced);
      applied = getText(input);
      showApplied();
      showToast(copy.appliedTitle);
    };
    const undo = () => {
      close();
      if (!input.isConnected || getText(input) !== applied) {
        showToast("Your input changed. Undo skipped to protect your edits.");
        return;
      }
      setText(input, original);
      showToast(copy.undoneTitle);
    };
    function showApplied() {
      panel.setAttribute("aria-label", copy.appliedTitle);
      panel.innerHTML = `
        <strong style="font-size:16px">${copy.appliedTitle}</strong>
        <p style="color:#cbd5e1;margin:6px 0">${escapeHtml(source)}</p>
        <div style="display:flex;gap:12px;margin-top:16px">
          <button type="button" id="pp-preview-undo" style="padding:8px 14px;border-radius:8px;background:#06b6d4;color:#04141c">Undo</button>
          <button type="button" id="pp-preview-done" style="padding:8px 14px;border-radius:8px;background:#334155;color:#fff">Done · Esc</button>
        </div>`;
      panel.querySelector("#pp-preview-undo").addEventListener("click", undo);
      panel.querySelector("#pp-preview-done").addEventListener("click", close);
      panel.querySelector("#pp-preview-undo").focus();
    }
    // The only shortcut the preview owns is Escape (shown on the buttons above).
    // Tab and Shift+Tab are left alone so they move focus normally.
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    };
    // A focused Apply button must not look like a composer submit to the host app.
    const stopPanelKeys = (event) => { event.stopPropagation(); };
    panel.querySelector("#pp-preview-accept").addEventListener("click", accept);
    panel.querySelector("#pp-preview-keep").addEventListener("click", close);
    document.body.appendChild(panel);
    document.addEventListener("keydown", onKey, true);
    panel.addEventListener("keydown", stopPanelKeys);
    closeEnhancementPreview = close;
    panel.focus();
    panel.querySelector("#pp-preview-accept")?.focus();
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
          <span class="pp-dock-icon" style="width:16px;height:16px;background:linear-gradient(135deg,#06b6d4,#0e7490);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;">${ICONS.sparkle}</span>
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

      <div class="pp-modal-preview" id="pp-modal-preview" contenteditable="true" spellcheck="false" data-placeholder="Type prompt idea in chatbox or directly here...">${escapeHtml(currentVal)}</div>

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

  // The chat box, not just the input. Some hosts wrap the editable area alone and keep
  // the toolbar — or an attachment tray — in a sibling below it, so the input's own
  // parent stops well above the composer. Walk up while the node is still composer
  // sized and take the lowest one that is drawn as a box of its own; the dock then
  // lands under the whole composer instead of on top of the input or the attachments.
  function resolveComposerBox(input) {
    if (!input) return null;
    const inputRect = input.getBoundingClientRect();
    let fallback = resolveChatCapsule(input) || input;
    let box = null;
    let cur = input.parentElement;
    for (let i = 0; i < 6 && cur && cur !== document.body; i++) {
      const rect = cur.getBoundingClientRect();
      if (rect.height < 24 || rect.height > 400 || rect.width < Math.max(200, inputRect.width * 0.9)) break;
      fallback = cur;
      const style = window.getComputedStyle(cur);
      const drawnBox =
        style.borderRadius !== "0px" ||
        style.borderBottomWidth !== "0px" ||
        !/^(transparent|rgba\(0,\s*0,\s*0,\s*0\))$/.test(style.backgroundColor);
      if (drawnBox) box = cur;
      cur = cur.parentElement;
    }
    return box || fallback;
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
        <span class="pp-dock-label">Enhance Prompt</span>
        <kbd class="pp-dock-kbd">${kbdShortcut}</kbd>
      </button>

      <div class="pp-dock-sep"></div>

      <button type="button" class="pp-dock-ghost-btn" id="pp-dock-context-btn" aria-haspopup="true" aria-expanded="false" title="Save this chat's context, or load context saved from another chatbot">
        <span class="pp-dock-icon">${ICONS.transfer}</span>
        <span class="pp-dock-label">Context</span>
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

      <div class="pp-dock-menu" id="pp-dock-menu" role="group" aria-label="Chat context" hidden></div>
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

    // ---------- Chat context: save this chat, load it into another chatbot ----------
    const contextMenu = dock.querySelector("#pp-dock-menu");
    const contextBtn = dock.querySelector("#pp-dock-context-btn");
    let contextMenuOpen = false;

    const closeContextMenu = () => {
      if (!contextMenuOpen) return;
      contextMenuOpen = false;
      contextMenu.hidden = true;
      contextBtn.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", onContextOutsideClick, true);
      document.removeEventListener("keydown", onContextMenuKey, true);
    };

    function onContextOutsideClick(event) {
      if (!contextMenu.contains(event.target) && !contextBtn.contains(event.target)) closeContextMenu();
    }

    function onContextMenuKey(event) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      closeContextMenu();
      contextBtn.focus();
    }

    const renderContextMenu = () => {
      const turns = readVisibleTurns();
      const saved = savedContext;
      contextMenu.innerHTML = `
        <p class="pp-dock-menu-title">Chat context</p>
        <p class="pp-dock-menu-status">This chat: ${escapeHtml(chatPlatformLabel())} · ${turns.length ? turnLabel(turns.length) : "no visible messages"}</p>
        <button type="button" class="pp-dock-menu-item primary" id="pp-ctx-save" ${turns.length ? "" : "disabled"}>Save this chat's context</button>
        <p class="pp-dock-menu-status">${saved ? `Saved: ${escapeHtml(saved.platformName)} · ${turnLabel(saved.turns.length)} · ${escapeHtml(new Date(saved.savedAt).toLocaleString())}` : "Nothing saved yet."}</p>
        <button type="button" class="pp-dock-menu-item" id="pp-ctx-load" ${saved ? "" : "disabled"}>Insert saved context here</button>
        ${saved ? `<button type="button" class="pp-dock-menu-item" id="pp-ctx-clear">Clear saved context</button>` : ""}
        <p class="pp-dock-menu-note">Only text visible in the page is copied — attachments and files are not. Saved in this browser.</p>
      `;

      contextMenu.querySelector("#pp-ctx-save")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        saveThisChatContext((result) => {
          if (!result.ok) {
            showToast(`Could not save context: ${result.reason}`);
            return;
          }
          showToast(`Saved ${turnLabel(result.ctx.turns.length)} from ${result.ctx.platformName}`);
          renderContextMenu();
        });
      });

      contextMenu.querySelector("#pp-ctx-load")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const saved = savedContext;
        if (!saved) return;
        closeContextMenu();
        openContextTransfer(input, saved);
      });

      contextMenu.querySelector("#pp-ctx-clear")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearSavedContext(() => {
          showToast("Saved context cleared");
          renderContextMenu();
        });
      });
    };

    const openContextMenu = () => {
      contextMenuOpen = true;
      renderContextMenu();
      contextMenu.hidden = false;
      contextBtn.setAttribute("aria-expanded", "true");
      // The dock sits on the composer's bottom edge, so open upward unless that
      // would push the panel off screen.
      contextMenu.style.removeProperty("bottom");
      contextMenu.style.removeProperty("top");
      const flipDown = contextMenu.getBoundingClientRect().top < 8;
      contextMenu.style.setProperty("bottom", flipDown ? "auto" : "calc(100% + 8px)", "important");
      contextMenu.style.setProperty("top", flipDown ? "calc(100% + 8px)" : "auto", "important");
      // Another tab may have saved a context after this page loaded.
      loadSavedContext(() => { if (contextMenuOpen) renderContextMenu(); });
      document.addEventListener("click", onContextOutsideClick, true);
      document.addEventListener("keydown", onContextMenuKey, true);
    };

    contextBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (contextMenuOpen) closeContextMenu();
      else openContextMenu();
    });

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

    const box = resolveComposerBox(input) || input;
    try {
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => schedulePosition());
        ro.observe(input);
        if (box && box !== input) ro.observe(box);
      }
    } catch {}

    window.addEventListener("scroll", schedulePosition, { capture: true, passive: true });
    window.addEventListener("resize", schedulePosition, { passive: true });
  }

  function positionFloatingButton(trigger, input) {
    if (!input || !trigger) return;
    if (!document.body.contains(input) || isSidebarElement(input)) {
      trigger.style.setProperty("display", "none", "important");
      return;
    }

    const box = resolveComposerBox(input) || input;
    const rect = box.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0 || rect.bottom <= 0 || rect.top >= window.innerHeight) {
      trigger.style.setProperty("display", "none", "important");
      return;
    }

    const dockHeight = 36;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // One fixed home: the dock rides just under the composer's bottom edge,
    // horizontally centred. The host's own controls sit at the composer's left and
    // right edges and its text above, so below the box is the one strip that never
    // covers any of them. There is no drag and no remembered position.
    trigger.style.removeProperty("right");
    trigger.style.setProperty("display", "inline-flex", "important");

    const dockWidth = trigger.offsetWidth || 320;
    // Align with the composer's bottom-right (matching ChatGPT Image 2 reference) with margin
    const left = Math.max(8, Math.min(viewportWidth - dockWidth - 12, rect.right - dockWidth - 8));
    
    // Check clearance below the composer box. If the composer is pinned tight
    // against the viewport bottom (e.g. ChatGPT / Claude fixed bottom footers),
    // flip above the composer to ensure it never collides with or obscures the input's own controls.
    let top = Math.max(8, Math.min(viewportHeight - dockHeight - 8, rect.bottom + 8));
    if (rect.bottom + dockHeight + 8 > viewportHeight && rect.top - dockHeight - 8 >= 8) {
      top = rect.top - dockHeight - 8;
    }

    trigger.style.setProperty("left", `${Math.round(left)}px`, "important");
    trigger.style.setProperty("top", `${Math.round(top)}px`, "important");
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

  loadSavedContext(() => {});

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

      // 6. Chat context handoff driven from the popup
      if (request.action === "getChatContext") {
        sendResponse({ success: true, platformName: chatPlatformLabel(), visibleTurns: readVisibleTurns().length });
        return true;
      }

      if (request.action === "saveChatContext") {
        saveThisChatContext((result) => {
          sendResponse(
            result.ok
              ? { success: true, turnCount: result.ctx.turns.length, platformName: result.ctx.platformName }
              : { success: false, error: result.reason }
          );
        });
        return true;
      }

      if (request.action === "insertSavedContext") {
        const ok = openContextTransfer(getInput(), savedContext);
        sendResponse(
          ok
            ? { success: true, pendingReview: true, turnCount: savedContext.turns.length, platformName: savedContext.platformName }
            : { success: false, error: savedContext ? "No chat input box on this page." : "Nothing saved yet." }
        );
        return true;
      }

      return false;
    });
  }
})();
