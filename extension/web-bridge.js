/**
 * Prompt+ Web Platform <-> Extension Sync Bridge (v2.1.3.1)
 * Enables zero-friction, bi-directional synchronization between the Prompt+ Web Platform and Extension.
 */
(function () {
  "use strict";

  const EXTENSION_VERSION = "2.1.3.1";

  // 1. Declare extension availability in the web page window context
  try {
    const script = document.createElement("script");
    script.textContent = `
      window.__PROMPT_PLUS_EXTENSION__ = {
        installed: true,
        version: "${EXTENSION_VERSION}",
        active: true,
        lastSeen: new Date().toISOString()
      };
      window.dispatchEvent(new CustomEvent("promptplus:extension_ready", {
        detail: { version: "${EXTENSION_VERSION}", timestamp: Date.now() }
      }));
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (err) {
    console.debug("[Prompt+ Bridge] Context injection note:", err);
  }

  // 2. Listen for window postMessage broadcasts from Next.js Web Platform
  window.addEventListener("message", (event) => {
    if (!event.data || typeof event.data !== "object") return;

    if (event.data.source === "promptplus_web") {
      const { type, user, quota, savedBlocks, recentPrompts } = event.data;

      if (type === "SESSION_UPDATE" || type === "SYNC_TRIGGER") {
        try {
          if (chrome?.runtime?.sendMessage) {
            chrome.runtime.sendMessage(
              {
                action: "saveSessionFromWeb",
                user,
                quota,
                savedBlocks,
                recentPrompts,
                version: EXTENSION_VERSION,
                syncedAt: new Date().toISOString(),
              },
              (response) => {
                if (response?.success) {
                  // Notify web page of successful bridge acknowledgement
                  window.postMessage(
                    {
                      source: "promptplus_extension",
                      type: "SESSION_SYNC_ACK",
                      version: EXTENSION_VERSION,
                      synced: true,
                    },
                    "*"
                  );
                }
              }
            );
          }
        } catch {
          // Ignore context invalidation
        }
      }
    }
  });

  // 3. Listen for manual custom sync events dispatched by React components
  window.addEventListener("promptplus:request_sync", () => {
    try {
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: "syncAuth" }, (response) => {
          window.dispatchEvent(
            new CustomEvent("promptplus:sync_response", { detail: response })
          );
        });
      }
    } catch {}
  });

  // 4. Initial heartbeat sync on DOM content loaded
  function performInitialSync() {
    try {
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: "syncAuth" }, (res) => {
          if (res?.authenticated && res?.user) {
            console.debug(`[Prompt+ Bridge] Extension v${EXTENSION_VERSION} synced for ${res.user.name || res.user.email}`);
          }
        });
      }
    } catch {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", performInitialSync);
  } else {
    performInitialSync();
  }
})();
