<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/screenshots/dashboard-dark.png">
  <img src="/screenshots/dashboard-light.png" alt="AI Prompt+ Dashboard" width="100%">
</picture>

<p align="center">
  <h1 align="center">⚡ AI Prompt+</h1>
  <p align="center">Transform simple prompts into powerful, AI-optimized instructions</p>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#screenshots">Screenshots</a>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Prompt Builder** | Write, analyze, and enhance prompts with AI-powered suggestions |
| **Library** | Save, search, and manage your prompt collection |
| **Collections** | Organize prompts by topic into curated collections |
| **Templates** | Start faster with ready-to-use prompt templates |
| **Compare** | Side-by-side comparison of original vs enhanced prompts |
| **Analytics** | Track your enhancement activity and scores |
| **Dark Mode** | Seamless light/dark theme toggle |

## 🖼️ Screenshots

| Light Mode | Dark Mode |
|:---:|:---:|
| ![Dashboard Light](/screenshots/dashboard-light.png) | ![Dashboard Dark](/screenshots/dashboard-dark.png) |
| **New Prompt** | **Library** |
| ![New Prompt](/screenshots/new-prompt.png) | ![Library](/screenshots/library.png) |
| **Collections** | **Mobile View** |
| ![Collections](/screenshots/collections.png) | ![Mobile Dashboard](/screenshots/dashboard-mobile.png) |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (Turbopack) |
| **Language** | TypeScript |
| **UI** | Tailwind CSS v4 + Base UI |
| **Database** | SQLite (via better-sqlite3) |
| **Icons** | Lucide Icons |
| **Theme** | next-themes |

## 🚀 Getting Started

```bash
git clone https://github.com/OK45batwal/Prompt-plus.git
cd ai-prompt-plus
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Seed Demo Data

```bash
npx prisma db push
./prisma/seed.sh
```

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & Signup pages
│   ├── (dashboard)/     # Dashboard layout & pages
│   └── api/v1/          # REST API routes
├── components/
│   ├── dashboard/        # Dashboard-specific components
│   └── ui/               # Reusable UI primitives
└── lib/
    └── db/               # Database layer
```

## 📄 License

[MIT](LICENSE)

---

<p align="center">
  Built with <a href="https://nextjs.org">Next.js</a>
</p>
