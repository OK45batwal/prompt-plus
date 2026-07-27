const input = document.getElementById("quick-input");
const enhanceBtn = document.getElementById("enhance-btn");
const clearBtn = document.getElementById("clear-btn");
const output = document.getElementById("output");
const outputBody = document.getElementById("output-body");
const copyBtn = document.getElementById("copy-btn");
const successMsg = document.getElementById("success-msg");
const errorMsg = document.getElementById("error-msg");
const errorText = document.getElementById("error-text");

function showLoading(show) {
  enhanceBtn.disabled = show;
  enhanceBtn.innerHTML = show
    ? '<span class="spinner"></span> Enhancing...'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Enhance';
}

function showError(msg) {
  errorText.textContent = msg;
  errorMsg.style.display = "flex";
  successMsg.style.display = "none";
  setTimeout(() => { errorMsg.style.display = "none"; }, 4000);
}

async function enhancePrompt(text) {
  showLoading(true);
  output.style.display = "none";
  successMsg.style.display = "none";
  errorMsg.style.display = "none";

  try {
    const res = await chrome.runtime.sendMessage({
      action: "enhancePrompt",
      text,
    });
    if (!res || !res.success) {
      throw new Error(res?.error || "Enhancement failed");
    }
    const enhanced = res.data?.data?.enhanced || res.data?.enhanced || "";
    outputBody.textContent = enhanced;
    output.style.display = "block";
    await navigator.clipboard.writeText(enhanced);
    successMsg.style.display = "flex";
    setTimeout(() => { successMsg.style.display = "none"; }, 2000);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

enhanceBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) {
    showError("Please enter a prompt first");
    return;
  }
  enhancePrompt(text);
});

clearBtn.addEventListener("click", () => {
  input.value = "";
  output.style.display = "none";
  successMsg.style.display = "none";
  errorMsg.style.display = "none";
  input.focus();
});

copyBtn.addEventListener("click", async () => {
  const text = outputBody.textContent;
  if (!text) return;
  await navigator.clipboard.writeText(text);
  copyBtn.innerHTML =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied';
  setTimeout(() => {
    copyBtn.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
  }, 1500);
});

document.getElementById("open-dashboard")?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://prompt-plus-three.vercel.app/dashboard" });
});
