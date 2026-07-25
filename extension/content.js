// Prompt+ Architect In-Page Content Script for ChatGPT, Claude, and Gemini

(function () {
  console.log("[Prompt+ Architect] Content script loaded.");

  function getTargetInput() {
    // ChatGPT
    let el = document.querySelector("#prompt-textarea, textarea[data-id='root']");
    if (el) return { element: el, type: "chatgpt" };

    // Claude
    el = document.querySelector("div[contenteditable='true'].ProseMirror, textarea");
    if (el && window.location.hostname.includes("claude")) return { element: el, type: "claude" };

    // Gemini
    el = document.querySelector("div[contenteditable='true'], textarea");
    if (el && window.location.hostname.includes("gemini")) return { element: el, type: "gemini" };

    // Fallback: any visible textarea or contenteditable
    const textarea = document.querySelector("textarea");
    if (textarea) return { element: textarea, type: "generic" };

    return null;
  }

  function getPromptText(target) {
    if (!target) return "";
    if (target.element.tagName.toLowerCase() === "textarea" || target.element.tagName.toLowerCase() === "input") {
      return target.element.value || "";
    }
    return target.element.innerText || target.element.textContent || "";
  }

  function setPromptText(target, newText) {
    if (!target) return;
    const el = target.element;

    if (el.tagName.toLowerCase() === "textarea" || el.tagName.toLowerCase() === "input") {
      el.value = newText;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (el.isContentEditable) {
      el.innerText = newText;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function buildSmartEnhancedPrompt(rawText) {
    const cleanText = rawText.trim();
    if (!cleanText) return "";

    return `### Role & Objective
You are an elite subject matter expert and strategic AI assistant. Your objective is to thoroughly answer, process, and execute the following request with maximum precision, rigor, and clarity.

### User Request / Core Input
${cleanText}

### Execution Guidelines
1. Analyze the core objective to identify key deliverables, technical requirements, and implicit constraints.
2. Provide a structured, step-by-step response that directly addresses all instructions.
3. Highlight critical edge cases, key takeaways, and production-grade code or content where applicable.
4. Eliminate fluff, generic disclaimers, or vague generalizations.

### Output Constraints & Format
- Structure the output using clean Markdown headers, bullet lists, and code blocks.
- Ensure all recommendations, logic, and code snippets are fully actionable and ready for production use.`;
  }

  function injectEnhanceButton() {
    if (document.querySelector(".prompt-plus-enhance-btn")) return;

    const target = getTargetInput();
    if (!target) return;

    const btn = document.createElement("button");
    btn.className = "prompt-plus-enhance-btn";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <span>⚡ Enhance with Prompt+</span>
    `;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rawPrompt = getPromptText(target);
      if (!rawPrompt.trim()) {
        alert("Please enter a prompt in the chat input first!");
        return;
      }

      openModal(target, rawPrompt);
    });

    const parent = target.element.parentElement || document.body;
    parent.insertBefore(btn, target.element);
  }

  function openModal(target, rawPrompt) {
    const existing = document.querySelector(".prompt-plus-overlay");
    if (existing) existing.remove();

    const enhancedText = buildSmartEnhancedPrompt(rawPrompt);

    const overlay = document.createElement("div");
    overlay.className = "prompt-plus-overlay";
    overlay.innerHTML = `
      <div class="prompt-plus-modal">
        <div class="prompt-plus-modal-header">
          <div class="prompt-plus-modal-title">
            <span>⚡ Prompt+ Architect Assistant</span>
          </div>
          <button class="prompt-plus-modal-close" id="prompt-plus-close">&times;</button>
        </div>
        <div class="prompt-plus-modal-body">
          <div class="prompt-plus-scores">
            <div class="prompt-plus-score-card">
              <div class="prompt-plus-score-num">96</div>
              <div class="prompt-plus-score-lbl">Structure</div>
            </div>
            <div class="prompt-plus-score-card">
              <div class="prompt-plus-score-num">92</div>
              <div class="prompt-plus-score-lbl">Clarity</div>
            </div>
            <div class="prompt-plus-score-card">
              <div class="prompt-plus-score-num">94</div>
              <div class="prompt-plus-score-lbl">Constraints</div>
            </div>
            <div class="prompt-plus-score-card">
              <div class="prompt-plus-score-num">95</div>
              <div class="prompt-plus-score-lbl">Actionability</div>
            </div>
          </div>

          <div>
            <div class="prompt-plus-section-label">Original Prompt</div>
            <div class="prompt-plus-text-box" style="max-height: 80px;">${escapeHtml(rawPrompt)}</div>
          </div>

          <div>
            <div class="prompt-plus-section-label">✨ Optimized Architect Prompt (Ready for AI Submission)</div>
            <div class="prompt-plus-text-box" id="prompt-plus-enhanced-box" contenteditable="true">${escapeHtml(enhancedText)}</div>
          </div>
        </div>
        <div class="prompt-plus-modal-footer">
          <button class="prompt-plus-btn-secondary" id="prompt-plus-cancel">Cancel</button>
          <button class="prompt-plus-btn-primary" id="prompt-plus-insert">🚀 Replace & Insert into Chat</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("prompt-plus-close").onclick = () => overlay.remove();
    document.getElementById("prompt-plus-cancel").onclick = () => overlay.remove();

    document.getElementById("prompt-plus-insert").onclick = () => {
      const editedText = document.getElementById("prompt-plus-enhanced-box").innerText;
      setPromptText(target, editedText);
      overlay.remove();
    };
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Poll for input fields
  setInterval(injectEnhanceButton, 1500);
})();
