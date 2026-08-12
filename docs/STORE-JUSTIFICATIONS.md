# Chrome Web Store - CWS Resubmission Package & Permission Justifications (v1.1.2)

> **CWS Violation Resolution (Yellow Argon / Keyword Spam):**  
> All third-party brand names ("ChatGPT", "Claude", "Gemini", "DeepSeek", "Grok", "Perplexity") have been completely removed from extension metadata, store descriptions, and permission justification texts.

---

## 1. Store Metadata & Descriptions

### Short Description (Max 132 chars)
```text
Transform simple text into structured, high-performing AI instructions directly within web chat interfaces.
```

### Detailed Store Description (Console Submission Text)
```text
Prompt+ Architect AI is a professional prompt engineering and optimization tool that transforms raw, simple prompts into production-grade AI instructions.

Key Features:
• Multi-Candidate Optimization: Generates concise, structured, comprehensive, and model-tuned prompt candidates.
• PromptIR & Intent Extraction: Automatically detects task intent, complexity, and domain rules to structure instructions cleanly.
• Security & Privacy Scan: Detects potential secrets, credentials, or sensitive data before sending prompts.
• On-Device & Cloud AI Modes: Supports offline local prompt enhancement via Chrome Prompt API or high-performance cloud AI optimization.
• Context Memory: Save and insert custom brand guidelines, system constraints, or role personas into any prompt with one click.
• Side-by-Side Model Comparison: Test and grade prompts across multiple AI engines simultaneously.

Single Purpose Statement:
Prompt+ Architect AI has the single purpose of optimizing, structuring, and enhancing AI prompts directly inside web-based chat interfaces.
```

---

## 2. API Permission Justifications

### Permission: `storage`
* **Console Text:**
```text
The storage permission is required to save user preferences locally, including the selected prompt enhancement engine (On-Device vs API mode), user-defined model parameters, and saved custom API keys. No personal data is transmitted.
```

### Permission: `activeTab`
* **Console Text:**
```text
The activeTab permission allows the extension to detect active prompt input fields on the user's active tab when triggered via context menu or keyboard shortcuts, enabling the inline insertion of enhanced prompt text.
```

### Permission: `contextMenus`
* **Console Text:**
```text
The contextMenus permission is used to create a right-click context menu entry ("Enhance Prompt with Prompt+"), allowing users to quickly send selected text to the enhancement engine directly from any page.
```

### Permission: `cookies`
* **Console Text:**
```text
The cookies permission is exclusively used to read the authentication session token from our web application domain (https://prompt-plus-three.vercel.app) to verify the user's logged-in status and account tier.
```

---

## 3. Host Permissions Justification

**Field:** Justification for Host Permissions  
**Console Text (100% Brand-Keyword-Free):**
```text
Host permissions are strictly limited to web-based AI assistant interfaces and our backend domain (prompt-plus-three.vercel.app):

1. Web AI Chat Interfaces: Required to inject the non-intrusive floating action button and inline side-panel UI next to prompt input textareas on supported web AI tools.

2. Backend Domain (prompt-plus-three.vercel.app): Required to route prompt enhancement requests to the optimization engine and synchronize saved context templates.
```

---

## 4. Remote Code Disclosure

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
