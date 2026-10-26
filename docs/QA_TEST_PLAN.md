# Prompt+ Quality Assurance & Test Plan

**Date:** October 26, 2026  
**QA Lead & Security Engineer:** Senior QA Lead & Application Security Engineer  
**Coverage Target:** Unit, Integration, Extension Platform Adapters, Security Gates, Accessibility, and Intent Benchmarks.

---

## 1. QA Strategy & Test Automation Architecture

The Prompt+ quality assurance framework enforces a multi-tiered defense against functional regressions, security misconfigurations, and intent degradation:

```
┌─────────────────────────────────────────────────────────────┐
│                 PROMPT+ QA PYRAMID                           │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Static Gates (Honesty, API security, Typescript)  │
│  Layer 2: Unit & Heuristic Tests (37 Vitest suites)          │
│  Layer 3: Intent & Constraint Preservation Benchmark         │
│  Layer 4: Extension Platform Adapter Matrix (6 DOM adapters) │
│  Layer 5: End-to-End User Journeys (Playwright E2E)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Test Execution Commands & CI Targets

| Test Target | CLI Command | Frequency | Pass Criteria |
|---|---|---|---|
| **API Route Security Gate** | `npm run check-routes` | Pre-commit & CI | 100% v1/v2 routes wrapped with `withAuth` or marked `@public-route` |
| **Honesty & Anti-Fabrication Gate** | `node scripts/check-honesty.mjs` | Pre-commit & CI | 0 unverified claims, dead models, or invented metrics |
| **Core Vitest Suite & Benchmarks** | `npm test` | Every commit | 37 suites, 258+ tests passing |
| **Extension DOM Adapter Checks** | `npm run test:extension` | Pre-extension release | 138/138 structural and adapter assertions pass |
| **Environment Readiness** | `npm run check-env` | Pre-deploy | Required secrets present, valid format & length |
| **Production Build** | `npm run build` | Deployment pipeline | Clean compilation with zero warnings or errors |
| **End-to-End Browser Flow** | `npm run test:e2e` | Nightly / Pre-launch | Full studio flow, side panel injection, auth sign-in |

---

## 3. Test Coverage Matrix by Functional Area

### 3.1 Prompt Transformation & IR Validation
* **Target Files:** `src/lib/prompt-engine/*`, `src/__tests__/prompt-engine.test.ts`, `src/__tests__/loop-engine.test.ts`
* **Test Cases Covered:**
  - IR parsing from raw unstructured text into typed sections (Objective, Instructions, Constraints, Context, Output).
  - Validation engine detecting missing goals, conflicting instructions, and excessive verbosity.
  - Heuristic repair engine auto-injecting structure, removing conversational filler (`"Sure, I can assist you with that..."`), and tagging boundary rules.
  - Convergence guarantees: Loop engine converges in $\le 3$ cycles and never degrades the initial structural score.

### 3.2 Authorization & User-Data Isolation
* **Target Files:** `src/lib/api/with-auth.ts`, `src/__tests__/auth-routes.test.ts`, `src/__tests__/session-hardening.test.ts`
* **Test Cases Covered:**
  - Unauthenticated access returns `401 Unauthorized` with structured JSON error.
  - Cross-tenant data isolation: Prompts, API keys, and collections queried with mandatory `where: { userId }`.
  - Global session revocation: Password changes or "Sign Out Everywhere" increments `authVersion`; active JWTs with stale versions are immediately rejected.
  - Cascade account erasure: Deleting an account wipes prompts, versions, API keys, usage logs, and analytics.

### 3.3 Security-Sensitive Failure Modes & Abuse Defense
* **Target Files:** `src/lib/crypto.ts`, `src/lib/rate-limit.ts`, `src/__tests__/security.test.ts`, `src/__tests__/rate-limit-redis.test.ts`
* **Test Cases Covered:**
  - `ENCRYPTION_KEY` validation: Rejects weak/missing keys in production.
  - Masked key hints: Database returns only masked hints (`sk-ant-...wxyz`); plaintext is never exposed.
  - Sliding-window rate limiting: Enforces IP-based limits (120/hr on extension public endpoint, 60/min on optimize) and returns `429 Too Many Requests` with RFC `Retry-After` headers.
  - Secret scanning: Detection of exposed AWS, OpenAI, Anthropic, and private SSH keys inside user input prompt text.

### 3.4 Browser Extension Platform Adapters
* **Target Platforms:** ChatGPT (`chatgpt.com`), Claude (`claude.ai`), Gemini (`gemini.google.com`), DeepSeek (`chat.deepseek.com`), Grok (`grok.com`), Perplexity (`perplexity.ai`).
* **Test Cases Covered (`extension/test-plan.js`):**
  - DOM selector detection for composer input wrappers.
  - Native prototype descriptor setters for React 18/19 controlled textarea value updates.
  - Context extraction from visible message bubbles without scraping external browser state.
  - Token runway computation against platform-specific model context ceilings.

---

## 4. Empirical Prompt Benchmark Suite

The automated benchmark suite (`src/__tests__/prompt-benchmark.test.ts`) runs across diverse real-world task categories:

| ID | Task Category | Input Complexity | Mandatory Constraints Tested | Pass Criteria |
|---|---|---|---|---|
| `coding-pagination` | Coding | High | `python`, `paginated`, `rate limits`, `backoff`, `requests` | Preserves all constraints; score delta $\ge 0$; zero boilerplate conversational intro |
| `writing-security-exec` | Writing | Medium | `executive summary`, `Q3`, `SOC2`, `board`, `300 words` | Preserves 300-word ceiling and board persona; no invented stats |
| `research-db-comparison` | Research | High | `Postgres`, `ClickHouse`, `IoT`, `500k`, `table`, `recommendation` | Enforces structured comparison table contract |
| `data-pandas-cleaning` | Data Analysis | Medium | `pandas`, `dataframe`, `missing timestamps`, `deduplicate`, `hourly active users` | Preserves logic sequence; no placeholder comments |
| `workflow-auth-migration` | General | High | `2-week`, `Auth0`, `Auth.js`, `zero`, `downtime`, `rollback` | Enforces rollback checkpoints and zero-downtime requirement |

---

## 5. Accessibility & Responsive Layout Verification

| Check Item | Requirement | Verification Method |
|---|---|---|
| **Contrast Ratios** | Primary text $\ge 4.5:1$ on light (`#fafafa`) and dark (`#09090b`) | Automated CSS token audit & dark theme overrides |
| **Keyboard Navigation** | All inputs, tabs, and modals navigable via `Tab`, `Arrow`, `Enter`, `Escape` | `handleTabKeyDown` in studio result tabs |
| **Screen Reader Landmarks** | ARIA live announcements for async operations | `role="status"`, `aria-live="polite"`, `aria-label` on icon buttons |
| **Mobile Ergonomics** | Viewport responsive down to 320px width without horizontal scroll | Flex-wrap layouts and responsive grid breakpoints |
