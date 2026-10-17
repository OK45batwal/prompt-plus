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

// ---------- Web Auth Session Detection & Sync ----------
async function checkWebAuth() {
  for (const baseUrl of API_URLS) {
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/extension-sync`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-PromptPlus-Client": "chrome-extension",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          await new Promise((resolve) => chrome.storage.local.set({ pp_web_session: data }, resolve));
        }
        return data;
      }
    } catch {
      // Try next URL
    }
  }

  // Check cached session if network fetch failed
  const cached = await new Promise((resolve) => {
    chrome.storage.local.get("pp_web_session", (d) => resolve(d?.pp_web_session || null));
  });

  return cached || { authenticated: false };
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
          tone: request.tone || undefined,
        };

        const targetUrls = cachedWorkingUrl ? [cachedWorkingUrl, ...API_URLS.filter((u) => u !== cachedWorkingUrl)] : API_URLS;
        let lastErr = "";

        for (const baseUrl of targetUrls) {
          // Route based on user selected mode:
          // "algo": Sub-30ms offline algorithmic IR endpoint
          // "api" or default: Multi-model LLM enhancement engine, with fallback to algorithmic if offline
          const endpoints = request.mode === "algo"
            ? [`${baseUrl}/api/v2/extension/optimize`]
            : [`${baseUrl}/api/v1/extension/enhance`, `${baseUrl}/api/v2/extension/optimize`];

          for (const url of endpoints) {
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 20000);
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
                  sendResponse({ success: false, error: `Rate limited. Retry in ${retryAfter || 5}s.` });
                  return;
                }
                lastErr = resData.error || `Server error (${res.status})`;
                continue;
              }

              cachedWorkingUrl = baseUrl;
              const enhancedText = resData.data?.enhanced || resData.enhanced || "";
              const modelUsed = resData.data?.model || resData.model || "promptplus-v2";
              const providerUsed = resData.data?.provider || resData.provider || "cloud";
              const scoreUsed = resData.data?.score ?? resData.score ?? null;
              const engine = providerUsed === "engine";
              const local = providerUsed === "local" || /algorithmic|promptplus-v2/.test(modelUsed) || url.includes("/v2/extension/");

              sendResponse({
                success: true,
                data: {
                  enhanced: enhancedText,
                  source: engine ? "engine" : local ? "local-template" : "llm",
                  model: modelUsed,
                  provider: providerUsed,
                  score: scoreUsed,
                  ...resData.data,
                },
              });
              return;
            } catch (err) {
              lastErr = err.message || "Connection failed";
              continue;
            }
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

  if (request.action === "saveToCloudPrompt") {
    (async () => {
      try {
        const { originalText, enhancedText, category, tone, score } = request;
        const targetUrls = cachedWorkingUrl ? [cachedWorkingUrl, ...API_URLS.filter((u) => u !== cachedWorkingUrl)] : API_URLS;

        for (const baseUrl of targetUrls) {
          try {
            const res = await fetch(`${baseUrl}/api/v1/extension/save-prompt`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-PromptPlus-Client": "chrome-extension",
                "X-Requested-With": "XMLHttpRequest",
              },
              credentials: "include",
              body: JSON.stringify({
                originalText,
                enhancedText,
                category: category || "General",
                tone: tone || "code",
                score: score ?? null,
              }),
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
              sendResponse({ success: true, data: data.data });
              return;
            }
          } catch {
            // Try next
          }
        }
        sendResponse({ success: false, error: "Please log in to Prompt+ Web to save prompts to Cloud." });
      } catch (err) {
        sendResponse({ success: false, error: err.message || "Save failed." });
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

  if (request.action === "saveSessionFromWeb") {
    chrome.storage.local.set({
      pp_web_session: {
        authenticated: true,
        user: request.user,
        quota: request.quota || null,
        savedBlocks: request.savedBlocks || [],
        recentPrompts: request.recentPrompts || [],
        syncedAt: new Date().toISOString(),
      },
    }, () => sendResponse({ success: true }));
    return true;
  }

  if (request.action === "openInWebStudio") {
    const promptText = encodeURIComponent(request.prompt || "");
    const toneVal = encodeURIComponent(request.tone || "");
    let targetUrl = (cachedWorkingUrl || API_URLS[0]) + "/dashboard/new";
    if (promptText) {
      targetUrl += `?prompt=${promptText}&tone=${toneVal}`;
    }
    chrome.tabs.create({ url: targetUrl }, () => sendResponse({ success: true }));
    return true;
  }

  // ---------- Live Token Runway & Context State Tracking ----------
  if (request.action === "tokenUpdate") {
    queueTokenState(async () => {
      const tabId = sender.tab?.id;
      if (tabId == null) return;
      const conversationId = await conversationIdentity(sender.url || sender.tab.url || "");
      const number = (key) => Number.isFinite(request[key]) && request[key] >= 0 ? request[key] : 0;
      const data = {
        conversationId,
        platform: String(request.platform || "chat").slice(0, 40),
        modelName: String(request.modelName || "Unknown model").slice(0, 100),
        estimated: true,
        contextLimitKnown: request.contextLimitKnown === true,
        ...Object.fromEntries(["conversationTokens", "contextLimit", "tokensRemaining", "percentUsed", "turnCount", "userTokens", "aiTokens", "avgTokensPerTurn", "avgTokensPerExchange", "estimatedMessagesLeft", "largestTurnTokens"].map((key) => [key, number(key)])),
        burnRate: ["steady", "moderate", "heavy"].includes(request.burnRate) ? request.burnRate : "steady",
        lastUpdated: Date.now(),
      };
      conversationTokenState.set(tabId, data);
      await persistTokenState();
      chrome.runtime.sendMessage({ action: "tokenStateUpdate", data }).catch(() => {});
    }).then(() => sendResponse({ success: true })).catch(() => sendResponse({ success: false, error: "Token state unavailable" }));
    return true;
  }

  if (request.action === "getTokenState") {
    queueTokenState(async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs?.[0];
      const state = tab ? conversationTokenState.get(tab.id) : null;
      const matches = state && state.conversationId === await conversationIdentity(tab.url || "");
      sendResponse({ data: matches ? state : null });
    }).catch(() => sendResponse({ data: null }));
    return true;
  }

  // ---------- Connection Health & Latency Monitor ----------
  if (request.action === "getHealthStatus") {
    sendResponse({ health: cachedHealthState });
    return true;
  }

  if (request.action === "triggerHealthCheck") {
    (async () => {
      const health = await pingServerHealth();
      sendResponse({ health });
    })();
    return true;
  }
});

// ---------- Real-Time Tab Token State & Notification Engine ----------
const conversationTokenState = new Map();

const TOKEN_SESSION_KEY = "pp_token_session_v1";
const tokenStateReady = chrome.storage.session.get(TOKEN_SESSION_KEY).then((stored) => {
  const snapshot = stored[TOKEN_SESSION_KEY];
  for (const [id, data] of snapshot?.tokens || []) conversationTokenState.set(id, data);
}).catch(() => {});
let tokenStateQueue = tokenStateReady;
function queueTokenState(operation) {
  const next = tokenStateQueue.then(operation);
  tokenStateQueue = next.catch(() => {});
  return next;
}
async function conversationIdentity(url) {
  const parsed = new URL(url || "https://unknown.invalid");
  const bytes = new TextEncoder().encode(parsed.origin + parsed.pathname);
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function persistTokenState() {
  await chrome.storage.session.set({ [TOKEN_SESSION_KEY]: { tokens: [...conversationTokenState] } });
}
// Clean up tab state on closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  queueTokenState(async () => {
    conversationTokenState.delete(tabId);
    await persistTokenState();
  }).catch(() => {});
});
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (!change.url) return;
  queueTokenState(async () => {
    const identity = await conversationIdentity(change.url);
    if (conversationTokenState.get(tabId)?.conversationId !== identity) {
      conversationTokenState.delete(tabId);
      await persistTokenState();
    }
  }).catch(() => {});
});

// ---------- Health Heartbeat System ----------
let cachedHealthState = {
  status: "unknown",
  latencyMs: null,
  lastChecked: null,
  url: API_URLS[0],
};

async function pingServerHealth() {
  const targetUrls = cachedWorkingUrl ? [cachedWorkingUrl, ...API_URLS.filter((u) => u !== cachedWorkingUrl)] : API_URLS;
  for (const baseUrl of targetUrls) {
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: "GET",
        headers: { "X-PromptPlus-Client": "chrome-extension" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        cachedWorkingUrl = baseUrl;
        cachedHealthState = {
          status: latencyMs > 2000 ? "degraded" : "connected",
          latencyMs,
          lastChecked: Date.now(),
          url: baseUrl,
        };
        return cachedHealthState;
      }
    } catch {
      // try next
    }
  }

  cachedHealthState = {
    status: "offline",
    latencyMs: -1,
    lastChecked: Date.now(),
    url: null,
  };
  return cachedHealthState;
}

// Ping health every 60s
setInterval(pingServerHealth, 60000);
pingServerHealth();
