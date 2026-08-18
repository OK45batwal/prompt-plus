# Prompt+ Platform Roadmap — Web Studio & Extension v1.3.0 Improvements

A curated list of actionable, high-impact improvements for both the **Prompt+ Web Platform** and the **Chrome Extension (v1.3.0)**.

---

## 🌐 1. Web Application Improvements (`/dashboard`)

### A. Prompt Studio & Builder (`/dashboard/new`)
- [ ] **Live Side-by-Side Diff Viewer:** Visual split-screen showing line-by-line diffs between the original prompt idea and the enhanced master prompt.
- [ ] **Dynamic Variable Filler (`{{variable}}` Auto-Parser):** Detect `{{placeholder}}` variables in generated prompts and render interactive input fields so users can populate parameters before copying.
- [ ] **1-Click "Send to AI Chat" Action Buttons:** Direct launch buttons on output cards that open `ChatGPT`, `Claude`, `Gemini`, or `DeepSeek` in a new tab with the prompt pre-loaded.
- [ ] **Target Model Preset Selector:** Quick-select tabs (`GPT-4o`, `Claude 3.5 Sonnet`, `Gemini 2.0 Flash`, `DeepSeek-V3`) that automatically tune output formatting (e.g. Anthropic XML vs. OpenAI Markdown).

### B. Prompt Library & History (`/dashboard/history`)
- [ ] **Semantic Tag & Category Filters:** Filter saved prompts by domain tag, engine mode, model target, or quality score threshold.
- [ ] **Version Timeline & Revert Gate:** Visual history tree ($v1 \rightarrow v2 \rightarrow v3$) allowing users to compare versions and restore previous iterations.
- [ ] **Batch Library Export:** 1-click export of saved prompts to JSON, CSV, or Markdown bundles.

### C. Templates Studio (`/dashboard/templates`)
- [ ] **Custom User Template Creator:** Allow users to save their own high-performing prompts into a personal reusable template collection.
- [ ] **Interactive Template Playground:** Instant preview drawer with parameter inputs for all 20+ built-in templates.

---

## 🧩 2. Chrome Extension Improvements (`extension/`)

### A. In-Page AI Chat Injector (`content.js`)
- [ ] **Hovering In-Field Action Pill:** Render a sleek glass floating pill inside `ChatGPT`, `Claude`, `Gemini`, and `DeepSeek` input boxes with 1-click **"⚡ Enhance"** and **"📦 Carry Context"**.
- [ ] **Smooth Auto-Type Injection:** Automatically populate the target AI chat input box smooth-typing style after prompt enhancement.
- [ ] **Inline Spotsearch Overlay (`Cmd+Shift+P` / `Ctrl+Shift+P`):** Floating searchable prompt launcher that allows users to search their saved prompt library without leaving ChatGPT or Claude.

### B. Storage & Sync (`background.js`)
- [ ] **Offline Queue & Re-Sync:** Queue offline prompt enhancements in `chrome.storage.local` and sync with the web dashboard as soon as connectivity resumes.
- [ ] **Custom Theme Switcher:** Allow extension users to toggle between OLED Dark (`#09090b`), Glassmorphism, and Modern Light themes inside the popover settings.

---

## 📊 Priority Matrix

| Feature | Impact | Effort | Target Scope |
| :--- | :--- | :--- | :--- |
| **1-Click "Send to AI Chat" Buttons** | 🌟🌟🌟🌟🌟 High | 🟢 Low | Web + Extension |
| **Dynamic Variable Filler (`{{variable}}`)** | 🌟🌟🌟🌟🌟 High | 🟡 Medium | Web Studio |
| **In-Page Hovering Action Pill** | 🌟🌟🌟🌟🌟 High | 🟡 Medium | Chrome Extension |
| **Side-by-Side Diff Viewer** | 🌟🌟🌟🌟 Medium | 🟢 Low | Web Studio |
| **Inline Spotsearch Overlay (`Cmd+Shift+P`)** | 🌟🌟🌟🌟 Medium | 🟡 Medium | Chrome Extension |
