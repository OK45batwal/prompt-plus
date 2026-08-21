(function () {
  let modalEl = null;
  let selectedTone = "code";

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
    if (document.getElementById("pp-styles-v2")) return;
    const style = document.createElement("style");
    style.id = "pp-styles-v2";
    style.textContent = `
      .pp-floating-trigger {
        position: fixed !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 5px 12px 5px 8px !important;
        border-radius: 9999px !important;
        background: rgba(14, 14, 18, 0.94) !important;
        border: 1px solid rgba(99, 102, 241, 0.45) !important;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5), 0 0 14px rgba(99, 102, 241, 0.25) !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif !important;
        z-index: 99999999 !important;
        cursor: pointer !important;
        user-select: none !important;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        color: #ffffff !important;
      }
      .pp-floating-trigger:hover {
        transform: translateY(-2px) scale(1.02) !important;
        border-color: rgba(99, 102, 241, 0.7) !important;
        box-shadow: 0 10px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.45) !important;
      }
      .pp-floating-trigger:active {
        transform: translateY(0) scale(0.98) !important;
      }

      .pp-trigger-icon {
        width: 20px !important;
        height: 20px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        color: #ffffff !important;
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.4) !important;
      }

      .pp-trigger-text {
        font-size: 11.5px !important;
        font-weight: 700 !important;
        letter-spacing: -0.01em !important;
        color: #ffffff !important;
        display: flex !important;
        align-items: center !important;
        gap: 5px !important;
      }

      .pp-trigger-token-badge {
        font-size: 9.5px !important;
        font-weight: 600 !important;
        padding: 2px 6px !important;
        border-radius: 9999px !important;
        background: rgba(255, 255, 255, 0.08) !important;
        color: #a1a1aa !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
      }

      /* Floating Modal Studio */
      .pp-floating-modal {
        position: fixed !important;
        z-index: 100000000 !important;
        width: 380px !important;
        max-width: calc(100vw - 32px) !important;
        background: rgba(14, 14, 18, 0.96) !important;
        border: 1px solid rgba(99, 102, 241, 0.45) !important;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(99, 102, 241, 0.25) !important;
        backdrop-filter: blur(24px) !important;
        -webkit-backdrop-filter: blur(24px) !important;
        border-radius: 14px !important;
        padding: 12px 14px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif !important;
        color: #f4f4f5 !important;
        user-select: none !important;
        animation: ppModalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }

      @keyframes ppModalIn {
        from { opacity: 0; transform: translateY(8px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .pp-modal-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
      }

      .pp-modal-title {
        display: flex !important;
        align-items: center !important;
        gap: 7px !important;
        font-size: 12.5px !important;
        font-weight: 700 !important;
        color: #ffffff !important;
      }

      .pp-modal-close-btn {
        background: transparent !important;
        border: none !important;
        color: #71717a !important;
        font-size: 14px !important;
        cursor: pointer !important;
        padding: 2px 6px !important;
        border-radius: 6px !important;
        transition: color 0.15s ease !important;
      }
      .pp-modal-close-btn:hover {
        color: #ffffff !important;
        background: rgba(255, 255, 255, 0.08) !important;
      }

      .pp-tone-row {
        display: flex !important;
        gap: 4px !important;
        overflow-x: auto !important;
      }

      .pp-tone-chip {
        font-size: 10px !important;
        font-weight: 600 !important;
        padding: 3px 8px !important;
        border-radius: 6px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: #a1a1aa !important;
        cursor: pointer !important;
        white-space: nowrap !important;
        transition: all 0.15s ease !important;
      }
      .pp-tone-chip:hover {
        color: #ffffff !important;
        background: rgba(255, 255, 255, 0.1) !important;
      }
      .pp-tone-chip.active {
        background: rgba(99, 102, 241, 0.25) !important;
        border-color: rgba(99, 102, 241, 0.6) !important;
        color: #c7d2fe !important;
      }

      .pp-modal-preview {
        background: rgba(0, 0, 0, 0.45) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 9px !important;
        padding: 8px 10px !important;
        font-size: 11.5px !important;
        line-height: 1.45 !important;
        color: #e4e4e7 !important;
        max-height: 100px !important;
        overflow-y: auto !important;
        white-space: pre-wrap !important;
        user-select: text !important;
      }

      .pp-modal-actions {
        display: flex !important;
        gap: 6px !important;
      }

      .pp-modal-btn-primary {
        flex: 1 !important;
        height: 36px !important;
        border-radius: 8px !important;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        color: #ffffff !important;
        font-size: 11.5px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 5px !important;
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4) !important;
        transition: all 0.15s ease !important;
      }
      .pp-modal-btn-primary:hover {
        filter: brightness(1.08) !important;
        transform: translateY(-1px) !important;
      }

      .pp-modal-btn-sub {
        height: 36px !important;
        padding: 0 12px !important;
        border-radius: 8px !important;
        background: rgba(255, 255, 255, 0.06) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        color: #ffffff !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;
        transition: all 0.15s ease !important;
      }
      .pp-modal-btn-sub:hover {
        background: rgba(255, 255, 255, 0.12) !important;
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

  function showToast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      background: "rgba(10,10,12,0.92)", color: "#f1f5f9", padding: "8px 18px", borderRadius: "12px",
      fontSize: "12px", fontWeight: "600", zIndex: "100000001", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", transition: "all 0.3s ease"
    });
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translate(-50%, 10px)";
      setTimeout(() => t.remove(), 300);
    }, 2800);
  }

  function synthesizeLocalPrompt(userInput, tone = "code") {
    const text = (userInput || "").trim();
    if (!text) return "";
    const cleanInput = text.replace(/^(please|can you|help me|i want to|i need to|how to|write|create|build|fix|generate|make)\s+/i, "");
    const subject = cleanInput.length > 0 ? cleanInput : text;

    let role = "Senior Subject Matter Expert & Principal Architect";
    let toneStr = "Technically Rigorous, Production-Grade";
    let sec1 = "SPECIFICATIONS & ARCHITECTURAL CONSTRAINTS";
    let sec2 = "IMPLEMENTATION PROTOCOL";

    if (tone === "copy") {
      role = "Elite Conversion Copywriter & Brand Strategist";
      toneStr = "High-Conversion, Punchy & Action-Oriented";
      sec1 = "AUDIENCE HOOK & VALUE DIRECTIVES";
      sec2 = "NARRATIVE EXECUTION STEPS";
    } else if (tone === "exec") {
      role = "Senior Management Consultant & Executive Director";
      toneStr = "Concise, Strategic & Metric-Driven";
      sec1 = "STRATEGIC OBJECTIVES & CONSTRAINTS";
      sec2 = "ACTIONABLE ROADMAP & DECISION STEPS";
    } else if (tone === "deep") {
      role = "Lead AI Research Scientist & Deep Logic Reasoner";
      toneStr = "Exhaustive, First-Principles Reasoning";
      sec1 = "CORE HYPOTHESES & LOGICAL CONSTRAINTS";
      sec2 = "STEP-BY-STEP DEDUCTION & VALIDATION";
    }

    return `### ROLE & PERSONA
You are an authoritative ${role}. Execute this task with highest precision:
"${text}"

### ${sec1}
- **Subject**: "${subject}"
- **Tone Profile**: ${toneStr}
- **Constraints**: Deliver complete, unabridged solutions without placeholders or conversational fluff.

### ${sec2}
1. Analyze core requirements for "${subject}" and anticipate implicit edge cases.
2. Structure output with modular sections, scannable Markdown headers, and concrete code/examples.
3. Validate solution against scalability, efficiency, and reliability best practices.

### DELIVERABLES & OUTPUT FORMAT
- Deliver complete, immediately usable results formatted in clean Markdown.`;
  }

  // Open Floating Optimizer Modal
  function openFloatingModal(inputEl) {
    if (modalEl) {
      modalEl.remove();
      modalEl = null;
    }

    currentTarget = inputEl;
    const currentVal = getText(inputEl).trim();
    const tokenCount = Math.ceil(currentVal.length / 3.8);
    const bot = detectChatbot().toUpperCase();

    modalEl = document.createElement("div");
    modalEl.className = "pp-floating-modal";

    modalEl.innerHTML = `
      <div class="pp-modal-header">
        <div class="pp-modal-title">
          <span style="color:#6366f1;font-size:14px;">✦</span>
          <span>Prompt+ Instant Optimizer</span>
          <span style="font-size:9.5px;color:#10b981;font-weight:700;">🟢 ${bot}</span>
          <span style="font-size:9.5px;color:#a1a1aa;">(~${tokenCount} tok)</span>
        </div>
        <button type="button" class="pp-modal-close-btn" id="pp-modal-close">✕</button>
      </div>

      <div class="pp-tone-row">
        <div class="pp-tone-chip ${selectedTone === "code" ? "active" : ""}" data-tone="code">💻 Tech</div>
        <div class="pp-tone-chip ${selectedTone === "copy" ? "active" : ""}" data-tone="copy">📈 Copy</div>
        <div class="pp-tone-chip ${selectedTone === "exec" ? "active" : ""}" data-tone="exec">👔 Executive</div>
        <div class="pp-tone-chip ${selectedTone === "deep" ? "active" : ""}" data-tone="deep">🔬 Deep Logic</div>
      </div>

      <div class="pp-modal-preview" id="pp-modal-preview">
        ${currentVal || "Type your prompt idea in the chatbox below..."}
      </div>

      <div class="pp-modal-actions">
        <button type="button" class="pp-modal-btn-primary" id="pp-modal-replace-btn">
          <span>⚡ Optimize & Replace in Chat</span>
        </button>
        <button type="button" class="pp-modal-btn-sub" id="pp-modal-copy-btn" title="Copy to clipboard">
          <span>📋</span>
        </button>
      </div>
    `;

    document.body.appendChild(modalEl);

    // Position modal right above the input box
    const card = getChatContainer(inputEl) || inputEl;
    const rect = card.getBoundingClientRect();
    const modalHeight = modalEl.offsetHeight || 220;
    const modalWidth = modalEl.offsetWidth || 380;

    let top = rect.top - modalHeight - 12;
    if (top < 12) top = rect.top + 8;
    let left = rect.right - modalWidth;
    if (left < 16) left = 16;

    modalEl.style.top = `${Math.round(top)}px`;
    modalEl.style.left = `${Math.round(left)}px`;

    // Event handlers with stopPropagation to prevent host page cancellation
    modalEl.querySelector("#pp-modal-close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      modalEl.remove();
      modalEl = null;
    });

    modalEl.querySelectorAll(".pp-tone-chip").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        modalEl.querySelectorAll(".pp-tone-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        selectedTone = chip.getAttribute("data-tone") || "code";
      });
    });

    modalEl.querySelector("#pp-modal-replace-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const raw = getText(inputEl).trim();
      if (!raw) {
        showToast("⚠️ Type your prompt idea in the chat box first!");
        return;
      }
      const masterPrompt = synthesizeLocalPrompt(raw, selectedTone);
      setText(inputEl, masterPrompt);
      showToast("✓ Master prompt compiled & replaced in chat!");
      modalEl.remove();
      modalEl = null;
    });

    modalEl.querySelector("#pp-modal-copy-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const raw = getText(inputEl).trim();
      const masterPrompt = synthesizeLocalPrompt(raw || "Build full stack scalable app", selectedTone);
      navigator.clipboard.writeText(masterPrompt);
      showToast("✓ Copied Master Prompt!");
    });
  }

  // Inject sleek floating trigger button
  function injectFloatingButton() {
    const existing = document.querySelector(".pp-floating-trigger");
    if (existing) {
      if (existing._targetInput && document.body.contains(existing._targetInput) && !isSidebarElement(existing._targetInput)) {
        positionFloatingButton(existing, existing._targetInput);
        return;
      }
      try { existing.remove(); } catch { /* ignore */ }
    }

    const input = getInput();
    if (!input || !input.parentElement) return;

    const rect = input.getBoundingClientRect();
    if (!rect || rect.width === 0) { setTimeout(injectFloatingButton, 800); return; }

    const trigger = document.createElement("div");
    trigger.className = "pp-floating-trigger";
    trigger._targetInput = input;

    trigger.innerHTML = `
      <div class="pp-trigger-icon">✦</div>
      <div class="pp-trigger-text">
        <span>Enhance</span>
        <span class="pp-trigger-token-badge" id="pp-trigger-tok">~0 tok</span>
      </div>
    `;

    document.body.appendChild(trigger);
    positionFloatingButton(trigger, input);

    // Live typing token count
    const updateTokens = () => {
      const val = getText(input);
      const tokens = Math.ceil(val.length / 3.8);
      const tokBadge = trigger.querySelector("#pp-trigger-tok");
      if (tokBadge) tokBadge.textContent = `~${tokens} tok`;
    };
    input.addEventListener("input", updateTokens);
    updateTokens();

    setupDraggable(trigger);

    // Reliable click handler
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (trigger._hasMoved && trigger._hasMoved()) return;
      openFloatingModal(input);
    });

    let rafPending = false;
    const schedulePosition = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if (document.body.contains(trigger) && document.body.contains(input)) {
          positionFloatingButton(trigger, input);
        }
      });
    };

    window.addEventListener("scroll", schedulePosition, { passive: true });
    window.addEventListener("resize", schedulePosition, { passive: true });
  }

  function positionFloatingButton(trigger, input) {
    if (!input || !trigger) return;
    if (!document.body.contains(input) || isSidebarElement(input)) {
      trigger.style.setProperty("display", "none", "important");
      return;
    }

    // Check if user has saved a custom dragged position
    const customPosStr = localStorage.getItem("pp_btn_custom_pos");
    if (customPosStr) {
      try {
        const pos = JSON.parse(customPosStr);
        if (typeof pos.top === "number" && typeof pos.left === "number") {
          const clampedTop = Math.max(8, Math.min(window.innerHeight - 40, pos.top));
          const clampedLeft = Math.max(8, Math.min(window.innerWidth - 120, pos.left));
          trigger.style.setProperty("top", `${clampedTop}px`, "important");
          trigger.style.setProperty("left", `${clampedLeft}px`, "important");
          trigger.style.setProperty("display", "inline-flex", "important");
          return;
        }
      } catch {}
    }

    // Find the closest active prompt capsule
    const capsule = input.closest("input-area-v2, .input-area, form, .composer-parent, fieldset, main") || input;
    const rect = capsule.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0 || rect.top < 0) {
      trigger.style.setProperty("display", "none", "important");
      return;
    }

    const triggerHeight = trigger.offsetHeight || 32;
    const triggerWidth = trigger.offsetWidth || 110;
    const viewportWidth = window.innerWidth;

    // Dock neatly aligned to the top-right of the prompt capsule
    let top = rect.top - triggerHeight - 8;
    if (top < 10) {
      top = rect.top + 8;
    }

    let left = rect.right - triggerWidth - 12;
    if (left < 16) left = 16;
    if (left + triggerWidth > viewportWidth - 16) {
      left = Math.max(16, viewportWidth - triggerWidth - 16);
    }

    trigger.style.setProperty("top", `${Math.round(top)}px`, "important");
    trigger.style.setProperty("left", `${Math.round(left)}px`, "important");
    trigger.style.setProperty("display", "inline-flex", "important");
  }

  // Draggable support for floating button
  function setupDraggable(trigger) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let moved = false;

    trigger.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = trigger.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      trigger.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        moved = true;
      }
      const newLeft = Math.max(8, Math.min(window.innerWidth - trigger.offsetWidth - 8, initialLeft + dx));
      const newTop = Math.max(8, Math.min(window.innerHeight - trigger.offsetHeight - 8, initialTop + dy));
      trigger.style.setProperty("left", `${newLeft}px`, "important");
      trigger.style.setProperty("top", `${newTop}px`, "important");
    });

    document.addEventListener("mouseup", () => {
      if (!isDragging) return;
      isDragging = false;
      trigger.style.transition = "";
      if (moved) {
        const rect = trigger.getBoundingClientRect();
        localStorage.setItem("pp_btn_custom_pos", JSON.stringify({ top: rect.top, left: rect.left }));
      }
    });

    trigger._hasMoved = () => moved;
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
          const master = synthesizeLocalPrompt(text, selectedTone);
          setText(input, master);
          showToast("✓ Prompt optimized in-place!");
        } else {
          openFloatingModal(input);
        }
      }
    }
  });

  // Observe DOM changes to re-inject when new chat views render
  setInterval(() => {
    const input = getInput();
    if (input && !document.querySelector(".pp-floating-trigger")) {
      injectFloatingButton();
    }
  }, 1000);

  window.addEventListener("focus", () => {
    const input = getInput();
    if (input) injectFloatingButton();
  });
})();
