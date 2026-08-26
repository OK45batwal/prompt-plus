# Contributing to Prompt+

Thank you for your interest in contributing to **Prompt+**! We welcome contributions from developers, researchers, and prompt engineers of all experience levels.

---

## 🌟 How You Can Contribute

- **🤖 AI Engine & Enhancers**: Add new prompt optimization heuristics, model adapters (e.g. Mistral, DeepSeek), or scoring metrics in `src/lib/engine/`.
- **💻 Web Application & Dashboard**: Enhance dashboard pages, components, analytics visualizations, and library management in `src/app/(dashboard)/`.
- **🧩 Chrome Extension**: Improve web-wide prompt injection, bubble UX, keyboard triggers, and background sync in `extension/`.
- **🔒 Security & API Architecture**: Strengthen encryption, token security, rate limiting, and API endpoints in `src/app/api/v1/`.
- **🧪 Testing & QA**: Expand test coverage in `src/__tests__/` with unit and integration tests.

---

## 🚀 Development Setup

### 1. Fork & Clone
1. Fork the repository: [https://github.com/OK45batwal/prompt-plus](https://github.com/OK45batwal/prompt-plus)
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/prompt-plus.git
   cd prompt-plus
   ```

### 2. Install Dependencies & Setup Environment
1. Install project dependencies:
   ```bash
   npm install
   ```
2. Setup environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Generate Prisma Client bindings:
   ```bash
   npx prisma generate
   ```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build Chrome Extension
```bash
npm run build:extension
```
Load the `extension/` folder in Chrome at `chrome://extensions` with Developer Mode enabled.

---

## 🧪 Testing & Validation

Before submitting your pull request, make sure all tests and build checks pass:

```bash
# Run unit & integration test suites
npm test

# Run Next.js production build check
npm run build

# Run linting check
npm run lint
```

---

## 📝 Commit & Branch Conventions

We follow Conventional Commits:

- `feat:` A new feature (e.g. `feat(api-keys): add cross-device hint masking`)
- `fix:` A bug fix (e.g. `fix(history): resolve soft-delete cascade`)
- `docs:` Documentation updates (e.g. `docs: add contributing guide`)
- `refactor:` Code improvements without behavioral changes
- `test:` Adding or modifying tests
- `perf:` Performance optimizations

Branch naming format: `feat/feature-name` or `fix/issue-description`.

---

## 🤝 Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Implement your changes with corresponding test coverage.
3. Verify that `npm test` passes completely.
4. Push your branch to GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```
5. Open a Pull Request on GitHub against `main` using our PR template.

Thank you for helping make Prompt+ the leading prompt engineering platform!
