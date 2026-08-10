# Chrome Web Store - Single Purpose & Permission Justifications

This document contains the exact text required for the **Privacy** and **Permissions Justification** tabs in the Chrome Web Store Developer Console for **Prompt+ Architect AI**.

---

## 1. Single Purpose Description

**Field:** Single Purpose Description  
**Text:**
```text
Prompt+ Architect AI has the single purpose of optimizing, structuring, and enhancing AI prompts directly inside web-based chat interfaces.
```

---

## 2. API Permission Justifications

### Permission: `storage`
* **Why is it needed?**
  * Required to locally store user preferences, selected enhancement mode (On-Device Nano vs Cloud API), theme settings, and saved API keys in Chrome's sync/local storage.
* **Console Text:**
```text
The storage permission is required to save user preferences locally, including the selected prompt enhancement engine (On-Device Gemini Nano vs API mode), user-defined model parameters, and saved custom API keys. No personal data is transmitted.
```

### Permission: `activeTab`
* **Why is it needed?**
  * Allows the extension to interact with the currently active web tab when the user clicks the extension action icon or triggers context menu commands.
* **Console Text:**
```text
The activeTab permission allows the extension to detect active prompt input fields on the user's active tab when triggered via context menu or keyboard shortcuts, enabling the inline insertion of enhanced prompt text.
```

### Permission: `contextMenus`
* **Why is it needed?**
  * Adds the "Enhance Prompt with Prompt+" right-click context menu item so users can highlight text or right-click any prompt input box to enhance it instantly.
* **Console Text:**
```text
The contextMenus permission is used to create a right-click context menu entry ("Enhance Prompt with Prompt+"), allowing users to quickly send selected text to the enhancement engine directly from any page.
```

### Permission: `cookies`
* **Why is it needed?**
  * Required to check user session authentication state with the official Prompt+ web app (`https://prompt-plus-three.vercel.app`) to verify account status and active subscriptions.
* **Console Text:**
```text
The cookies permission is exclusively used to read the authentication session token from our web application domain (https://prompt-plus-three.vercel.app) to verify the user's logged-in status and account tier.
```

---

## 3. Host Permissions Justification

**Field:** Justification for Host Permissions  
**Console Text:**
```text
Host permissions are strictly limited to supported web chat interfaces (ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot) and our backend service (prompt-plus-three.vercel.app):

1. Web AI Interfaces (chatgpt.com, claude.ai, gemini.google.com, etc.): Required to inject the non-intrusive floating action button and inline side-panel UI next to prompt input boxes.

2. Backend Domain (prompt-plus-three.vercel.app): Required to route prompt enhancement requests to the cloud AI optimization engine and sync prompt templates.
```

---

## 4. Remote Code & Content Security Policy Disclosure

* **Does your extension use remote code?** Select **NO**.
* **Justification / Explanation:**
```text
All extension code is completely self-contained within the extension bundle (Manifest V3 service worker and injected content scripts). No external or remote JavaScript is fetched or evaluated at runtime.
```

---

## 5. Data Usage / Privacy Practices Disclosure

* **Data Collected:** 
  * *User Activity / Website Content:* Only the prompt text typed or selected by the user when they explicitly click "Enhance".
  * *Authentication Info:* Session tokens used to verify subscription state.
* **Data Use:** Strictly used to perform the core prompt enhancement functionality requested by the user.
* **Data Sharing:** Data is never sold, traded, or shared with third parties. Prompt text is processed in-memory and sent directly to the designated AI enhancement API.
