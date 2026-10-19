# Prompt+ Browser Extension (Manifest V3) — v2.1.6

Enhance a prompt, review the change, then insert it — plus a visible-message token estimate, a prompt history and a launcher for eight AI sites.

## What it does

### 1. Enhance, review, insert
- The **Instant** engine runs on your device: no network call, no API key, works offline.
- **Cloud key** uses your own saved API key. **Chrome AI** uses the browser's built-in model when the build provides it.
- The result is shown as a diff with the measured token change before you accept it. Insert it into the active chat, or copy it.

### 2. Visible conversation token estimates
- Counts visible DOM messages with a lightweight approximate tokenizer; hidden/system context is excluded.
- Shows per-role estimates, turn count and largest visible turn.
- Chat-product capacity is unknown; legacy adapter API limits are not treated as confirmed chat limits. Remaining-token/exchange claims are disabled until a limit is verified, and the UI says so instead of guessing.
- Minimal counters survive service-worker restarts in session storage. Raw conversation text is not persisted in that state.

### 3. In-page dock
- Sits directly under the composer on supported sites: enhance in place, a live usage readout, three quick tones, and one button that opens the full panel. It does not float and cannot be dragged, and it never covers the input, the attachment tray or the host's own controls.
- **Context** saves the visible messages of the current chat and inserts them into another chatbot's input, after the same review step used for enhancements. Only text visible in the page is copied; attachments and files are not. The saved copy stays in this browser.
- The popup's **Context** tab moves that same saved copy: save on the chat you are reading, open the other chatbot, then insert it there.

### 4. Cross-platform launcher (8 platforms)
- ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot, and Meta AI.
- "Open in all" opens the listed platforms with the compiled prompt.

### 5. Connection health
- The indicator starts at **Not checked** and then reports Connected, Degraded or Offline with measured latency. It does not claim health it has not measured.

### 6. Prompt history
- Last 20 compiled prompts with the original snippet, tone, structure score, and time. One-click **Load** to restore one.

---

## Quick install

1. Open `chrome://extensions` in Google Chrome or Brave.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/` directory from this repository.
5. Open a supported AI site (e.g. [ChatGPT](https://chatgpt.com), [Claude](https://claude.ai), [Gemini](https://gemini.google.com), [DeepSeek](https://chat.deepseek.com)) to see the dock and the popup.

## Verification

Run `npm run test:extension` for structural checks and `npm run test:extension:e2e` for Chromium fixtures covering insertion, worker restarts and navigation cleanup. Use `node scripts/package-extension.mjs --output-dir /tmp/prompt-plus-release` to validate a standalone ZIP. Manual tests on current live chatbot pages are still required before release.
