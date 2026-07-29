const input = document.getElementById("input");
const btn = document.getElementById("enhance-btn");
const msg = document.getElementById("msg");
const keyInput = document.getElementById("key-input");
const keyText = document.getElementById("key-text");
const keyIndicator = document.getElementById("key-indicator");
const modelSelect = document.getElementById("model-select");
const charCount = document.getElementById("char-count");

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
  setTimeout(() => { msg.style.display = "none"; }, 3000);
}

function updateKeyUI(has) {
  if (keyText) keyText.textContent = has ? "Key Set" : "No Key";
  if (keyIndicator) keyIndicator.className = "key-badge" + (has ? " ok" : "");
}

// Detect active chatbot tab and highlight pill
chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || "";
  Object.entries(CHATBOT_URLS).forEach(([key, baseUrl]) => {
    const pill = chatbotPills[key];
    if (!pill) return;
    if (url.startsWith(baseUrl)) pill.classList.add("active");
  });
});

// Character counter
input?.addEventListener("input", () => {
  if (charCount) {
    const len = input.value.length;
    charCount.textContent = `${len} character${len === 1 ? "" : "s"}`;
  }
});

// Chatbot pill — open chatbot site in new tab
Object.entries(chatbotPills).forEach(([botKey, pill]) => {
  if (!pill) return;
  pill.addEventListener("click", () => {
    const url = CHATBOT_URLS[botKey];
    if (url) chrome.tabs.create({ url });
  });
});

// Load API key
chrome.runtime?.sendMessage?.({ action: "getApiKey" }, (res) => {
  if (res && res.apiKey) {
    if (keyInput) keyInput.value = res.apiKey;
    updateKeyUI(true);
  }
});

// Load model setting
chrome.runtime?.sendMessage?.({ action: "getSettings" }, (res) => {
  if (res && res.settings && res.settings.model && modelSelect) {
    modelSelect.value = res.settings.model;
  }
});

// Save API key with format validation
keyInput?.addEventListener("change", () => {
  const k = keyInput.value.trim();
  if (!k) { updateKeyUI(false); keyInput.style.borderColor = ""; return; }
  const valid = k.startsWith("sk-") || k.startsWith("sk-or-") || k.startsWith("sk-ant-") || k.startsWith("nvapi-");
  if (!valid) {
    keyInput.style.borderColor = "#ef4444";
    showMsg("Invalid key format (expected sk-..., sk-or-..., sk-ant-..., or nvapi-...)", true);
    return;
  }
  keyInput.style.borderColor = "#10b981";
  chrome.runtime.sendMessage({ action: "saveApiKey", apiKey: k }, (r) => {
    if (r && r.success) updateKeyUI(true);
  });
});

keyInput?.addEventListener("input", () => {
  keyInput.style.borderColor = "";
});

// Save model selection
modelSelect?.addEventListener("change", () => {
  chrome.runtime.sendMessage({ action: "saveSettings", settings: { model: modelSelect.value } });
});

// Enhance prompt
btn?.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) { showMsg("Enter a prompt first", true); return; }
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
});

// Open dashboard
document.getElementById("open-dash")?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://prompt-plus-three.vercel.app/dashboard" });
});
