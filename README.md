<p align="center">
  <img src="./public/logo.png" alt="Prompt+ Official Logo" width="460">
</p>

<p align="center">
  <h1 align="center">⚡ AI Prompt+</h1>
  <p align="center">Transform simple ideas into professional, high-performance, AI-optimized prompts</p>
</p>

<div align="center">
  <img src="https://raw.githubusercontent.com/OK45batwal/Prompt-plus/main/public/screenshots/dashboard-light.png" alt="AI Prompt+ Dashboard Hero Screenshot" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
</div>

<br/>

<!-- GitHub Badges -->
<p align="center">
  <a href="https://prompt-plus-three.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-https%3A%2F%2Fprompt--plus--three.vercel.app-22c55e?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo">
  </a>
  <a href="https://github.com/OK45batwal/Prompt-plus/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/OK45batwal/Prompt-plus/ci.yml?branch=main&style=for-the-badge&logo=github&label=Build%20%26%20CI" alt="CI Status">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License: MIT">
  </a>
  <a href="docs/README.md">
    <img src="https://img.shields.io/badge/Docs-15%20Specs-purple?style=for-the-badge&logo=markdown&logoColor=white" alt="Documentation Specs">
  </a>
</p>

<p align="center">
  <a href="#features">Key Features</a> •
  <a href="#screenshots">Screenshots & Showcase</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="docs/README.md">Documentation Center</a> •
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 **Context Memory Engine** | Reusable project stack rules (`Next.js 16 + Tailwind`, `FastAPI`, `Code Reviewer`) injected into prompts |
| ⏱️ **Real-Time Cost Counter** | Live token estimator (`tiktoken`) & pre-execution cost comparison ($) across GPT-4o, Claude 3.5 & OpenRouter |
| 🦙 **OpenRouter Free Models** | Seamless support for `Llama 3.3 70B`, `Gemini 2.0 Flash`, `DeepSeek R1`, and `Qwen 2.5 Coder` |
| 🔐 **Encrypted API Keys** | AES-256-GCM server encryption + instant `localStorage` client persistence for OpenRouter, OpenAI & Anthropic |
| 📊 **Analytics Dashboard** | Real-time tracking of request volumes, average latency (ms), token usage, and model distribution |
| 🎯 **6-Dimension Scoring** | Real-time LLM evaluation across Clarity, Specificity, Structure, Context, Constraints, and Actionability |
| 📚 **Library & Collections** | Save, search, filter, and organize prompts into structured topic collections |
| 🌓 **Dark / Light Theme** | High-contrast dark and light themes with system preference sync |

---

## 🖼️ Screenshots & Interface Showcase

<div align="center">

### ☀️ Light Mode vs 🌙 Dark Mode
<table width="100%">
  <tr>
    <td width="50%" align="center"><b>☀️ Light Theme Dashboard</b></td>
    <td width="50%" align="center"><b>🌙 Dark Theme Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/OK45batwal/Prompt-plus/main/public/screenshots/dashboard-light.png" alt="Dashboard Light Mode" width="100%"/></td>
    <td><img src="https://raw.githubusercontent.com/OK45batwal/Prompt-plus/main/public/screenshots/dashboard-dark.png" alt="Dashboard Dark Mode" width="100%"/></td>
  </tr>
</table>

<br/>

### 🛠️ Prompt Builder & 📚 Library Management
<table width="100%">
  <tr>
    <td width="50%" align="center"><b>⚡ Prompt Builder & Context Memory</b></td>
    <td width="50%" align="center"><b>📚 Prompt Library</b></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/OK45batwal/Prompt-plus/main/public/screenshots/new-prompt.png" alt="Prompt Builder Interface" width="100%"/></td>
    <td><img src="https://raw.githubusercontent.com/OK45batwal/Prompt-plus/main/public/screenshots/library.png" alt="Prompt Library Interface" width="100%"/></td>
  </tr>
</table>

<br/>

### 📁 Collections & 📱 Mobile View
<table width="100%">
  <tr>
    <td width="50%" align="center"><b>📁 Topic Collections</b></td>
    <td width="50%" align="center"><b>📱 Mobile Responsive View</b></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/OK45batwal/Prompt-plus/main/public/screenshots/collections.png" alt="Collections Interface" width="100%"/></td>
    <td align="center"><img src="https://raw.githubusercontent.com/OK45batwal/Prompt-plus/main/public/screenshots/dashboard-mobile.png" alt="Mobile Dashboard View" width="70%"/></td>
  </tr>
</table>

</div>

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Core Framework** | [Next.js 16](https://nextjs.org) (App Router & Turbopack) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS v4 + Lucide Icons |
| **Authentication** | NextAuth.js v5 (JWT + Bcrypt hashing) |
| **Database & ORM** | Neon PostgreSQL / SQLite + Prisma ORM 7 |
| **AI Providers** | OpenRouter (`Llama 3.3`, `DeepSeek R1`), OpenAI (`GPT-4o`), Anthropic (`Claude 3.5`) |
| **Testing** | Vitest Runner (45 passing tests) |
| **Security** | AES-256-GCM encryption + Request ID tracing + CSRF validation |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/OK45batwal/Prompt-plus.git
cd Prompt-plus/prompt-plus
npm install
```

### 2. Database Push & Dev Server

```bash
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch the web dashboard.

### 3. Run Automated Test Suite

```bash
npm test
```

---

## 📚 Documentation Center

For deep-dive architectural specifications, database schemas, and workflows, explore the [docs/](docs/README.md) directory:

- 🏗️ **[Architecture](docs/ARCHITECTURE.md)** — System architecture & API design patterns
- 🗄️ **[Database Specification](docs/DATABASE.md)** — Prisma ORM models & Neon PostgreSQL schema
- 🧩 **[Component Hierarchy](docs/COMPONENT-HIERARCHY.md)** — UI component tree & Shadcn layout composition
- 🧭 **[Navigation Map](docs/NAVIGATION.md)** — Route hierarchy & navigation maps
- 🎨 **[UI Visual Audit Report](docs/UI-REVIEW.md)** — 6-Pillar visual audit & WCAG accessibility review
- ⚡ **[Engineering Backlog](docs/Improvements.md)** — Roadmap and architectural improvements checklist

Check out the complete **[Documentation Index](docs/README.md)** for all 15 specification guides.

---

## 🤝 Contributing

Contributions are welcome! Please view [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, code formatting rules, and pull request workflows.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
