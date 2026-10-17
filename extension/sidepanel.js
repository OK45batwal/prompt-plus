/**
 * Prompt+ Architect AI — side panel.
 * The longer workspace: edit a draft, Enhance prompt, then compare Output against Changes.
 * The popup and the web Studio stay available; this page only adds room.
 */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const charCount = document.getElementById("char-count");
  const tokenEstimate = document.getElementById("token-estimate");
  const enhanceBtn = document.getElementById("enhance-btn");
  const btnText = document.getElementById("btn-text");
  const statusEl = document.getElementById("status");
  const reviewSwitch = document.getElementById("review-switch");
  const reviewTabOutput = document.getElementById("review-tab-output");
  const reviewTabChanges = document.getElementById("review-tab-changes");
  const outputBody = document.getElementById("output-body");
  const diffPane = document.getElementById("diff-pane");
  const diffBefore = document.getElementById("diff-before");
  const diffAfter = document.getElementById("diff-after");
  const copyBtn = document.getElementById("copy-btn");
  const copyBtnLabel = document.getElementById("copy-btn-label");
  const applyBtn = document.getElementById("apply-btn");
  const applyBtnLabel = document.getElementById("apply-btn-label");
  const studioLink = document.getElementById("studio-link");
  const headerVersionPill = document.getElementById("header-version-pill");
  if (headerVersionPill) headerVersionPill.textContent = `v${chrome.runtime.getManifest().version}`;

  // The popup's draft is read as a handoff so the text already typed there arrives here.
  const POPUP_DRAFT_KEY = "pp_popup_draft";
  const PANEL_DRAFT_KEY = "pp_panel_draft";

  let currentMode = "algo";
  let currentTone = "human";
  let output = "";
  let rawPrompt = "";

  function countTokens(text) {
    if (!text) return 0;
    if (window.PromptPlusTokenizer && typeof window.PromptPlusTokenizer.count === "function") {
      return window.PromptPlusTokenizer.count(text);
    }
    return Math.ceil(text.length / 3.8);
  }

  function setStatus(message, isErr = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle("err", isErr);
  }

  function savePanelDraft() {
    try {
      chrome.storage.local.set({
        [PANEL_DRAFT_KEY]: {
          input: input ? input.value : "",
          tone: currentTone,
          output: output || "",
        },
      });
    } catch {}
  }

  function restoreDraft() {
    try {
      chrome.storage.local.get([PANEL_DRAFT_KEY, POPUP_DRAFT_KEY], (data) => {
        const draft = data?.[PANEL_DRAFT_KEY] || data?.[POPUP_DRAFT_KEY];
        if (!draft) return;
        if (draft.tone) {
          currentTone = draft.tone;
          document.querySelectorAll(".tone-pill-btn").forEach((c) => {
            c.classList.toggle("active", c.getAttribute("data-tone") === draft.tone);
          });
        }
        if (draft.input && input) {
          input.value = draft.input;
          input.dispatchEvent(new Event("input"));
        }
        // The popup stores a result as `result`; this panel stores its own as `output`.
        const resumed = draft.output || draft.result;
        if (resumed) showResult(resumed, draft.source || "");
      });
    } catch {}
  }

  function updateMetrics() {
    const raw = input ? input.value : "";
    if (charCount) charCount.textContent = `${raw.length} char${raw.length === 1 ? "" : "s"}`;
    if (tokenEstimate) tokenEstimate.textContent = `~${countTokens(raw)} tokens`;
  }

  function updateEnhanceLabel() {
    if (btnText) btnText.textContent = "Enhance prompt";
  }

  input?.addEventListener("input", () => {
    updateMetrics();
    savePanelDraft();
  });

  document.querySelectorAll(".tone-pill-btn").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".tone-pill-btn").forEach((c) => c.classList.remove("active"));
      pill.classList.add("active");
      currentTone = pill.getAttribute("data-tone") || "human";
      savePanelDraft();
    });
  });

  function setMode(mode) {
    currentMode = mode;
    [[document.getElementById("mode-api"), "api"], [document.getElementById("mode-algo"), "algo"]].forEach(([btn, m]) => {
      if (!btn) return;
      btn.classList.toggle("active", mode === m);
      btn.setAttribute("aria-pressed", String(mode === m));
    });
    updateEnhanceLabel();
  }
  document.getElementById("mode-api")?.addEventListener("click", () => setMode("api"));
  document.getElementById("mode-algo")?.addEventListener("click", () => setMode("algo"));
  setMode(currentMode);

  // ---------- Result view: Output and Changes ----------
  function setReviewMode(mode) {
    const showingChanges = mode === "changes";
    if (outputBody) outputBody.hidden = showingChanges;
    if (diffPane) diffPane.hidden = !showingChanges;
    [reviewTabOutput, reviewTabChanges].forEach((tab) => {
      if (!tab) return;
      const active = tab === (showingChanges ? reviewTabChanges : reviewTabOutput);
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
  }

  reviewTabOutput?.addEventListener("click", () => setReviewMode("output"));
  reviewTabChanges?.addEventListener("click", () => setReviewMode("changes"));

  function showResult(text, source) {
    output = text;
    rawPrompt = input ? input.value.trim() : rawPrompt;
    if (outputBody) {
      outputBody.textContent = text;
      outputBody.hidden = false;
    }
    let changed = false;
    if (diffBefore && diffAfter && window.PromptPlusDiff) {
      const review = window.PromptPlusDiff.highlight(rawPrompt, text);
      diffBefore.innerHTML = review.before;
      diffAfter.innerHTML = review.after;
      changed = !!review.changed;
    }
    if (reviewSwitch) reviewSwitch.hidden = !changed;
    if (diffPane) diffPane.hidden = !changed;
    setReviewMode(changed ? "changes" : "output");
    if (copyBtn) copyBtn.disabled = false;
    if (applyBtn) applyBtn.disabled = false;
    setStatus(source || "Done.");
    savePanelDraft();
  }

  // ---------- Enhance prompt ----------
  async function triggerCompilation() {
    const rawText = input ? input.value.trim() : "";
    if (!rawText) {
      setStatus("Write a draft first, then Enhance prompt.", true);
      input?.focus();
      return;
    }
    rawPrompt = rawText;
    if (enhanceBtn) enhanceBtn.disabled = true;
    if (btnText) btnText.textContent = "Enhancing…";
    setStatus("Enhancing…");

    let finalResult = "";
    let resultSource = "Local template (offline)";

    if (currentMode === "algo") {
      finalResult = globalThis.PromptPlusSynthesis.synthesizeLocalPrompt(rawText, { tone: currentTone });
    }

    if (!finalResult) {
      try {
        const res = await new Promise((resolve) => {
          // shortcut: 30s cap with no cancel button, same as the popup. Raise only if cloud generations routinely exceed it.
          const timer = setTimeout(() => resolve(null), 30000);
          chrome.runtime.sendMessage(
            { action: "enhancePrompt", text: rawText, mode: currentMode, tone: currentTone },
            (r) => {
              clearTimeout(timer);
              resolve(r);
            }
          );
        });
        if (res?.success && res.data?.enhanced) {
          finalResult = res.data.enhanced;
          resultSource = res.data.source === "engine"
            ? "Deterministic engine"
            : res.data.source === "local-template" ? "Local template (offline)" : "Cloud model";
        } else if (res?.error) {
          resultSource = res.error;
        }
      } catch {}
    }

    if (!finalResult) {
      finalResult = globalThis.PromptPlusSynthesis.synthesizeLocalPrompt(rawText, { tone: currentTone });
      resultSource = "Local template (offline)";
    }

    if (enhanceBtn) enhanceBtn.disabled = false;
    if (btnText) btnText.textContent = "Enhance prompt";
    showResult(finalResult, resultSource);
  }

  enhanceBtn?.addEventListener("click", triggerCompilation);

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      triggerCompilation();
    }
  });

  // ---------- Copy, Apply, Studio ----------
  async function copyOutput() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(output);
      return true;
    } catch {
      setStatus("Clipboard unavailable. Select the Output and copy it manually.", true);
      return false;
    }
  }

  copyBtn?.addEventListener("click", async () => {
    if (!output) return;
    if (!(await copyOutput())) return;
    if (copyBtnLabel) copyBtnLabel.textContent = "Copied";
    setStatus("Copied to clipboard.");
    setTimeout(() => { if (copyBtnLabel) copyBtnLabel.textContent = "Copy"; }, 2000);
  });

  applyBtn?.addEventListener("click", () => {
    if (!output) return;
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (!tab?.id) {
        void copyOutput();
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: "injectEnhanced", enhanced: output }, async (r) => {
        if (chrome.runtime?.lastError || !r?.success) {
          if (!(await copyOutput())) return;
          if (applyBtnLabel) applyBtnLabel.textContent = "Copied";
          setStatus("No editable chat here, so the Output was copied instead.");
          setTimeout(() => { if (applyBtnLabel) applyBtnLabel.textContent = "Apply to chat"; }, 2500);
        } else {
          if (applyBtnLabel) applyBtnLabel.textContent = r.pendingReview ? "Review in chat" : "Inserted";
          setStatus(r.pendingReview ? "Review the changes in your chat before accepting." : "Inserted into the active chat.");
          setTimeout(() => { if (applyBtnLabel) applyBtnLabel.textContent = "Apply to chat"; }, 2000);
        }
      });
    });
  });

  studioLink?.addEventListener("click", (e) => {
    // The link's href is the fallback; the message carries the current draft into the Studio.
    e.preventDefault();
    chrome.runtime.sendMessage({ action: "openInWebStudio", prompt: output || (input ? input.value.trim() : ""), tone: currentTone });
  });

  updateMetrics();
  restoreDraft();
});
