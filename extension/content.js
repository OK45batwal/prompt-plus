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

  function loadHistory(cb) {
    if (!chrome?.storage?.local) { cb([]); return; }
    chrome.storage.local.get(HISTORY_KEY, (d) => cb(d[HISTORY_KEY] || []));
  }

  function saveHistory(item) {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get(HISTORY_KEY, (d) => {
      let h = d[HISTORY_KEY] || [];
      h = [{ text: item.slice(0, 80), ts: Date.now() }, ...h].slice(0, 10);
      chrome.storage.local.set({ [HISTORY_KEY]: h });
    });
  }

  function analyzeLocal(text) {
    const wc = text.split(/\s+/).length;
    const score = Math.min(95, Math.max(20, Math.round(wc * 1.8 + 20)));
    const complexity = wc < 10 ? "Low" : wc < 30 ? "Medium" : "High";
    const intent = text.includes("code") || text.includes("function") || text.includes("script") ? "Code" :
                   text.includes("email") || text.includes("write") ? "Writing" :
                   text.includes("analyze") || text.includes("explain") ? "Analysis" : "General";
    return { score, complexity, intent, wordCount: wc };
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
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/>' +
      '</svg>';
    fab.title = "Open Prompt+";

    fab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentTarget = input;
      currentText = getText(input);
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
      background: "rgba(15,23,42,0.85)", color: "#f1f5f9", padding: "10px 20px", borderRadius: "14px",
      fontSize: "13px", zIndex: "100000001", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      border: "1px solid rgba(99,102,241,0.2)", fontFamily: "-apple-system, sans-serif",
      backdropFilter: "blur(12px)", transition: "opacity 0.3s",
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2000);
  }

  function openPanel() {
    if (panelEl) { closePanel(); return; }
    const input = currentTarget;
    const text = currentText;
    if (!text.trim()) return;

    settings = null;
    loadSettings((s) => {
      settings = s;
      renderPanel(input, text, settings);
    });
  }

  function closePanel() {
    if (panelEl) { panelEl.remove(); panelEl = null; panelOpen = false; }
  }

  let settings = null;

  function renderPanel(input, text, s) {
    panelOpen = true;
    panelEl = document.createElement("div");
    panelEl.className = "pp-panel";
    panelEl.innerHTML =
      '<div class="pp-backdrop"></div>' +
      '<div class="pp-side">' +
        '<div class="pp-side-inner">' +
          '<div class="pp-head">' +
            '<div class="pp-head-l"><span class="pp-head-icon">P</span><span>Prompt+</span></div>' +
            '<div class="pp-head-r">' +
              '<button class="pp-icon-btn" id="pp-settings-btn" title="Settings">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' +
              '</button>' +
              '<button class="pp-icon-btn" id="pp-close-btn">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="pp-body" id="pp-body">' +
            // Analysis Card
            '<div class="pp-card" id="pp-analysis-card">' +
              '<div class="pp-analysis-top">' +
                '<div class="pp-score-ring">' +
                  '<svg viewBox="0 0 36 36" width="48" height="48">' +
                    '<path d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2.5"/>' +
                    '<path id="pp-score-arc" d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" fill="none" stroke="#818cf8" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="100 100"/>' +
                  '</svg>' +
                  '<span class="pp-score-num" id="pp-score-num">--</span>' +
                '</div>' +
                '<div class="pp-analysis-meta">' +
                  '<div class="pp-meta-row"><span class="pp-meta-lbl">Intent</span><span class="pp-meta-val" id="pp-intent">--</span></div>' +
                  '<div class="pp-meta-row"><span class="pp-meta-lbl">Complexity</span><span class="pp-meta-val" id="pp-complexity">--</span></div>' +
                  '<div class="pp-meta-row"><span class="pp-meta-lbl">Words</span><span class="pp-meta-val" id="pp-words">--</span></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // Suggestions
            '<div class="pp-card" id="pp-suggestions-card">' +
              '<div class="pp-card-h">Suggestions <span class="pp-badge" id="pp-suggestion-count">5</span></div>' +
              '<div class="pp-suggestions" id="pp-suggestions">' +
                '<label class="pp-suggestion checked"><input type="checkbox" checked><span class="pp-check"></span><span>Add Role & Persona</span></label>' +
                '<label class="pp-suggestion checked"><input type="checkbox" checked><span class="pp-check"></span><span>Add Constraints</span></label>' +
                '<label class="pp-suggestion checked"><input type="checkbox" checked><span class="pp-check"></span><span>Add Output Format</span></label>' +
                '<label class="pp-suggestion checked"><input type="checkbox" checked><span class="pp-check"></span><span>Add Context</span></label>' +
                '<label class="pp-suggestion checked"><input type="checkbox" checked><span class="pp-check"></span><span>Add Examples</span></label>' +
              '</div>' +
            '</div>' +
            // Model Selector
            '<div class="pp-card">' +
              '<div class="pp-card-h">Model</div>' +
              '<div class="pp-model-select">' +
                '<select id="pp-model" class="pp-select">' +
                  '<option value="gpt-4o-mini" selected>GPT-4o Mini</option>' +
                  '<option value="gpt-4o">GPT-4o</option>' +
                  '<option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>' +
                  '<option value="gemini-1-5-pro">Gemini 1.5 Pro</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            // Preview
            '<div class="pp-card">' +
              '<div class="pp-card-h">Original</div>' +
              '<div class="pp-preview" id="pp-original-preview"></div>' +
            '</div>' +
            '<div class="pp-card" id="pp-enhanced-card" style="display:none">' +
              '<div class="pp-card-h">Enhanced</div>' +
              '<div class="pp-preview pp-enhanced-box" id="pp-enhanced-preview" contenteditable="true"></div>' +
            '</div>' +
            // Actions
            '<div class="pp-actions" id="pp-actions">' +
              '<button class="pp-btn pp-btn-primary" id="pp-enhance-btn">' +
                '<span class="pp-btn-spinner" style="display:none"></span>' +
                '<span id="pp-enhance-text">Enhance</span>' +
              '</button>' +
              '<button class="pp-btn pp-btn-secondary" id="pp-copy-btn" disabled>Copy</button>' +
              '<button class="pp-btn pp-btn-secondary" id="pp-replace-btn" disabled>Replace</button>' +
            '</div>' +
            // History
            '<div class="pp-card" id="pp-history-card">' +
              '<div class="pp-card-h">Recent</div>' +
              '<div class="pp-history" id="pp-history"></div>' +
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

    // Run analysis
    const analysis = analyzeLocal(text);
    const scoreArc = panelEl.querySelector("#pp-score-arc");
    const scoreNum = panelEl.querySelector("#pp-score-num");
    const circ = 100;
    scoreArc.setAttribute("stroke-dasharray", circ + " " + circ);
    scoreArc.setAttribute("stroke-dashoffset", circ - (analysis.score / 100) * circ);
    scoreNum.textContent = analysis.score;
    panelEl.querySelector("#pp-intent").textContent = analysis.intent;
    panelEl.querySelector("#pp-complexity").textContent = analysis.complexity;
    panelEl.querySelector("#pp-words").textContent = analysis.wordCount;
    panelEl.querySelector("#pp-original-preview").textContent = text;

    // History
    loadHistory((h) => {
      const hist = panelEl.querySelector("#pp-history");
      if (h.length === 0) { hist.innerHTML = '<div class="pp-empty">No recent prompts</div>'; return; }
      hist.innerHTML = h.map((item, i) =>
        '<div class="pp-history-item" data-idx="' + i + '">' +
          '<span>' + escapeHtml(item.text) + '</span>' +
        '</div>'
      ).join("");
    });

    // Suggestions count
    updateSuggestionCount();

    // Close
    panelEl.querySelector("#pp-close-btn").onclick = closePanel;
    panelEl.querySelector("#pp-backdrop")?.addEventListener("click", closePanel);
    document.addEventListener("keydown", ppEscHandler);

    // Settings toggle
    panelEl.querySelector("#pp-settings-btn").onclick = () => toggleSettings();

    // Enhance
    panelEl.querySelector("#pp-enhance-btn").onclick = () => doEnhance(input, text);

    // Copy
    panelEl.querySelector("#pp-copy-btn").onclick = () => {
      const val = panelEl.querySelector("#pp-enhanced-preview").textContent;
      if (!val) return;
      navigator.clipboard.writeText(val);
      showToast("Copied");
    };

    // Replace
    panelEl.querySelector("#pp-replace-btn").onclick = () => {
      const val = panelEl.querySelector("#pp-enhanced-preview").textContent;
      if (val) setText(input, val);
      closePanel();
    };

    // Suggestions toggle
    panelEl.querySelectorAll(".pp-suggestion input").forEach((cb) => {
      cb.addEventListener("change", updateSuggestionCount);
    });

    // History click
    panelEl.addEventListener("click", (e) => {
      const item = e.target.closest(".pp-history-item");
      if (item) {
        const idx = parseInt(item.dataset.idx);
        loadHistory((h) => {
          if (h[idx]) {
            panelEl.querySelector("#pp-original-preview").textContent = h[idx].text;
            currentText = h[idx].text;
          }
        });
      }
    });

    if (settings && settings.autoEnhance) {
      doEnhance(input, text);
    }
  }

  function toggleSettings() {
    const body = document.getElementById("pp-body");
    if (!body) return;
    const existing = body.querySelector(".pp-settings-card");
    if (existing) { existing.remove(); return; }

    const card = document.createElement("div");
    card.className = "pp-card pp-settings-card";
    card.innerHTML =
      '<div class="pp-card-h">Settings</div>' +
      '<div class="pp-setting-row">' +
        '<span>Dark Mode</span>' +
        '<label class="pp-toggle"><input type="checkbox" ' + (settings?.darkMode !== false ? "checked" : "") + ' id="pp-dark-toggle"><span class="pp-toggle-track"></span></label>' +
      '</div>' +
      '<div class="pp-setting-row">' +
        '<span>Auto Enhance</span>' +
        '<label class="pp-toggle"><input type="checkbox" ' + (settings?.autoEnhance ? "checked" : "") + ' id="pp-auto-toggle"><span class="pp-toggle-track"></span></label>' +
      '</div>' +
      '<div class="pp-setting-row">' +
        '<span>Optimization</span>' +
        '<select class="pp-select pp-opt-select" id="pp-opt-level">' +
          '<option value="basic">Basic</option>' +
          '<option value="balanced" selected>Balanced</option>' +
          '<option value="advanced">Advanced</option>' +
        '</select>' +
      '</div>';

    body.insertBefore(card, body.querySelector(".pp-actions"));

    card.querySelector("#pp-dark-toggle").addEventListener("change", (e) => {
      saveSettings({ darkMode: e.target.checked });
    });
    card.querySelector("#pp-auto-toggle").addEventListener("change", (e) => {
      saveSettings({ autoEnhance: e.target.checked });
    });
    card.querySelector("#pp-opt-level")?.addEventListener("change", (e) => {
      saveSettings({ optLevel: e.target.value });
    });
  }

  function updateSuggestionCount() {
    const el = document.getElementById("pp-suggestion-count");
    if (!el) return;
    const checked = document.querySelectorAll(".pp-suggestion input:checked").length;
    el.textContent = checked;
  }

  function getSelectedSuggestions() {
    const labels = [];
    document.querySelectorAll(".pp-suggestion input:checked").forEach((cb) => {
      const text = cb.closest(".pp-suggestion")?.querySelector("span:last-child")?.textContent;
      if (text) labels.push(text);
    });
    return labels;
  }

  let enhancing = false;

  async function doEnhance(input, text) {
    if (enhancing) return;
    enhancing = true;

    const btn = document.getElementById("pp-enhance-btn");
    const btnText = document.getElementById("pp-enhance-text");
    const spinner = btn?.querySelector(".pp-btn-spinner");
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = "Enhancing...";
    if (spinner) spinner.style.display = "inline-block";

    const enhancedCard = document.getElementById("pp-enhanced-card");
    const enhancedPreview = document.getElementById("pp-enhanced-preview");
    const copyBtn = document.getElementById("pp-copy-btn");
    const replaceBtn = document.getElementById("pp-replace-btn");

    if (enhancedCard) enhancedCard.style.display = "none";

    try {
      const res = await chrome.runtime.sendMessage({ action: "enhancePrompt", text });
      if (!res || !res.success) throw new Error(res?.error || "Failed");

      currentEnhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
      if (enhancedPreview) enhancedPreview.textContent = currentEnhanced;
      if (enhancedCard) enhancedCard.style.display = "block";
      if (copyBtn) copyBtn.disabled = false;
      if (replaceBtn) replaceBtn.disabled = false;

      saveHistory(text);
      loadHistory((h) => {
        const el = document.getElementById("pp-history");
        if (!el) return;
        el.innerHTML = h.map((item, i) =>
          '<div class="pp-history-item" data-idx="' + i + '">' +
            '<span>' + escapeHtml(item.text) + '</span>' +
          '</div>'
        ).join("");
      });
    } catch (err) {
      showToast(err.message);
    } finally {
      enhancing = false;
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = "Enhance";
      if (spinner) spinner.style.display = "none";
    }
  }

  function ppEscHandler(e) {
    if (e.key === "Escape") closePanel();
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  const style = document.createElement("style");
  style.textContent = `

.pp-fab {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9));
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(99,102,241,0.35);
  transition: all 0.2s ease;
  z-index: 999999;
  backdrop-filter: blur(8px);
  animation: ppFabIn 0.3s ease-out;
}

.pp-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(99,102,241,0.5);
}

.pp-fab:active { transform: scale(0.95); }

@keyframes ppFabIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

.pp-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 99999999;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.pp-side {
  position: fixed;
  top: 0;
  right: 0;
  width: 420px;
  max-width: 92vw;
  height: 100vh;
  z-index: 100000000;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.pp-side-inner {
  height: 100%;
  background: rgba(15,23,42,0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid rgba(99,102,241,0.12);
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0,0,0,0.3);
}

.pp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.pp-head-l { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #e0e7ff; }
.pp-head-icon { width: 22px; height: 22px; border-radius: 6px; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #fff; }
.pp-head-r { display: flex; align-items: center; gap: 4px; }

.pp-icon-btn {
  background: none; border: none; color: #64748b; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.pp-icon-btn:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }

.pp-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pp-body::-webkit-scrollbar { width: 4px; }
.pp-body::-webkit-scrollbar-track { background: transparent; }
.pp-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

.pp-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 14px 16px;
}

.pp-card-h {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pp-badge {
  font-size: 10px;
  background: rgba(99,102,241,0.2);
  color: #a5b4fc;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 700;
}

.pp-analysis-top {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pp-score-ring { position: relative; width: 48px; height: 48px; flex-shrink: 0; }
.pp-score-num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #e0e7ff; }

.pp-analysis-meta { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.pp-meta-row { display: flex; justify-content: space-between; align-items: center; }
.pp-meta-lbl { font-size: 11px; color: #64748b; }
.pp-meta-val { font-size: 12px; font-weight: 600; color: #e2e8f0; }

.pp-suggestions { display: flex; flex-direction: column; gap: 6px; }

.pp-suggestion {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #cbd5e1;
  cursor: pointer;
  padding: 4px 0;
  user-select: none;
}

.pp-suggestion input { display: none; }

.pp-check {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid rgba(255,255,255,0.12);
  flex-shrink: 0;
  position: relative;
  transition: all 0.15s;
}

.pp-suggestion.checked .pp-check {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: #6366f1;
}

.pp-suggestion.checked .pp-check::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.pp-suggestion:hover .pp-check { border-color: rgba(99,102,241,0.5); }
.pp-suggestion:hover { color: #f1f5f9; }

.pp-select {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: #e2e8f0;
  padding: 8px 12px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.pp-select:hover { border-color: rgba(99,102,241,0.3); }
.pp-select:focus { border-color: rgba(99,102,241,0.5); }

.pp-preview {
  font-size: 12px;
  line-height: 1.6;
  color: #94a3b8;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
}

.pp-enhanced-box {
  color: #e2e8f0;
  max-height: 200px;
}

.pp-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pp-btn {
  padding: 9px 16px;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
}

.pp-btn-primary {
  flex: 1;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  min-width: 100px;
}

.pp-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
.pp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; filter: none; }

.pp-btn-secondary {
  flex: 1;
  background: rgba(255,255,255,0.04);
  color: #94a3b8;
  border: 1px solid rgba(255,255,255,0.08);
}

.pp-btn-secondary:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }
.pp-btn-secondary:disabled { opacity: 0.35; cursor: not-allowed; }

.pp-btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ppSpin 0.6s linear infinite;
}

@keyframes ppSpin { to { transform: rotate(360deg); } }

.pp-history { display: flex; flex-direction: column; gap: 4px; }
.pp-history-item {
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pp-history-item:hover { background: rgba(255,255,255,0.04); color: #e2e8f0; }
.pp-empty { font-size: 12px; color: #475569; text-align: center; padding: 8px; }

.pp-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: #cbd5e1;
}

.pp-toggle { position: relative; cursor: pointer; }
.pp-toggle input { display: none; }
.pp-toggle-track {
  display: block;
  width: 36px;
  height: 20px;
  background: rgba(255,255,255,0.08);
  border-radius: 12px;
  transition: background 0.2s;
  position: relative;
}
.pp-toggle-track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #64748b;
  border-radius: 50%;
  transition: all 0.2s;
}
.pp-toggle input:checked + .pp-toggle-track { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.pp-toggle input:checked + .pp-toggle-track::after { left: 18px; background: #fff; }

.pp-opt-select { width: auto; min-width: 100px; padding: 6px 28px 6px 10px; font-size: 12px; }
  `;
  document.head.appendChild(style);

  // Prevent multiple instances
  if (document.querySelector(".pp-fab")) return;
  setInterval(injectFab, 1500);
})();
