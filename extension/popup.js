const input = document.getElementById("input");
const btn = document.getElementById("enhance-btn");
const msg = document.getElementById("msg");
const keyInput = document.getElementById("key-input");
const keyDot = document.getElementById("key-dot");
const keyDotTop = document.getElementById("key-dot-top");
const keyText = document.getElementById("key-text");
const keyIndicator = document.getElementById("key-indicator");
const modelSelect = document.getElementById("model-select");

const chatbotPills = {
  chatgpt: document.getElementById("tab-chatgpt"),
  claude: document.getElementById("tab-claude"),
  gemini: document.getElementById("tab-gemini"),
  deepseek: document.getElementById("tab-deepseek"),
};

function showMsg(text, err) {
  msg.textContent = text;
  msg.className = "msg" + (err ? " err" : "");
  msg.style.display = "flex";
  setTimeout(() => {
    msg.style.display = "none";
  }, 3000);
}

function updateKeyUI(has) {
  if (keyDot) keyDot.className = "api-dot " + (has ? "ok" : "no");
  if (keyDotTop) keyDotTop.className = "api-dot " + (has ? "ok" : "no");
  if (keyText) keyText.textContent = has ? "Key Set" : "No Key";
  if (keyIndicator) keyIndicator.className = "key-badge " + (has ? "ok" : "");
}

Object.keys(chatbotPills).forEach((botKey) => {
  const pill = chatbotPills[botKey];
  if (!pill) return;
  pill.addEventListener("click", () => {
    Object.values(chatbotPills).forEach((p) => p && p.classList.remove("active"));
    pill.classList.add("active");
  });
});

chrome.runtime?.sendMessage?.({ action: "getApiKey" }, (res) => {
  if (res && res.apiKey) {
    keyInput.value = res.apiKey;
    updateKeyUI(true);
  }
});

chrome.runtime?.sendMessage?.({ action: "getSettings" }, (res) => {
  if (res && res.settings && res.settings.model) {
    modelSelect.value = res.settings.model;
  }
});

keyInput?.addEventListener("change", () => {
  const k = keyInput.value.trim();
  if (!k) {
    updateKeyUI(false);
    return;
  }
  chrome.runtime.sendMessage({ action: "saveApiKey", apiKey: k }, (r) => {
    if (r && r.success) updateKeyUI(true);
  });
});

modelSelect?.addEventListener("change", () => {
  chrome.runtime.sendMessage({ action: "saveSettings", settings: { model: modelSelect.value } });
});

btn?.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) {
    showMsg("Enter a prompt first", true);
    return;
  }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Enhancing...';

  const modelVal = modelSelect.value;
  const parts = modelVal.split("::");
  const model = parts[0];
  const provider = parts[1] || "openai";

  try {
    const res = await chrome.runtime.sendMessage({ action: "enhancePrompt", text, model, provider });
    if (!res || !res.success) throw new Error(res?.error || "Failed");
    const enhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
    await navigator.clipboard.writeText(enhanced);
    showMsg("Enhanced! Copied to clipboard");
  } catch (e) {
    showMsg(e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Enhance Prompt";
  }
});

document.getElementById("open-dash")?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://prompt-plus-7md4ow7pu-unkown3.vercel.app/dashboard" });
});
