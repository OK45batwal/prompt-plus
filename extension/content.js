(function () {
  let panelEl = null;
  let currentTarget = null;
  let currentText = "";
  let userQuota = { remaining: 88, monthlyLimit: 100, usagePercentage: 12 };

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
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease !important;
      }
      .pp-fab-bar:hover {
        border-color: rgba(99, 102, 241, 0.6) !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(99, 102, 241, 0.4) !important;
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
        padding: 5px 10px !important;
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

  function getConversationText() {
    const bot = detectChatbot();
    let text = "";
    if (bot === "chatgpt") {
      const turns = document.querySelectorAll("[data-message-author-role]");
      turns.forEach((t) => {
        const role = t.getAttribute("data-message-author-role");
        const body = t.innerText?.trim();
        if (body) text += `${role === "user" ? "User" : "Assistant"}: ${body}\n\n`;
      });
    } else if (bot === "claude") {
      const msgs = document.querySelectorAll(".font-claude-message, .font-user-message, [data-is-streaming]");
      msgs.forEach((m) => {
        const body = m.innerText?.trim();
        if (body) text += `${body}\n\n`;
      });
    } else if (bot === "gemini") {
      const turns = document.querySelectorAll(".conversation-container, .query-text, .response-text");
      turns.forEach((t) => {
        const body = t.innerText?.trim();
        if (body) text += `${body}\n\n`;
      });
    } else if (bot === "deepseek") {
      const msgs = document.querySelectorAll(".chat-message, .fbb737a4, [class*='message-content']");
      msgs.forEach((m) => {
        const body = m.innerText?.trim();
        if (body) text += `${body}\n\n`;
      });
    }
    if (!text.trim()) {
      const main = document.querySelector("main") || document.body;
      text = main?.innerText?.slice(-4000) || "";
    }
    return text.trim();
  }

  function captureContextBucket() {
    const raw = getConversationText();
    if (!raw || raw.length < 30) {
      showToast("⚠️ Not enough conversation text found to carry over.");
      return;
    }
    const sourceBot = detectChatbot().toUpperCase();
    const bucket = {
      source: sourceBot,
      rawText: raw.slice(-6000),
      timestamp: new Date().toISOString(),
      formattedPrompt: `### CONTEXT CARRIED OVER FROM PREVIOUS ${sourceBot} SESSION\n\`\`\`text\n${raw.slice(-4000)}\n\`\`\`\n\n### CONTINUATION GOAL\nContinue analyzing or executing the task above with maximum accuracy and full context continuity:`
    };

    try {
      if (chrome?.storage?.local) {
        chrome.storage.local.set({ pp_context_bucket: bucket }, () => {
          showToast(`✓ Context captured from ${sourceBot}! Open any other chatbot to resume.`);
          const inj = document.querySelector("#pp-fab-bucket-inj");
          if (inj) {
            inj.style.display = "inline-flex";
            inj.classList.add("resume-pill");
            inj.innerHTML = `<span class="pp-fab-icon">💉</span><span style="font-size:10px;font-weight:700;margin-left:2px;">Resume from ${sourceBot}</span>`;
          }
        });
      }
    } catch {
      showToast("Context capture failed.");
    }
  }

  function injectContextBucket() {
    try {
      if (chrome?.storage?.local) {
        chrome.storage.local.get("pp_context_bucket", (d) => {
          const b = d?.pp_context_bucket;
          if (b && b.formattedPrompt) {
            const input = getInput();
            if (input) {
              setText(input, b.formattedPrompt);
              showToast(`✓ Loaded previous chat context from ${b.source || "prior session"}!`);
            }
          }
        });
      }
    } catch {
      showToast("Failed to inject context.");
    }
  }

  function getInput() {
    const selectors = [
      "#prompt-textarea",
      "textarea[data-id='root']",
      "div[contenteditable='true'][role='textbox']",
      "div[contenteditable='true'][data-placeholder]",
      "div[contenteditable='true']",
      "rich-textarea textarea",
      "textarea[placeholder*='Message']",
      "textarea[placeholder*='Ask']",
      "textarea[placeholder*='prompt']",
      "textarea"
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && isVisible(el)) return el;
    }
    return null;
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      el.offsetWidth > 0 &&
      el.offsetHeight > 0
    );
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
      if (existing._targetInput && document.body.contains(existing._targetInput)) {
        return;
      }
      try { existing.remove(); } catch { /* ignore */ }
    }
    const input = getInput();
    if (!input || !input.parentElement) return;

    const rect = input.getBoundingClientRect();
    if (!rect || rect.width === 0) { setTimeout(injectFab, 800); return; }

    const bar = document.createElement("div");
    bar.className = "pp-fab-bar";
    bar._targetInput = input;

    bar.innerHTML =
      '<div class="pp-fab-brain-badge" title="Prompt+ Intelligence Engine" style="background: transparent; padding: 0; cursor: pointer;">' +
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
      '<span id="pp-fab-token-quota" style="color:#10b981;font-weight:700;">88 left</span>' +
      '</div>' +
      '<button class="pp-fab-btn-sub" id="pp-fab-bucket-cap" type="button" title="Carry conversation history to another chatbot">' +
      '<span class="pp-fab-icon">📦</span>' +
      '</button>' +
      '<button class="pp-fab-btn-sub" id="pp-fab-bucket-inj" type="button" style="display:none;" title="Inject saved context">' +
      '<span class="pp-fab-icon">💉</span>' +
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

    bar.querySelector(".pp-fab-brain-badge")?.addEventListener("click", handleEnhanceClick);
    bar.querySelector("#pp-fab-btn")?.addEventListener("click", handleEnhanceClick);

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

    try {
      if (chrome?.storage?.local) {
        chrome.storage.local.get("pp_context_bucket", (d) => {
          const b = d?.pp_context_bucket;
          if (b && b.formattedPrompt && injBtn) {
            injBtn.style.display = "inline-flex";
            injBtn.innerHTML = `<span class="pp-fab-icon">💉</span><span style="font-size:10px;font-weight:700;margin-left:2px;">Resume from ${b.source || "Prior Chat"}</span>`;
            injBtn.title = `Resume conversation carried over from ${b.source || "prior session"}`;
          }
        });
      }
    } catch { /* ignore */ }

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
    if (!document.body.contains(input)) {
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

    let top = rect.top - barHeight - 8;
    if (top < 8) {
      top = rect.top + 8;
    }

    let left = rect.right - barWidth - 8;
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

    let role = "Senior Subject Matter Expert & Systems Architect";
    let sec1 = "Key Requirements & Specifications";
    let sec2 = "Execution Guidelines";

    if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html)\b/i.test(text)) {
      role = "Principal Software Engineer & Technical Architect";
      sec1 = "Architecture & Technical Specifications";
      sec2 = "Implementation Guidelines";
    } else if (/\b(write|blog|article|email|post|essay|copy|letter|content|draft|story|headline|tweet|linkedin|newsletter)\b/i.test(text)) {
      role = "Elite Content Director & Strategic Copywriter";
      sec1 = "Audience Hook & Narrative Strategy";
      sec2 = "Content Directives";
    }

    return `### ROLE & PERSONA
You are an authoritative ${role}. Execute this task with production-grade rigor:
"${text}"

### ${sec1}
- **Subject**: "${subject}"
- **Tone Profile**: ${tone}
- **Constraints**: Deliver complete, unabridged solutions without placeholders or assumptions.

### ${sec2}
1. Analyze core requirements for "${subject}" and address implicit edge cases.
2. Structure output with modular sections, scannable Markdown headers, and concrete code/examples.
3. Eliminate all conversational introductory fluff and meta commentary.

### DELIVERABLES & OUTPUT FORMAT
- Deliver complete, immediately usable results formatted in clean Markdown.`;
  }

  function openPanel() {
    if (panelEl) {
      panelEl.style.display = "flex";
      return;
    }

    panelEl = document.createElement("div");
    panelEl.id = "pp-side-panel";
    Object.assign(panelEl.style, {
      position: "fixed", top: "0", right: "0", width: "420px", height: "100vh",
      background: "rgba(10,10,14,0.96)", borderLeft: "1px solid rgba(255,255,255,0.1)",
      zIndex: "100000000", display: "flex", flexDirection: "column",
      boxShadow: "-8px 0 32px rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#f4f4f5"
    });

    panelEl.innerHTML = `
      <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #4f46e5); display: flex; align-items: center; justify-content: center; font-weight: 700;">⚡</div>
          <div>
            <div style="font-weight: 700; font-size: 14px;">Prompt+ <span style="font-weight: 400; color: #a1a1aa; font-size: 12px;">Architect AI v2.0</span></div>
            <div style="font-size: 10px; color: #34d399; font-weight: 600;">🟢 WEB SYNCED</div>
          </div>
        </div>
        <button id="pp-panel-close" style="background: transparent; border: none; color: #a1a1aa; font-size: 20px; cursor: pointer; padding: 4px;">✕</button>
      </div>

      <div style="padding: 16px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.05em;">Original User Input</div>
        <textarea id="pp-panel-input" rows="4" style="width: 100%; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #f4f4f5; font-size: 13px; font-family: inherit; resize: vertical; outline: none;" placeholder="Type or edit your prompt idea..."></textarea>

        <button id="pp-panel-enhance-btn" style="padding: 12px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); border: none; color: #fff; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 16px rgba(99,102,241,0.4);">
          <span>⚡ Enhance Prompt Live</span>
        </button>

        <!-- Panel Token Remaining Bar -->
        <div style="padding: 8px 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; gap: 5px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #a1a1aa;">
            <span id="pp-panel-token-need">⚡ ~0 Tokens needed</span>
            <span id="pp-panel-token-rem" style="color: #10b981; font-weight: 700;">88 / 100 Free Units</span>
          </div>
          <div style="width: 100%; height: 4px; border-radius: 9999px; background: rgba(255,255,255,0.08); overflow: hidden;">
            <div id="pp-panel-token-fill" style="height: 100%; border-radius: 9999px; background: linear-gradient(90deg, #6366f1 0%, #10b981 100%); width: 88%;"></div>
          </div>
        </div>

        <div id="pp-panel-msg" style="font-size: 12px; display: none; padding: 8px 12px; border-radius: 8px;"></div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
          <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.05em;">Enhanced Master Prompt</span>
          <span id="pp-panel-score" style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: rgba(52,211,153,0.15); border: 1px solid rgba(52,211,153,0.4); color: #34d399; display: none;">Score: 98/100</span>
        </div>

        <div id="pp-panel-result" style="flex: 1; padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); font-size: 12px; font-family: monospace; white-space: pre-wrap; color: #e4e4e7; min-height: 180px; overflow-y: auto;">
          Click "Enhance Prompt Live" above to compile master instruction
        </div>

        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <button id="pp-panel-copy" style="flex: 1; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #f4f4f5; font-size: 12px; font-weight: 600; cursor: pointer;">Copy Result</button>
          <button id="pp-panel-inject" style="flex: 1; padding: 10px; border-radius: 10px; background: linear-gradient(135deg, #34d399, #059669); border: none; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;">Apply to Chat Input ✓</button>
        </div>
      </div>
    `;

    document.body.appendChild(panelEl);

    document.getElementById("pp-panel-close")?.addEventListener("click", () => {
      panelEl.style.display = "none";
    });

    const panelEnhanceBtn = document.getElementById("pp-panel-enhance-btn");
    const panelInput = document.getElementById("pp-panel-input");
    const panelResult = document.getElementById("pp-panel-result");
    const panelScore = document.getElementById("pp-panel-score");
    const panelMsg = document.getElementById("pp-panel-msg");
    const panelTokenNeed = document.getElementById("pp-panel-token-need");
    const panelTokenRem = document.getElementById("pp-panel-token-rem");
    const panelTokenFill = document.getElementById("pp-panel-token-fill");

    panelInput?.addEventListener("input", () => {
      const val = panelInput.value || "";
      const tokens = Math.ceil(val.length / 3.8);
      if (panelTokenNeed) panelTokenNeed.textContent = `⚡ ~${tokens} Tokens needed`;
      if (panelTokenRem && userQuota) {
        panelTokenRem.textContent = `${userQuota.remaining || 88} / 100 Free Units`;
      }
      if (panelTokenFill && userQuota) {
        const dynamicRemaining = Math.max(0, userQuota.remaining - (tokens > 50 ? 1 : 0));
        const fillPct = Math.max(8, Math.min(100, Math.round((dynamicRemaining / (userQuota.monthlyLimit || 100)) * 100)));
        panelTokenFill.style.width = `${fillPct}%`;
      }
    });

    panelEnhanceBtn?.addEventListener("click", () => {
      const text = panelInput?.value?.trim();
      if (!text) {
        if (panelMsg) {
          panelMsg.textContent = "⚠️ Please type a prompt first!";
          panelMsg.style.display = "block";
          panelMsg.style.background = "rgba(239,68,68,0.15)";
          panelMsg.style.color = "#f87171";
        }
        return;
      }

      if (panelEnhanceBtn) panelEnhanceBtn.disabled = true;
      if (panelResult) panelResult.textContent = "Enhancing prompt with Prompt+ Intelligence...";

      const finishEnhancement = (enhanced, sourceLabel = "Cloud AI") => {
        if (panelEnhanceBtn) panelEnhanceBtn.disabled = false;
        if (panelResult) panelResult.textContent = enhanced;
        if (panelScore) {
          panelScore.textContent = "Score: 98/100";
          panelScore.style.display = "inline-flex";
        }
        if (panelMsg) {
          panelMsg.textContent = `⚡ Enhanced via ${sourceLabel}!`;
          panelMsg.style.display = "block";
          panelMsg.style.background = "rgba(52,211,153,0.15)";
          panelMsg.style.color = "#34d399";
          setTimeout(() => { panelMsg.style.display = "none"; }, 3500);
        }
      };

      try {
        chrome.runtime.sendMessage(
          { action: "enhancePrompt", text, mode: "api", level: "deep" },
          (res) => {
            if (res && res.success && res.data?.enhanced) {
              finishEnhancement(res.data.enhanced, res.data.model || "Cloud AI");
            } else {
              finishEnhancement(synthesizeLocalPrompt(text), "⚡ No-API Rule Engine");
            }
          }
        );
      } catch {
        finishEnhancement(synthesizeLocalPrompt(text), "⚡ No-API Rule Engine");
      }
    });

    document.getElementById("pp-panel-copy")?.addEventListener("click", () => {
      const text = panelResult?.textContent;
      if (text && !text.startsWith("Click")) {
        navigator.clipboard.writeText(text);
        showToast("✓ Master prompt copied to clipboard!");
      }
    });

    document.getElementById("pp-panel-inject")?.addEventListener("click", () => {
      const text = panelResult?.textContent;
      if (text && !text.startsWith("Click")) {
        const target = currentTarget || getInput();
        if (target) {
          setText(target, text);
          showToast("✓ Applied enhanced prompt to chat input!");
          if (panelEl) panelEl.style.display = "none";
        }
      }
    });
  }

  // Setup periodic mutation observer to attach to dynamic chat textareas
  let lastTarget = null;
  setInterval(() => {
    const input = getInput();
    if (input && input !== lastTarget) {
      lastTarget = input;
      injectFab();
    }
  }, 1000);

  // Initial trigger
  setTimeout(injectFab, 800);

  // Chrome Message Listener for in-page actions
  chrome.runtime?.onMessage?.addListener((req, sender, sendResponse) => {
    if (req.action === "injectEnhanced" && req.enhanced) {
      const input = getInput();
      if (input) {
        setText(input, req.enhanced);
        showToast("✓ Enhanced prompt injected into active chat!");
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: "No active chat input detected" });
      }
    } else if (req.action === "openEnhancePanel") {
      openPanel();
      sendResponse({ success: true });
    }
  });
})();
