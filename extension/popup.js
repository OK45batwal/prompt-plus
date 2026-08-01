const input = document.getElementById("input");
const btn = document.getElementById("enhance-btn");
const btnIcon = document.getElementById("btn-icon");
const btnText = document.getElementById("btn-text");
const msg = document.getElementById("msg");
const keyInput = document.getElementById("key-input");
const keyText = document.getElementById("key-text");
const keyIndicator = document.getElementById("key-indicator");
const modelSelect = document.getElementById("model-select");
const modelLabel = document.getElementById("model-label");
const modeLabel = document.getElementById("mode-label");
const apiCard = document.getElementById("api-card");
const charCount = document.getElementById("char-count");
const resultCard = document.getElementById("result-card");
const resultBody = document.getElementById("result-body");
const copyBtn = document.getElementById("copy-btn");
const useBtn = document.getElementById("use-btn");

const modeDevice = document.getElementById("mode-device");
const modeServer = document.getElementById("mode-server");

const settingsToggle = document.getElementById("settings-toggle");
const settingsBody = document.getElementById("settings-body");

let currentMode = "device";
let tokenSaver = false;
const tsToggle = document.getElementById("ts-toggle");

function getLanguageModelAPI() {
  if (typeof LanguageModel !== "undefined") return LanguageModel;
  if (typeof window !== "undefined" && window.LanguageModel) return window.LanguageModel;
  if (typeof ai !== "undefined" && ai.languageModel) return ai.languageModel;
  if (typeof window !== "undefined" && window.ai?.languageModel) return window.ai.languageModel;
  return null;
}

async function checkDeviceSupport() {
  try {
    const lm = getLanguageModelAPI();
    if (lm) {
      const a = await lm.availability();
      return a === "available" || a === "readily" || a === "downloading" || a === "after-download";
    }
  } catch { /* ignore */ }
  return false;
}

function showMsg(text, err) {
  if (!msg) return;
  msg.textContent = text;
  msg.className = "msg " + (err ? "err" : "ok");
  msg.style.display = "flex";
  setTimeout(() => { msg.style.display = "none"; }, 4000);
}

function updateKeyUI(has) {
  if (keyText) keyText.textContent = has ? "Key Set" : "Free Server";
  if (keyIndicator) keyIndicator.className = "key-badge" + (has ? " ok" : "");
}

function setMode(mode) {
  currentMode = mode;
  modeDevice.classList.toggle("active", mode === "device");
  modeServer.classList.toggle("active", mode === "server");

  const resultMode = document.getElementById("result-mode");
  if (resultMode) resultMode.textContent = mode === "device" ? "On-Device" : "API Server";

  if (mode === "device") {
    btnIcon.textContent = "📱";
    btnText.textContent = "Device Enhance";
    modelSelect.style.display = "none";
    modelLabel.style.display = "none";
    apiCard.style.display = "none";
    modeLabel.textContent = "On-Device AI — enhanced via Gemini Nano";
    modeLabel.className = "mode-hint";
    checkDeviceSupport().then((supported) => {
      if (!supported) {
        modeLabel.textContent = "On-Device AI — needs Chrome 138+ with Gemini Nano (chrome://flags → Enable Prompt API)";
        modeLabel.className = "mode-hint warn";
      }
    });
  } else {
    btnIcon.textContent = "⚡";
    btnText.textContent = "Apply Upgrade";
    modelSelect.style.display = "";
    modelLabel.style.display = "";
    apiCard.style.display = "";
    modeLabel.textContent = "API mode — enhanced via cloud AI API";
    modeLabel.className = "mode-hint";
  }
  chrome.runtime?.sendMessage?.({ action: "saveSettings", settings: { mode } });
}

input?.addEventListener("input", () => {
  const len = input.value.length;
  if (charCount) charCount.textContent = `${len} character${len === 1 ? "" : "s"}`;
});

// Mode toggle
modeDevice?.addEventListener("click", () => setMode("device"));
modeServer?.addEventListener("click", () => setMode("server"));

tsToggle?.addEventListener("change", () => {
  tokenSaver = tsToggle.checked;
  chrome.runtime.sendMessage({ action: "saveSettings", settings: { tokenSaver } });
});

settingsToggle?.addEventListener("click", () => {
  settingsToggle.classList.toggle("open");
  settingsBody.classList.toggle("open");
});

