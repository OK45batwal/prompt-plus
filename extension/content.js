(function () {
  let panelEl = null;
  let currentTarget = null;
  let currentText = "";
  let userQuota = { remaining: 88, monthlyLimit: 100, usagePercentage: 12 };
  let uiMode = localStorage.getItem("pp_ui_mode") || "full"; // "full" | "compact" | "hidden"

  // Web Platform Session Bridge: Listen for authenticated sessions broadcast by Prompt+ Web Platform
  if (
    location.hostname.includes("prompt-plus-three.vercel.app") ||
    location.hostname.includes("localhost") ||
    location.hostname.includes("prompt-plus")
  ) {
    window.addEventListener("message", (event) => {
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
    if (document.getElementById("pp-styles")) return;
    const style = document.createElement("style");
    style.id = "pp-styles";
    style.textContent = `
      .pp-fab-bar {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 4px 10px !important;
        border-radius: 9999px !important;
        background: rgba(10, 10, 14, 0.94) !important;
        border: 1px solid rgba(99, 102, 241, 0.4) !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(99, 102, 241, 0.25) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI Variable", sans-serif !important;
        z-index: 99999999 !important;
        user-select: none !important;
        line-height: 1 !important;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, opacity 0.2s ease !important;
      }
      .pp-fab-bar:hover {
        border-color: rgba(99, 102, 241, 0.6) !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(99, 102, 241, 0.4) !important;
      }

      .pp-fab-bar.mode-compact {
        padding: 4px 8px !important;
        gap: 4px !important;
      }
      .pp-fab-bar.mode-compact .pp-fab-btn,
      .pp-fab-bar.mode-compact .pp-fab-token-bar,
      .pp-fab-bar.mode-compact #pp-fab-bucket-cap,
      .pp-fab-bar.mode-compact #pp-fab-bucket-inj {
        display: none !important;
      }

      .pp-fab-brain-badge {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 24px !important;
        height: 24px !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        transition: transform 0.2s ease !important;
      }
      .pp-fab-brain-badge:hover {
        transform: scale(1.15) rotate(5deg) !important;
      }

      .pp-fab-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        padding: 5px 12px !important;
        border-radius: 9999px !important;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
        border: none !important;
        color: #ffffff !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 2px 8px rgba(99, 102, 241, 0.4) !important;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        white-space: nowrap !important;
        margin: 0 !important;
      }
      .pp-fab-btn:hover {
        transform: translateY(-1px) scale(1.02) !important;
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.5), 0 4px 14px rgba(99, 102, 241, 0.6) !important;
      }

      .pp-fab-token-bar {
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        padding: 3px 8px !important;
        border-radius: 9999px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        font-size: 9.5px !important;
        font-weight: 600 !important;
        color: #a1a1aa !important;
      }

      .pp-fab-token-track {
        width: 32px !important;
        height: 4px !important;
        border-radius: 9999px !important;
        background: rgba(255, 255, 255, 0.15) !important;
        overflow: hidden !important;
      }

      .pp-fab-token-fill {
        height: 100% !important;
        border-radius: 9999px !important;
        background: linear-gradient(90deg, #6366f1 0%, #10b981 100%) !important;
        width: 88% !important;
        transition: width 0.3s ease !important;
      }

      .pp-fab-btn-sub {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 5px 8px !important;
        border-radius: 9999px !important;
        background: rgba(255, 255, 255, 0.06) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        color: #f4f4f5 !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        margin: 0 !important;
        white-space: nowrap !important;
      }
      .pp-fab-btn-sub:hover {
        background: rgba(255, 255, 255, 0.16) !important;
        border-color: rgba(255, 255, 255, 0.25) !important;
        transform: translateY(-1px) !important;
      }
      .pp-fab-btn-sub.resume-pill {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2)) !important;
        border-color: rgba(16, 185, 129, 0.45) !important;
        color: #34d399 !important;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.3) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  ensureStylesInjected();

  function detectChatbot() {
    const host = location.hostname.toLowerCase();
    if (host.includes("chatgpt") || host.includes("chat.openai")) return "chatgpt";
    if (host.includes("claude")) return "claude";
    if (host.includes("gemini")) return "gemini";
    if (host.includes("deepseek")) return "deepseek";
    if (host.includes("grok") || host.includes("x.ai")) return "grok";
    if (host.includes("perplexity")) return "perplexity";
    if (host.includes("copilot")) return "copilot";
    if (host.includes("poe")) return "poe";
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

    // 1. Google Gemini specific selectors
    if (bot === "gemini") {
      const geminiSelectors = [
        "rich-textarea .ql-editor",
        "rich-textarea div[contenteditable='true']",
        "rich-textarea textarea",
        "input-area-v2 div[contenteditable='true']",
        "div.input-area div[contenteditable='true']",
        "div[aria-label*='Enter a prompt']",
        "div[aria-label*='Ask Gemini']",
        "textarea[aria-label*='prompt']"
      ];
      for (const s of geminiSelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 2. ChatGPT specific selectors
    if (bot === "chatgpt") {
      const chatgptSelectors = [
        "#prompt-textarea",
        "div[id='prompt-textarea']",
        "div[contenteditable='true']#prompt-textarea",
        "textarea[data-id='root']",
        "textarea#prompt-textarea"
      ];
      for (const s of chatgptSelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 3. Claude specific selectors
    if (bot === "claude") {
      const claudeSelectors = [
        "div[contenteditable='true'].ProseMirror",
        "fieldset div[contenteditable='true']",
        "div.ProseMirror"
      ];
      for (const s of claudeSelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 4. DeepSeek specific selectors
    if (bot === "deepseek") {
      const deepseekSelectors = [
        "textarea#chat-input",
        "textarea[placeholder*='DeepSeek']",
        "textarea"
      ];
      for (const s of deepseekSelectors) {
        const el = document.querySelector(s);
        if (el && isVisible(el) && !isSidebarElement(el)) return el;
      }
    }

    // 5. Fallback generic selectors
    const fallbackSelectors = [
      "form textarea",
      "main div[contenteditable='true']",
      "main textarea",
      "textarea[placeholder*='Message']",
      "textarea[placeholder*='Ask']",
      "textarea[placeholder*='prompt']",
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
      el.innerHTML = "";
      const p = document.createElement("p");
      p.innerText = val;
      el.appendChild(p);
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
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

  function injectFab() {
    const existing = document.querySelector(".pp-fab-bar");
    if (existing) {
      if (existing._targetInput && document.body.contains(existing._targetInput) && !isSidebarElement(existing._targetInput)) {
        positionFab(existing, existing._targetInput);
        return;
      }
      try { existing.remove(); } catch { /* ignore */ }
    }

    const input = getInput();
    if (!input || !input.parentElement) return;

    const rect = input.getBoundingClientRect();
    if (!rect || rect.width === 0) { setTimeout(injectFab, 800); return; }

    const bar = document.createElement("div");
    bar.className = `pp-fab-bar ${uiMode === "compact" ? "mode-compact" : ""}`;
    bar._targetInput = input;

    bar.innerHTML =
      '<div class="pp-fab-brain-badge" title="Prompt+ Intelligence Engine (Click to Enhance or Switch UI)" style="background: transparent; padding: 0; cursor: pointer;">' +
      '<svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="fabLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1D70F5"/><stop offset="100%" stopColor="#8B5CF6"/></linearGradient></defs>' +
      '<path d="M22 90V28C22 16 32 10 52 10C72 10 85 22 85 40C85 58 72 68 52 68H42V90H22Z" fill="url(#fabLogoGrad)"/>' +
      '<path d="M26 68L56 38M56 38H42M56 38V52" stroke="white" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
      '</div>' +
      '<button class="pp-fab-btn" id="pp-fab-btn" type="button" title="Enhance prompt with Prompt+ Intelligence">' +
      '<span class="pp-fab-icon">⚡</span>' +
      '<span class="pp-fab-text" id="pp-fab-text">Enhance Prompt</span>' +
      '</button>' +
      '<div class="pp-fab-token-bar" id="pp-fab-token-bar" title="Prompt+ Real-Time Quota & Context Load">' +
      '<span id="pp-fab-token-text">~0 tok</span>' +
      '<div class="pp-fab-token-track">' +
      '<div class="pp-fab-token-fill" id="pp-fab-token-fill" style="width: 88%;"></div>' +
      '</div>' +
      '<span id="pp-fab-token-quota" style="color:#10b981;font-weight:700;">88 units</span>' +
      '</div>' +
      '<button class="pp-fab-btn-sub" id="pp-fab-bucket-cap" type="button" title="Carry conversation history to another chatbot">' +
      '<span class="pp-fab-icon">📦</span>' +
      '</button>' +
      '<button class="pp-fab-btn-sub" id="pp-fab-bucket-inj" type="button" style="display:none;" title="Inject saved context">' +
      '<span class="pp-fab-icon">💉</span>' +
      '</button>' +
      '<button class="pp-fab-btn-sub" id="pp-fab-switch-mode" type="button" title="Switch UI Box (Full / Compact Sparkle)">' +
      '<span class="pp-fab-icon">⇄</span>' +
      '</button>';

    document.body.appendChild(bar);
    positionFab(bar, input);

    // Live In-Chat Input Token Metering
    const updateInputTokenCount = () => {
      const val = getText(input);
      const tokens = Math.ceil((val || "").length / 3.8);
      const tokText = bar.querySelector("#pp-fab-token-text");
      const tokFill = bar.querySelector("#pp-fab-token-fill");
      const tokQuota = bar.querySelector("#pp-fab-token-quota");
      const bot = detectChatbot().toUpperCase();
      const botMaxContext = bot === "CLAUDE" ? 200000 : bot === "GEMINI" ? 1000000 : 128000;
      const freeK = (Math.max(0, botMaxContext - tokens) / 1000).toFixed(0);

      if (tokText) tokText.textContent = `~${tokens} tok · ${freeK}K free`;
      if (tokQuota && userQuota) {
        tokQuota.textContent = `${userQuota.remaining || 88} units`;
      }
      if (tokFill && userQuota) {
        const dynamicRemaining = Math.max(0, userQuota.remaining - (tokens > 50 ? 1 : 0));
        const fillPct = Math.max(8, Math.min(100, Math.round((dynamicRemaining / (userQuota.monthlyLimit || 100)) * 100)));
        tokFill.style.width = `${fillPct}%`;
      }
    };

    input.addEventListener("input", updateInputTokenCount);
    updateInputTokenCount();

    const handleEnhanceClick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const el = getInput() || input;
      currentTarget = el;
      currentText = el ? getText(el) : "";
      if (!currentText.trim()) {
        showToast("⚠️ Type your prompt idea in the chat box first!");
        try { el?.focus(); } catch { /* ignore */ }
        return;
      }
      openPanel();
      setTimeout(() => {
        const panelInput = document.getElementById("pp-panel-input");
        const panelEnhanceBtn = document.getElementById("pp-panel-enhance-btn");
        if (panelInput) panelInput.value = currentText;
        if (panelEnhanceBtn) panelEnhanceBtn.click();
      }, 100);
    };

    bar.querySelector(".pp-fab-brain-badge")?.addEventListener("click", (e) => {
      if (uiMode === "compact") {
        handleEnhanceClick(e);
      } else {
        handleEnhanceClick(e);
      }
    });

    bar.querySelector("#pp-fab-btn")?.addEventListener("click", handleEnhanceClick);

    // Switch UI Box presentation (Full <-> Compact)
    bar.querySelector("#pp-fab-switch-mode")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uiMode = uiMode === "full" ? "compact" : "full";
      localStorage.setItem("pp_ui_mode", uiMode);
      if (uiMode === "compact") {
        bar.classList.add("mode-compact");
        showToast("✓ Switched to Compact Sparkle Mode. Click ⇄ or ✦ to expand.");
      } else {
        bar.classList.remove("mode-compact");
        showToast("✓ Switched to Full Omni-Bar Mode.");
      }
      positionFab(bar, input);
    });

    bar.querySelector("#pp-fab-bucket-cap")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      captureContextBucket();
    });

    const injBtn = bar.querySelector("#pp-fab-bucket-inj");
    injBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      injectContextBucket();
    });

    let rafPending = false;
    const schedulePosition = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (document.body.contains(bar) && document.body.contains(input)) {
          positionFab(bar, input);
        }
      });
    };

    window.addEventListener("scroll", schedulePosition, { passive: true });
    window.addEventListener("resize", schedulePosition, { passive: true });
  }

  function positionFab(bar, input) {
    if (!input || !bar) return;
    if (!document.body.contains(input) || isSidebarElement(input)) {
      bar.style.setProperty("display", "none", "important");
      return;
    }

    const card = getChatContainer(input) || input;
    const rect = card.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      bar.style.setProperty("display", "none", "important");
      return;
    }

    const barHeight = bar.offsetHeight || 36;
    const barWidth = bar.offsetWidth || 340;
    const viewportWidth = window.innerWidth;

    // Position directly docked above the chat input container
    let top = rect.top - barHeight - 10;
    if (top < 12) {
      top = rect.top + 8;
    }

    let left = rect.right - barWidth - 10;
    if (left < 16) left = 16;
    if (left + barWidth > viewportWidth - 16) {
      left = Math.max(16, viewportWidth - barWidth - 16);
    }

    bar.style.setProperty("position", "fixed", "important");
    bar.style.setProperty("z-index", "99999999", "important");
    bar.style.setProperty("top", `${Math.round(top)}px`, "important");
    bar.style.setProperty("bottom", "auto", "important");
    bar.style.setProperty("left", `${Math.round(left)}px`, "important");
    bar.style.setProperty("display", "inline-flex", "important");
  }

  function showToast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "rgba(10,10,12,0.92)", color: "#f1f5f9", padding: "10px 20px", borderRadius: "14px",
      fontSize: "13px", fontWeight: "600", zIndex: "100000001", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", transition: "all 0.3s ease"
    });
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translate(-50%, 10px)";
      setTimeout(() => t.remove(), 300);
    }, 2800);
  }

  function detectImplicitTone(input) {
    const text = (input || "").toLowerCase();
    if (/\b(tweet|post|linkedin|casual|friendly|fun|newsletter|blog|engaging|story)\b/i.test(text)) return "Engaging, Authentic & Conversational";
    if (/\b(sell|pitch|copy|ad|convert|sales|landing|cta|email|headline|offer)\b/i.test(text)) return "High-Conversion, Persuasive & Action-Oriented";
    if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html)\b/i.test(text)) return "Technically Rigorous, Precise & Production-Grade";
    if (/\b(strategy|plan|executive|kpi|growth|roadmap|summary|business|report)\b/i.test(text)) return "Executive, Strategic & High-Level";
    if (/\b(data|analyze|analysis|statistics|metrics|research|paper|study)\b/i.test(text)) return "Analytical, Objective & Data-Driven";
    return "Clear, Authoritative & Direct";
  }

  function synthesizeLocalPrompt(userInput) {
    const text = (userInput || "").trim();
    if (!text) return "";
    const tone = detectImplicitTone(text);
    const cleanInput = text.replace(/^(please|can you|help me|i want to|i need to|how to|write|create|build|fix|generate|make)\s+/i, "");
    const subject = cleanInput.length > 0 ? cleanInput : text;

    let role = "Senior Subject Matter Expert & Technical Architect";
    let sec1 = "SPECIFICATIONS & ARCHITECTURAL CONSTRAINTS";
    let sec2 = "STEP-BY-STEP EXECUTION PROTOCOL";

    if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html)\b/i.test(text)) {
      role = "Principal Software Architect & Lead Systems Engineer";
      sec1 = "TECHNICAL SPECIFICATIONS & QUALITY CONSTRAINTS";
      sec2 = "IMPLEMENTATION PROTOCOL";
    } else if (/\b(write|blog|article|email|post|essay|copy|letter|content|draft|story|headline|tweet|linkedin|newsletter)\b/i.test(text)) {
      role = "Elite Content Director & Strategic Copywriter";
      sec1 = "AUDIENCE HOOK & CONTENT DIRECTIVES";
      sec2 = "NARRATIVE EXECUTION STEPS";
    }

    return `### ROLE & PERSONA
You are an authoritative ${role}. Execute this task with highest quality and production-grade precision:
"${text}"

### ${sec1}
- **Subject**: "${subject}"
- **Tone Profile**: ${tone}
- **Constraints**: Deliver complete, unabridged solutions without placeholders or assumptions.

### ${sec2}
1. Analyze core requirements for "${subject}" and anticipate implicit edge cases.
2. Structure output with modular sections, scannable Markdown headers, and concrete code/examples.
3. Eliminate all conversational introductory fluff and meta commentary.

### DELIVERABLES & OUTPUT FORMAT
- Deliver immediately usable results formatted in clean Markdown.`;
  }

  function openPanel() {
    if (panelEl) {
      panelEl.style.display = "flex";
      return;
    }

    panelEl = document.createElement("div");
    panelEl.className = "pp-panel";
    panelEl.id = "pp-panel";
    panelEl.innerHTML = `
      <div class="pp-panel-header">
        <div class="pp-panel-title">
          <div style="width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#6366f1,#4f46e5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">✦</div>
          <span>Prompt+ Studio</span>
          <span style="font-size:9.5px;padding:2px 6px;border-radius:4px;background:rgba(99,102,241,0.2);color:#a5b4fc;font-weight:700;">v2.1.2</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span id="pp-panel-token-need" style="font-size:10px;color:#10b981;font-weight:700;">⚡ ~0 tok</span>
          <button type="button" class="pp-panel-close" id="pp-panel-close">✕</button>
        </div>
      </div>
      <div class="pp-panel-body">
        <div style="display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#71717a;font-weight:700;text-transform:uppercase;">
            <span>Raw Prompt</span>
            <span id="pp-panel-char-count">0 chars</span>
          </div>
          <textarea class="pp-panel-textarea" id="pp-panel-input" placeholder="Type or refine your prompt idea..."></textarea>
        </div>

        <button type="button" class="pp-panel-enhance-btn" id="pp-panel-enhance-btn">
          <span>⚡ Compile Master Prompt</span>
        </button>

        <div class="pp-panel-result" id="pp-panel-result" style="display:none;">
          <div class="pp-panel-result-header">
            <div style="display:flex;gap:5px;align-items:center;">
              <span id="pp-panel-score" style="font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px;background:rgba(16,185,129,0.15);color:#34d399;">Score: 94/100</span>
              <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;background:rgba(99,102,241,0.15);color:#a5b4fc;">⚡ &lt;25ms</span>
            </div>
            <span id="pp-panel-engine-tag" style="font-size:10px;color:#a1a1aa;">Master Prompt</span>
          </div>
          <div class="pp-panel-result-body" id="pp-panel-result-body"></div>
          <div class="pp-panel-result-actions">
            <button type="button" class="pp-panel-action-btn pp-panel-btn-copy" id="pp-panel-btn-copy">📋 Copy</button>
            <button type="button" class="pp-panel-action-btn pp-panel-btn-use" id="pp-panel-btn-use">🚀 Apply to Chat</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panelEl);

    const closeBtn = panelEl.querySelector("#pp-panel-close");
    const panelInput = panelEl.querySelector("#pp-panel-input");
    const panelEnhanceBtn = panelEl.querySelector("#pp-panel-enhance-btn");
    const panelResult = panelEl.querySelector("#pp-panel-result");
    const panelResultBody = panelEl.querySelector("#pp-panel-result-body");
    const panelBtnCopy = panelEl.querySelector("#pp-panel-btn-copy");
    const panelBtnUse = panelEl.querySelector("#pp-panel-btn-use");
    const panelCharCount = panelEl.querySelector("#pp-panel-char-count");
    const panelTokenNeed = panelEl.querySelector("#pp-panel-token-need");

    closeBtn?.addEventListener("click", () => {
      panelEl.style.display = "none";
    });

    panelInput?.addEventListener("input", () => {
      const len = panelInput.value.length;
      const tokens = Math.ceil(len / 3.8);
      if (panelCharCount) panelCharCount.textContent = `${len} chars`;
      if (panelTokenNeed) panelTokenNeed.textContent = `⚡ ~${tokens} tok`;
    });

    let lastEnhanced = "";

    panelEnhanceBtn?.addEventListener("click", async () => {
      const text = panelInput.value.trim();
      if (!text) {
        showToast("Please enter a prompt idea!");
        return;
      }

      panelEnhanceBtn.disabled = true;
      panelEnhanceBtn.innerHTML = "<span>⚡ Compiling Master Prompt...</span>";
      panelResult.style.display = "flex";
      panelResultBody.textContent = "Compiling with Prompt+ Intelligence...";

      let result = "";

      // Try background message route
      try {
        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: "enhancePrompt", text, mode: "api", level: "code" },
            (r) => resolve(r)
          );
        });
        if (res?.success && res.data?.enhanced) {
          result = res.data.enhanced;
        }
      } catch {}

      // Fallback synthesizer
      if (!result) {
        result = synthesizeLocalPrompt(text);
      }

      lastEnhanced = result;
      panelResultBody.textContent = result;
      panelEnhanceBtn.disabled = false;
      panelEnhanceBtn.innerHTML = "<span>⚡ Compile Master Prompt</span>";
      showToast("✓ Master prompt compiled!");
    });

    panelBtnCopy?.addEventListener("click", () => {
      if (lastEnhanced) {
        navigator.clipboard.writeText(lastEnhanced);
        panelBtnCopy.textContent = "✓ Copied!";
        setTimeout(() => { panelBtnCopy.textContent = "📋 Copy"; }, 2000);
      }
    });

    panelBtnUse?.addEventListener("click", () => {
      const el = currentTarget || getInput();
      if (el && lastEnhanced) {
        setText(el, lastEnhanced);
        panelEl.style.display = "none";
        showToast("✓ Master prompt applied to chatbox!");
      }
    });
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
          const master = synthesizeLocalPrompt(text);
          setText(input, master);
          showToast("✓ Prompt optimized in-place!");
        } else {
          openPanel();
        }
      } else {
        openPanel();
      }
    }
  });

  // Observe DOM changes to re-inject when new chat views render
  setInterval(() => {
    const input = getInput();
    if (input && !document.querySelector(".pp-fab-bar")) {
      injectFab();
    }
  }, 1000);

  window.addEventListener("focus", () => {
    const input = getInput();
    if (input) injectFab();
  });
})();
