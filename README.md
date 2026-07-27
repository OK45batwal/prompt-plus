<p align="center">
  <h1 align="center">⚡ Prompt+</h1>
  <p align="center">Transform simple ideas into professional, high-performance, AI-optimized prompts</p>
</p>

<p align="center">
  <a href="https://prompt-plus-three.vercel.app">
    <img src="https://img.shields.io/badge/Website-prompt--plus--three.vercel.app-22c55e?style=for-the-badge&logo=vercel&logoColor=white" alt="Website">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License: MIT">
  </a>
</p>

<p align="center">
  <a href="#features">Key Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#extension">Chrome Extension</a>
</p>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 **Prompt Enhancement** | 8-step architectural pipeline that transforms raw inputs into structured, production-grade prompts |
| 🔌 **Chrome Extension** | FAB + side panel on ChatGPT, Claude, Gemini — analyze, enhance, copy, replace inline |
| 🦙 **7 Free OpenRouter Models** | Llama 3.3 70B, Gemini 2.0 Flash, DeepSeek R1, Qwen 2.5 Coder, Mistral Small, Phi-3 Mini, Hermes 3 405B |
| 🖥️ **NVIDIA Free Models** | Llama 3.3 70B (NV), Nemotron 70B, Gemma 2 27B, Mistral 7B — via NVIDIA API |
| 🔐 **Encrypted API Keys** | AES-256-GCM server encryption + localStorage persistence per provider |
| 📊 **Analytics Dashboard** | Daily/monthly usage tracking, progress bars, average scores |
| 🎯 **6-Dimension Scoring** | Evaluation across Clarity, Specificity, Structure, Context, Constraints, Actionability |
| 📚 **Library & Collections** | Save, search, filter, and organize prompts into collections |
| 🌓 **Dark / Light Theme** | System preference sync with manual toggle |
| 🔑 **OAuth Ready** | Google & GitHub login (configure env vars to enable) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Core Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Authentication** | NextAuth.js v5 (JWT + Bcrypt) |
| **Database** | PostgreSQL + Prisma ORM |
| **AI Providers** | OpenRouter, NVIDIA, OpenAI, Anthropic |
| **Testing** | Vitest |
| **Security** | AES-256-GCM encryption, Rate limiting |
| **Extension** | Manifest V3 Chrome extension |

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/OK45batwal/Prompt-plus.git
cd Prompt-plus
npm install
```

### 2. Database & Dev Server
```bash
# Copy .env.example to .env and fill in values
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Run Tests
```bash
npm test
```

---

## 🔌 Chrome Extension

The Prompt+ extension works on **ChatGPT**, **Claude**, and **Gemini**.

**Features:**
- **Sparkle FAB** — floating purple button near input fields
- **420px Side Panel** — prompt analysis (score, complexity, intent), 7 free OpenRouter models + NVIDIA models, suggestions, history, settings
- **Popup** — quick enhance with model selector + API key management

**Install:**
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder

---

## 📄 License

[MIT License](LICENSE)
