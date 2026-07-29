(function () {
  const STORAGE_KEY = "pp_settings";
  const HISTORY_KEY = "pp_history";
  let panelOpen = false;
  let panelEl = null;
  let currentTarget = null;
  let currentText = "";
  let currentEnhanced = "";

  function getInput() {
    let el = document.querySelector("#prompt-textarea, textarea[data-id='root']");
    if (el) return el;
    el = document.querySelector("div[contenteditable='true'].ProseMirror, textarea");
    if (el && location.hostname.includes("claude")) return el;
    el = document.querySelector("div[contenteditable='true'], textarea");
    if (el && location.hostname.includes("gemini")) return el;
    return document.querySelector("textarea, div[contenteditable='true']");
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
      el.dispatchEvent(new Event("blur", { bubbles: true }));
    } else if (el.isContentEditable) {
      el.innerText = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
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

  /* Detect which chatbot site we are on */
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
      '<span class="pp-fab-icon">⚡</span>' +
      '<span class="pp-fab-text">Enhance Prompt</span>';
    fab.title = "Open Prompt+ Architect";

    fab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentTarget = input;
      currentText = getText(input);
      if (!currentText.trim()) { showToast("Enter or paste a prompt first"); return; }
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
    fab.style.bottom = (window.innerHeight - rect.bottom + 12) + "px";
    fab.style.right = (window.innerWidth - rect.right + 12) + "px";
  }

  function showToast(msg) {
    const t = document.createElement("div");
    t.className = "pp-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateX(-50%) translateY(0)"; });
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateX(-50%) translateY(10px)";
      setTimeout(() => t.remove(), 300);
    }, 2400);
  }

  function openPanel() {
    if (panelEl) { closePanel(); return; }
    const input = currentTarget || getInput();
    const text = currentText || getText(input);
    if (!text.trim()) { showToast("Enter a prompt first"); return; }

    settings = null;
    loadSettings((s) => {
      settings = s;
      renderPanel(input, text, settings);
    });
  }

  function closePanel() {
    if (panelEl) { panelEl.remove(); panelEl = null; panelOpen = false; }
    document.removeEventListener("keydown", ppEscHandler);
  }

  let settings = null;

  function renderPanel(input, text, s) {
    panelOpen = true;
    panelEl = document.createElement("div");
    panelEl.className = "pp-panel";

    const activeChatbot = detectChatbot();

    panelEl.innerHTML =
      '<div class="pp-backdrop"></div>' +
      '<div class="pp-side">' +
        '<div class="pp-side-inner">' +
          /* Header */
          '<div class="pp-head">' +
            '<div class="pp-head-left">' +
              '<div class="pp-head-icon">⚡</div>' +
              '<div class="pp-head-info">' +
                '<div class="pp-head-title">Prompt+ Intelligence</div>' +
                '<div class="pp-head-enc"><span class="pp-enc-dot"></span> SECURE API</div>' +
              '</div>' +
            '</div>' +
            '<button class="pp-close-btn" id="pp-close-btn" title="Close Panel (Esc)">' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
          '</div>' +
          /* Chatbot Counter Bar */
          '<div class="pp-bots-strip">' +
            '<div class="pp-bot-pill' + (activeChatbot === "chatgpt" ? " active" : "") + '"><span>🤖</span><span class="pp-bot-label">ChatGPT</span></div>' +
            '<div class="pp-bot-pill' + (activeChatbot === "claude" ? " active" : "") + '"><span>🟣</span><span class="pp-bot-label">Claude</span></div>' +
            '<div class="pp-bot-pill' + (activeChatbot === "gemini" ? " active" : "") + '"><span>✨</span><span class="pp-bot-label">Gemini</span></div>' +
            '<div class="pp-bot-pill' + (activeChatbot === "deepseek" ? " active" : "") + '"><span>⚡</span><span class="pp-bot-label">DeepSeek</span></div>' +
          '</div>' +
          /* Main Body */
          '<div class="pp-body">' +
            /* Options Controls */
            '<div class="pp-controls-row">' +
              '<select id="pp-model" class="pp-select">' +
                '<optgroup label="OpenRouter Free">' +
                  '<option value="meta-llama/llama-3.3-70b-instruct:free::openrouter" selected>Llama 3.3 70B</option>' +
                  '<option value="google/gemini-2.0-flash-exp:free::openrouter">Gemini 2.0 Flash</option>' +
                  '<option value="deepseek/deepseek-r1:free::openrouter">DeepSeek R1</option>' +
                  '<option value="qwen/qwen-2.5-coder-32b-instruct:free::openrouter">Qwen 2.5 Coder</option>' +
                '</optgroup>' +
                '<optgroup label="Direct Keys">' +
                  '<option value="gpt-4o-mini::openai">GPT-4o Mini</option>' +
                  '<option value="gpt-4o::openai">GPT-4o</option>' +
                  '<option value="claude-3-5-sonnet-20241022::anthropic">Claude 3.5 Sonnet</option>' +
                '</optgroup>' +
              '</select>' +
              '<select id="pp-tone" class="pp-select">' +
                '<option value="Balanced" selected>Tone: Balanced</option>' +
                '<option value="Professional">Tone: Professional</option>' +
                '<option value="Technical">Tone: Technical</option>' +
                '<option value="Concise">Tone: Concise</option>' +
                '<option value="Creative">Tone: Creative</option>' +
              '</select>' +
            '</div>' +

            /* Split Header */
            '<div class="pp-split-header">' +
              '<div class="pp-split-label">ORIGINAL PROMPT</div>' +
              '<div class="pp-split-label-right">' +
                '<span>IMPROVED RESULT</span>' +
                '<button class="pp-copy-chip" id="pp-copy-btn" disabled>📋 Copy</button>' +
              '</div>' +
            '</div>' +
            /* Split view */
            '<div class="pp-split-view">' +
              '<div class="pp-split-original" id="pp-original-preview"></div>' +
              '<div class="pp-split-improved" id="pp-enhanced-preview">' +
                '<div class="pp-placeholder">Click "Apply Upgrade" below to generate AI-optimized prompt structure</div>' +
              '</div>' +
            '</div>' +
            /* Structured Sections */
            '<div id="pp-structured-sections" style="display:none">' +
              '<div class="pp-section">' +
                '<div class="pp-section-head"><div class="pp-section-bar" style="background:#2563eb;"></div><span class="pp-section-title">ROLE</span></div>' +
                '<div class="pp-section-body" id="pp-role-body">—</div>' +
              '</div>' +
              '<div class="pp-section">' +
                '<div class="pp-section-head"><div class="pp-section-bar" style="background:#3b82f6;"></div><span class="pp-section-title">CONTEXT</span></div>' +
                '<div class="pp-section-body" id="pp-context-body">—</div>' +
              '</div>' +
              '<div class="pp-section">' +
                '<div class="pp-section-head"><div class="pp-section-bar" style="background:#10b981;"></div><span class="pp-section-title">INSTRUCTIONS</span></div>' +
                '<div class="pp-section-body" id="pp-instructions-body">—</div>' +
              '</div>' +
              '<div class="pp-section">' +
                '<div class="pp-section-head"><div class="pp-section-bar" style="background:#f59e0b;"></div><span class="pp-section-title">CONSTRAINTS</span></div>' +
                '<div class="pp-section-body" id="pp-constraints-body">—</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          /* Footer */
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

    // Animate in
    requestAnimationFrame(() => {
      panelEl.querySelector(".pp-backdrop").style.opacity = "1";
      panelEl.querySelector(".pp-side").style.transform = "translateX(0)";
    });

    // Show original text
    panelEl.querySelector("#pp-original-preview").textContent = text;

    // Load stored settings
    if (s) {
      if (s.model) {
        const sel = panelEl.querySelector("#pp-model");
        if (sel) sel.value = s.model;
      }
      if (s.tone) {
        const selTone = panelEl.querySelector("#pp-tone");
        if (selTone) selTone.value = s.tone;
      }
    }

    // Close handlers
    panelEl.querySelector("#pp-close-btn").onclick = closePanel;
    panelEl.querySelector(".pp-backdrop")?.addEventListener("click", closePanel);
    document.addEventListener("keydown", ppEscHandler);

    // Chatbot pills
    const botUrls = { chatgpt: "https://chatgpt.com", claude: "https://claude.ai", gemini: "https://gemini.google.com", deepseek: "https://chat.deepseek.com" };
    panelEl.querySelectorAll(".pp-bot-pill").forEach((pill) => {
      const idx = Array.from(pill.parentElement.children).indexOf(pill);
      const url = Object.values(botUrls)[idx];
      if (url) pill.style.cursor = "pointer";
      pill.addEventListener("click", (e) => { e.stopPropagation(); if (url) window.open(url, "_blank"); });
    });

    // Keep Original
    panelEl.querySelector("#pp-keep-btn").onclick = () => {
      if (currentText) setText(input, currentText);
      closePanel();
    };

    // Enhance / Apply Upgrade
    panelEl.querySelector("#pp-enhance-btn").onclick = () => doEnhance(input, text);

    // Copy
    panelEl.querySelector("#pp-copy-btn").onclick = () => {
      const val = panelEl.querySelector("#pp-enhanced-preview").textContent;
      if (!val) return;
      navigator.clipboard.writeText(val);
      const copyBtn = panelEl.querySelector("#pp-copy-btn");
      copyBtn.textContent = "✓ Copied!";
      setTimeout(() => { copyBtn.textContent = "📋 Copy"; }, 1800);
    };

    // Store settings when changed
    panelEl.querySelector("#pp-model").addEventListener("change", (e) => {
      saveSettings({ model: e.target.value });
    });
    panelEl.querySelector("#pp-tone").addEventListener("change", (e) => {
      saveSettings({ tone: e.target.value });
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
      const modelVal = document.getElementById("pp-model")?.value || "gpt-4o-mini";
      const toneVal = document.getElementById("pp-tone")?.value || "Balanced";
      const parts = modelVal.split("::");
      const model = parts[0];
      const provider = parts[1] || "openai";

      const res = await chrome.runtime.sendMessage({ action: "enhancePrompt", text, model, provider, tone: toneVal });
      if (!res || !res.success) throw new Error(res?.error || "Enhancement failed");

      currentEnhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
      if (enhancedPreview) enhancedPreview.textContent = currentEnhanced;
      if (copyBtn) copyBtn.disabled = false;

      // Structured sections parsing
      if (sections) {
        sections.style.display = "block";
        parseAndFillSections(currentEnhanced);
      }

      // Update button to Replace mode
      if (btnText) btnText.textContent = "Insert into Page";
      if (btn) {
        btn.disabled = false;
        btn.onclick = () => {
          if (currentEnhanced) setText(input, currentEnhanced);
          showToast("Inserted enhanced prompt into editor!");
          closePanel();
        };
      }

      saveHistory(text);
    } catch (err) {
      showToast(err.message || "Failed to enhance prompt");
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

    if (roleEl) roleEl.textContent = role.trim() || "Not specified";
    if (ctxEl) ctxEl.textContent = context.trim() || "Standard context";
    if (instEl) instEl.textContent = instructions.trim() || enhanced;
    if (constEl) constEl.textContent = constraints.trim() || "None specified";
  }

  function ppEscHandler(e) {
    if (e.key === "Escape") closePanel();
  }

  const style = document.createElement("style");
  style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  /* ─── Toast Notification ─── */
  .pp-toast {
    position: fixed; bottom: 28px; left: 50%;
    transform: translateX(-50%) translateY(10px);
    background: rgba(15, 23, 42, 0.92);
    color: #f8fafc;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 13px; font-weight: 600;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    z-index: 100000001;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(12px);
    opacity: 0;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  }

  /* ─── Floating Action Button ─── */
  .pp-fab {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 18px;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.2);
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 4px 18px rgba(37,99,235,0.4);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 999999;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 13px; font-weight: 700;
    letter-spacing: -0.01em;
  }
  .pp-fab:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 24px rgba(37,99,235,0.55);
  }
  .pp-fab:active { transform: translateY(0) scale(0.98); }
  .pp-fab-icon {
    width: 24px; height: 24px;
    border-radius: 50%;
    background: rgba(255,255,255,0.22);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
  }

  /* ─── Backdrop ─── */
  .pp-backdrop {
    position: fixed; inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    z-index: 99999999;
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  /* ─── Side Panel Container ─── */
  .pp-side {
    position: fixed; top: 0; right: 0;
    width: 530px; max-width: 96vw;
    height: 100vh;
    z-index: 100000000;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .pp-side-inner {
    height: 100%;
    background: #f8fafc;
    display: flex; flex-direction: column;
    box-shadow: -8px 0 40px rgba(0,0,0,0.15);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #0f172a;
  }

  /* ─── Header ─── */
  .pp-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
  }
  .pp-head-left { display: flex; align-items: center; gap: 12px; }
  .pp-head-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #2563eb, #3b82f6);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: #fff;
    box-shadow: 0 3px 10px rgba(37,99,235,0.3);
  }
  .pp-head-info { display: flex; flex-direction: column; gap: 2px; }
  .pp-head-title { font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em; }
  .pp-head-enc {
    font-size: 10px; font-weight: 700; color: #10b981;
    text-transform: uppercase; letter-spacing: 0.06em;
    display: flex; align-items: center; gap: 4px;
  }
  .pp-enc-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.8);
    display: inline-block;
  }
  .pp-close-btn {
    background: none; border: none; color: #64748b;
    cursor: pointer; padding: 6px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .pp-close-btn:hover { background: #f1f5f9; color: #0f172a; }

  /* ─── Chatbot Strip ─── */
  .pp-bots-strip {
    display: flex; gap: 6px;
    padding: 8px 20px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
  }
  .pp-bot-pill {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    padding: 7px 4px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    font-size: 11px; font-weight: 600; color: #64748b;
    cursor: pointer; transition: all 0.15s;
  }
  .pp-bot-pill.active {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #2563eb;
  }
  .pp-bot-label { font-size: 11px; }

  /* ─── Scrollable Body ─── */
  .pp-body {
    flex: 1; overflow-y: auto;
    padding: 16px 20px;
    display: flex; flex-direction: column; gap: 14px;
    background: #f8fafc;
  }
  .pp-body::-webkit-scrollbar { width: 5px; }
  .pp-body::-webkit-scrollbar-track { background: transparent; }
  .pp-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

  .pp-controls-row {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  }

  /* ─── Split View ─── */
  .pp-split-header {
    display: flex; justify-content: space-between; align-items: center;
  }
  .pp-split-label {
    font-size: 11px; font-weight: 700; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .pp-split-label-right {
    display: flex; align-items: center; gap: 10px;
    font-size: 11px; font-weight: 700; color: #2563eb;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .pp-copy-chip {
    font-size: 11px; font-weight: 600;
    padding: 4px 10px; border-radius: 6px;
    border: 1px solid #cbd5e1;
    background: #ffffff; color: #475569;
    cursor: pointer; transition: all 0.15s;
    font-family: inherit;
  }
  .pp-copy-chip:hover { background: #f1f5f9; color: #0f172a; }
  .pp-copy-chip:disabled { opacity: 0.4; cursor: not-allowed; }

  .pp-split-view {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  .pp-split-original, .pp-split-improved {
    padding: 14px;
    border-radius: 12px;
    font-size: 13px; line-height: 1.6;
    min-height: 100px; max-height: 220px; overflow-y: auto;
    white-space: pre-wrap; word-break: break-word;
  }
  .pp-split-original {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
  .pp-split-improved {
    background: #ffffff;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .pp-placeholder { color: #94a3b8; font-style: italic; font-size: 12px; }

  /* ─── Structured Sections ─── */
  .pp-section {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px;
    margin-top: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .pp-section-head {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 8px;
  }
  .pp-section-bar {
    width: 4px; height: 16px;
    border-radius: 2px;
  }
  .pp-section-title {
    font-size: 11px; font-weight: 800; color: #0f172a;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .pp-section-body {
    font-size: 12.5px; line-height: 1.6; color: #334155;
    white-space: pre-wrap; word-break: break-word;
  }

  /* ─── Select Dropdowns ─── */
  .pp-select {
    width: 100%;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    color: #0f172a;
    padding: 8px 30px 8px 10px;
    font-size: 12px; font-weight: 500; font-family: inherit;
    outline: none; cursor: pointer; transition: all 0.15s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }
  .pp-select:hover { border-color: #94a3b8; }
  .pp-select:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }

  /* ─── Footer ─── */
  .pp-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px;
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
    flex-shrink: 0;
  }
  .pp-footer-credit {
    font-size: 12px; color: #64748b; font-weight: 500;
  }
  .pp-footer-credit strong { color: #2563eb; }

  .pp-footer-actions { display: flex; gap: 8px; }

  .pp-btn-keep {
    padding: 10px 18px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #475569;
    font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
    font-family: inherit;
  }
  .pp-btn-keep:hover { background: #f1f5f9; color: #0f172a; }

  .pp-btn-apply {
    padding: 10px 20px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    color: #ffffff;
    font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; gap: 6px;
    font-family: inherit;
    box-shadow: 0 3px 10px rgba(37,99,235,0.3);
  }
  .pp-btn-apply:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .pp-btn-apply:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .pp-btn-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ppSpin 0.6s linear infinite;
  }
  @keyframes ppSpin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  // Observer to re-inject FAB if DOM updates
  const observer = new MutationObserver(() => {
    if (!document.querySelector(".pp-fab")) injectFab();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  injectFab();

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request) => {
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
  });
})();
