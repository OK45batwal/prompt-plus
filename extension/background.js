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

      const urls = cachedWorkingUrl ? [cachedWorkingUrl, ...API_URLS.filter((u) => u !== cachedWorkingUrl)] : API_URLS;
      let lastErr = "";

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: request.text,
              apiKey: apiKey || undefined,
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
              sendResponse({ success: false, error: `Too many requests. Try again ${retryAfter ? `in ${retryAfter}s` : "in a few minutes"}.` });
              return;
            }
            if (res.status === 402) {
              sendResponse({ success: false, error: msg });
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
        const result = await enhanceWithDevice(request, sender);
        sendResponse(result);
      } catch (e) {
        sendResponse({ success: false, error: e.message || "Device AI error" });
      }
    })();
    return true;
  }

  if (request.action === "checkDeviceAI") {
    (async () => {
      try {
        let supported = typeof LanguageModel !== "undefined";
        if (supported) {
          const availability = await LanguageModel.availability();
          supported = availability === "available" || availability === "downloading";
        }
        sendResponse({ supported });
      } catch {
        sendResponse({ supported: false });
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
async function enhanceWithDevice(req, sender) {
  const text = req.text;
  if (typeof LanguageModel === "undefined") {
    throw new Error("Device AI not supported. Chrome 138+ with Gemini Nano required.");
  }
  const availability = await LanguageModel.availability();
  if (availability === "unavailable") {
    throw new Error("Gemini Nano not available on this device. Needs Chrome 138+, 22GB+ free storage, macOS 13+/Win 10+/Linux.");
  }
  const session = await LanguageModel.create({
    temperature: 0.3, topK: 1,
    monitor(m) {
      m.addEventListener("downloadprogress", (e) => {
        if (e.loaded < 1) {
          try {
            chrome.tabs.sendMessage(sender?.tab?.id, {
              action: "deviceProgress", pct: Math.round(e.loaded * 100),
            });
          } catch { /* tab gone */ }
        }
      });
    },
  });
  try {
    const cat = req.category || "General Task";
    const tone = req.tone || "Professional & Clear";
    const length = req.length || "Comprehensive & Structured";

    const systemInstruction = `You are the Prompt+ Architect Engine — an advanced AI meta-prompt compiler.
Your task is to transform raw, simple, or incomplete user prompts into production-grade, highly structured AI instructions.
Return ONLY the final enhanced prompt framework ready for immediate execution by AI models. Do NOT add introductory or conversational meta-text.`;

    const tokenSaverClause = req.tokenSaver
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
        try {
          chrome.tabs.sendMessage(sender?.tab?.id, { action: "deviceChunk", text: full });
        } catch { /* tab gone */ }
      }
    } catch (e) {
      console.error("[Prompt+] stream error, falling back to prompt():", e);
    }

    if (!full.trim()) {
      full = await session.prompt(`${systemInstruction}\n\n${metaPrompt}`);
      try {
        chrome.tabs.sendMessage(sender?.tab?.id, { action: "deviceChunk", text: full });
      } catch { /* tab gone */ }
    }
    return { success: true, enhanced: full.trim() };
  } finally {
    session.destroy();
  }
}
