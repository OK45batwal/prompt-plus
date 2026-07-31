(function () {
  const STORAGE_KEY = "pp_settings";
  const HISTORY_KEY = "pp_history";
  let panelEl = null;
  let currentTarget = null;
  let currentText = "";
  let currentEnhanced = "";
  let currentMode = "server";

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
    const used = estimateTokens(text);
    const limit = CONTEXT_LIMITS[detectChatbot()] || 128000;
    return { used, limit, pct: Math.min(100, Math.round((used / limit) * 100)) };
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
    else fill.style.background = "linear-gradient(90deg, #22c55e, #3b82f6)";
  }

  function getInput() {
    let el = document.querySelector("#prompt-textarea, textarea[data-id='root']");
    if (el) return el;
    el = document.querySelector("div[contenteditable='true'].ProseMirror, textarea");
    if (el && location.hostname.includes("claude")) return el;
    el = document.querySelector("div[contenteditable='true'], textarea");
    if (el && location.hostname.includes("gemini")) return el;
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
    if (!chrome?.storage?.local) { cb({}); return; }
    chrome.storage.local.get(STORAGE_KEY, (d) => cb(d[STORAGE_KEY] || {}));
  }

  function saveSettings(s, cb) {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get(STORAGE_KEY, (d) => {
      const cur = d[STORAGE_KEY] || {};
      Object.assign(cur, s);
      chrome.storage.local.set({ [STORAGE_KEY]: cur }, () => cb && cb());
    });
  }

  function saveHistory(item) {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get(HISTORY_KEY, (d) => {
      let h = d[HISTORY_KEY] || [];
      h = [{ text: item.slice(0, 80), ts: Date.now() }, ...h].slice(0, 10);
      chrome.storage.local.set({ [HISTORY_KEY]: h });
    });
  }

  function detectChatbot() {
    const host = location.hostname;
    if (host.includes("chatgpt") || host.includes("chat.openai")) return "chatgpt";
    if (host.includes("claude")) return "claude";
    if (host.includes("gemini")) return "gemini";
    if (host.includes("deepseek")) return "deepseek";
    return null;
  }

  function injectFab() {
    if (document.querySelector(".pp-fab")) return;
    const input = getInput();
    if (!input || !input.parentElement) return;

    const rect = input.getBoundingClientRect();
    if (!rect || rect.width === 0) { setTimeout(injectFab, 1000); return; }

    const fab = document.createElement("button");
    fab.className = "pp-fab";
    fab.setAttribute("type", "button");
    fab.innerHTML =
      '<span class="pp-fab-icon">✦</span>' +
      '<span class="pp-fab-text">Enhance Prompt</span>';
    fab.title = "Open Prompt+";

    fab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const el = getInput() || input;
      if (!el || !el.parentElement) { showToast("No input field found"); return; }
      currentTarget = el;
      currentText = getText(el);
      if (!currentText.trim()) { showToast("Enter a prompt first"); return; }
      openPanel();
    });

    fab.style.position = "fixed";
    fab.style.zIndex = "999999";
    document.body.appendChild(fab);
    positionFab(fab, input);
    window.addEventListener("scroll", () => positionFab(fab, input), { passive: true });
    window.addEventListener("resize", () => positionFab(fab, input), { passive: true });
  }

  function positionFab(fab, input) {
    const rect = input.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    fab.style.bottom = (window.innerHeight - rect.bottom + 10) + "px";
    fab.style.right = (window.innerWidth - rect.right + 10) + "px";
  }

  function showToast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "rgba(15,23,42,0.9)", color: "#f1f5f9", padding: "10px 20px", borderRadius: "14px",
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
      currentMode = s.mode || "server";
      renderPanel(input, text, settings);
    });
  }

  function closePanel() {
    if (panelEl) { panelEl.remove(); panelEl = null; }
    document.removeEventListener("keydown", ppEscHandler);
    if (tokenInterval) { clearInterval(tokenInterval); tokenInterval = null; }
  }

  let settings = null;

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
                '<optgroup label="OpenRouter Paid">' +
                  '<option value="openai/gpt-4o::openrouter">GPT-4o</option>' +
                  '<option value="anthropic/claude-3-5-sonnet-20241022::openrouter">Claude 3.5 Sonnet</option>' +
                  '<option value="google/gemini-1.5-pro::openrouter">Gemini 1.5 Pro</option>' +
                '</optgroup>' +
                '<optgroup label="NVIDIA">' +
                  '<option value="meta/llama-3.3-70b-instruct::nvidia">Llama 3.3 70B (NV)</option>' +
                  '<option value="nvidia/llama-3.1-nemotron-70b-instruct::nvidia">Nemotron 70B</option>' +
                  '<option value="google/gemma-2-27b-it::nvidia">Gemma 2 27B (NV)</option>' +
                  '<option value="mistralai/mistral-7b-instruct-v0.3::nvidia">Mistral 7B (NV)</option>' +
                '</optgroup>' +
                '<optgroup label="Direct Keys">' +
                  '<option value="gpt-4o-mini::openai">GPT-4o Mini</option>' +
                  '<option value="gpt-4o::openai">GPT-4o</option>' +
                  '<option value="claude-3-5-sonnet-20241022::anthropic">Claude 3.5 Sonnet</option>' +
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

    const fab = document.querySelector(".pp-fab");
    const fabOrig = fab?.innerHTML || "";

    const btn = document.getElementById("pp-enhance-btn");
    const btnText = document.getElementById("pp-enhance-text");
    const spinner = btn?.querySelector(".pp-btn-spinner");
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = "Enhancing...";
    if (spinner) spinner.style.display = "inline-block";
    if (fab) fab.innerHTML = '<span class="pp-fab-icon">⌛</span><span class="pp-fab-text">Enhancing...</span>';

    const enhancedPreview = document.getElementById("pp-enhanced-preview");
    const copyBtn = document.getElementById("pp-copy-btn");
    const sections = document.getElementById("pp-structured-sections");

    try {
      const tsEl = document.getElementById("pp-ts-toggle");
      const tkSave = tsEl ? tsEl.checked : false;
      let res;
      if (currentMode === "device") {
        res = await chrome.runtime.sendMessage({ action: "enhanceDevice", text, tokenSaver: tkSave });
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
    } finally {
      enhancing = false;
      if (spinner) spinner.style.display = "none";
      if (fab) fab.innerHTML = fabOrig;
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
.pp-fab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px 10px 14px;
  border-radius: 28px;
  border: none;
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(59,130,246,0.35);
  transition: all 0.2s ease;
  z-index: 999999;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.pp-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(59,130,246,0.5); }
.pp-fab:active { transform: translateY(0); }
.pp-fab-icon { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 14px; }

.pp-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999999; opacity: 0; transition: opacity 0.25s ease; }

