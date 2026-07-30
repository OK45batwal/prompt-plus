const input = document.getElementById("input");
const btn = document.getElementById("enhance-btn");
const btnIcon = document.getElementById("btn-icon");
const btnText = document.getElementById("btn-text");
const msg = document.getElementById("msg");
const keyInput = document.getElementById("key-input");
const keyText = document.getElementById("key-text");
const keyIndicator = document.getElementById("key-indicator");
const modelSelect = document.getElementById("model-select");
const charCount = document.getElementById("char-count");
const modeLabel = document.getElementById("mode-label");
const apiCard = document.getElementById("api-card");

const modeSelf = document.getElementById("mode-self");
const modeDevice = document.getElementById("mode-device");
const modeServer = document.getElementById("mode-server");

let currentMode = "self";

function showMsg(text, err) {
  if (!msg) return;
  msg.textContent = text;
  msg.className = "msg " + (err ? "err" : "ok");
  msg.style.display = "flex";
  setTimeout(() => { msg.style.display = "none"; }, 3000);
}

function updateKeyUI(has) {
  if (keyText) keyText.textContent = has ? "Key Set" : "No Key";
  if (keyIndicator) keyIndicator.className = "key-badge" + (has ? " ok" : "");
}

function setMode(mode) {
  currentMode = mode;
  modeSelf.classList.toggle("active", mode === "self");
  modeDevice.classList.toggle("active", mode === "device");
  modeServer.classList.toggle("active", mode === "server");

  if (mode === "self") {
    btnIcon.textContent = "✨";
    btnText.textContent = "Self-Enhance";
    modelSelect.style.display = "none";
    apiCard.style.display = "none";
    modeLabel.textContent = "Self mode — injected directly into chatbot";
  } else if (mode === "device") {
    btnIcon.textContent = "📱";
    btnText.textContent = "Device Enhance";
    modelSelect.style.display = "none";
    apiCard.style.display = "none";
    modeLabel.textContent = "Device AI — enhanced via on-device Gemini Nano";
  } else {
    btnIcon.textContent = "⚡";
    btnText.textContent = "Apply Upgrade";
    modelSelect.style.display = "";
    apiCard.style.display = "";
    modeLabel.textContent = "Server mode — enhanced via AI API";
  }
  chrome.runtime.sendMessage({ action: "saveSettings", settings: { mode } });
}

input?.addEventListener("input", () => {
  const len = input.value.length;
  if (charCount) charCount.textContent = `${len} character${len === 1 ? "" : "s"}`;
});

// Mode toggle
modeSelf?.addEventListener("click", () => setMode("self"));
modeDevice?.addEventListener("click", () => setMode("device"));
modeServer?.addEventListener("click", () => setMode("server"));

// Load settings
chrome.runtime?.sendMessage?.({ action: "getSettings" }, (res) => {
  const s = res?.settings || {};
  if (s.mode) setMode(s.mode);
  if (s.model && modelSelect) modelSelect.value = s.model;
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

// Enhance
btn?.addEventListener("click", async () => {
  try {
    const text = input?.value?.trim();
    if (!text) { showMsg("Enter a prompt first", true); return; }

    if (currentMode === "self") {
      const [tab] = await chrome.tabs?.query({ active: true, currentWindow: true }) || [];
      if (!tab?.id) { showMsg("Open a chatbot tab first", true); return; }
      chrome.tabs.sendMessage(tab.id, { action: "selfEnhance", text }, (res) => {
        if (chrome.runtime.lastError) {
          showMsg("Open a chatbot tab first", true);
          return;
        }
        if (res?.success) {
          showMsg("Meta-prompt injected! Submit in the chatbot.");
          window.close();
        } else {
          showMsg(res?.error || "Failed. Open a chatbot tab.", true);
        }
      });
      return;
    }

    if (currentMode === "device") {
      btn.disabled = true;
      btn.innerHTML = '<span>📱</span><span>Device Enhancing...</span>';
      try {
        const res = await chrome.runtime.sendMessage({ action: "enhanceDevice", text });
        if (!res || !res.success) throw new Error(res?.error || "Device AI not available (Chrome 138+ with Gemini Nano required)");
        const enhanced = res.enhanced;
        const [tab] = await chrome.tabs?.query({ active: true, currentWindow: true }) || [];
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { action: "injectEnhanced", text, enhanced }, (ir) => {
            if (chrome.runtime.lastError || !ir?.success) {
              navigator.clipboard.writeText(enhanced);
              showMsg("Enhanced & copied to clipboard");
            } else {
              showMsg("Prompt enhanced & injected!");
              window.close();
            }
          });
        } else {
          await navigator.clipboard.writeText(enhanced);
          showMsg("Enhanced & copied to clipboard");
        }
      } catch (e) {
        showMsg(e.message, true);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>📱</span><span>Device Enhance</span><span>→</span>';
      }
      return;
    }

    // Server mode
    btn.disabled = true;
    btn.innerHTML = '<span>⚡</span><span>Enhancing...</span>';

    const modelVal = modelSelect.value;
    const parts = modelVal.split("::");
    const model = parts[0];
    const provider = parts[1] || "openai";

    try {
      const res = await chrome.runtime.sendMessage({ action: "enhancePrompt", text, model, provider });
      if (!res || !res.success) throw new Error(res?.error || "Failed");
      const enhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
      await navigator.clipboard.writeText(enhanced);
      showMsg("Enhanced & copied to clipboard!");
    } catch (e) {
      showMsg(e.message, true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>⚡</span><span>Apply Upgrade</span><span>→</span>';
    }
  } catch (err) {
    console.error("[Prompt+] click handler error:", err);
    showMsg(err.message || "Something went wrong", true);
  }
});

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
