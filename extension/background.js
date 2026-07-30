const API_URLS = [
  "https://prompt-plus-three.vercel.app/api/v1/extension/enhance",
  "http://localhost:3000/api/v1/extension/enhance",
];
const STORAGE_KEY = "pp_settings";
let cachedWorkingUrl = "";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "enhance-selection",
    title: 'Enhance with Prompt+',
    contexts: ["selection"],
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "enhancePrompt") {
    (async () => {
      const settings = await chrome.storage.local.get(STORAGE_KEY).catch(() => ({}));
      const saved = settings[STORAGE_KEY] || {};
      const apiKey = request.apiKey || saved.apiKey || "";

      if (!apiKey) {
        sendResponse({ success: false, error: "No API key set. Open the extension popup to configure one." });
        return;
      }

      const urls = cachedWorkingUrl ? [cachedWorkingUrl, ...API_URLS.filter((u) => u !== cachedWorkingUrl)] : API_URLS;
      let lastErr = "";

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: request.text,
              apiKey,
              model: request.model || "gpt-4o-mini",
              provider: request.provider || "openai",
            }),
            signal: AbortSignal.timeout(20000),
          });
          const data = await res.json();
          if (!res.ok) {
            const msg = data.error || "Enhancement failed";
            if (res.status === 429) {
              const retryAfter = res.headers.get("Retry-After");
              sendResponse({ success: false, error: `Daily limit reached. Try again ${retryAfter ? `in ${retryAfter}s` : "tomorrow"}.` });
              return;
            }
            if (res.status >= 500) { lastErr = msg; continue; }
            sendResponse({ success: false, error: msg });
            return;
          }
          cachedWorkingUrl = url;
          sendResponse({ success: true, data });
          return;
        } catch (err) {
          lastErr = err.message || "Connection failed";
          continue;
        }
      }
      sendResponse({ success: false, error: lastErr || "Could not reach Prompt+ API. Check your connection and try again." });
    })();
    return true;
  }

  if (request.action === "enhanceDevice") {
    (async () => {
      try {
        const result = await enhanceWithDevice(request.text);
        sendResponse(result);
      } catch (e) {
        sendResponse({ success: false, error: e.message || "Device AI error" });
      }
    })();
    return true;
  }

  if (request.action === "saveApiKey") {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const settings = data[STORAGE_KEY] || {};
      settings.apiKey = request.apiKey;
      chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.action === "getApiKey") {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const settings = data[STORAGE_KEY] || {};
      sendResponse({ apiKey: settings.apiKey || "" });
    });
    return true;
  }

  if (request.action === "getSettings") {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      sendResponse({ settings: data[STORAGE_KEY] || {} });
    });
    return true;
  }

  if (request.action === "saveSettings") {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const cur = data[STORAGE_KEY] || {};
      Object.assign(cur, request.settings);
      chrome.storage.local.set({ [STORAGE_KEY]: cur }, () => sendResponse({ success: true }));
    });
    return true;
  }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "enhance-selection" && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "openEnhancePanel", text: info.selectionText });
  }
});

// Keyboard command handler
chrome.commands.onCommand.addListener((command) => {
  if (command === "enhance-prompt") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleEnhancePanel" });
      }
    });
  }
});

// Device AI enhancement via Chrome Prompt API (Gemini Nano, Chrome 138+)
async function enhanceWithDevice(text) {
  const LM = typeof LanguageModel !== "undefined" ? LanguageModel :
             self.ai?.languageModel ? self.ai.languageModel : null;
  if (!LM) {
    throw new Error("Device AI not supported. Chrome 138+ with Gemini Nano required.");
  }
  let availability;
  if (LM === LanguageModel) {
    availability = await LM.availability();
  } else {
    const caps = await LM.capabilities();
    availability = caps.available;
  }
  if (availability === "unavailable") {
    throw new Error("Gemini Nano model not available on this device. Enable via chrome://flags/#prompt-api-for-gemini-nano");
  }
  let session;
  if (LM === LanguageModel) {
    session = await LM.create({
      systemPrompt: "Rewrite the user's rough prompt into a detailed, structured version. Add context, clear step-by-step instructions, specificity, format guidance, and constraints. Output only the enhanced prompt.",
      temperature: 0.4,
    });
  } else {
    session = await LM.create({
      systemPrompt: "Rewrite the user's rough prompt into a detailed, structured version. Add context, clear step-by-step instructions, specificity, format guidance, and constraints. Output only the enhanced prompt.",
      temperature: 0.4,
    });
  }
  try {
    const result = await session.prompt(text);
    return { success: true, enhanced: result };
  } finally {
    session.destroy();
  }
}
