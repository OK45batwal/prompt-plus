const API_URLS = [
  "https://prompt-plus-three.vercel.app",
  "http://localhost:3000"
];

const STORAGE_KEY = "pp_settings";

// ---------- Web Crypto Per-Installation AES-256 Key Management ----------
async function getOrCreateInstallationKey() {
  const data = await new Promise((resolve) => chrome.storage.local.get("pp_install_key", resolve));
  if (data?.pp_install_key) {
    try {
      const raw = new Uint8Array(data.pp_install_key);
      return await crypto.subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    } catch {
      // Fallback to fresh key if corrupted
    }
  }

  const newKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const exported = await crypto.subtle.exportKey("raw", newKey);
  await new Promise((resolve) => chrome.storage.local.set({ pp_install_key: Array.from(new Uint8Array(exported)) }, resolve));
  return newKey;
}

async function encryptData(text) {
  if (!text) return "";
  try {
    const key = await getOrCreateInstallationKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error("[Prompt+ Crypto] Encryption failed:", e);
    return "";
  }
}

async function decryptData(encryptedB64) {
  if (!encryptedB64) return "";
  try {
    const key = await getOrCreateInstallationKey();
    const combined = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("[Prompt+ Crypto] Decryption failed:", e);
    return "";
  }
}

// ---------- Context Menu Setup ----------
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "pp-enhance-selection",
    title: "⚡ Enhance with Prompt+ AI Architect",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pp-enhance-selection" && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "enhanceSelection",
      text: info.selectionText,
    });
  }
});

// ---------- Keyboard Shortcut Commands ----------
chrome.commands.onCommand.addListener((command) => {
  if (command === "enhance-prompt") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs?.[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "openEnhancePanel" });
      }
    });
  }
});

// ---------- Web Auth Session Detection ----------
async function checkWebAuth() {
  for (const baseUrl of API_URLS) {
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/extension-sync`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Try next URL
    }
  }
  return { authenticated: false };
}

// ---------- Message Router Handler ----------
let cachedWorkingUrl = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "enhancePrompt") {
    (async () => {
      try {
        const data = await new Promise((resolve) => chrome.storage.local.get(STORAGE_KEY, resolve));
        const settings = data?.[STORAGE_KEY] || {};
        let apiKey = "";

        if (settings.apiKeyEnc) {
          apiKey = await decryptData(settings.apiKeyEnc);
        } else if (settings.apiKey) {
          apiKey = settings.apiKey;
        }

        const payload = {
          text: request.text || "",
          apiKey: apiKey || request.apiKey || undefined,
          provider: request.provider || settings.provider || undefined,
          model: request.model || settings.model || undefined,
          tokenSaver: request.tokenSaver || settings.tokenSaver || false,
          level: request.level || "deep",
        };

        const targetUrls = cachedWorkingUrl ? [cachedWorkingUrl, ...API_URLS.filter((u) => u !== cachedWorkingUrl)] : API_URLS;
        let lastErr = "";

        for (const baseUrl of targetUrls) {
          const url = `${baseUrl}/api/v2/extension/optimize`;
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);
            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-PromptPlus-Client": "chrome-extension",
                "X-Requested-With": "XMLHttpRequest",
              },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timeout);

            const resData = await res.json().catch(() => ({}));

            if (!res.ok) {
              if (res.status === 429) {
                const retryAfter = res.headers.get("Retry-After");
                sendResponse({ success: false, error: `Too many requests. Retry in ${retryAfter || 5}s.` });
                return;
              }
              lastErr = resData.error || `Server error (${res.status})`;
              continue;
            }

            cachedWorkingUrl = baseUrl;
            sendResponse({ success: true, data: resData });
            return;
          } catch (err) {
            lastErr = err.message || "Connection failed";
            continue;
          }
        }

        sendResponse({
          success: false,
          error: lastErr || "Could not connect to Prompt+ server.",
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message || "Enhancement failed." });
      }
    })();
    return true;
  }

  if (request.action === "syncAuth") {
    (async () => {
      const authState = await checkWebAuth();
      sendResponse(authState);
    })();
    return true;
  }

  if (request.action === "saveApiKey") {
    (async () => {
      const encryptedKey = await encryptData(request.apiKey);
      chrome.storage.local.get(STORAGE_KEY, (data) => {
        const cur = data[STORAGE_KEY] || {};
        cur.apiKeyEnc = encryptedKey;
        cur.apiKey = "";
        chrome.storage.local.set({ [STORAGE_KEY]: cur }, () => sendResponse({ success: true }));
      });
    })();
    return true;
  }

  if (request.action === "getApiKey") {
    (async () => {
      chrome.storage.local.get(STORAGE_KEY, async (data) => {
        const settings = data[STORAGE_KEY] || {};
        let key = "";
        if (settings.apiKeyEnc) {
          key = await decryptData(settings.apiKeyEnc);
        } else if (settings.apiKey) {
          key = settings.apiKey;
        }
        sendResponse({ apiKey: key });
      });
    })();
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

  if (request.action === "openInWebStudio") {
    const targetUrl = (cachedWorkingUrl || API_URLS[0]) + "/dashboard/new";
    chrome.tabs.create({ url: targetUrl }, () => sendResponse({ success: true }));
    return true;
  }
});