.pp-side { position: fixed; top: 0; right: 0; width: 520px; max-width: 96vw; height: 100vh; z-index: 100000000; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.pp-side-inner { height: 100%; background: #090d16; display: flex; flex-direction: column; box-shadow: -8px 0 40px rgba(0,0,0,0.4); font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f8fafc; }

.pp-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.pp-head-left { display: flex; align-items: center; gap: 12px; }
.pp-head-icon { width: 42px; height: 42px; border-radius: 10px; background: #1d4ed8; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; }
.pp-head-info { display: flex; flex-direction: column; gap: 2px; }
.pp-head-title { font-size: 17px; font-weight: 800; color: #f8fafc; letter-spacing: -0.03em; }
.pp-head-enc { font-size: 10px; font-weight: 600; color: #22c55e; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 4px; }
.pp-enc-dot { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.5); display: inline-block; animation: ppPulse 2s infinite; }
@keyframes ppPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.pp-close-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #64748b; cursor: pointer; padding: 7px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.pp-close-btn:hover { background: rgba(255,255,255,0.08); color: #f8fafc; transform: rotate(90deg); }

.pp-bots-strip { display: flex; gap: 6px; padding: 8px 20px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.pp-bot-pill { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 6px 4px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); font-size: 11px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.15s; }
.pp-bot-pill:hover { background: rgba(255,255,255,0.08); transform: translateY(-1px); }
.pp-bot-pill.active { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.4); color: #93c5fd; }
.pp-bot-label { font-size: 10px; }

.pp-token-bar { padding: 8px 20px 6px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.pp-token-label { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; margin-bottom: 5px; }
.pp-token-label strong { color: #93c5fd; font-weight: 600; }
.pp-token-track { height: 4px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
.pp-token-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #22c55e, #3b82f6); transition: width 0.6s ease; }

.pp-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
.pp-body::-webkit-scrollbar { width: 4px; }
.pp-body::-webkit-scrollbar-track { background: transparent; }
.pp-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

.pp-split-header { display: flex; justify-content: space-between; align-items: center; }
.pp-split-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
.pp-split-label-right { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 600; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.06em; }
.pp-copy-chip { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #64748b; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.pp-copy-chip:hover { background: rgba(255,255,255,0.08); color: #94a3b8; }
.pp-copy-chip:disabled { opacity: 0.3; cursor: not-allowed; }

.pp-split-view { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pp-split-original, .pp-split-improved { padding: 14px; border-radius: 8px; font-size: 13px; line-height: 1.7; min-height: 60px; white-space: pre-wrap; word-break: break-word; }
.pp-split-original { background: #0f172a; color: #94a3b8; border: 1px solid rgba(255,255,255,0.06); }
.pp-split-improved { background: #0f172a; color: #f8fafc; border: 1px solid rgba(255,255,255,0.08); }
.pp-placeholder { color: #64748b; font-style: italic; font-size: 12px; }

.pp-section { background: #0f172a; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 14px 16px; transition: border-color 0.15s; }
.pp-section:hover { border-color: rgba(59,130,246,0.2); }
.pp-section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.pp-section-bar { width: 3px; height: 16px; border-radius: 2px; background: #3b82f6; }
.pp-section-title { font-size: 11px; font-weight: 700; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.06em; }
.pp-section-body { font-size: 13px; line-height: 1.7; color: #94a3b8; white-space: pre-wrap; word-break: break-word; }

.pp-opt-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
.pp-opt-info { display: flex; flex-direction: column; gap: 1px; }
.pp-opt-label { font-size: 12px; font-weight: 600; color: #93c5fd; }
.pp-opt-sub { font-size: 10px; color: #64748b; }
.pp-toggle { position: relative; width: 34px; height: 20px; flex-shrink: 0; cursor: pointer; }
.pp-toggle input { display: none; }
.pp-toggle-slider { position: absolute; inset: 0; background: rgba(255,255,255,0.1); border-radius: 10px; transition: 0.2s; cursor: pointer; }
.pp-toggle-slider::before { content: ""; position: absolute; width: 14px; height: 14px; left: 3px; bottom: 3px; background: #64748b; border-radius: 50%; transition: 0.2s; }
.pp-toggle input:checked + .pp-toggle-slider { background: rgba(59,130,246,0.4); }
.pp-toggle input:checked + .pp-toggle-slider::before { transform: translateX(14px); background: #3b82f6; }

.pp-model-row { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
.pp-model-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
.pp-select { flex: 1; background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: #f8fafc; padding: 8px 30px 8px 12px; font-size: 13px; font-family: inherit; outline: none; cursor: pointer; transition: border-color 0.15s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }
.pp-select:hover { border-color: rgba(59,130,246,0.4); }
.pp-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.pp-select optgroup { background: #0f172a; color: #64748b; }
.pp-select option { background: #0f172a; color: #f8fafc; }

.pp-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; background: rgba(255,255,255,0.03); border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
.pp-footer-credit { font-size: 12px; color: #64748b; letter-spacing: 0.01em; }
.pp-footer-credit strong { color: #93c5fd; font-weight: 700; }
.pp-footer-actions { display: flex; gap: 8px; }

.pp-btn-keep { padding: 10px 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: inherit; }
.pp-btn-keep:hover { background: rgba(255,255,255,0.06); color: #94a3b8; border-color: rgba(255,255,255,0.12); }

.pp-btn-apply { padding: 10px 24px; border-radius: 8px; border: none; background: #3b82f6; color: #ffffff; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; font-family: inherit; }
.pp-btn-apply:hover { background: #2563eb; transform: translateY(-2px); }
.pp-btn-apply:active { transform: translateY(0); }
.pp-btn-apply:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.pp-btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: ppSpin 0.6s linear infinite; }
@keyframes ppSpin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(() => {
    if (!document.querySelector(".pp-fab")) injectFab();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  injectFab();

  loadSettings((s) => { currentMode = s.mode || "server"; });

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
