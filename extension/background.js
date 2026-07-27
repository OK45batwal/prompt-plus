const API_URLS = [
  "https://prompt-plus-three.vercel.app/api/v1/extension/enhance",
  "http://localhost:3000/api/v1/extension/enhance",
];
const STORAGE_KEY = "pp_settings";

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Prompt+] Extension installed");
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

      for (const url of API_URLS) {
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
            sendResponse({ success: false, error: data.error || "Enhancement failed" });
            return;
          }
          sendResponse({ success: true, data });
          return;
        } catch (err) {
          continue;
        }
      }
      sendResponse({ success: false, error: "Could not reach Prompt+ API. Check your connection and try again." });
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