// Load settings
chrome.runtime?.sendMessage?.({ action: "getSettings" }, (res) => {
  const s = res?.settings || {};
  setMode(s.mode || "device");
  if (s.model && modelSelect) modelSelect.value = s.model;
  if (s.tokenSaver && tsToggle) { tsToggle.checked = true; tokenSaver = true; }
});

// Save model selection
modelSelect?.addEventListener("change", () => {
  chrome.runtime.sendMessage({ action: "saveSettings", settings: { model: modelSelect.value } });
});

// API key
chrome.runtime?.sendMessage?.({ action: "getApiKey" }, (res) => {
  if (res && res.apiKey) {
    if (keyInput) keyInput.value = res.apiKey;
    updateKeyUI(true);
  }
});

keyInput?.addEventListener("change", () => {
  const k = keyInput.value.trim();
  if (!k) { updateKeyUI(false); keyInput.style.borderColor = ""; return; }
  const valid = k.startsWith("sk-") || k.startsWith("sk-or-") || k.startsWith("sk-ant-") || k.startsWith("nvapi-");
  if (!valid) {
    keyInput.style.borderColor = "#ef4444";
    showMsg("Invalid format (expected sk-..., sk-or-..., sk-ant-..., or nvapi-...)", true);
    return;
  }
  keyInput.style.borderColor = "#34d399";
  chrome.runtime.sendMessage({ action: "saveApiKey", apiKey: k }, (r) => {
    if (r && r.success) updateKeyUI(true);
  });
});

keyInput?.addEventListener("input", () => { keyInput.style.borderColor = ""; });

// ---- Enhance ----
// ---- Enhance ----
btn?.addEventListener("click", async () => {
  const cBtn = document.getElementById("copy-btn");
  const uBtn = document.getElementById("use-btn");
  try {
    const text = input?.value?.trim();
    if (!text) { showMsg("Enter a prompt first", true); return; }

    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span><span>Enhancing…</span>';
    if (resultCard) resultCard.style.display = "block";
    if (resultBody) {
      resultBody.classList.remove("placeholder");
      resultBody.textContent = "Enhancing…";
    }
    if (cBtn) cBtn.disabled = true;
    if (uBtn) uBtn.disabled = true;

    let enhanced = "";
    if (currentMode === "device") {
      try {
        enhanced = await deviceEnhance(text, tokenSaver);
      } catch (e) {
        throw new Error(e.message);
      }
    } else {
      // Server mode via background
      const modelVal = modelSelect?.value || "meta-llama/llama-3.3-70b-instruct:free::openrouter";
      const parts = modelVal.split("::");
      const model = parts[0];
      const provider = parts[1] || "openai";
      const res = await chrome.runtime.sendMessage({ action: "enhancePrompt", text, model, provider, tokenSaver });
      if (!res || !res.success) throw new Error(res?.error || "Failed");
      enhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
    }

    if (!enhanced) throw new Error("No output received");
    if (resultBody) resultBody.textContent = enhanced;
    if (cBtn) cBtn.disabled = false;
    if (uBtn) uBtn.disabled = false;
    showMsg("Enhanced!");

    // Try to inject into the active chat tab if content script is present
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs?.[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "injectEnhanced", text, enhanced }, (ir) => {
          if (!chrome.runtime.lastError && ir?.success && uBtn) {
            uBtn.textContent = "✓ Injected";
            setTimeout(() => { uBtn.textContent = "Use in Tab →"; }, 2000);
          }
        });
      }
    });
  } catch (err) {
    console.error("[Prompt+] enhance error:", err);
    showMsg(err.message || "Something went wrong", true);
    if (resultBody) {
      const isApiKeyErr = err.message && (err.message.includes("No API key") || err.message.includes("API key"));
      if (isApiKeyErr) {
        resultBody.classList.remove("placeholder");
        resultBody.innerHTML = `
          <div style="padding: 6px 0; color: #f8fafc;">
            <div style="font-weight: 600; color: #f59e0b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; font-size: 12px;">
              <span>🔑</span> No API Key Configured
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px; line-height: 1.5;">
              Cloud AI requires an API key. You can switch to free <strong>On-Device AI</strong> (no key needed) or add an API key.
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button id="err-switch-device" type="button" style="padding: 8px 12px; background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.5); color: #93c5fd; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 6px;">
                <span>📱</span> Switch to On-Device AI (Free & Offline)
              </button>
              <button id="err-open-key-input" type="button" style="padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 6px;">
                <span>⚙️</span> Add API Key in Settings below
              </button>
            </div>
          </div>
        `;
        document.getElementById("err-switch-device")?.addEventListener("click", () => {
          setMode("device");
          btn?.click();
        });
        document.getElementById("err-open-key-input")?.addEventListener("click", () => {
          if (settingsToggle && settingsBody) {
            settingsToggle.classList.add("open");
            settingsBody.classList.add("open");
            keyInput?.focus();
          }
        });
      } else {
        resultBody.classList.add("placeholder");
        resultBody.textContent = err.message || "Enhancement failed";
      }
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = currentMode === "device"
      ? '<span>📱</span><span>Device Enhance</span>'
      : '<span>⚡</span><span>Apply Upgrade</span>';
  }
});

