(function () {
  let pendingTarget = null;

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

  function injectButton() {
    if (document.querySelector(".pp-btn")) return;
    const target = getTargetInput();
    if (!target) return;

    const btn = document.createElement("button");
    btn.className = "pp-btn";
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg><span>Prompt+</span>';
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      pendingTarget = target;
      const raw = getText(target);
      if (!raw.trim()) {
        showToast("Please enter a prompt first");
        return;
      }
      openModal(target, raw);
    });
    const parent = target.element.parentElement || document.body;
    parent.insertBefore(btn, target.element);
  }

  function showToast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "#1e293b", color: "#f1f5f9", padding: "10px 20px", borderRadius: "10px",
      fontSize: "13px", zIndex: "99999999", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      border: "1px solid #334155", fontFamily: "-apple-system, sans-serif",
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function openModal(target, rawText) {
    const existing = document.querySelector(".pp-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "pp-overlay";
    overlay.innerHTML =
      '<div class="pp-modal">' +
        '<div class="pp-h">' +
          '<div class="pp-h-title"><span class="pp-h-icon">P</span> Prompt+ Architect</div>' +
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
  style.textContent =
    ".pp-btn{display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff!important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;font-weight:600;padding:5px 12px;border-radius:18px;border:1px solid rgba(255,255,255,.15);cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,.3);transition:all .15s;z-index:999999;margin:6px 0;user-select:none}" +
    ".pp-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(99,102,241,.45);filter:brightness(1.1)}" +
    ".pp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.65);backdrop-filter:blur(6px);z-index:99999999;display:flex;align-items:center;justify-content:center;opacity:0;animation:ppFadeIn .2s forwards ease-out}" +
    "@keyframes ppFadeIn{to{opacity:1}}" +
    ".pp-modal{width:90%;max-width:680px;max-height:85vh;background:#1e293b;border:1px solid #334155;border-radius:16px;color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden}" +
    ".pp-h{padding:14px 18px;background:#0f172a;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between}" +
    ".pp-h-title{font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px}" +
    ".pp-h-icon{width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}" +
    ".pp-h-close{background:none;border:none;color:#64748b;font-size:22px;cursor:pointer;padding:2px 6px;border-radius:4px;line-height:1}" +
    ".pp-h-close:hover{color:#fff;background:#334155}" +
    ".pp-b{padding:18px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:14px}" +
    ".pp-section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:5px}" +
    ".pp-box{background:#0f172a;border:1px solid #334155;border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.6;color:#e2e8f0;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow-y:auto}" +
    ".pp-loading{display:flex;align-items:center;gap:8px;color:#64748b;font-size:13px}" +
    ".pp-spinner{display:inline-block;width:14px;height:14px;border:2px solid #334155;border-top-color:#6366f1;border-radius:50%;animation:ppSpin .6s linear infinite}" +
    "@keyframes ppSpin{to{transform:rotate(360deg)}}" +
    ".pp-f{padding:14px 18px;background:#0f172a;border-top:1px solid #334155;display:flex;align-items:center;justify-content:flex-end;gap:10px}" +
    ".pp-btn-sec{background:#334155;color:#f8fafc;border:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s}" +
    ".pp-btn-sec:hover{background:#475569}" +
    ".pp-btn-pri{background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s}" +
    ".pp-btn-pri:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.1)}" +
    ".pp-btn-pri:disabled{opacity:.4;cursor:not-allowed}";
  document.head.appendChild(style);

  setInterval(injectButton, 1500);
})();
