# Prompt+ Browser Extension (Manifest V3) — v2.1.3.2

Enterprise-grade AI Prompt Compiler, Context Memory Bridge & Sub-30ms Optimizer for ChatGPT, Claude, Gemini, DeepSeek, and modern AI platforms.

## What's New in v2.1.3.2

- **Precision Glassmorphic UI**: Linear/Raycast-inspired dark theme with sharp SVG iconography and fluid layout.
- **Smart 3-Tier Execution Engine**:
  - **Cloud AI (`/api/v1/extension/enhance`)**: Multi-model routing across GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, DeepSeek-R1, and open-source models with BYOK key management.
  - **Turbo Local (`/api/v2/extension/optimize`)**: Sub-30ms offline algorithmic heuristic and Prompt IR synthesis.
  - **Gemini Nano (`On-Device`)**: Private, zero-latency local synthesis using Chrome's built-in `window.ai.languageModel` API.
- **Interactive Context Vault**: Custom project rules and specifications saved in `chrome.storage.local` with toggleable rule sets dynamically injected into every compiled master prompt.
- **Dynamic Blueprints Library**: Synchronized repository of enterprise prompt templates fetched from `/api/v1/extension/templates` with instant search and variable interpolation.
- **Efficient In-Page Automation (`content.js`)**: Debounced `MutationObserver` eliminates idle CPU overhead while attaching smoothly to chat inputs across 20+ supported AI platforms.
- **Bi-Directional Quota & Auth Sync**: Real-time integration with Prompt+ Web Studio via `web-bridge.js`.

## Quick Install

1. Open `chrome://extensions` in Google Chrome or Brave.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/` directory from this repository.
5. Open any supported platform (e.g. ChatGPT, Claude, Gemini, DeepSeek) and click the Prompt+ beacon or press `Cmd+Shift+P` / `Ctrl+Shift+P`.

## Extension Files

- `manifest.json`: Manifest V3 specification and permissions.
- `background.js`: Service worker with AES-256 Web Crypto encryption and intelligent endpoint dispatch.
- `content.js`: In-page floating trigger, context detector, and text injection bridge.
- `web-bridge.js`: Zero-friction communication bridge connecting the Next.js web application to the browser extension.
- `popup.html` & `popup.js`: High-density compiler popup studio.