document.addEventListener("click", (e) => {
  const target = e.target;
  if (!target) return;
  if (target.id === "copy-btn" || target.closest("#copy-btn")) {
    const cBtn = document.getElementById("copy-btn");
    if (resultBody?.textContent) {
      navigator.clipboard.writeText(resultBody.textContent);
      if (cBtn) {
        cBtn.textContent = "✓ Copied";
        setTimeout(() => { cBtn.textContent = "📋 Copy"; }, 1500);
      }
    }
  } else if (target.id === "use-btn" || target.closest("#use-btn")) {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs?.[0]?.id) { showMsg("No active tab", true); return; }
      chrome.tabs.sendMessage(tabs[0].id, { action: "injectEnhanced", text: input.value.trim(), enhanced: resultBody.textContent }, (ir) => {
        if (chrome.runtime.lastError || !ir?.success) {
          showMsg("Open a supported chat page to inject", true);
        } else {
          showMsg("Injected into chat!");
          setTimeout(() => window.close(), 600);
        }
      });
    });
  }
});

// ---- On-device enhancement (runs directly in popup window context) ----
async function deviceEnhance(text, tokenSaver) {
  const lm = getLanguageModelAPI();
  if (!lm) {
    throw new Error("On-device AI not supported. Needs Chrome 138+ with Gemini Nano (chrome://flags → Enable Prompt API).");
  }
  const availability = await lm.availability();
  if (availability === "unavailable" || availability === "no") {
    throw new Error("Gemini Nano unavailable. Needs Chrome 138+, 22GB+ free storage, macOS 13+ / Win 10+ / Linux.");
  }

  const session = await lm.create({
    temperature: 0.1, topK: 1, outputLanguage: "en",
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => {
        if (e.loaded < 1 && resultBody) {
          resultBody.textContent = `Downloading Gemini Nano… ${Math.round(e.loaded * 100)}%`;
        }
      });
    },
  });
  try {
    const cat = "General Task";
    const tone = "Professional & Clear";
    const length = "Comprehensive & Structured";

    const systemInstruction = `You are the Prompt+ Architect Engine — an advanced AI meta-prompt compiler.
Your task is to transform raw, simple, or incomplete user prompts into production-grade, highly structured AI instructions.
Return ONLY the final enhanced prompt framework ready for immediate execution by AI models. Do NOT add introductory or conversational meta-text.`;

    const tokenSaverClause = tokenSaver
      ? "\nTighten the output to ~40% fewer tokens while keeping every section complete and lossless."
      : "";

    const metaPrompt = `[ORIGINAL USER PROMPT]:
"${text.trim()}"

[TARGET DOMAIN]: ${cat}
[PREFERRED TONE]: ${tone}
[TARGET OUTPUT LENGTH]: ${length}

[META-PROMPT INSTRUCTIONS]:
Rewrite the prompt above into a master AI prompt framework with the following explicit sections:
1. ### Role & Objective — Define an elite persona tailored to ${cat}.
2. ### Context & Domain Constraints — Establish target domain, background context, and non-negotiable boundaries.
3. ### Step-by-Step Instructions — Break down execution into clear, sequential steps.
4. ### Output Format & Constraints — Specify ${length}, ${tone}, and formatting guidelines (Markdown, code blocks, bullet points).
5. ### Input Variables — Highlight placeholders like {{user_input}} or specific parameters if required.${tokenSaverClause}`;

    let full = "";
    try {
      const stream = await session.promptStreaming(`${systemInstruction}\n\n${metaPrompt}`);
      for await (const chunk of stream) {
        if (!chunk) continue;
        full = chunk;
        if (resultBody) {
          resultBody.textContent = full;
          resultBody.scrollTop = resultBody.scrollHeight;
        }
      }
    } catch (e) {
      console.error("[Prompt+] stream error, falling back to prompt():", e);
    }

    if (!full.trim()) {
      if (resultBody) resultBody.textContent = "Enhancing…";
      full = await session.prompt(`${systemInstruction}\n\n${metaPrompt}`);
      if (resultBody) resultBody.textContent = full;
    }
    return full.trim();
  } finally {
    session.destroy();
  }
}

