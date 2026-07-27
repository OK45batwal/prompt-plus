const API_URLS = [
  "https://prompt-plus-three.vercel.app/api/v1/prompts/enhance-ai",
  "http://localhost:3000/api/v1/prompts/enhance-ai",
];

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Prompt+] Extension installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "enhancePrompt") {
    (async () => {
      for (const url of API_URLS) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: request.text, model: request.model || "gpt-4o-mini" }),
            signal: AbortSignal.timeout(15000),
          });
          if (!res.ok) continue;
          const data = await res.json();
          sendResponse({ success: true, data });
          return;
        } catch {
          continue;
        }
      }
      sendResponse({ success: false, error: "Could not reach Prompt+ API. Make sure the app is running or you're online." });
    })();
    return true;
  }
});
