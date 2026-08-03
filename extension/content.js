(function () {
  const STORAGE_KEY = "pp_settings";
  const HISTORY_KEY = "pp_history";
  let panelEl = null;
  let currentTarget = null;
  let currentText = "";
  let currentEnhanced = "";
  let currentMode = "device";

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
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      el.value = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (el.isContentEditable) {
      el.innerText = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
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
    if (document.querySelector(".pp-fab-bar")) return;
    const input = getInput();
    if (!input || !input.parentElement) return;

    const rect = input.getBoundingClientRect();
    if (!rect || rect.width === 0) { setTimeout(injectFab, 1000); return; }

    currentMode = "device"; // Always force On-Device AI on chatbot floating toolbar

    const bar = document.createElement("div");
    bar.className = "pp-fab-bar";

    bar.innerHTML =
      '<button class="pp-fab-btn" id="pp-fab-btn" type="button" title="Enhance prompt with free On-Device AI (Gemini Nano)">' +
      '<span class="pp-fab-icon">📱</span>' +
      '<span class="pp-fab-text" id="pp-fab-text">Device Enhance</span>' +
      '</button>' +
      '<button class="pp-fab-btn" id="pp-fab-bucket-cap" type="button" title="Capture & Carry conversation history to another chatbot (e.g. ChatGPT to Claude)">' +
      '<span class="pp-fab-icon">📦</span>' +
      '<span class="pp-fab-text">Carry Context</span>' +
      '</button>' +
      '<button class="pp-fab-btn" id="pp-fab-bucket-inj" type="button" style="display:none;" title="Inject saved conversation context from another chatbot">' +
      '<span class="pp-fab-icon">💉</span>' +
      '<span class="pp-fab-text" id="pp-fab-bucket-inj-text">Inject Context</span>' +
      '</button>' +
      '<div class="pp-fab-badge" title="Powered by Chrome Gemini Nano On-Device AI">' +
      '<span>📱 On-Device AI</span>' +
      '</div>' +
      '<div class="pp-fab-token-wrap" title="Context Tokens Remaining">' +
      '<div class="pp-fab-token-info">' +
      '<span>Tokens: <strong id="pp-fab-used">0</strong> / <strong id="pp-fab-limit">128K</strong></span>' +
      '<span class="pp-fab-remain-wrap"><strong id="pp-fab-remain">128K</strong> remaining</span>' +
      '</div>' +
      '<div class="pp-fab-token-track">' +
      '<div class="pp-fab-token-fill" id="pp-fab-fill" style="width:0%"></div>' +
      '</div>' +
      '</div>';

    document.body.appendChild(bar);
    positionFab(bar, input);

    bar.querySelector("#pp-fab-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const el = getInput() || input;
      if (!el) { showToast("No input field found"); return; }
      currentTarget = el;
      currentText = getText(el);
      openPopover();
    });

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

    updateFabTokenBar();
    if (fabTimer) clearInterval(fabTimer);
    fabTimer = setInterval(updateFabTokenBar, 2500);
  }

  function getChatContainer(input) {
    if (!input) return null;
    const form = input.closest("form");
    if (form) return form;
    const composer = input.closest("[class*='composer'], [class*='chat-input'], [class*='prompt-container']");
    if (composer) return composer;
    let el = input.parentElement;
    while (el && el.parentElement && el.tagName !== "BODY" && el.tagName !== "MAIN") {
      if (el.offsetHeight >= 50 && el.querySelector("button, [role='button']")) return el;
      el = el.parentElement;
    }
    return input.parentElement || input;
  }

  function positionFab(bar, input) {
    if (!bar || !input) return;
    const card = getChatContainer(input) || input;
    const rect = card.getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    let top = rect.top - 44;
    if (top < 10) {
      top = Math.max(10, rect.top + 6);
    }

    bar.style.setProperty("position", "fixed", "important");
    bar.style.setProperty("z-index", "99999999", "important");
    bar.style.setProperty("top", top + "px", "important");
    bar.style.setProperty("bottom", "auto", "important");
    bar.style.setProperty("left", Math.max(10, rect.left) + "px", "important");
    bar.style.setProperty("display", "inline-flex", "important");
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
    const input = currentTarget;
    const text = currentText;
    if (!text.trim()) return;

    settings = null;
    loadSettings((s) => {
      settings = s;
      currentMode = s.mode || "device";
      renderPanel(input, text, settings);
    });
  }

  function closePanel() {
    if (panelEl) { panelEl.remove(); panelEl = null; }
    document.removeEventListener("keydown", ppEscHandler);
    if (tokenInterval) { clearInterval(tokenInterval); tokenInterval = null; }
  }

  let settings = null;

  // ---- Compact popover (new primary UX) ----
  let popoverEl = null;
  let popoverTimer = null;

  function openPopover() {
    if (popoverEl) { closePopover(); return; }
    const input = currentTarget;
    const text = currentText;
    if (!input || !text.trim()) {
      showToast("Type a prompt in the chat input first");
      return;
    }

    loadSettings((s) => {
      settings = s;
      currentMode = s.mode || "device";
      renderPopover(input, text);
    });
  }

  function closePopover() {
    if (popoverEl) { popoverEl.remove(); popoverEl = null; }
    if (popoverTimer) { clearInterval(popoverTimer); popoverTimer = null; }
    document.removeEventListener("keydown", popoverEscHandler);
  }

  function popoverEscHandler(e) {
    if (e.key === "Escape") closePopover();
  }

  function updatePopoverTokenBar() {
    const fill = document.getElementById("pp-pop-token-fill");
    const usedEl = document.getElementById("pp-pop-token-used");
    const remainEl = document.getElementById("pp-pop-token-remaining");
    const pctEl = document.getElementById("pp-pop-token-pct");
    if (!fill || !usedEl || !remainEl) return;
    const info = getTokenInfo();
    const remaining = Math.max(0, info.limit - info.used);
    usedEl.textContent = info.used.toLocaleString();
    remainEl.textContent = remaining.toLocaleString();
    pctEl.textContent = info.pct + "%";
    fill.style.width = info.pct + "%";
    fill.style.background = info.pct > 80 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "#6366f1";
  }

  function renderPopover(input, text) {
    currentMode = "device"; // Always force On-Device AI mode for popover
    popoverEl = document.createElement("div");
    popoverEl.className = "pp-popover";
    popoverEl.innerHTML =
      '<div class="pp-pop-head">' +
      '<div class="pp-pop-title">✦ Prompt+ Intelligence</div>' +
      '<div class="pp-pop-mode" id="pp-pop-mode">📱 On-Device AI</div>' +
      '<button class="pp-pop-close" id="pp-pop-close">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '</div>' +
      '<div class="pp-pop-token">' +
      '<div class="pp-pop-token-label"><span>Used: <strong id="pp-pop-token-used">0</strong> · Remaining: <strong id="pp-pop-token-remaining">128K</strong></span><span id="pp-pop-token-pct">0%</span></div>' +
      '<div class="pp-pop-token-track"><div class="pp-pop-token-fill" id="pp-pop-token-fill" style="width:0%"></div></div>' +
      '</div>' +
      '<div class="pp-pop-body">' +
      '<div class="pp-pop-result" id="pp-pop-result"></div>' +
      '</div>' +
      '<div class="pp-pop-footer">' +
      '<button class="pp-btn-keep" id="pp-pop-keep">Keep Original</button>' +
      '<button class="pp-pop-copy" id="pp-pop-copy" disabled>📋 Copy</button>' +
      '<button class="pp-btn-apply" id="pp-pop-use" disabled><span id="pp-pop-use-text">Use Enhanced</span><span>→</span></button>' +
      '</div>';

    document.body.appendChild(popoverEl);
    positionPopover(input);

    updatePopoverTokenBar();
    popoverTimer = setInterval(updatePopoverTokenBar, 3000);

    popoverEl.querySelector("#pp-pop-close").onclick = closePopover;
    popoverEl.querySelector("#pp-pop-keep").onclick = () => {
      if (currentText) setText(input, currentText);
      closePopover();
    };
    document.addEventListener("keydown", popoverEscHandler);

    const result = popoverEl.querySelector("#pp-pop-result");
    result.textContent = text;

    popoverEl.querySelector("#pp-pop-copy").onclick = () => {
      navigator.clipboard.writeText(currentEnhanced || result.textContent);
      const cb = popoverEl.querySelector("#pp-pop-copy");
      cb.textContent = "✓ Copied";
      setTimeout(() => { cb.textContent = "📋 Copy"; }, 1500);
    };

    popoverEl.querySelector("#pp-pop-use").onclick = () => {
      if (currentEnhanced) setText(input, currentEnhanced);
      closePopover();
    };

    doEnhancePopover(input, text);
  }

  function positionPopover(input) {
    if (!popoverEl) return;
    const rect = input.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    popoverEl.style.bottom = (window.innerHeight - rect.top + 10) + "px";
    popoverEl.style.right = (window.innerWidth - rect.right + 10) + "px";
    if (rect.top < 420) {
      popoverEl.style.bottom = (window.innerHeight - rect.bottom - 60) + "px";
    }
  }

  let popoverEnhancing = false;

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
            resolve(r || { success: false, error: "Device AI failed" });
          }
        }
      }).catch(async (e) => {
        chrome.runtime.onMessage.removeListener(handler);
        try {
          const localRes = await runDeviceEnhanceInContent(text, tokenSaver, targetId);
          resolve(localRes);
        } catch {
          resolve({ success: false, error: e.message });
        }
      });
    });
  }

  async function doEnhancePopover(input, text) {
    if (popoverEnhancing) return;
    popoverEnhancing = true;

    const fabText = document.getElementById("pp-fab-text");
    const fabTextOrig = fabText?.textContent || "";
    const result = document.getElementById("pp-pop-result");
    const useBtn = document.getElementById("pp-pop-use");
    const useText = document.getElementById("pp-pop-use-text");
    const copyBtn = document.getElementById("pp-pop-copy");
    if (useBtn) useBtn.disabled = true;
    if (copyBtn) copyBtn.disabled = true;
    if (fabText) fabText.textContent = "Enhancing…";

    try {
      let res;
      if (currentMode === "device") {
        res = await sendDeviceEnhance(text, !!(settings?.tokenSaver), "pp-pop-result");
        if (!res || !res.success) throw new Error(res?.error || "Device AI not available (Chrome 138+ with Gemini Nano required)");
        currentEnhanced = res.enhanced || "";
      } else {
        const modelVal = settings?.model || "meta-llama/llama-3.3-70b-instruct:free::openrouter";
        const parts = modelVal.split("::");
        const model = parts[0];
        const provider = parts[1] || "openai";
        res = await chrome.runtime.sendMessage({ action: "enhancePrompt", text, model, provider, tokenSaver: !!(settings?.tokenSaver) });
        if (!res || !res.success) throw new Error(res?.error || "Failed");
        currentEnhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
      }

      if (!currentEnhanced) throw new Error("No output received");
      if (result) result.textContent = currentEnhanced;
      if (useBtn) useBtn.disabled = false;
      if (copyBtn) copyBtn.disabled = false;
      if (useText) useText.textContent = "Use Enhanced";
      saveHistory(text);
    } catch (err) {
      showToast(err.message);
      if (useText) useText.textContent = "Use Enhanced";
      if (err.message && (err.message.includes("No API key") || err.message.includes("API key"))) {
        if (result) {
          result.innerHTML =
            '<div style="padding: 4px; color: #f4f4f5;">' +
            '<div style="font-weight: 600; color: #f59e0b; margin-bottom: 6px; font-size: 12px; display: flex; align-items: center; gap: 6px;">' +
            '<span>🔑</span> No Server API Key' +
            '</div>' +
            '<div style="font-size: 11px; color: #94a3b8; margin-bottom: 10px; line-height: 1.4;">' +
            'No API key configured. Switch to <strong>On-Device AI (Gemini Nano)</strong> for instant free enhancements without an API key.' +
            '</div>' +
            '<button id="pp-pop-switch-device" type="button" style="width: 100%; padding: 8px 12px; background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.5); color: #a5b4fc; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">' +
            '<span>📱</span> Switch to On-Device AI Mode' +
            '</button>' +
            '</div>';
          document.getElementById("pp-pop-switch-device")?.addEventListener("click", () => {
            currentMode = "device";
            const modeEl = document.getElementById("pp-pop-mode");
            if (modeEl) modeEl.textContent = "📱 On-Device";
            saveSettings({ mode: "device" });
            doEnhancePopover(input, text);
          });
        }
      }
    } finally {
      popoverEnhancing = false;
      if (fabText) fabText.textContent = fabTextOrig;
    }
  }

  function renderPanel(input, text, s) {
    panelEl = document.createElement("div");
    panelEl.className = "pp-panel";

    const activeChatbot = detectChatbot();

    panelEl.innerHTML =
      '<div class="pp-backdrop"></div>' +
      '<div class="pp-side">' +
      '<div class="pp-side-inner">' +
      '<div class="pp-head">' +
      '<div class="pp-head-left">' +
      '<div class="pp-head-icon">✦</div>' +
      '<div class="pp-head-info">' +
      '<div class="pp-head-title">Prompt+ Intelligence</div>' +
      '<div class="pp-head-enc"><span class="pp-enc-dot"></span> SECURE</div>' +
      '</div>' +
      '</div>' +
      '<button class="pp-close-btn" id="pp-close-btn">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '</div>' +
      '<div class="pp-bots-strip">' +
      '<div class="pp-bot-pill' + (activeChatbot === "chatgpt" ? " active" : "") + '"><span>🤖</span><span class="pp-bot-label">ChatGPT</span></div>' +
      '<div class="pp-bot-pill' + (activeChatbot === "claude" ? " active" : "") + '"><span>🟣</span><span class="pp-bot-label">Claude</span></div>' +
      '<div class="pp-bot-pill' + (activeChatbot === "gemini" ? " active" : "") + '"><span>✨</span><span class="pp-bot-label">Gemini</span></div>' +
      '<div class="pp-bot-pill' + (activeChatbot === "deepseek" ? " active" : "") + '"><span>⚡</span><span class="pp-bot-label">DeepSeek</span></div>' +
      '</div>' +
      '<div class="pp-body" id="pp-body">' +
      '<div class="pp-split-header">' +
      '<div class="pp-split-label">ORIGINAL</div>' +
      '<div class="pp-split-label-right">' +
      '<span>IMPROVED</span>' +
      '<button class="pp-copy-chip" id="pp-copy-btn" disabled>📋 Copy</button>' +
      '</div>' +
      '</div>' +
      '<div class="pp-split-view">' +
      '<div class="pp-split-original" id="pp-original-preview"></div>' +
      '<div class="pp-split-improved" id="pp-enhanced-preview">' +
      '<div class="pp-placeholder">Click "Apply Upgrade" below to see the AI-optimized result</div>' +
      '</div>' +
      '</div>' +
      '<div id="pp-structured-sections" style="display:none">' +
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
      '<div class="pp-opt-row">' +
      '<div class="pp-opt-info"><div class="pp-opt-label">Token Saver</div><div class="pp-opt-sub">Concise output, ~40% fewer tokens</div></div>' +
      '<label class="pp-toggle"><input type="checkbox" id="pp-ts-toggle"><div class="pp-toggle-slider"></div></label>' +
      '</div>' +
      '<div class="pp-model-row">' +
      '<label class="pp-model-label">Model</label>' +
      '<select id="pp-model" class="pp-select">' +
      '<optgroup label="OpenRouter Free">' +
      '<option value="meta-llama/llama-3.3-70b-instruct:free::openrouter" selected>Llama 3.3 70B</option>' +
      '<option value="google/gemini-2.0-flash-exp:free::openrouter">Gemini 2.0 Flash</option>' +
      '<option value="deepseek/deepseek-r1:free::openrouter">DeepSeek R1</option>' +
      '<option value="qwen/qwen-2.5-coder-32b-instruct:free::openrouter">Qwen 2.5 Coder 32B</option>' +
      '<option value="mistralai/mistral-small-24b-instruct-2501:free::openrouter">Mistral Small 24B</option>' +
      '<option value="microsoft/phi-3-mini-128k-instruct:free::openrouter">Phi-3 Mini 128K</option>' +
      '<option value="nousresearch/hermes-3-llama-3.1-405b:free::openrouter">Hermes 3 405B</option>' +
      '</optgroup>' +
      '<optgroup label="NVIDIA Free">' +
      '<option value="meta/llama-3.3-70b-instruct::nvidia">Llama 3.3 70B (NV)</option>' +
      '<option value="nvidia/llama-3.1-nemotron-70b-instruct::nvidia">Nemotron 70B (NV)</option>' +
      '<option value="google/gemma-2-27b-it::nvidia">Gemma 2 27B (NV)</option>' +
      '<option value="mistralai/mistral-7b-instruct-v0.3::nvidia">Mistral 7B (NV)</option>' +
      '</optgroup>' +
      '</select>' +
      '</div>' +
      '</div>' +
      '<div class="pp-token-bar" id="pp-token-bar">' +
      '<div class="pp-token-label"><span>Context: <strong id="pp-token-used">0</strong> / <strong id="pp-token-limit">128K</strong> tokens</span><span id="pp-token-pct">0%</span></div>' +
      '<div class="pp-token-track"><div class="pp-token-fill" id="pp-token-fill" style="width:0%"></div></div>' +
      '</div>' +
      '<div class="pp-footer">' +
      '<div class="pp-footer-credit">Powered by <strong>Prompt+</strong></div>' +
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

    panelEl.querySelector("#pp-enhance-btn").onclick = () => doEnhance(input, text);

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
    enhancing = true;

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
        res = await sendDeviceEnhance(text, tkSave, "pp-enhanced-preview");
        if (!res || !res.success) throw new Error(res?.error || "Device AI not available (Chrome 138+ with Gemini Nano required)");
        currentEnhanced = res.enhanced || "";
      } else {
        const modelVal = document.getElementById("pp-model")?.value || "gpt-4o-mini";
        const parts = modelVal.split("::");
        const model = parts[0];
        const provider = parts[1] || "openai";
        res = await chrome.runtime.sendMessage({ action: "enhancePrompt", text, model, provider, tokenSaver: tkSave });
        if (!res || !res.success) throw new Error(res?.error || "Failed");
        currentEnhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
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
  gap: 10px !important;
  padding: 5px 12px !important;
  border-radius: 10px !important;
  background: #0a0a0c !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(99, 102, 241, 0.35) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45) !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable", "Segoe UI", sans-serif !important;
  color: #f4f4f5 !important;
  width: fit-content !important;
  max-width: calc(100vw - 32px) !important;
  height: 38px !important;
  margin: 0 !important;
  line-height: 1 !important;
  transition: opacity 0.15s ease !important;
}
.pp-fab-bar .pp-fab-btn {
  all: initial !important;
  box-sizing: border-box !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  padding: 6px 14px !important;
  border-radius: 7px !important;
  border: none !important;
  background: #6366f1 !important;
  color: #ffffff !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  line-height: 1.2 !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable", "Segoe UI", sans-serif !important;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4) !important;
  transition: transform 0.15s ease, opacity 0.15s ease !important;
  margin: 0 !important;
  outline: none !important;
}
.pp-fab-bar .pp-fab-btn:hover { opacity: 0.95 !important; transform: translateY(-1px) !important; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5) !important; }
.pp-fab-bar .pp-fab-badge {
  all: initial !important;
  box-sizing: border-box !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  padding: 3px 8px !important;
  border-radius: 5px !important;
  background: rgba(34, 197, 94, 0.12) !important;
  border: 1px solid rgba(34, 197, 94, 0.35) !important;
  color: #4ade80 !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  line-height: 1.2 !important;
  white-space: nowrap !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable", "Segoe UI", sans-serif !important;
  letter-spacing: 0.03em !important;
  margin: 0 !important;
}
.pp-fab-bar .pp-fab-token-wrap {
  all: initial !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 3px !important;
  min-width: 130px !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable", "Segoe UI", sans-serif !important;
  margin: 0 !important;
}
.pp-fab-bar .pp-fab-token-info {
  all: initial !important;
  box-sizing: border-box !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  font-size: 10px !important;
  line-height: 1.2 !important;
  color: #94a3b8 !important;
  white-space: nowrap !important;
  gap: 10px !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable", "Segoe UI", sans-serif !important;
}
.pp-fab-bar .pp-fab-token-info strong { color: #a5b4fc !important; font-weight: 600 !important; }
.pp-fab-bar .pp-fab-remain-wrap { color: #34d399 !important; font-size: 10px !important; font-weight: 500 !important; }
.pp-fab-bar .pp-fab-token-track {
  all: initial !important;
  box-sizing: border-box !important;
  display: block !important;
  height: 4px !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 4px !important;
  overflow: hidden !important;
}
.pp-fab-bar .pp-fab-token-fill {
  all: initial !important;
  box-sizing: border-box !important;
  display: block !important;
  height: 100% !important;
  border-radius: 4px !important;
  background: #6366f1 !important;
  transition: width 0.4s ease !important;
}

.pp-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999999; opacity: 0; transition: opacity 0.25s ease; }

.pp-side { position: fixed; top: 0; right: 0; width: 520px; max-width: 96vw; height: 100vh; z-index: 100000000; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.pp-side-inner { height: 100%; background: #0a0a0c; display: flex; flex-direction: column; box-shadow: -8px 0 40px rgba(0,0,0,0.4); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable", "Segoe UI", sans-serif; color: #f4f4f5; }

.pp-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.pp-head-left { display: flex; align-items: center; gap: 12px; }
.pp-head-icon { width: 42px; height: 42px; border-radius: 10px; background: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; }
.pp-head-info { display: flex; flex-direction: column; gap: 2px; }
.pp-head-title { font-size: 17px; font-weight: 800; color: #f4f4f5; letter-spacing: -0.03em; }
.pp-head-enc { font-size: 10px; font-weight: 600; color: #22c55e; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 4px; }
.pp-enc-dot { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.5); display: inline-block; animation: ppPulse 2s infinite; }
@keyframes ppPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.pp-close-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #64748b; cursor: pointer; padding: 7px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.pp-close-btn:hover { background: rgba(255,255,255,0.08); color: #f4f4f5; transform: rotate(90deg); }

.pp-bots-strip { display: flex; gap: 6px; padding: 8px 20px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.pp-bot-pill { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 6px 4px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); font-size: 11px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.15s; }
.pp-bot-pill:hover { background: rgba(255,255,255,0.08); transform: translateY(-1px); }
.pp-bot-pill.active { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.4); color: #a5b4fc; }
.pp-bot-label { font-size: 10px; }

.pp-token-bar { padding: 8px 20px 6px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.pp-token-label { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; margin-bottom: 5px; }
.pp-token-label strong { color: #a5b4fc; font-weight: 600; }
.pp-token-track { height: 4px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
.pp-token-fill { height: 100%; border-radius: 4px; background: #6366f1; transition: width 0.6s ease; }

.pp-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
.pp-body::-webkit-scrollbar { width: 4px; }
.pp-body::-webkit-scrollbar-track { background: transparent; }
.pp-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

.pp-split-header { display: flex; justify-content: space-between; align-items: center; }
.pp-split-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
.pp-split-label-right { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 600; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.06em; }
.pp-copy-chip { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #64748b; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.pp-copy-chip:hover { background: rgba(255,255,255,0.08); color: #94a3b8; }
.pp-copy-chip:disabled { opacity: 0.3; cursor: not-allowed; }

.pp-split-view { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pp-split-original, .pp-split-improved { padding: 14px; border-radius: 8px; font-size: 13px; line-height: 1.7; min-height: 60px; white-space: pre-wrap; word-break: break-word; }
.pp-split-original { background: #131316; color: #94a3b8; border: 1px solid rgba(255,255,255,0.06); }
.pp-split-improved { background: #131316; color: #f4f4f5; border: 1px solid rgba(255,255,255,0.08); }
.pp-placeholder { color: #64748b; font-style: italic; font-size: 12px; }

.pp-section { background: #131316; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 14px 16px; transition: border-color 0.15s; }
.pp-section:hover { border-color: rgba(59,130,246,0.2); }
.pp-section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.pp-section-bar { width: 3px; height: 16px; border-radius: 2px; background: #6366f1; }
.pp-section-title { font-size: 11px; font-weight: 700; color: #f4f4f5; text-transform: uppercase; letter-spacing: 0.06em; }
.pp-section-body { font-size: 13px; line-height: 1.7; color: #94a3b8; white-space: pre-wrap; word-break: break-word; }

.pp-opt-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
.pp-opt-info { display: flex; flex-direction: column; gap: 1px; }
.pp-opt-label { font-size: 12px; font-weight: 600; color: #a5b4fc; }
.pp-opt-sub { font-size: 10px; color: #64748b; }
.pp-toggle { position: relative; width: 34px; height: 20px; flex-shrink: 0; cursor: pointer; }
.pp-toggle input { display: none; }
.pp-toggle-slider { position: absolute; inset: 0; background: rgba(255,255,255,0.1); border-radius: 10px; transition: 0.2s; cursor: pointer; }
.pp-toggle-slider::before { content: ""; position: absolute; width: 14px; height: 14px; left: 3px; bottom: 3px; background: #64748b; border-radius: 50%; transition: 0.2s; }
.pp-toggle input:checked + .pp-toggle-slider { background: rgba(59,130,246,0.4); }
.pp-toggle input:checked + .pp-toggle-slider::before { transform: translateX(14px); background: #6366f1; }

.pp-model-row { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
.pp-model-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
.pp-select { flex: 1; background: #131316; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: #f4f4f5; padding: 8px 30px 8px 12px; font-size: 13px; font-family: inherit; outline: none; cursor: pointer; transition: border-color 0.15s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }
.pp-select:hover { border-color: rgba(59,130,246,0.4); }
.pp-select:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.pp-select optgroup { background: #131316; color: #64748b; }
.pp-select option { background: #131316; color: #f4f4f5; }

.pp-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; background: rgba(255,255,255,0.03); border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.pp-footer-credit { font-size: 12px; color: #64748b; letter-spacing: 0.01em; }
.pp-footer-credit strong { color: #a5b4fc; font-weight: 700; }
.pp-footer-actions { display: flex; gap: 8px; }

.pp-btn-keep { padding: 10px 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.pp-btn-keep:hover { background: rgba(255,255,255,0.06); color: #94a3b8; border-color: rgba(255,255,255,0.12); }

.pp-btn-apply { padding: 10px 24px; border-radius: 8px; border: none; background: #6366f1; color: #ffffff; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; font-family: inherit; }
.pp-btn-apply:hover { background: #4f46e5; transform: translateY(-2px); }
.pp-btn-apply:active { transform: translateY(0); }
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
      if (!document.querySelector(".pp-fab-bar")) injectFab();
    }, 150);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  injectFab();

  // Inline keyboard shortcut (Cmd+Shift+E / Ctrl+Shift+E)
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "E" || e.key === "e")) {
      const activeInput = getInput();
      if (!activeInput) return;
      const val = getText(activeInput);
      if (!val.trim()) return;
      e.preventDefault();
      showToast("✨ Enhancing prompt with Prompt+...");
      chrome.runtime.sendMessage(
        { action: "enhancePrompt", text: val },
        (res) => {
          if (res && res.success && res.data?.enhanced) {
            setText(activeInput, res.data.enhanced);
            showToast("✨ Enhanced with Prompt+!");
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
      setText(currentTarget, request.text);
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
