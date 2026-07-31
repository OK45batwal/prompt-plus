const msg = document.getElementById("msg");
const keyInput = document.getElementById("key-input");
const keyText = document.getElementById("key-text");
const keyIndicator = document.getElementById("key-indicator");
const modelSelect = document.getElementById("model-select");
const modelLabel = document.getElementById("model-label");
const modeLabel = document.getElementById("mode-label");
const apiCard = document.getElementById("api-card");

const modeDevice = document.getElementById("mode-device");
const modeServer = document.getElementById("mode-server");

let tokenSaver = false;
const tsToggle = document.getElementById("ts-toggle");

async function checkDeviceSupport() {
  try {
    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
      const res = await chrome.runtime.sendMessage({ action: "checkDeviceAI" });
      return res?.supported === true;
    }
  } catch { /* ignore */ }
  return false;
}

function showMsg(text, err) {
  if (!msg) return;
  msg.textContent = text;
  msg.className = "msg " + (err ? "err" : "ok");
  msg.style.display = "flex";
  setTimeout(() => { msg.style.display = "none"; }, 3000);
}

function updateKeyUI(has) {
  if (keyText) keyText.textContent = has ? "Key Set" : "Free Server";
  if (keyIndicator) keyIndicator.className = "key-badge" + (has ? " ok" : "");
}

function setMode(mode) {
  modeDevice.classList.toggle("active", mode === "device");
  modeServer.classList.toggle("active", mode === "server");

  if (mode === "device") {
    modelSelect.style.display = "none";
    modelLabel.style.display = "none";
    apiCard.style.display = "none";
    modeLabel.textContent = "On-Device AI — enhanced via Gemini Nano";
    checkDeviceSupport().then((supported) => {
      if (!supported) {
        modeLabel.textContent = "On-Device AI — needs Chrome 138+ with Gemini Nano";
        modeLabel.style.color = "#f59e0b";
      } else {
        modeLabel.textContent = "On-Device AI — enhanced via Gemini Nano";
        modeLabel.style.color = "";
      }
    });
  } else {
    modelSelect.style.display = "";
    modelLabel.style.display = "";
    apiCard.style.display = "";
    modeLabel.textContent = "API mode — enhanced via cloud AI API";
    modeLabel.style.color = "";
  }
  chrome.runtime.sendMessage({ action: "saveSettings", settings: { mode } });
}

// Mode toggle
modeDevice?.addEventListener("click", () => setMode("device"));
modeServer?.addEventListener("click", () => setMode("server"));

tsToggle?.addEventListener("change", () => {
  tokenSaver = tsToggle.checked;
  chrome.runtime.sendMessage({ action: "saveSettings", settings: { tokenSaver } });
});

// Load settings
chrome.runtime?.sendMessage?.({ action: "getSettings" }, (res) => {
  const s = res?.settings || {};
  if (s.mode) setMode(s.mode);
  else checkDeviceSupport().then((supported) => {
    if (!supported) {
      modeLabel.textContent = "On-Device AI — needs Chrome 138+ with Gemini Nano";
      modeLabel.style.color = "#f59e0b";
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