// Token bar
function updatePopupTokenBar(info) {
  const bar = document.getElementById("token-bar");
  const usedEl = document.getElementById("pop-token-used");
  const limitEl = document.getElementById("pop-token-limit");
  const pctEl = document.getElementById("pop-token-pct");
  const fill = document.getElementById("pop-token-fill");
  if (!bar || !info) { if (bar) bar.style.display = "none"; return; }
  bar.style.display = "block";
  usedEl.textContent = info.used.toLocaleString();
  limitEl.textContent = (info.limit / 1000).toFixed(0) + "K";
  pctEl.textContent = info.pct + "%";
  fill.style.width = info.pct + "%";
  fill.style.background = info.pct > 80 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "linear-gradient(90deg, #34d399, #7C3AED)";
}

function fetchTokenInfo() {
  chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs?.[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: "getTokenInfo" }, (res) => {
      if (chrome.runtime.lastError || !res) { updatePopupTokenBar(null); return; }
      updatePopupTokenBar(res);
    });
  });
}

fetchTokenInfo();
setInterval(fetchTokenInfo, 3000);

copyBtn?.addEventListener("click", () => {
  const text = resultBody?.textContent || "";
  if (!text || resultBody?.classList.contains("placeholder")) return;
  navigator.clipboard.writeText(text).then(() => {
    showMsg("Copied to clipboard!");
    const orig = copyBtn.textContent;
    copyBtn.textContent = "✓ Copied!";
    setTimeout(() => { copyBtn.textContent = orig; }, 1500);
  });
});

useBtn?.addEventListener("click", () => {
  const text = input?.value?.trim() || "";
  const enhanced = resultBody?.textContent || "";
  if (!enhanced || resultBody?.classList.contains("placeholder")) return;
  chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs?.[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "injectEnhanced", text, enhanced }, (ir) => {
        if (!chrome.runtime.lastError && ir?.success && useBtn) {
          const orig = useBtn.textContent;
          useBtn.textContent = "✓ Injected!";
          setTimeout(() => { useBtn.textContent = orig; }, 1500);
        } else {
          showMsg("Active tab input not found", true);
        }
      });
    }
  });
});

document.getElementById("open-dash")?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://prompt-plus-three.vercel.app/dashboard" });
});

// ---- Context Bucket Management ----
const bucketCard = document.getElementById("bucket-card");
const bucketSource = document.getElementById("bucket-source");
const bucketPreview = document.getElementById("bucket-preview");
const bucketInjectBtn = document.getElementById("bucket-inject-btn");
const bucketCopyBtn = document.getElementById("bucket-copy-btn");
const bucketClearBtn = document.getElementById("bucket-clear-btn");

function updateBucketUI() {
  try {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get("pp_context_bucket", (d) => {
      const b = d?.pp_context_bucket;
      if (b && b.formattedPrompt && bucketCard) {
        bucketCard.style.display = "block";
        if (bucketSource) bucketSource.textContent = b.source || "Chatbot";
        if (bucketPreview) bucketPreview.textContent = b.text ? b.text.slice(0, 150) + "…" : "Conversation context ready";
      } else if (bucketCard) {
        bucketCard.style.display = "none";
      }
    });
  } catch { /* ignore context error */ }
}

bucketInjectBtn?.addEventListener("click", () => {
  chrome.storage.local.get("pp_context_bucket", (d) => {
    const b = d?.pp_context_bucket;
    if (!b || !b.formattedPrompt) return;
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs?.[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "injectEnhanced", enhanced: b.formattedPrompt }, (ir) => {
          showMsg(`Injected Context from ${b.source || "Chatbot"}!`);
        });
      }
    });
  });
});

bucketCopyBtn?.addEventListener("click", () => {
  chrome.storage.local.get("pp_context_bucket", (d) => {
    const b = d?.pp_context_bucket;
    if (b && b.formattedPrompt) {
      navigator.clipboard.writeText(b.formattedPrompt).then(() => {
        showMsg("Copied Context Bucket to clipboard!");
      });
    }
  });
});

bucketClearBtn?.addEventListener("click", () => {
  chrome.storage.local.remove("pp_context_bucket", () => {
    showMsg("Context Bucket cleared");
    updateBucketUI();
  });
});

updateBucketUI();
