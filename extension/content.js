(function () {
  const STORAGE_KEY = "pp_settings";
  const HISTORY_KEY = "pp_history";
  let panelEl = null;
  let currentTarget = null;
  let currentText = "";
  let currentEnhanced = "";
  let currentMode = "api";

  const CONTEXT_LIMITS = { chatgpt: 128000, claude: 200000, gemini: 1000000, deepseek: 128000 };

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

  function updateTokenBar() {
    const fill = document.getElementById("pp-token-fill");
    const usedEl = document.getElementById("pp-token-used");
    const pctEl = document.getElementById("pp-token-pct");
    const limitEl = document.getElementById("pp-token-limit");
    if (!fill || !usedEl) return;
    const info = getTokenInfo();
    usedEl.textContent = info.used.toLocaleString();
    if (limitEl) limitEl.textContent = (info.limit / 1000).toFixed(0) + "K";
    if (pctEl) pctEl.textContent = info.pct + "%";
    fill.style.width = info.pct + "%";
    if (info.pct > 80) fill.style.background = "linear-gradient(90deg, #f59e0b, #ef4444)";
    else fill.style.background = "#6366f1";
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
    let el = document.querySelector("#prompt-textarea, textarea[data-id='root']");
    if (el) return el;
    el = document.querySelector("div[contenteditable='true'].ProseMirror, textarea");
    if (el && location.hostname.includes("claude")) return el;
    el = document.querySelector("div[contenteditable='true'], textarea");
    if (el && location.hostname.includes("gemini")) return el;
    el = document.querySelector("#chat-input, .ds-textarea, textarea[placeholder*='Ask'], textarea[placeholder*='prompt']");
    if (el) return el;
    el = document.querySelector("div[contenteditable='true']");
    if (el) return el;
    return document.querySelector("textarea");
  }

  function getText(el) {
    if (!el) return "";
    return el.tagName === "TEXTAREA" || el.tagName === "INPUT" ? el.value : el.innerText || el.textContent || "";
  }

  function setText(el, text) {
    if (!el) return;
    try {
      el.focus();
    } catch { /* ignore focus error */ }

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
      } catch { /* fallback to innerText below */ }

      if (!inserted) {
        el.innerText = text;
      }

      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function loadSettings(cb) {
    try {
      if (!chrome?.storage?.local) { cb({}); return; }
      chrome.storage.local.get(STORAGE_KEY, (d) => {
        if (chrome.runtime.lastError) { cb({}); return; }
        cb(d[STORAGE_KEY] || {});
      });
    } catch {
      cb({});
    }
  }

  function saveSettings(s, cb) {
    try {
      if (!chrome?.storage?.local) return;
      chrome.storage.local.get(STORAGE_KEY, (d) => {
        if (chrome.runtime.lastError) return;
        const cur = d[STORAGE_KEY] || {};
        Object.assign(cur, s);
        chrome.storage.local.set({ [STORAGE_KEY]: cur }, () => cb && cb());
      });
    } catch { /* ignore extension context invalidation */ }
  }

  function saveHistory(item) {
    try {
      if (!chrome?.storage?.local) return;
      chrome.storage.local.get(HISTORY_KEY, (d) => {
        if (chrome.runtime.lastError) return;
        let h = d[HISTORY_KEY] || [];
        h = [{ text: item.slice(0, 80), ts: Date.now() }, ...h].slice(0, 10);
        chrome.storage.local.set({ [HISTORY_KEY]: h });
      });
    } catch { /* ignore context invalidation */ }
  }

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

  let fabTimer = null;

  function updateFabTokenBar() {
    const usedEl = document.getElementById("pp-fab-used");
    const limitEl = document.getElementById("pp-fab-limit");
    const remainEl = document.getElementById("pp-fab-remain");
    const fillEl = document.getElementById("pp-fab-fill");
    if (!usedEl || !remainEl || !fillEl) return;

    const info = getTokenInfo();
    usedEl.textContent = info.used > 1000 ? (info.used / 1000).toFixed(1) + "K" : info.used;
    if (limitEl) {
      limitEl.textContent = info.limit >= 1000000 ? (info.limit / 1000000).toFixed(0) + "M" : (info.limit / 1000).toFixed(0) + "K";
    }

    const remStr = info.remaining >= 1000 ? (info.remaining / 1000).toFixed(1) + "K" : info.remaining;
    remainEl.textContent = remStr;

    fillEl.style.width = info.pct + "%";
    if (info.pct > 80) fillEl.style.background = "linear-gradient(90deg, #f59e0b, #ef4444)";
    else if (info.pct > 50) fillEl.style.background = "linear-gradient(90deg, #6366f1, #f59e0b)";
    else fillEl.style.background = "#6366f1";
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

    try {
      if (chrome?.storage?.local) {
        chrome.storage.local.get("pp_settings", (data) => {
          const saved = data?.pp_settings || {};
          if (saved.mode) currentMode = saved.mode;
          else currentMode = "api";
        });
      }
    } catch {
      currentMode = "api";
    }

    const bar = document.createElement("div");
    bar.className = "pp-fab-bar";
    bar._targetInput = input;

    bar.innerHTML =
      '<div class="pp-fab-brain-badge" title="Prompt+ Intelligence Engine" style="background: transparent; padding: 0;">' +
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
      openPanel();
    };

    bar.querySelector(".pp-fab-brain-badge")?.addEventListener("click", handleEnhanceClick);
    bar.querySelector("#pp-fab-btn")?.addEventListener("click", handleEnhanceClick);

    bar.querySelector("#pp-fab-bucket-cap").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      captureContextBucket();
    });

    const injBtn = bar.querySelector("#pp-fab-bucket-inj");
    const injText = bar.querySelector("#pp-fab-bucket-inj-text");
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
            if (injText) injText.textContent = `Inject (${b.source || "Bucket"})`;
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

    input.addEventListener("input", updateFabTokenBar, { passive: true });
    window.addEventListener("scroll", schedulePosition, { passive: true });
    window.addEventListener("resize", schedulePosition, { passive: true });

    // Dynamic container observer for realtime resizing & layout shifts
    try {
      const container = getChatContainer(input) || input;
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(schedulePosition);
        ro.observe(container);
      }
    } catch { /* fallback */ }

    updateFabTokenBar();
    schedulePosition();
    if (fabTimer) clearInterval(fabTimer);
    fabTimer = setInterval(updateFabTokenBar, 2500);
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

    // Position floating toolbar cleanly above top-right of chat container
    const barHeight = bar.offsetHeight || 36;
    const barWidth = bar.offsetWidth || 320;
    const viewportWidth = window.innerWidth;

    let top = rect.top - barHeight - 6;
    if (top < 8) {
      // If near top of viewport, dock top-right inside container
      top = rect.top + 8;
    }

    // Align to top-right of chat input card
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
      background: "rgba(10,10,12,0.9)", color: "#f1f5f9", padding: "10px 20px", borderRadius: "14px",
      fontSize: "13px", zIndex: "100000001", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      border: "1px solid rgba(124,58,237,0.3)", fontFamily: "-apple-system, sans-serif",
      backdropFilter: "blur(12px)", transition: "opacity 0.3s",
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2000);
  }

  let tokenInterval = null;

  function openPanel() {
    if (panelEl) { closePanel(); return; }
    const input = currentTarget || getInput();
    const text = currentText || (input ? getText(input) : "");

    settings = null;
    loadSettings((s) => {
      settings = s;
      currentMode = s.mode || "api";
      renderPanel(input, text, settings);
      if (text.trim()) {
        doEnhance(input, text);
      }
    });
  }

  function closePanel() {
    if (panelEl) { panelEl.remove(); panelEl = null; }
    document.removeEventListener("keydown", ppEscHandler);
    if (tokenInterval) { clearInterval(tokenInterval); tokenInterval = null; }
  }

  let settings = null;

  // ---- Primary Side Panel UX ----


  function getLanguageModelAPI() {
    if (typeof LanguageModel !== "undefined") return LanguageModel;
    if (typeof window !== "undefined" && window.LanguageModel) return window.LanguageModel;
    if (typeof ai !== "undefined" && ai.languageModel) return ai.languageModel;
    if (typeof window !== "undefined" && window.ai?.languageModel) return window.ai.languageModel;
    return null;
  }

  async function runDeviceEnhanceInContent(text, tokenSaver, targetId) {
    const lm = getLanguageModelAPI();
    if (!lm) throw new Error("On-device AI not supported. Needs Chrome 138+ with Gemini Nano.");
    const availability = await lm.availability();
    if (availability === "unavailable" || availability === "no") throw new Error("Gemini Nano unavailable on this device.");

    const session = await lm.create({ temperature: 0.1, topK: 1 });
    try {
      const systemInstruction = `You are the Prompt+ Architect Engine — an advanced AI meta-prompt compiler.
Your task is to transform raw, simple, or incomplete user prompts into production-grade, highly structured AI instructions.
Return ONLY the final enhanced prompt framework ready for immediate execution by AI models. Do NOT add introductory or conversational meta-text.`;
      const tokenSaverClause = tokenSaver ? "\nTighten the output to ~40% fewer tokens while keeping every section complete and lossless." : "";
      const metaPrompt = `[ORIGINAL USER PROMPT]:\n"${text.trim()}"\n\n[TARGET DOMAIN]: General Task\n[PREFERRED TONE]: Professional & Clear\n[TARGET OUTPUT LENGTH]: Comprehensive & Structured\n\n[META-PROMPT INSTRUCTIONS]:\nRewrite the prompt above into a master AI prompt framework with: 1. ### Role & Objective 2. ### Context & Domain Constraints 3. ### Step-by-Step Instructions 4. ### Output Format & Constraints 5. ### Input Variables${tokenSaverClause}`;

      let full = "";
      try {
        const stream = await session.promptStreaming(`${systemInstruction}\n\n${metaPrompt}`);
        for await (const chunk of stream) {
          if (!chunk) continue;
          full = chunk;
          const r = document.getElementById(targetId);
          if (r) { r.textContent = full; r.scrollTop = r.scrollHeight; }
        }
      } catch { /* fallback to prompt */ }

      if (!full.trim()) {
        full = await session.prompt(`${systemInstruction}\n\n${metaPrompt}`);
        const r = document.getElementById(targetId);
        if (r) r.textContent = full;
      }
      return { success: true, enhanced: full.trim() };
    } finally {
      session.destroy();
    }
  }

  function compileMasterArchitectPrompt(rawText, tokenSaver = false) {
    const clean = (rawText || "").trim();
    if (!clean) return "";

    const lower = clean.toLowerCase();
    let role = "Senior Domain Expert & AI Architect";
    let domain = "General Execution & Technical Solution Design";

    if (lower.includes("code") || lower.includes("python") || lower.includes("js") || lower.includes("react") || lower.includes("bug") || lower.includes("api") || lower.includes("function") || lower.includes("fix") || lower.includes("sql") || lower.includes("db")) {
      role = "Principal Software Architect & Lead Engineer";
      domain = "Software Architecture & Production Engineering";
    } else if (lower.includes("write") || lower.includes("blog") || lower.includes("article") || lower.includes("email") || lower.includes("post") || lower.includes("copy") || lower.includes("essay")) {
      role = "Elite Copywriter & Technical Content Director";
      domain = "Strategic Content Creation & Professional Writing";
    } else if (lower.includes("market") || lower.includes("seo") || lower.includes("ad") || lower.includes("sales") || lower.includes("growth") || lower.includes("campaign")) {
      role = "Chief Marketing Officer & Growth Strategist";
      domain = "Digital Growth & Brand Positioning";
    } else if (lower.includes("data") || lower.includes("analyze") || lower.includes("report") || lower.includes("chart") || lower.includes("metric")) {
      role = "Staff Data Scientist & Business Intelligence Lead";
      domain = "Data Analytics & Strategic Insights";
    }

    const tokenClause = tokenSaver
      ? "\n- Conciseness: Apply ~40% token optimization while retaining 100% structural fidelity."
      : "";

    return `### Role & Persona\nAct as an elite ${role} with deep technical domain expertise in ${domain}. Your goal is to solve the request below with maximum clarity, accuracy, and depth.\n\n### Core Objective\n${clean}\n\n### Context & Execution Constraints\n- **Tone & Style**: Professional, practical, authoritative, and direct. Zero introductory or conversational filler text.\n- **Accuracy**: Deliver concrete, tested solutions, templates, or step-by-step guidance.\n- **Structure**: Organize output into clear, logical headers, bullet points, and syntax-highlighted code blocks.${tokenClause}\n\n### Step-by-Step Execution Plan\n1. **Requirements Analysis**: Deconstruct the request into core technical components and objectives.\n2. **Strategy & Planning**: Formulate the optimal, edge-case resilient solution strategy.\n3. **Execution & Deliverables**: Deliver complete, production-grade results with zero omitted placeholders.\n4. **Validation & Best Practices**: Review against industry standards, performance efficiency, and security best practices.\n\n### Output Formatting\nProvide clean Markdown formatting with clear section headers, bold key takeaways, and copy-paste ready code blocks.`;
  }

  function sendDeviceEnhance(text, tokenSaver, targetId) {
    return new Promise((resolve) => {
      const handler = (msg) => {
        const r = document.getElementById(targetId);
        if (!r) return;
        if (msg.action === "deviceChunk" && msg.text) { r.textContent = msg.text; if (r.scrollTop + r.clientHeight >= r.scrollHeight - 20) r.scrollTop = r.scrollHeight; }
      };
      chrome.runtime.onMessage.addListener(handler);
      chrome.runtime.sendMessage({ action: "enhanceDevice", text, tokenSaver }).then(async (r) => {
        chrome.runtime.onMessage.removeListener(handler);
        if (r && r.success) {
          resolve(r);
        } else {
          try {
            const localRes = await runDeviceEnhanceInContent(text, tokenSaver, targetId);
            resolve(localRes);
          } catch {
            const apiRes = await enhanceApi(text, targetId);
            resolve(apiRes);
          }
        }
      }).catch(async () => {
        chrome.runtime.onMessage.removeListener(handler);
        try {
          const localRes = await runDeviceEnhanceInContent(text, tokenSaver, targetId);
          resolve(localRes);
        } catch {
          const apiRes = await enhanceApi(text, targetId);
          resolve(apiRes);
        }
      });
    });
  }



  function renderPanel(input, text, s) {
    panelEl = document.createElement("div");
    panelEl.className = "pp-panel";

    panelEl.innerHTML =
      '<div class="pp-backdrop"></div>' +
      '<div class="pp-side">' +
      '<div class="pp-side-inner">' +
      '<div class="pp-head">' +
      '<div class="pp-head-left">' +
      '<div class="pp-head-icon">⚡</div>' +
      '<div class="pp-head-info">' +
      '<div class="pp-head-title">Prompt+ Intelligence Activated</div>' +
      '<div class="pp-head-enc"><span class="pp-enc-dot"></span> END-TO-END ENCRYPTED</div>' +
      '</div>' +
      '</div>' +
      '<button class="pp-close-btn" id="pp-close-btn">✕</button>' +
      '</div>' +
      '<div class="pp-tab-bar-wrap">' +
      '<div class="pp-tab-track">' +
      '<button class="pp-tab-btn active" id="pp-tab-improved" type="button">Improved</button>' +
      '<button class="pp-tab-btn" id="pp-tab-changes" type="button">Changes</button>' +
      '</div>' +
      '</div>' +
      '<div class="pp-body" id="pp-body">' +
      '<div class="pp-split-view">' +
      '<div class="pp-col-left">' +
      '<div class="pp-split-label">ORIGINAL</div>' +
      '<div class="pp-split-original" id="pp-original-preview"></div>' +
      '</div>' +
      '<div class="pp-col-right">' +
      '<div id="pp-view-improved">' +
      '<div class="pp-split-header">' +
      '<div class="pp-split-label-right">IMPROVED</div>' +
      '<button class="pp-copy-chip" id="pp-copy-btn" disabled>📋 Copy</button>' +
      '</div>' +
      '<div class="pp-split-improved" id="pp-enhanced-preview">' +
      '<div class="pp-placeholder">Click "Apply Upgrade" below to see the AI-optimized result</div>' +
      '</div>' +
      '<div id="pp-structured-sections" style="display:none; margin-top: 12px;">' +
      '<div class="pp-section">' +
      '<div class="pp-section-head"><div class="pp-section-bar"></div><span class="pp-section-title">ROLE</span></div>' +
      '<div class="pp-section-body" id="pp-role-body">—</div>' +
      '</div>' +
      '<div class="pp-section">' +
      '<div class="pp-section-head"><div class="pp-section-bar"></div><span class="pp-section-title">CONTEXT</span></div>' +
      '<div class="pp-section-body" id="pp-context-body">—</div>' +
      '</div>' +
      '<div class="pp-section">' +
      '<div class="pp-section-head"><div class="pp-section-bar"></div><span class="pp-section-title">INSTRUCTIONS</span></div>' +
      '<div class="pp-section-body" id="pp-instructions-body">—</div>' +
      '</div>' +
      '<div class="pp-section">' +
      '<div class="pp-section-head"><div class="pp-section-bar"></div><span class="pp-section-title">CONSTRAINTS</span></div>' +
      '<div class="pp-section-body" id="pp-constraints-body">—</div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div id="pp-view-changes" style="display:none;">' +
      '<div class="pp-outcome-badge">✨ OUTCOME: STRONG STRUCTURAL UPGRADE</div>' +
      '<ul class="pp-changes-list">' +
      '<li><span class="pp-check">✓</span> Expanded minimal instructions into a multi-step strategic action plan.</li>' +
      '<li><span class="pp-check">✓</span> Introduced measurable constraints to improve output precision and control.</li>' +
      '<li><span class="pp-check">✓</span> Added expert role definition to align AI tone and perspective.</li>' +
      '<li><span class="pp-check">✓</span> Expanded real-world context to reduce generic responses.</li>' +
      '</ul>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="pp-opt-row">' +
      '<div class="pp-opt-info"><div class="pp-opt-label">Token Saver</div><div class="pp-opt-sub">Concise output, ~40% fewer tokens</div></div>' +
      '<label class="pp-toggle"><input type="checkbox" id="pp-ts-toggle"><div class="pp-toggle-slider"></div></label>' +
      '</div>' +
      '<div class="pp-model-row">' +
      '<label class="pp-model-label">Model</label>' +
      '<select id="pp-model" class="pp-select">' +
      '<optgroup label="OpenRouter Free Tier">' +
      '<option value="google/gemini-2.0-flash-exp:free::openrouter" selected>Gemini 2.0 Flash (Free)</option>' +
      '<option value="deepseek/deepseek-r1:free::openrouter">DeepSeek R1 (Free)</option>' +
      '<option value="meta-llama/llama-3.1-8b-instruct:free::openrouter">Llama 3.1 8B (Free)</option>' +
      '<option value="qwen/qwen-2.5-coder-32b-instruct:free::openrouter">Qwen 2.5 Coder 32B (Free)</option>' +
      '<option value="mistralai/mistral-7b-instruct:free::openrouter">Mistral 7B (Free)</option>' +
      '</optgroup>' +
      '<optgroup label="OpenAI ChatGPT">' +
      '<option value="gpt-4o-mini::openai">ChatGPT GPT-4o Mini</option>' +
      '<option value="gpt-4o::openai">ChatGPT GPT-4o</option>' +
      '<option value="o3-mini::openai">ChatGPT o3-Mini (Reasoning)</option>' +
      '</optgroup>' +
      '<optgroup label="Anthropic Claude">' +
      '<option value="claude-3-5-sonnet-20241022::anthropic">Claude 3.5 Sonnet</option>' +
      '<option value="claude-3-5-haiku-20241022::anthropic">Claude 3.5 Haiku</option>' +
      '<option value="claude-3-opus-20240229::anthropic">Claude 3 Opus</option>' +
      '</optgroup>' +
      '<optgroup label="NVIDIA Nim Free Tier">' +
      '<option value="meta/llama-3.3-70b-instruct::nvidia">Llama 3.3 70B (NV)</option>' +
      '<option value="nvidia/llama-3.1-nemotron-70b-instruct::nvidia">Nemotron 70B (NV)</option>' +
      '<option value="google/gemma-2-27b-it::nvidia">Gemma 2 27B (NV)</option>' +
      '</optgroup>' +
      '</select>' +
      '</div>' +
      '</div>' +
      '<div class="pp-token-bar" id="pp-token-bar">' +
      '<div class="pp-token-label"><span>Context: <strong id="pp-token-used">0</strong> / <strong id="pp-token-limit">128K</strong> tokens</span><span id="pp-token-pct">0%</span></div>' +
      '<div class="pp-token-track"><div class="pp-token-fill" id="pp-token-fill" style="width:0%"></div></div>' +
      '</div>' +
      '<div class="pp-footer">' +
      '<div class="pp-footer-credit">Optimized by <strong>Prompt+</strong></div>' +
      '<div class="pp-footer-actions">' +
      '<button class="pp-btn-keep" id="pp-keep-btn">Keep Original</button>' +
      '<button class="pp-btn-apply" id="pp-enhance-btn">' +
      '<span class="pp-btn-spinner" style="display:none"></span>' +
      '<span id="pp-enhance-text">Apply Upgrade</span>' +
      '<span>→</span>' +
      '</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>';

    document.body.appendChild(panelEl);

    requestAnimationFrame(() => {
      panelEl.querySelector(".pp-backdrop").style.opacity = "1";
      panelEl.querySelector(".pp-side").style.transform = "translateX(0)";
    });

    updateTokenBar();
    if (tokenInterval) clearInterval(tokenInterval);
    tokenInterval = setInterval(updateTokenBar, 3000);

    panelEl.querySelector("#pp-original-preview").textContent = text;

    if (s?.tokenSaver) {
      const cb = panelEl.querySelector("#pp-ts-toggle");
      if (cb) cb.checked = true;
    }
    if (currentMode === "device") {
      const modelRow = panelEl.querySelector(".pp-model-row");
      if (modelRow) modelRow.style.display = "none";
    } else if (s && s.model) {
      const sel = panelEl.querySelector("#pp-model");
      if (sel) sel.value = s.model;
    }

    const tabImp = panelEl.querySelector("#pp-tab-improved");
    const tabChg = panelEl.querySelector("#pp-tab-changes");
    const viewImp = panelEl.querySelector("#pp-view-improved");
    const viewChg = panelEl.querySelector("#pp-view-changes");

    if (tabImp && tabChg) {
      tabImp.addEventListener("click", () => {
        tabImp.classList.add("active");
        tabChg.classList.remove("active");
        if (viewImp) viewImp.style.display = "block";
        if (viewChg) viewChg.style.display = "none";
      });
      tabChg.addEventListener("click", () => {
        tabChg.classList.add("active");
        tabImp.classList.remove("active");
        if (viewImp) viewImp.style.display = "none";
        if (viewChg) viewChg.style.display = "block";
      });
    }

    panelEl.querySelector("#pp-close-btn").onclick = closePanel;
    panelEl.querySelector(".pp-backdrop")?.addEventListener("click", closePanel);
    document.addEventListener("keydown", ppEscHandler);

    const botUrls = { chatgpt: "https://chatgpt.com", claude: "https://claude.ai", gemini: "https://gemini.google.com", deepseek: "https://chat.deepseek.com" };
    panelEl.querySelectorAll(".pp-bot-pill").forEach((pill) => {
      const idx = Array.from(pill.parentElement.children).indexOf(pill);
      const url = Object.values(botUrls)[idx];
      if (url) pill.style.cursor = "pointer";
      pill.addEventListener("click", (e) => { e.stopPropagation(); if (url) window.open(url, "_blank"); });
    });

    panelEl.querySelector("#pp-keep-btn").onclick = () => {
      if (currentText) setText(input, currentText);
      closePanel();
    };

    panelEl.querySelector("#pp-enhance-btn").onclick = () => {
      const activeInput = currentTarget || input || getInput();
      const txt = (activeInput ? getText(activeInput) : "") || currentText;
      doEnhance(activeInput, txt);
    };

    panelEl.querySelector("#pp-copy-btn").onclick = () => {
      const val = panelEl.querySelector("#pp-enhanced-preview").textContent;
      if (!val) return;
      navigator.clipboard.writeText(val);
      const copyBtn = panelEl.querySelector("#pp-copy-btn");
      copyBtn.textContent = "✓ Copied";
      setTimeout(() => { copyBtn.textContent = "📋 Copy"; }, 1500);
    };

    panelEl.querySelector("#pp-model").addEventListener("change", (e) => {
      saveSettings({ model: e.target.value });
    });
    panelEl.querySelector("#pp-ts-toggle")?.addEventListener("change", (e) => {
      saveSettings({ tokenSaver: e.target.checked });
    });
  }

  let enhancing = false;

  async function doEnhance(input, text) {
    if (enhancing) return;

    const el = input || currentTarget || getInput();
    const promptText = (text || currentText || (el ? getText(el) : "")).trim();

    if (!promptText) {
      const preview = document.getElementById("pp-enhanced-preview");
      if (preview) preview.textContent = "Type a prompt in the chat input field first, then click Enhance!";
      return;
    }

    text = promptText;
    enhancing = true;
    currentEnhanced = "";

    const fabText = document.getElementById("pp-fab-text");
    const fabTextOrig = fabText?.textContent || "";

    const btn = document.getElementById("pp-enhance-btn");
    const btnText = document.getElementById("pp-enhance-text");
    const spinner = btn?.querySelector(".pp-btn-spinner");
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = "Enhancing…";
    if (spinner) spinner.style.display = "inline-block";
    if (fabText) fabText.textContent = "Enhancing…";

    const enhancedPreview = document.getElementById("pp-enhanced-preview");
    const copyBtn = document.getElementById("pp-copy-btn");
    const sections = document.getElementById("pp-structured-sections");

    try {
      const tsEl = document.getElementById("pp-ts-toggle");
      const tkSave = tsEl ? tsEl.checked : false;
      let res;
      if (currentMode === "device") {
        try {
          res = await sendDeviceEnhance(text, tkSave, "pp-enhanced-preview");
          if (res && res.success) {
            currentEnhanced = res.enhanced || res.data?.enhanced || "";
          }
        } catch { /* device AI unavailable, fallback seamlessly to Cloud API */ }
      }

      if (!currentEnhanced) {
        try {
          const modelVal = document.getElementById("pp-model")?.value || "google/gemini-2.0-flash-exp:free::openrouter";
          const parts = modelVal.split("::");
          const model = parts[0];
          const provider = parts[1] || "openrouter";
          res = await new Promise((resolve) => {
            try {
              chrome.runtime.sendMessage({ action: "enhancePrompt", text, model, provider, tokenSaver: tkSave }, (r) => {
                if (chrome.runtime.lastError) resolve(null);
                else resolve(r);
              });
            } catch { resolve(null); }
          });
          if (res && res.success) {
            currentEnhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
          }
        } catch { /* ignore network error & fallback */ }
      }

      if (!currentEnhanced) {
        currentEnhanced = compileMasterArchitectPrompt(text, tkSave);
      }

      if (!currentEnhanced) throw new Error("No output received");
      if (enhancedPreview) enhancedPreview.textContent = currentEnhanced;
      if (copyBtn) copyBtn.disabled = false;

      if (sections) {
        sections.style.display = "block";
        parseAndFillSections(currentEnhanced);
      }

      if (btnText) btnText.textContent = "Apply Upgrade";
      if (btn) {
        btn.disabled = false;
        btn.onclick = () => {
          if (currentEnhanced) setText(input, currentEnhanced);
          closePanel();
        };
      }

      saveHistory(text);
    } catch (err) {
      showToast(err.message);
      if (btnText) btnText.textContent = "Apply Upgrade";
      if (btn) btn.disabled = false;
      if (err.message && (err.message.includes("No API key") || err.message.includes("API key"))) {
        if (enhancedPreview) {
          enhancedPreview.innerHTML =
            '<div style="padding: 8px; color: #f4f4f5;">' +
            '<div style="font-weight: 600; color: #f59e0b; margin-bottom: 6px; font-size: 13px;">🔑 No API Key Configured</div>' +
            '<div style="font-size: 12px; color: #94a3b8; margin-bottom: 12px; line-height: 1.5;">' +
            'No API key configured on server. You can switch to free <strong>On-Device AI</strong> (Gemini Nano) or add an API key in extension popup settings.' +
            '</div>' +
            '<button id="pp-panel-switch-device" type="button" style="padding: 8px 14px; background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.5); color: #a5b4fc; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">' +
            '📱 Switch to On-Device AI' +
            '</button>' +
            '</div>';
          document.getElementById("pp-panel-switch-device")?.addEventListener("click", () => {
            currentMode = "device";
            const modelRow = panelEl?.querySelector(".pp-model-row");
            if (modelRow) modelRow.style.display = "none";
            saveSettings({ mode: "device" });
            doEnhance(input, text);
          });
        }
      }
    } finally {
      enhancing = false;
      if (spinner) spinner.style.display = "none";
      if (fabText) fabText.textContent = fabTextOrig;
    }
  }

  function parseAndFillSections(enhanced) {
    const roleEl = document.getElementById("pp-role-body");
    const ctxEl = document.getElementById("pp-context-body");
    const instEl = document.getElementById("pp-instructions-body");
    const constEl = document.getElementById("pp-constraints-body");

    const lines = enhanced.split("\n");
    let role = "", context = "", instructions = "", constraints = "";
    let current = "instructions";
    for (const line of lines) {
      const lower = line.toLowerCase().trim();
      if (lower.startsWith("role:") || lower.startsWith("act as") || lower.startsWith("you are")) {
        current = "role";
        role += line.replace(/^(role:|act as|you are)\s*/i, "") + "\n";
      } else if (lower.startsWith("context:") || lower.startsWith("background:")) {
        current = "context";
        context += line.replace(/^(context:|background:)\s*/i, "") + "\n";
      } else if (lower.startsWith("instructions:") || lower.startsWith("task:")) {
        current = "instructions";
        instructions += line.replace(/^(instructions:|task:)\s*/i, "") + "\n";
      } else if (lower.startsWith("constraints:") || lower.startsWith("rules:") || lower.startsWith("requirements:")) {
        current = "constraints";
        constraints += line.replace(/^(constraints:|rules:|requirements:)\s*/i, "") + "\n";
      } else {
        if (current === "role") role += line + "\n";
        else if (current === "context") context += line + "\n";
        else if (current === "constraints") constraints += line + "\n";
        else instructions += line + "\n";
      }
    }

    if (roleEl) roleEl.textContent = role.trim() || "";
    if (ctxEl) ctxEl.textContent = context.trim() || "";
    if (instEl) instEl.textContent = instructions.trim() || enhanced.slice(0, 200);
    if (constEl) constEl.textContent = constraints.trim() || "";
  }

  function ppEscHandler(e) {
    if (e.key === "Escape") closePanel();
  }

  const style = document.createElement("style");
  style.textContent = `
.pp-fab-bar {
  position: fixed !important;
  z-index: 99999999 !important;
  box-sizing: border-box !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  width: fit-content !important;
  height: 38px !important;
  margin: 0 !important;
  transition: opacity 0.15s ease !important;
}
.pp-fab-bar .pp-fab-brain-badge {
  all: initial !important;
  box-sizing: border-box !important;
  width: 38px !important;
  height: 38px !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, #2e1065 0%, #3b0764 100%) !important;
  border: 1px solid rgba(168, 85, 247, 0.4) !important;
  color: #c084fc !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 4px 14px rgba(59, 7, 100, 0.5) !important;
  cursor: pointer !important;
  pointer-events: auto !important;
  user-select: none !important;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.pp-fab-bar .pp-fab-brain-badge * { pointer-events: none !important; }
.pp-fab-bar .pp-fab-btn * { pointer-events: none !important; }
.pp-fab-bar .pp-fab-brain-badge:hover {
  transform: scale(1.08) rotate(6deg) !important;
}
.pp-fab-bar .pp-fab-btn {
  all: initial !important;
  box-sizing: border-box !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  height: 38px !important;
  padding: 0 20px !important;
  border-radius: 9999px !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
  color: #ffffff !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 4px 16px rgba(29, 78, 216, 0.45) !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  margin: 0 !important;
  outline: none !important;
}
.pp-fab-bar .pp-fab-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  transform: translateY(-1px) scale(1.02) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 6px 20px rgba(29, 78, 216, 0.6) !important;
}
.pp-fab-bar .pp-fab-btn:active {
  transform: translateY(0px) scale(0.97) !important;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.2) !important;
}
.pp-fab-bar .pp-fab-btn-sub {
  all: initial !important;
  box-sizing: border-box !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
  font-size: 13px !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}
.pp-fab-bar .pp-fab-btn-sub:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  transform: scale(1.08) !important;
}

.pp-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 99999999; opacity: 0; transition: opacity 0.25s ease; }

.pp-side { position: fixed; top: 0; right: 0; width: 560px; max-width: 96vw; height: 100vh; z-index: 100000000; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.pp-side-inner { height: 100%; background: #ffffff; display: flex; flex-direction: column; box-shadow: -12px 0 50px rgba(15, 23, 42, 0.15); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }

.pp-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
.pp-head-left { display: flex; align-items: center; gap: 12px; }
.pp-head-icon { width: 38px; height: 38px; border-radius: 10px; background: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; font-weight: bold; }
.pp-head-info { display: flex; flex-direction: column; gap: 3px; }
.pp-head-title { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
.pp-head-enc { font-size: 10px; font-weight: 700; color: #0284c7; background: #e0f2fe; border: 1px solid #bae6fd; padding: 2px 8px; border-radius: 9999px; letter-spacing: 0.04em; display: inline-flex; align-items: center; gap: 4px; width: fit-content; }
.pp-enc-dot { width: 6px; height: 6px; border-radius: 50%; background: #0284c7; display: inline-block; animation: ppPulse 2s infinite; }
@keyframes ppPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.pp-close-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.pp-close-btn:hover { background: #f1f5f9; color: #0f172a; }

.pp-tab-bar-wrap { display: flex; justify-content: center; padding: 14px 24px 0; background: #ffffff; flex-shrink: 0; }
.pp-tab-track { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 9999px; padding: 3px; display: inline-flex; gap: 4px; }
.pp-tab-btn { border-radius: 9999px; padding: 6px 24px; font-size: 13px; font-weight: 600; cursor: pointer; border: 2px solid transparent; background: transparent; color: #64748b; transition: all 0.2s ease; outline: none; font-family: inherit; }
.pp-tab-btn.active { background: #ffffff; border-color: #10b981; color: #047857; font-weight: 700; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); }

.pp-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; background: #ffffff; }
.pp-split-view { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.pp-col-left, .pp-col-right { display: flex; flex-direction: column; gap: 10px; }

.pp-split-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
.pp-split-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.pp-split-label-right { font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.06em; }
.pp-copy-chip { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.pp-copy-chip:hover { background: #e2e8f0; color: #0f172a; }

.pp-split-original { background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; font-size: 13px; line-height: 1.7; min-height: 120px; white-space: pre-wrap; word-break: break-word; }
.pp-split-improved { background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; font-size: 13px; line-height: 1.7; min-height: 80px; white-space: pre-wrap; word-break: break-word; }

.pp-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); }
.pp-section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.pp-section-bar { width: 4px; height: 16px; border-radius: 2px; background: #2563eb; }
.pp-section-title { font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; }
.pp-section-body { font-size: 13px; line-height: 1.6; color: #475569; white-space: pre-wrap; word-break: break-word; }

.pp-outcome-badge { background: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 6px; display: inline-block; margin-bottom: 16px; letter-spacing: 0.02em; }
.pp-changes-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
.pp-changes-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #334155; line-height: 1.5; }
.pp-check { color: #2563eb; font-weight: bold; flex-shrink: 0; font-size: 14px; }

.pp-opt-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-top: 1px solid #f1f5f9; }
.pp-opt-info { display: flex; flex-direction: column; gap: 1px; }
.pp-opt-label { font-size: 12px; font-weight: 600; color: #0f172a; }
.pp-opt-sub { font-size: 10px; color: #64748b; }
.pp-toggle { position: relative; width: 34px; height: 20px; flex-shrink: 0; cursor: pointer; }
.pp-toggle input { display: none; }
.pp-toggle-slider { position: absolute; inset: 0; background: #cbd5e1; border-radius: 10px; transition: 0.2s; cursor: pointer; }
.pp-toggle-slider::before { content: ""; position: absolute; width: 14px; height: 14px; left: 3px; bottom: 3px; background: #ffffff; border-radius: 50%; transition: 0.2s; }
.pp-toggle input:checked + .pp-toggle-slider { background: #2563eb; }
.pp-toggle input:checked + .pp-toggle-slider::before { transform: translateX(14px); background: #ffffff; }

.pp-model-row { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
.pp-model-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
.pp-select { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; color: #0f172a; padding: 8px 30px 8px 12px; font-size: 13px; font-family: inherit; outline: none; cursor: pointer; transition: border-color 0.15s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }

.pp-token-bar { padding: 8px 24px 6px; background: #f8fafc; border-top: 1px solid #e2e8f0; flex-shrink: 0; }
.pp-token-label { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; margin-bottom: 5px; }
.pp-token-label strong { color: #0284c7; font-weight: 600; }
.pp-token-track { height: 4px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.pp-token-fill { height: 100%; border-radius: 4px; background: #0284c7; transition: width 0.6s ease; }

.pp-footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; flex-shrink: 0; }
.pp-footer-credit { font-size: 12px; color: #64748b; }
.pp-footer-credit strong { color: #0f172a; font-weight: 700; }
.pp-footer-actions { display: flex; gap: 10px; }

.pp-btn-keep { padding: 10px 20px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.pp-btn-keep:hover { background: #f1f5f9; color: #0f172a; }

.pp-btn-apply { padding: 10px 24px; border-radius: 8px; border: none; background: #0284c7; color: #ffffff; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; font-family: inherit; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35); }
.pp-btn-apply:hover { background: #0369a1; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(2, 132, 199, 0.45); }
.pp-btn-apply:active { transform: translateY(0px); }
.pp-btn-apply:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.pp-btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: ppSpin 0.6s linear infinite; }
@keyframes ppSpin { to { transform: rotate(360deg); } }

/* Compact popover */
.pp-popover {
  position: fixed;
  width: 460px;
  max-width: calc(100vw - 24px);
  max-height: 70vh;
  background: #0a0a0c;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  box-shadow: 0 16px 60px rgba(0,0,0,0.55);
  z-index: 100000000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable", "Segoe UI", sans-serif;
  color: #f4f4f5;
}
.pp-pop-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.pp-pop-title { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 7px; }
.pp-pop-mode {
  font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 6px;
  background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.4); color: #a5b4fc;
  margin-left: auto; margin-right: 8px;
}
.pp-pop-close {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: #64748b; cursor: pointer; padding: 5px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.pp-pop-close:hover { background: rgba(255,255,255,0.08); color: #f4f4f5; }
.pp-pop-token { padding: 8px 16px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.pp-pop-token-label { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; margin-bottom: 5px; }
.pp-pop-token-label strong { color: #a5b4fc; font-weight: 600; }
.pp-pop-token-track { height: 4px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
.pp-pop-token-fill { height: 100%; border-radius: 4px; background: #6366f1; transition: width 0.6s ease; }
.pp-pop-body { flex: 1; overflow-y: auto; padding: 14px 16px; }
.pp-pop-body::-webkit-scrollbar { width: 4px; }
.pp-pop-body::-webkit-scrollbar-track { background: transparent; }
.pp-pop-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
.pp-pop-result {
  font-size: 13px; line-height: 1.7; color: #f4f4f5; white-space: pre-wrap; word-break: break-word;
  background: #131316; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px;
}
.pp-pop-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 16px; background: rgba(255,255,255,0.03); border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.pp-pop-copy {
  padding: 10px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.pp-pop-copy:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: #f4f4f5; }
.pp-pop-copy:disabled { opacity: 0.35; cursor: not-allowed; }
  `;
  document.head.appendChild(style);

  let injectDebounceTimer = null;
  const observer = new MutationObserver(() => {
    if (injectDebounceTimer) return;
    injectDebounceTimer = setTimeout(() => {
      injectDebounceTimer = null;
      const currentInput = getInput();
      const existingBar = document.querySelector(".pp-fab-bar");
      if (!existingBar || !existingBar._targetInput || !document.body.contains(existingBar._targetInput) || (currentInput && existingBar._targetInput !== currentInput)) {
        if (existingBar) { try { existingBar.remove(); } catch { /* ignore */ } }
        injectFab();
      }
    }, 150);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  injectFab();

  // Inline keyboard shortcut (Cmd+Shift+E / Ctrl+Shift+E)
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "E" || e.key === "e")) {
      const selectionText = window.getSelection()?.toString()?.trim();
      const activeInput = getInput();
      const val = selectionText || (activeInput ? getText(activeInput) : "");
      if (!val.trim()) return;
      e.preventDefault();
      showToast("✨ Enhancing prompt with Prompt+...");
      chrome.runtime.sendMessage(
        { action: "enhancePrompt", text: val },
        (res) => {
          if (res && res.success && res.data?.enhanced) {
            if (activeInput) {
              setText(activeInput, res.data.enhanced);
            } else {
              navigator.clipboard.writeText(res.data.enhanced);
            }
            showToast("✨ Enhanced & inserted into chat!");
          } else {
            showToast("⚠️ Could not enhance prompt");
          }
        }
      );
    }
  });

  loadSettings((s) => { currentMode = s.mode || "device"; });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleEnhancePanel") {
      if (panelEl) { closePanel(); return; }
      currentTarget = getInput();
      currentText = getText(currentTarget);
      if (currentText.trim()) openPanel();
    }
    if (request.action === "openEnhancePanel" && request.text) {
      currentTarget = getInput();
      currentText = request.text;
      if (currentTarget) setText(currentTarget, request.text);
      openPanel();
    }
    if (request.action === "getTokenInfo") {
      sendResponse?.({ ...getTokenInfo() });
      return true;
    }
    if (request.action === "injectEnhanced") {
      const input = getInput();
      if (!input) { sendResponse?.({ success: false, error: "No input field" }); return true; }
      currentTarget = input;
      currentText = request.text;
      setText(input, request.enhanced);
      showToast("✨ Prompt enhanced & injected!");
      sendResponse?.({ success: true });
      return true;
    }
  });
})();
