// Prompt+ Sentry Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Prompt+ Sentry Extension] Installed successfully.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "enhancePrompt") {
    // Send request to local or remote Prompt+ API
    fetch("http://localhost:3000/api/v1/prompts/enhance-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: request.text,
        model: request.model || "gpt-4",
      }),
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});
