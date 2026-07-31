# Prompt+ Browser Extension (Manifest V3)

Enhance prompts directly inside ChatGPT, Claude, and Gemini.

## Features

- **Sparkle FAB** — floating button appears near input fields on ChatGPT, Claude, Gemini
- **420px Side Panel** — original/enhanced preview with structured ROLE / CONTEXT / INSTRUCTIONS / CONSTRAINTS sections, token saver, model selector, copy/apply
- **Two enhancement modes**:
  - **On-Device (Gemini Nano)** — free, private, offline via Chrome Prompt API (Chrome 138+)
  - **API Based** — cloud enhancement via OpenRouter free models, NVIDIA, or direct OpenAI/Anthropic keys
- **Popup** — mode toggle + API key management

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Visit ChatGPT, Claude, or Gemini

## Architecture

- `content.js` — injects FAB and side panel UI
- `background.js` — service worker; runs on-device Gemini Nano enhancement, routes API requests to the Prompt+ API
- `popup.html` / `popup.js` — quick-enhance popup with mode toggle, API key + model selector
