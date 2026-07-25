<p align="center">
  <img src="./public/logo.png" alt="Prompt+ Official Logo" width="460">
</p>

<p align="center">
  <h1 align="center">⚡ AI Prompt+</h1>
  <p align="center">Transform simple ideas into professional, high-performance, AI-optimized prompts</p>
</p>

<div align="center">
  <img src="./public/screenshots/dashboard-light.png" alt="AI Prompt+ Dashboard Hero Screenshot" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
</div>

<br/>

<!-- GitHub Badges -->
<p align="center">
  <a href="https://prompt-plus-three.vercel.app">
    <img src="https://img.shields.io/badge/Website-prompt--plus--three.vercel.app-22c55e?style=for-the-badge&logo=vercel&logoColor=white" alt="Website">
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

## ⚡ Prompt+ Architect 8-Step Enhancement Pipeline

Prompt+ transforms simple or incomplete inputs into production-grade prompts using an automated 8-step architectural pipeline:

| Step | Component | Description |
|---|---|---|
| **1. User Input** | Input Acquisition | Captures simple or raw user inputs (e.g. *"Create a portfolio website"*). |
| **2. Prompt Analysis** | Intent & Task NLP | Analyzes user intent, domain context, task classification, and complexity. |
| **3. Missing Info Detection** | Gap Auditor | Identifies missing elements: Role, Context, Constraints, Audience, Tone, Examples, Output Format. |
| **4. Meta-Prompt Generation** | Meta-Instruction Compiler | Formulates a hidden meta-instruction framework without altering original user intent. |
| **5. AI Model Processing** | Multi-Provider Engine | Dispatches original prompt + meta-instruction to selected LLM (GPT-4o, Claude 3.5, Llama 3.3, DeepSeek R1). |
| **6. Prompt Enhancement** | Architectural Rewrite | AI rewrites prompt into a structured framework with Role, Instructions, Constraints, and Input Variables. |
| **7. Quality Validation** | 6-Metric Audit | Validates prompt completeness, section boundaries, actionability, and structural integrity. |
| **8. Final Output** | Delivery & In-Page Injection | Displays enhanced prompt with options to Copy, Edit, Save, or Insert directly into ChatGPT, Claude, and Gemini. |

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
    <td><img src="./public/screenshots/dashboard-light.png" alt="Dashboard Light Mode" width="100%"/></td>
    <td><img src="./public/screenshots/dashboard-dark.png" alt="Dashboard Dark Mode" width="100%"/></td>
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
    <td><img src="./public/screenshots/new-prompt.png" alt="Prompt Builder Interface" width="100%"/></td>
    <td><img src="./public/screenshots/library.png" alt="Prompt Library Interface" width="100%"/></td>
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
    <td><img src="./public/screenshots/collections.png" alt="Collections Interface" width="100%"/></td>
    <td align="center"><img src="./public/screenshots/dashboard-mobile.png" alt="Mobile Dashboard View" width="70%"/></td>
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
| **Database & ORM** | Neon PostgreSQL + Prisma ORM 7 |
| **AI Providers** | OpenRouter (`Llama 3.3`, `DeepSeek R1`), OpenAI (`GPT-4o`), Anthropic (`Claude 3.5`) |
| **Testing** | Vitest Runner (37 passing tests) |
| **Security** | AES-256-GCM encryption + Request ID tracing + CSRF validation |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/OK45batwal/Prompt-plus.git
cd Prompt-plus
npm install
```

### 2. Database Setup & Dev Server

```bash
# Set a Postgres connection string in .env (DATABASE_URL)
npx prisma migrate dev
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
