(function () {
  const DAILY_LIMIT = parseInt(chrome?.runtime?.id ? 20 : 20, 10);
  const STORAGE_KEY = "pp_credits";

  function getTargetInput() {
    let el = document.querySelector("#prompt-textarea, textarea[data-id='root']");
    if (el) return { element: el, type: "chatgpt" };
    el = document.querySelector("div[contenteditable='true'].ProseMirror, textarea");
    if (el && location.hostname.includes("claude")) return { element: el, type: "claude" };
    el = document.querySelector("div[contenteditable='true'], textarea");
    if (el && location.hostname.includes("gemini")) return { element: el, type: "gemini" };
    const textarea = document.querySelector("textarea");
    if (textarea) return { element: textarea, type: "generic" };
    return null;
  }

  function getText(target) {
    if (!target) return "";
    const el = target.element;
    return el.tagName === "TEXTAREA" || el.tagName === "INPUT"
      ? el.value
      : el.innerText || el.textContent || "";
  }

  function setText(target, text) {
    if (!target) return;
    const el = target.element;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      el.value = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (el.isContentEditable) {
      el.innerText = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function getCreditColor(remaining, total) {
    const pct = remaining / total;
    if (pct > 0.5) return { bar: "#10b981", text: "#6ee7b7" };
    if (pct > 0.2) return { bar: "#f59e0b", text: "#fcd34d" };
    return { bar: "#ef4444", text: "#fca5a5" };
  }

  function loadCredits(cb) {
    if (!chrome?.storage?.local) { cb({ remaining: DAILY_LIMIT, total: DAILY_LIMIT, ts: Date.now() }); return; }
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const stored = data[STORAGE_KEY];
      if (stored && stored.ts) {
        const elapsed = Date.now() - stored.ts;
        if (elapsed < 86400000) {
          cb({ remaining: stored.remaining, total: stored.total || DAILY_LIMIT, ts: stored.ts });
          return;
        }
      }
      const fresh = { remaining: DAILY_LIMIT, total: DAILY_LIMIT, ts: Date.now() };
      chrome.storage.local.set({ [STORAGE_KEY]: fresh }, () => cb(fresh));
    });
  }

  function saveCredits(remaining, total) {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.set({ [STORAGE_KEY]: { remaining, total, ts: Date.now() } });
  }

  function useOneCredit(cb) {
    loadCredits((credits) => {
      let r = Math.max(0, credits.remaining - 1);
      saveCredits(r, credits.total);
      if (cb) cb(r, credits.total);
    });
  }

  function injectButton() {
    if (document.querySelector(".pp-wrap")) return;
    const target = getTargetInput();
    if (!target) return;

    const wrap = document.createElement("div");
    wrap.className = "pp-wrap";

    loadCredits((credits) => {
      const r = credits.remaining;
      const t = credits.total;
      const pct = t > 0 ? Math.round((r / t) * 100) : 0;
      const col = getCreditColor(r, t);

      wrap.innerHTML =
        '<button type="button" class="pp-btn" title="Enhance with Prompt+ AI">' +
          '<svg class="pp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/>' +
            '<circle cx="19" cy="5" r="1" fill="currentColor"/>' +
            '<circle cx="5" cy="19" r="1" fill="currentColor"/>' +
            '<circle cx="20" cy="18" r="0.8" fill="currentColor"/>' +
          '</svg>' +
          '<span class="pp-label">Prompt+</span>' +
        '</button>' +
        '<div class="pp-credit-wrap">' +
          '<div class="pp-credit-track">' +
            '<div class="pp-credit-bar" style="width:' + pct + '%;background:' + col.bar + '"></div>' +
          '</div>' +
          '<span class="pp-credit-text" style="color:' + col.text + '">' + r + '/' + t + '</span>' +
        '</div>';
    });

    const btn = wrap.querySelector("button");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const raw = getText(target);
        if (!raw.trim()) { showToast("Enter a prompt first"); return; }
        useOneCredit(() => {
          const bar = wrap.querySelector(".pp-credit-bar");
          const txt = wrap.querySelector(".pp-credit-text");
          if (bar) { loadCredits((c) => {
            const p = c.total > 0 ? Math.round((c.remaining / c.total) * 100) : 0;
            const col = getCreditColor(c.remaining, c.total);
            bar.style.width = p + "%";
            bar.style.background = col.bar;
            if (txt) { txt.textContent = c.remaining + "/" + c.total; txt.style.color = col.text; }
          }); }
        });
        openModal(target, raw);
      });
    }

    if (target.element.parentElement) {
      target.element.parentElement.style.position = "relative";
      target.element.parentElement.appendChild(wrap);
    }
  }

  function showToast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "#0f172a", color: "#f1f5f9", padding: "10px 20px", borderRadius: "12px",
      fontSize: "13px", zIndex: "99999999", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      border: "1px solid #1e293b", fontFamily: "-apple-system, sans-serif",
      backdropFilter: "blur(8px)",
    });
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.transition = "opacity .3s";
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }

  function openModal(target, rawText) {
    const existing = document.querySelector(".pp-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "pp-overlay";
    overlay.innerHTML =
      '<div class="pp-modal">' +
        '<div class="pp-h">' +
          '<div class="pp-h-title">' +
            '<svg class="pp-h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/>' +
              '<circle cx="19" cy="5" r="1" fill="currentColor"/>' +
              '<circle cx="5" cy="19" r="1" fill="currentColor"/>' +
            '</svg>' +
            'Prompt+ Architect' +
          '</div>' +
          '<button class="pp-h-close">&times;</button>' +
        '</div>' +
        '<div class="pp-b">' +
          '<div class="pp-section"><div class="pp-section-label">Original</div><div class="pp-box pp-orig">' + escapeHtml(rawText) + '</div></div>' +
          '<div class="pp-section">' +
            '<div class="pp-section-label">Enhanced</div>' +
            '<div class="pp-box pp-enhanced" id="pp-enhanced" contenteditable="true">' +
              '<div class="pp-loading"><span class="pp-spinner"></span> Enhancing with AI...</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pp-f">' +
          '<button class="pp-btn-sec" id="pp-cancel">Cancel</button>' +
          '<button class="pp-btn-pri" id="pp-insert" disabled>Replace &amp; Insert</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    const enhancedBox = document.getElementById("pp-enhanced");
    const insertBtn = document.getElementById("pp-insert");

    overlay.querySelector(".pp-h-close").onclick = () => overlay.remove();
    document.getElementById("pp-cancel").onclick = () => overlay.remove();
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    insertBtn.onclick = () => {
      const edited = enhancedBox.innerText;
      if (edited) setText(target, edited);
      overlay.remove();
    };

    chrome.runtime.sendMessage({ action: "enhancePrompt", text: rawText }, (res) => {
      if (chrome.runtime.lastError || !res || !res.success) {
        enhancedBox.innerHTML =
          '<div style="color:#f87171;font-size:13px;">Enhancement failed. Try the popup or dashboard.</div>';
        insertBtn.disabled = true;
        return;
      }
      const enhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
      enhancedBox.textContent = enhanced;
      insertBtn.disabled = false;
    });
  }

  const style = document.createElement("style");
  style.textContent = `

.pp-wrap {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 999999;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.pp-wrap * { pointer-events: auto; }

.pp-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px 5px 8px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #a5b4fc;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(99, 102, 241, 0.25);
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.15);
  transition: all 0.2s ease;
  user-select: none;
  animation: ppEntrance 0.35s ease-out;
}

@keyframes ppEntrance {
  from { opacity: 0; transform: scale(0.85) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.pp-btn:hover {
  color: #e0e7ff;
  background: rgba(99, 102, 241, 0.25);
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}

.pp-btn:active { transform: translateY(0) scale(0.97); }

.pp-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  color: #818cf8;
  animation: ppGlow 2s ease-in-out infinite;
}

@keyframes ppGlow {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.pp-label { font-size: 11px; letter-spacing: 0.02em; }

.pp-credit-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 4px;
}

.pp-credit-track {
  width: 36px;
  height: 3px;
  background: rgba(255,255,255,0.08);
  border-radius: 2px;
  overflow: hidden;
}

.pp-credit-bar {
  height: 100%;
  border-radius: 2px;
  background: #10b981;
  transition: width 0.3s ease, background 0.3s ease;
}

.pp-credit-text {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #6ee7b7;
  transition: color 0.3s ease;
}

.pp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 99999999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  animation: ppFadeIn 0.2s forwards ease-out;
}

@keyframes ppFadeIn { to { opacity: 1; } }

.pp-modal {
  width: 90%;
  max-width: 680px;
  max-height: 85vh;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ppModalIn 0.2s ease-out;
}

@keyframes ppModalIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.pp-h { padding: 14px 18px; background: #0f172a; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; }
.pp-h-title { font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: #e0e7ff; }
.pp-h-icon { width: 18px; height: 18px; color: #818cf8; }
.pp-h-close { background: none; border: none; color: #64748b; font-size: 22px; cursor: pointer; padding: 2px 8px; border-radius: 6px; line-height: 1; transition: all 0.15s; }
.pp-h-close:hover { color: #fff; background: #334155; }

.pp-b { padding: 18px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px; }
.pp-section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 5px; }
.pp-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 13px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; word-break: break-word; max-height: 200px; overflow-y: auto; }
.pp-loading { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px; }
.pp-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #334155; border-top-color: #818cf8; border-radius: 50%; animation: ppSpin 0.6s linear infinite; }
@keyframes ppSpin { to { transform: rotate(360deg); } }

.pp-f { padding: 14px 18px; background: #0f172a; border-top: 1px solid #334155; display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.pp-btn-sec { background: #334155; color: #f8fafc; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.pp-btn-sec:hover { background: #475569; }
.pp-btn-pri { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
.pp-btn-pri:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35); }
.pp-btn-pri:disabled { opacity: 0.4; cursor: not-allowed; }
  `;
  document.head.appendChild(style);

  setInterval(injectButton, 1500);
})();
