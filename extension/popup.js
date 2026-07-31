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

async function checkDeviceSupport() {
  try {
    if (typeof LanguageModel !== "undefined") {
      const a = await LanguageModel.availability();
      return a === "available" || a === "downloading";
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
  chrome.runtime.sendMessage({ action: "saveSettings", settings: { mode } });
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
  if (s.mode) setMode(s.mode);
  else checkDeviceSupport().then((supported) => {
    if (!supported) {
      modeLabel.textContent = "On-Device AI — needs Chrome 138+ with Gemini Nano (chrome://flags → Enable Prompt API)";
      modeLabel.className = "mode-hint warn";
    }
  });
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
btn?.addEventListener("click", async () => {
  try {
    const text = input?.value?.trim();
    if (!text) { showMsg("Enter a prompt first", true); return; }

    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span><span>Enhancing...</span>';
    resultCard.style.display = "block";
    resultBody.classList.remove("placeholder");
    resultBody.textContent = "Enhancing...";
    copyBtn.disabled = true;
    useBtn.disabled = true;

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
    resultBody.textContent = enhanced;
    copyBtn.disabled = false;
    useBtn.disabled = false;
    showMsg("Enhanced!");

    // Try to inject into the active chat tab if content script is present
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs?.[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "injectEnhanced", text, enhanced }, (ir) => {
          if (!chrome.runtime.lastError && ir?.success) {
            useBtn.textContent = "✓ Injected";
            setTimeout(() => { useBtn.textContent = "Use in Tab →"; }, 2000);
          }
        });
      }
    });
  } catch (err) {
    console.error("[Prompt+] enhance error:", err);
    showMsg(err.message || "Something went wrong", true);
    resultBody.classList.add("placeholder");
    resultBody.textContent = err.message || "Enhancement failed";
  } finally {
    btn.disabled = false;
    btn.innerHTML = currentMode === "device"
      ? '<span>📱</span><span>Device Enhance</span>'
      : '<span>⚡</span><span>Apply Upgrade</span>';
  }
});

copyBtn?.addEventListener("click", () => {
  navigator.clipboard.writeText(resultBody.textContent);
  copyBtn.textContent = "✓ Copied";
  setTimeout(() => { copyBtn.textContent = "📋 Copy"; }, 1500);
});

useBtn?.addEventListener("click", () => {
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
});

// ---- On-device enhancement (runs directly in popup window context) ----
async function deviceEnhance(text, tokenSaver) {
  if (typeof LanguageModel === "undefined") {
    throw new Error("On-device AI not supported. Needs Chrome 138+ with Gemini Nano (chrome://flags → Enable Prompt API).");
  }
  const availability = await LanguageModel.availability();
  if (availability === "unavailable") {
    throw new Error("Gemini Nano unavailable. Needs Chrome 138+, 22GB+ free storage, macOS 13+ / Win 10+ / Linux.");
  }

  const session = await LanguageModel.create({
    temperature: 0.3, topK: 1,
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => {
        if (e.loaded < 1) {
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
        resultBody.textContent = full;
        resultBody.scrollTop = resultBody.scrollHeight;
      }
    } catch (e) {
      console.error("[Prompt+] stream error, falling back to prompt():", e);
    }

    if (!full.trim()) {
      resultBody.textContent = "Enhancing…";
      full = await session.prompt(`${systemInstruction}\n\n${metaPrompt}`);
      resultBody.textContent = full;
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

document.getElementById("open-dash")?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://prompt-plus-three.vercel.app/dashboard" });
});
