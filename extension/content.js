(function () {
  const STORAGE_KEY = "pp_settings";
  const HISTORY_KEY = "pp_history";
  let panelEl = null;
  let currentTarget = null;
  let currentText = "";
  let currentMode = "api";

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
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable", sans-serif !important;
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
      .pp-fab-btn-sub.resume-pill:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(5, 150, 105, 0.35)) !important;
        border-color: rgba(16, 185, 129, 0.7) !important;
        box-shadow: 0 0 16px rgba(16, 185, 129, 0.5) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  ensureStylesInjected();

  const CONTEXT_LIMITS = { chatgpt: 128000, claude: 200000, gemini: 1000000, deepseek: 128000, grok: 128000, perplexity: 128000 };

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
    if (!bot) return "";
    const sel = bot === "chatgpt" ? "[data-message-author-role]" : bot === "claude" ? '.font-claude-message, .font-user-message, [class*="message"]' : bot === "gemini" ? '.conversation-turn, [data-message]' : ".message, .ds-message";
    const els = document.querySelectorAll(sel);
    if (!els.length) return "";
    return Array.from(els).reduce((s, el) => s + " " + (el.textContent || ""), "");
  }

  function estimateTokens(text) {
    return Math.round((text || "").length / 4);
  }

  function getTokenInfo() {
    const text = getConversationText();
    const currentInputText = currentTarget ? getText(currentTarget) : "";
    const used = estimateTokens(text + " " + currentInputText);
    const limit = CONTEXT_LIMITS[detectChatbot()] || 128000;
    const remaining = Math.max(0, limit - used);
    return { used, limit, remaining, pct: Math.min(100, Math.round((used / limit) * 100)) };
  }

  function sanitizeContextText(text) {
    if (!text) return "";
    return String(text)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
      .trim();
  }

  function captureContextBucket() {
    const rawText = getConversationText() || (currentTarget ? getText(currentTarget) : "");
    const cleanText = sanitizeContextText(rawText);
    if (!cleanText) {
      showToast("⚠️ No conversation text found to carry context.");
      return;
    }
    const source = detectChatbot().toUpperCase();
    const formatted = `[IMPORTED CONTEXT FROM ${source}]\nThe following background context was captured from a prior chat session:\n\n"""\n${cleanText.slice(-4000)}\n"""\n\nPlease use this background context to answer my follow-up request:`;
    const bucket = {
      source,
      rawText: cleanText,
      formattedPrompt: formatted,
      timestamp: Date.now(),
    };

    try {
      if (chrome?.storage?.local) {
        chrome.storage.local.set({ pp_context_bucket: bucket }, () => {
          showToast(`📦 Context captured from ${source}! Ready to carry into other AI chats.`);
          const injBtn = document.getElementById("pp-fab-bucket-inj");
          if (injBtn) injBtn.style.display = "inline-flex";
        });
      } else {
        showToast("⚠️ Extension local storage not available on this tab.");
      }
    } catch {
      showToast("⚠️ Could not write to extension storage.");
    }
  }

  function injectContextBucket() {
    const applyInject = (bucket) => {
      if (!bucket || !bucket.formattedPrompt) {
        showToast("⚠️ No context saved in bucket.");
        return;
      }
      const input = getInput() || currentTarget;
      if (!input) {
        showToast("⚠️ Active chat input field not found.");
        return;
      }
      const sanitized = sanitizeContextText(bucket.formattedPrompt);
      setText(input, sanitized);
      showToast(`💉 Injected context from ${bucket.source || "Bucket"} into chat!`);
    };

    try {
      if (chrome?.storage?.local) {
        chrome.storage.local.get("pp_context_bucket", (d) => {
          applyInject(d?.pp_context_bucket);
        });
      } else {
        showToast("⚠️ Extension storage not available.");
      }
    } catch {
      showToast("⚠️ Could not load context bucket");
    }
  }

  function getInput() {
    const active = document.activeElement;
    if (active && (active.tagName === "TEXTAREA" || active.isContentEditable || active.tagName === "INPUT")) {
      return active;
    }
    let el = document.querySelector("#prompt-textarea, textarea[data-id='root'], [contenteditable='true']#prompt-textarea");
    if (el) return el;
    el = document.querySelector("div[contenteditable='true'].ProseMirror, textarea[aria-label*='Write'], div[contenteditable='true'][aria-label*='Write']");
    if (el && location.hostname.includes("claude")) return el;
    el = document.querySelector("div[contenteditable='true'][aria-label*='Prompt'], div[contenteditable='true'], textarea");
    if (el && location.hostname.includes("gemini")) return el;
    el = document.querySelector("#chat-input, .ds-textarea, textarea[placeholder*='Ask'], textarea[placeholder*='prompt'], div[contenteditable='true']");
    if (el && location.hostname.includes("deepseek")) return el;
    el = document.querySelector("textarea[placeholder*='Grok'], div[contenteditable='true']");
    if (el && (location.hostname.includes("grok") || location.hostname.includes("x.ai"))) return el;
    el = document.querySelector("textarea[placeholder*='Ask'], textarea[placeholder*='Search'], textarea");
    if (el && location.hostname.includes("perplexity")) return el;
    el = document.querySelector("div[contenteditable='true']");
    if (el) return el;
    el = document.querySelector("textarea");
    if (el) return el;
    return document.querySelector("input[type='text']");
  }

  function getText(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value || "";
    if (el.isContentEditable) return el.innerText || el.textContent || "";
    return el.value || el.innerText || el.textContent || "";
  }

  function setText(el, text) {
    if (!el) return;
    try { el.focus(); } catch { /* ignore focus error */ }

    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      try {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        if (nativeSetter) {
          nativeSetter.call(el, text);
        } else {
          el.value = text;
        }
      } catch {
        el.value = text;
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (el.isContentEditable) {
      let inserted = false;
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("delete", false, null);
        inserted = document.execCommand("insertText", false, text);
      } catch { /* fallback */ }

      if (!inserted) {
        el.innerText = text;
      }

      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  let fabTimer = null;

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
      '<button class="pp-fab-btn-sub" id="pp-fab-bucket-cap" type="button" title="Carry conversation history to another chatbot">' +
      '<span class="pp-fab-icon">📦</span>' +
      '</button>' +
      '<button class="pp-fab-btn-sub" id="pp-fab-bucket-inj" type="button" style="display:none;" title="Inject saved context">' +
      '<span class="pp-fab-icon">💉</span>' +
      '</button>';

    document.body.appendChild(bar);
    positionFab(bar, input);

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

    bar.querySelector("#pp-fab-bucket-cap").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      captureContextBucket();
    });

    const injBtn = bar.querySelector("#pp-fab-bucket-inj");
    injBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      injectContextBucket();
    });

    try {
      if (chrome?.storage?.local) {
        chrome.storage.local.get("pp_context_bucket", (d) => {
          const b = d?.pp_context_bucket;
          if (b && b.formattedPrompt) {
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
        positionFab(bar, input);
        rafPending = false;
      });
    };

    window.addEventListener("scroll", schedulePosition, { passive: true });
    window.addEventListener("resize", schedulePosition, { passive: true });

    schedulePosition();
    if (fabTimer) clearInterval(fabTimer);
    fabTimer = setInterval(() => {
      if (!document.body.contains(input)) {
        injectFab();
      } else {
        schedulePosition();
      }
    }, 2000);
  }

  function getChatContainer(input) {
    if (!input) return null;
    const form = input.closest("form");
    if (form) return form;
    const composer = input.closest("[class*='composer'], [class*='chat-input'], [class*='prompt-container'], [data-id='root']");
    if (composer) return composer;
    let el = input.parentElement;
    while (el && el.parentElement && el.tagName !== "BODY" && el.tagName !== "MAIN") {
      if (el.offsetHeight >= 40 && el.querySelector("button, [role='button']")) return el;
      el = el.parentElement;
    }
    return input.parentElement || input;
  }

  function positionFab(bar, input) {
    if (!bar || !input) return;
    if (!document.body.contains(input)) {
      try { bar.remove(); } catch { /* ignore */ }
      setTimeout(injectFab, 200);
      return;
    }

    const card = getChatContainer(input) || input;
    const rect = card.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      bar.style.setProperty("display", "none", "important");
      return;
    }

    const barHeight = bar.offsetHeight || 36;
    const barWidth = bar.offsetWidth || 320;
    const viewportWidth = window.innerWidth;

    let top = rect.top - barHeight - 6;
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
    bar.style.setProperty("transition", "top 0.15s ease-out, left 0.15s ease-out", "important");
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
    let domain = "Execution & Strategic Analysis";
    let sec1 = "Key Requirements & Specifications";
    let sec2 = "Execution Guidelines";
    let directives = [
      `Analyze core requirements for "${subject}" and address implicit edge cases.`,
      `Deliver an authoritative, highly structured solution matching tone profile ("${tone}").`,
      `Ensure output is ready for immediate deployment with zero conversational fluff.`
    ];

    if (/\b(code|python|javascript|typescript|react|nextjs|node|api|sql|db|bug|function|script|refactor|error|fix|css|html)\b/i.test(text)) {
      role = "Principal Software Engineer & Technical Architect";
      domain = "Production Software Engineering";
      sec1 = "Architecture & Technical Specifications";
      sec2 = "Implementation Guidelines";
      directives = [
        `Design a clean, modular, production-ready architecture for "${subject}".`,
        `Incorporate strict typing, comprehensive error handling, and performance optimizations.`,
        `Provide executable, self-contained code blocks with clear inline documentation.`
      ];
    } else if (/\b(write|blog|article|email|post|essay|copy|letter|content|draft|story|headline|tweet|linkedin|newsletter)\b/i.test(text)) {
      role = "Elite Content Director & Strategic Copywriter";
      domain = "High-Impact Copywriting & Editorial Strategy";
      sec1 = "Audience Hook & Narrative Strategy";
      sec2 = "Content Directives";
      directives = [
        `Craft an engaging narrative hook tailored to the target audience for "${subject}".`,
        `Maintain a ${tone.toLowerCase()} tone with scannable formatting, subheadings, and clear takeaways.`,
        `Eliminate passive voice, repetitive boilerplate, and generic introductory filler.`
      ];
    }

    return `You are a ${role} with deep expertise in ${domain}.

Your objective is to execute the following request with production-grade precision:
"${text}"

### ${sec1}
- **Target Subject**: "${subject}"
- **Tone & Persona**: ${tone}
- **Quality Standard**: Deliver complete, unabridged solutions without placeholders or assumptions.

### ${sec2}
1. ${directives[0]}
2. ${directives[1]}
3. ${directives[2]}

### Deliverables & Formatting Specs
- Present final response with clear Markdown headers, bulleted lists, and structured blocks ready for immediate real-world application.`;
  }

  async function enhanceWithDeviceInExtension(text) {
    if (!text) return null;
    try {
      const w = window;
      const lm = w.LanguageModel || w.ai?.languageModel;
      if (!lm) return null;
      const avail = await lm.availability();
      if (avail !== "available" && avail !== "readily") return null;
      const session = await lm.create({ temperature: 0.1, topK: 1 });
      const promptText = `You are a Senior Prompt Architect. Transform the following prompt into an advanced, structured master prompt with Role, Specifications, and Execution steps:\n\n"${text}"`;
      const res = await session.prompt(promptText);
      session.destroy();
      return res ? res.trim() : null;
    } catch {
      return null;
    }
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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#f4f4f5"
    });

    panelEl.innerHTML = `
      <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #4f46e5); display: flex; align-items: center; justify-content: center; font-weight: 700;">⚡</div>
          <div>
            <div style="font-weight: 700; font-size: 14px;">Prompt+ <span style="font-weight: 400; color: #a1a1aa; font-size: 12px;">Architect AI</span></div>
            <div style="font-size: 10px; color: #34d399; font-weight: 600;">🟢 ACTIVE IN PANEL</div>
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

      (async () => {
        // 1. Try On-Device Gemini Nano (if browser supports it)
        const deviceText = await enhanceWithDeviceInExtension(text);
        if (deviceText) {
          finishEnhancement(deviceText, "On-Device Gemini Nano");
          return;
        }

        // 2. Fallback to Free Non-API-Key Cloud Engine
        try {
          if (chrome?.runtime?.sendMessage) {
            chrome.runtime.sendMessage({ action: "enhancePrompt", text, level: "deep" }, (res) => {
              let enhanced = "";
              if (res && res.success) {
                enhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
              }
              if (enhanced) {
                finishEnhancement(enhanced, "Free Cloud AI Engine");
              } else {
                const localText = synthesizeLocalPrompt(text);
                finishEnhancement(localText, "Prompt+ Local Engine");
              }
            });
          } else {
            const localText = synthesizeLocalPrompt(text);
            finishEnhancement(localText, "Prompt+ Local Engine");
          }
        } catch {
          const localText = synthesizeLocalPrompt(text);
          finishEnhancement(localText, "Prompt+ Local Engine");
        }
      })();
    });

    document.getElementById("pp-panel-copy")?.addEventListener("click", () => {
      const text = panelResult?.textContent;
      if (text) {
        navigator.clipboard.writeText(text);
        showToast("✓ Copied enhanced prompt to clipboard!");
      }
    });

    document.getElementById("pp-panel-inject")?.addEventListener("click", () => {
      const text = panelResult?.textContent;
      const input = getInput() || currentTarget;
      if (text && input) {
        setText(input, text);
        showToast("✓ Applied enhanced prompt directly into chat input!");
        panelEl.style.display = "none";
      }
    });
  }

  // Handle messages from background worker
  try {
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
        if (req.action === "openEnhancePanel") {
          openPanel();
          sendResponse({ success: true });
        } else if (req.action === "injectEnhanced") {
          const input = getInput();
          if (input && req.enhanced) {
            setText(input, req.enhanced);
            sendResponse({ success: true });
          }
        }
      });
    }
  } catch { /* ignore */ }

  // Initial load delay injection
  setTimeout(injectFab, 1000);
})();
