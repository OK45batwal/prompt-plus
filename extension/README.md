# Prompt+ Browser Extension (Manifest V3) — v3.0.0

Enterprise-grade AI Prompt Compiler, Live Context Runway, Real-Time Token Tracker & Multi-AI Launcher for ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot, and Meta AI.

## Major Innovations in v3.0.0

### 1. Visible conversation token estimates
- Counts visible DOM messages with a lightweight approximate tokenizer; hidden/system context is excluded.
- Shows per-role estimates, turn count and largest visible turn.
- Chat-product capacity is unknown; legacy adapter API limits are not treated as confirmed chat limits. Remaining-token/exchange claims and threshold notifications are disabled until a limit is verified.
- Minimal counters and alert metadata survive service-worker restarts in session storage. Raw conversation text is not persisted in that state.

### 2. Button & Floating Trigger Overhaul
- **Animated Loading State**: Master Enhance button displays shimmer gradient sweep and elapsed timer counter (`Compiling... 1.2s`).
- **Dynamic Mode-Aware Labels**: Button text reflects execution mode (`⚡ Compile via Cloud AI`, `⚡ Turbo Local IR`, `⚡ Gemini Nano`).
- **Tactile State Transitions**: Spring-scale bounce on click, green success checkmark on completion, error shake on failure.
- **Draggable Floating Trigger**: Persistent custom position stored in local storage, live token badge in the pill, and platform-tailored accent colors.

### 3. Cross-Platform AI Launcher (8 Platforms)
- Expanded from 4 to **8 AI platforms**: ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, Copilot, and Meta AI.
- Dedicated brand color accents and active tab presence indicators (green dot if that AI tab is already open).
- **"Send to All" Dispatcher**: Opens primary platforms simultaneously with your compiled master prompt.

### 4. Enterprise Connection Health System
- **Real-Time Heartbeat**: Regular background telemetry pings `/api/health` with round-trip latency tracking.
- **Measured Health Indicator**: starts Not checked, then reports Connected, Degraded or Offline with measured latency.
- **Manual Ping & Force Sync**: In-popup diagnostic controls to test cloud latency and reconcile user session data instantly.

### 5. Prompt History Timeline
- Persistent chronological record of the last 20 compiled prompts with original snippet, tone, quality score, and timestamp.
- One-click "Load" button to restore any previous compilation directly into the compiler.

---

## Quick Install

1. Open `chrome://extensions` in Google Chrome or Brave.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/` directory from this repository.
5. Navigate to any supported AI platform (e.g. [ChatGPT](https://chatgpt.com), [Claude](https://claude.ai), [Gemini](https://gemini.google.com), [DeepSeek](https://chat.deepseek.com)) to see the **Context Runway Bar** and Prompt+ trigger in action!

## Verification

Run `npm run test:extension` for structural checks and `npm run test:extension:e2e` for Chromium fixtures covering insertion, worker restarts and navigation cleanup. Use `node scripts/package-extension.mjs --output-dir /tmp/prompt-plus-release` to validate a standalone ZIP. Manual tests on current live chatbot pages are still required before release.
