const input = document.getElementById("input");
const btn = document.getElementById("enhance-btn");
const btnLabel = document.getElementById("btn-label");
const msg = document.getElementById("msg");
const keyInput = document.getElementById("key-input");
const keyText = document.getElementById("key-text");
const keyIndicator = document.getElementById("key-indicator");
const toggleKeyBtn = document.getElementById("toggle-key-btn");
const modelSelect = document.getElementById("model-select");
const toneSelect = document.getElementById("tone-select");
const charCount = document.getElementById("char-count");
const clearBtn = document.getElementById("clear-btn");
const pasteBtn = document.getElementById("paste-btn");

const resultCard = document.getElementById("result-card");
const resultBody = document.getElementById("result-body");
const copyResultBtn = document.getElementById("copy-result-btn");

let currentEnhancedText = "";

const CHATBOT_URLS = {
  chatgpt: "https://chatgpt.com",
  claude: "https://claude.ai",
  gemini: "https://gemini.google.com",
  deepseek: "https://chat.deepseek.com",
};

const chatbotPills = {
  chatgpt: document.getElementById("tab-chatgpt"),
  claude: document.getElementById("tab-claude"),
  gemini: document.getElementById("tab-gemini"),
  deepseek: document.getElementById("tab-deepseek"),
};

function showMsg(text, err) {
  if (!msg) return;
  msg.textContent = text;
  msg.className = "msg " + (err ? "err" : "ok");
  msg.style.display = "flex";
  setTimeout(() => { msg.style.display = "none"; }, 3500);
}

function updateKeyUI(has) {
  if (keyText) keyText.textContent = has ? "Key Set" : "No Key";
  if (keyIndicator) keyIndicator.className = "key-badge" + (has ? " ok" : "");
}

function updateTextMeta() {
  if (!input) return;
  const val = input.value;
  const len = val.length;
  const words = val.trim() ? val.trim().split(/\s+/).length : 0;
  if (charCount) {
    charCount.textContent = `${len} chars • ${words} word${words === 1 ? "" : "s"}`;
  }
  if (clearBtn) {
    clearBtn.style.display = len > 0 ? "inline-block" : "none";
  }
}

// Active tab detection
chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || "";
  Object.entries(CHATBOT_URLS).forEach(([key, baseUrl]) => {
    const pill = chatbotPills[key];
    if (!pill) return;
    if (url.startsWith(baseUrl)) pill.classList.add("active");
  });
});

// Character and Word counter
input?.addEventListener("input", updateTextMeta);

// Clear button
clearBtn?.addEventListener("click", () => {
  if (input) {
    input.value = "";
    updateTextMeta();
    input.focus();
  }
});

// Paste button
pasteBtn?.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && input) {
      input.value = text;
      updateTextMeta();
      showMsg("Pasted from clipboard!");
    }
  } catch {
    showMsg("Clipboard access denied", true);
  }
});

// Eye toggle for API key input
toggleKeyBtn?.addEventListener("click", () => {
  if (!keyInput) return;
  const isPass = keyInput.type === "password";
  keyInput.type = isPass ? "text" : "password";
  toggleKeyBtn.textContent = isPass ? "🙈" : "👁️";
});

// Chatbot pills click handlers
Object.entries(chatbotPills).forEach(([botKey, pill]) => {
  if (!pill) return;
  pill.addEventListener("click", () => {
    const url = CHATBOT_URLS[botKey];
    if (url) chrome.tabs.create({ url });
  });
});

// Load saved API key & settings
chrome.runtime?.sendMessage?.({ action: "getApiKey" }, (res) => {
  if (res && res.apiKey) {
    if (keyInput) keyInput.value = res.apiKey;
    updateKeyUI(true);
  }
});

chrome.runtime?.sendMessage?.({ action: "getSettings" }, (res) => {
  if (res && res.settings) {
    if (res.settings.model && modelSelect) modelSelect.value = res.settings.model;
    if (res.settings.tone && toneSelect) toneSelect.value = res.settings.tone;
  }
});

// Save API key with validation
keyInput?.addEventListener("change", () => {
  const k = keyInput.value.trim();
  if (!k) { updateKeyUI(false); keyInput.style.borderColor = ""; return; }
  const valid = k.startsWith("sk-") || k.startsWith("sk-or-") || k.startsWith("sk-ant-") || k.startsWith("nvapi-");
  if (!valid) {
    keyInput.style.borderColor = "#ef4444";
    showMsg("Invalid format (expected sk-..., sk-or-..., sk-ant-..., or nvapi-...)", true);
    return;
  }
  keyInput.style.borderColor = "#10b981";
  chrome.runtime.sendMessage({ action: "saveApiKey", apiKey: k }, (r) => {
    if (r && r.success) {
      updateKeyUI(true);
      showMsg("API Key saved securely!");
    }
  });
});

keyInput?.addEventListener("input", () => {
  if (keyInput) keyInput.style.borderColor = "";
});

// Save settings on dropdown change
modelSelect?.addEventListener("change", () => {
  chrome.runtime.sendMessage({ action: "saveSettings", settings: { model: modelSelect.value } });
});

toneSelect?.addEventListener("change", () => {
  chrome.runtime.sendMessage({ action: "saveSettings", settings: { tone: toneSelect.value } });
});

// Enhance Prompt
btn?.addEventListener("click", async () => {
  const text = input ? input.value.trim() : "";
  if (!text) { showMsg("Enter or paste a prompt first", true); return; }
  
  btn.disabled = true;
  if (btnLabel) btnLabel.textContent = "Enhancing...";

  const modelVal = modelSelect ? modelSelect.value : "gpt-4o-mini";
  const toneVal = toneSelect ? toneSelect.value : "Balanced";
  const parts = modelVal.split("::");
  const model = parts[0];
  const provider = parts[1] || "openai";

  try {
    const res = await chrome.runtime.sendMessage({
      action: "enhancePrompt",
      text,
      model,
      provider,
      tone: toneVal,
    });

    if (!res || !res.success) throw new Error(res?.error || "Enhancement failed");

    currentEnhancedText = res.data?.data?.enhanced || res.data?.enhanced || "";
    
    // Copy to clipboard
    await navigator.clipboard.writeText(currentEnhancedText);

    // Show result card
    if (resultCard && resultBody) {
      resultBody.textContent = currentEnhancedText;
      resultCard.style.display = "flex";
    }

    showMsg("Enhanced & copied to clipboard!");
  } catch (e) {
    showMsg(e.message, true);
  } finally {
    btn.disabled = false;
    if (btnLabel) btnLabel.textContent = "Apply Upgrade";
  }
});

// Copy Result button inside Result Card
copyResultBtn?.addEventListener("click", async () => {
  if (!currentEnhancedText) return;
  await navigator.clipboard.writeText(currentEnhancedText);
  copyResultBtn.textContent = "✓ Copied!";
  setTimeout(() => {
    copyResultBtn.textContent = "📋 Copy Enhanced";
  }, 2000);
});

// Open dashboard tab
document.getElementById("open-dash")?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://prompt-plus-three.vercel.app/dashboard" });
});
