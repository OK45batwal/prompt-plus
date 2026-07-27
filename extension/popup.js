const input = document.getElementById("input");
const btn = document.getElementById("enhance-btn");
const msg = document.getElementById("msg");
const keyInput = document.getElementById("key-input");
const keyDot = document.getElementById("key-dot");
const keyIndicator = document.getElementById("key-indicator");

function showMsg(text, err) { msg.textContent = text; msg.className = "msg" + (err ? " err" : ""); msg.style.display = "flex"; setTimeout(() => { msg.style.display = "none"; }, 3000); }

function updateKeyUI(has) {
  keyDot.className = "api-dot " + (has ? "ok" : "no");
  keyIndicator.textContent = has ? "• Key Set" : "• No Key";
  keyIndicator.style.color = has ? "#10b981" : "#f87171";
}

chrome.runtime.sendMessage({ action: "getApiKey" }, (res) => {
  if (res && res.apiKey) { keyInput.value = res.apiKey; updateKeyUI(true); }
});

keyInput.addEventListener("change", () => {
  const k = keyInput.value.trim();
  if (!k) { updateKeyUI(false); return; }
  chrome.runtime.sendMessage({ action: "saveApiKey", apiKey: k }, (r) => {
    if (r && r.success) updateKeyUI(true);
  });
});

btn.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) { showMsg("Enter a prompt first", true); return; }
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Enhancing...';
  try {
    const res = await chrome.runtime.sendMessage({ action: "enhancePrompt", text });
    if (!res || !res.success) throw new Error(res?.error || "Failed");
    const enhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
    await navigator.clipboard.writeText(enhanced);
    showMsg("Enhanced! Copied to clipboard");
  } catch (e) {
    showMsg(e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Enhance";
  }
});

document.getElementById("open-dash")?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://prompt-plus-three.vercel.app/dashboard" });
});
