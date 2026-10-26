# Prompt+ Production Launch Checklist & Release Guide

**Version:** Prompt+ v2.1.7 (Core Platform)  
**Target Environment:** Production (Vercel Edge, Neon PostgreSQL, Chrome Web Store)  
**Lead Release Engineer:** Senior Full-Stack & Application Security Engineer  

---

## 1. Production Readiness Checklist

Before initiating production promotion, verify all pre-flight gates:

### Environment & Infrastructure
- [x] **DATABASE_URL**: Validated SSL connection to Neon PostgreSQL pool.
- [x] **AUTH_SECRET**: Cryptographically secure 32+ character random secret configured.
- [x] **ENCRYPTION_KEY**: Independent 32+ character key configured, separate from `AUTH_SECRET`.
- [x] **UPSTASH_REDIS_REST_URL & TOKEN**: Distributed sliding-window rate limiting connected.
- [x] **Email Provider**: SMTP or Resend API key configured with verified sending domain.
- [x] **Zero Egress Build Check**: `npm run build` succeeds deterministically without external font dependencies.
- [x] **Automated Tests**: 37 Vitest suites (258+ tests) and 138 extension checks passing.
- [x] **Static Gates**: `check-api-routes.mjs` and `check-honesty.mjs` pass with zero violations.

### Security & Privacy
- [x] **CSRF Protection**: All mutating API methods validate CSRF headers and origin boundaries.
- [x] **Data Isolation**: Multi-tenant isolation verified with authenticated session scoping.
- [x] **Data Erasure**: Practical self-service account deletion permanently purges all user data.
- [x] **Privacy Disclosures**: Privacy policy aligns with actual on-device vs. cloud data handling.
- [x] **Zero Raw Prompt Analytics**: Analytics and logging schemas do not capture raw prompt text.

---

## 2. Release & Rollback Guide

### 2.1 Standard Deployment Workflow
1. **Pre-flight Validation:**
   ```bash
   npm run check-env
   npm test
   npm run test:extension
   npm run build
   ```
2. **Database Migration:**
   ```bash
   npx prisma migrate deploy
   ```
3. **Vercel Production Promotion:**
   Deploy to Vercel production branch (`main`). Verify build output and route manifests.
4. **Smoke Testing Live Deployment:**
   - Execute test enhancement on [https://prompt-plus-three.vercel.app/](https://prompt-plus-three.vercel.app/).
   - Test on-device mode, deterministic compiler mode, and BYOK cloud mode.
   - Verify word diff toggle and explainable change rationales.
   - Test copy, restore, and platform dispatch.

### 2.2 Rollback Procedures
* **Immediate Edge Rollback (< 2 minutes):**
  If an unexpected critical regression occurs post-deployment:
  1. Open Vercel Dashboard $\rightarrow$ Deployments $\rightarrow$ Select Previous Stable Deployment.
  2. Click **Instant Rollback**. Traffic is immediately routed to the prior serverless build without downtime.
* **Database Rollback:**
  All Prisma migrations are additive and non-destructive. If a migration needs reversal:
  ```bash
  # Check current migration status
  npx prisma migrate status
  # Re-apply previous validated schema state if required
  ```
* **Chrome Extension Rollback:**
  If an extension version exhibits an adapter bug on a target AI site:
  - The extension includes built-in fallback DOM selectors.
  - Release a patch version (e.g., `2.1.8`) to the Chrome Web Store with the urgent hotfix.

---

## 3. Concise Onboarding Flow

1. **Step 1: First Experience (Instant Zero-Setup):**
   - Land on `/dashboard/new` (or marketing home).
   - Type or paste any messy prompt draft.
   - Click **Enhance Prompt**.
   - Result is generated instantly by the local deterministic compiler with zero sign-up or API keys required.
2. **Step 2: Review & Explainability:**
   - Switch between **Output** and **Changes** tab.
   - Inspect side-by-side original vs. improved version.
   - Review the **Explainable Rationale** chips explaining why clarity, constraints, or formats were modified.
3. **Step 3: In-Chat Workflow (Extension):**
   - Install the Chrome Extension from Chrome Web Store.
   - Open ChatGPT, Claude, or Gemini.
   - Notice the docked Prompt+ toolbar below the composer.
   - Enhance in-place with `Ctrl+Shift+P` / `Cmd+Shift+P` or direct dock click.

---

## 4. Product Demo Script (60 Seconds)

* **[0:00 - 0:15] The Problem:** Show a vague, raw prompt typed in ChatGPT: `"make me a python script to download files"`. Notice typical AI responses provide basic, fragile code with no error handling or retries.
* **[0:15 - 0:35] The Prompt+ Solution:** Click Prompt+ enhance in the bottom dock. Watch the compiler run locally in under 50ms, transforming it into a structured prompt with typing, chunked streaming, backoff retries, and explicit constraints.
* **[0:35 - 0:45] Explainable Transparency:** Open the Changes view. See exact word diffs and reason chips: *“Preserved user intent · Injected exponential backoff constraint · Eliminated conversational preamble”*.
* **[0:45 - 1:00] Data Privacy Guarantee:** Highlight the on-device badge: *“100% on-device. Zero bytes transmitted to third-party servers.”*

---

## 5. Controlled Launch Plan & Pilot Group

We recommend a **2-stage controlled rollout**:

### Phase 1: Controlled Pilot (Days 1–7)
- **Audience:** 50–100 technical beta testers (developers, technical product managers, AI engineers).
- **Channels:** Direct invite, Discord / Slack developer communities, GitHub contributors.
- **Goals:**
  - Gather micro-feedback on prompt quality via built-in thumbs up/down widget.
  - Verify extension stability across DOM updates on ChatGPT, Claude, and Gemini.
  - Monitor edge latencies and rate limiter health on Upstash Redis.

### Phase 2: Public Launch (Day 8+)
- **Channels:** Product Hunt, Hacker News Show HN, Developer Twitter/X, Chrome Web Store promotion.
- **Monitoring:** Live tracking of daily active enhancements, error rate categories, and user retention.

---

## 6. Prioritized Post-Launch Issue Tracker

| Priority | Issue / Opportunity | Category | Action Plan |
|---|---|---|---|
| **P1** | Platform DOM Changes | Extension | Maintain automated synthetic canary checks that alert if ChatGPT or Claude change composer DOM selectors |
| **P2** | VS Code / Cursor IDE Extension | Distribution | Port background adapter logic to VS Code WebView using `docs/ANTIGRAVITY-PLAN.md` |
| **P3** | Fine-Tuned Few-Shot Library | Quality | Allow users to save verified few-shot input/output examples to their personal prompt memory blocks |
| **P3** | Team Shared Collections | Collaboration | Enable optional team collection workspaces for enterprise teams sharing standardized prompt contracts |
