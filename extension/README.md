# Prompt+ Browser Extension (Manifest V3)

Enhance prompts directly inside ChatGPT, Claude, and Gemini.

## Features

- **Sparkle FAB** — floating purple button appears near input fields on ChatGPT, Claude, Gemini
- **420px Side Panel** — shows prompt analysis (score, complexity, intent), toggleable suggestions, model selector (OpenRouter free models + paid + NVIDIA), original/enhanced preview, Copy/Replace/Enhance, history, and settings
- **Popup** — quick enhance + API key management
- **Model selector** — 7 free OpenRouter models + 4 NVIDIA models

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Visit ChatGPT, Claude, or Gemini

## Architecture

- `content.js` — injects FAB and side panel UI
- `background.js` — service worker, routes enhance requests to the Prompt+ API
- `popup.html` / `popup.js` — quick-enhance popup with API key + model selector
