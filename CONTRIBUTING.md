# Contributing to Prompt+

Thank you for your interest in contributing to **Prompt+**! We welcome contributions from developers of all skill levels.

---

## 🚀 Quick Start Guide

### 1. Fork & Clone
1. Fork the repository on GitHub: `https://github.com/OK45batwal/prompt-plus`
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/prompt-plus.git
   cd prompt-plus
   ```

### 2. Environment & Dependencies
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
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

---

## 🧪 Testing & Validation

Before submitting a Pull Request, ensure all unit tests and builds pass cleanly:

```bash
# Run unit & integration test suite
npm test

# Run Next.js production build check
npm run build
```

---

## 📝 Commit Conventions

We follow the Conventional Commits specification:

- `feat:` New features (e.g., `feat(ui): add prompt tag filtering`)
- `fix:` Bug fixes (e.g., `fix(auth): resolve session expiration callback`)
- `refactor:` Code refactoring without behavioral changes
- `docs:` Documentation improvements
- `test:` Adding or updating tests

---

## 🤝 Pull Request Workflow

1. Create a descriptive topic branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes and verify with `npm test` and `npm run build`.
3. Commit your changes:
   ```bash
   git commit -m "feat(scope): detailed message"
   ```
4. Push to your fork and submit a Pull Request on GitHub!
