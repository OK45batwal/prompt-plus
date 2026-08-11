# Prompt+ Current Architecture (v1.1 Technical Inventory)

This document provides a comprehensive technical audit of the existing **Prompt+** codebase prior to upgrading to **Prompt+ 2.0**.

---

## 1. System Overview & Technology Stack

* **Framework:** Next.js 16.2.10 (App Router, Server Actions, API Routes)
* **Language:** TypeScript 5 (Strict Mode)
* **Styling & UI:** Tailwind CSS v4, Base UI, Shadcn UI components, Lucide React icons, Next-Themes
* **Database & ORM:** PostgreSQL (Neon Serverless Pool) with Prisma ORM 7.8.0
* **Authentication:** NextAuth.js v5 (Beta 31) with JWT strategy, bcrypt password hashing, and custom API key authorization
* **LLM Integrations:** Multi-provider client (OpenAI, Anthropic, OpenRouter, NVIDIA API Catalog, local/browser Chrome Prompt API)
* **Browser Extension:** Chrome Extension Manifest V3 (Service Worker `background.js`, `content.js` FAB + side panel, `popup.js`)
* **Testing:** Vitest 4.1.10 (Unit/Integration tests) & Playwright 1.62.1 (E2E tests)

---

## 2. Current Prompt Compiler Architecture

The current compiler logic resides in [`src/lib/llm/meta-prompt.ts`](file:///Users/omkar/prompt-plus/src/lib/llm/meta-prompt.ts) and [`src/lib/llm/algorithmic-enhancers.ts`](file:///Users/omkar/prompt-plus/src/lib/llm/algorithmic-enhancers.ts).

### Compilation Flow
1. **Input Sanitization:** [`sanitizeUserInput()`](file:///Users/omkar/prompt-plus/src/lib/llm/meta-prompt.ts#L50) strips script tags and basic prompt injection markers (`ignore all previous instructions`).
2. **Implicit Tone Detection:** [`detectImplicitTone()`](file:///Users/omkar/prompt-plus/src/lib/llm/meta-prompt.ts#L9) uses regex pattern matching against keywords (e.g. `code`, `strategy`, `sales`, `tweet`) to assign predefined tone strings.
3. **Level-Based System Instructions:** 3 levels (`quick`, `deep`, `expert`) map to static system prompt templates instructing the LLM to act as "Gemini Prompt Architect".
4. **Meta-Prompt Synthesis:** Combines domain context, tone profile, and desired output depth into a meta-prompt sent to the LLM via [`callLLM()`](file:///Users/omkar/prompt-plus/src/lib/llm/providers.ts#L70).
5. **Output Cleaning:** [`cleanMasterPromptOutput()`](file:///Users/omkar/prompt-plus/src/lib/llm/meta-prompt.ts#L63) strips markdown codeblock wrappers (` ```markdown `) and conversational intros (`"Here is your enhanced prompt:"`).
6. **Algorithmic Fallback:** If LLM calls fail/timeout, [`synthesizeAlgorithmicPrompt()`](file:///Users/omkar/prompt-plus/src/lib/llm/algorithmic-enhancers.ts) constructs a structured markdown template using deterministic regex extraction.

---

## 3. Current AI Providers & Model Routing

Managed in [`src/lib/llm/providers.ts`](file:///Users/omkar/prompt-plus/src/lib/llm/providers.ts):

* **Providers Supported:**
  * `openai` (`api.openai.com`)
  * `anthropic` (`api.anthropic.com`)
  * `openrouter` (`openrouter.ai/api/v1`)
  * `nvidia` (`integrate.api.nvidia.com/v1`)
  * `google` (OpenRouter / On-device Chrome Prompt API)
* **Auto-Routing & Failover:**
  * Provider auto-detected via API key prefix (`sk-or-` $\rightarrow$ OpenRouter, `nvapi-` $\rightarrow$ NVIDIA, `sk-ant-` $\rightarrow$ Anthropic, `sk-` $\rightarrow$ OpenAI).
  * If no user key is provided, routes to OpenRouter free models (`google/gemini-2.0-flash-exp:free`, `deepseek/deepseek-r1:free`, `qwen/qwen-2.5-coder-32b-instruct:free`, `meta-llama/llama-3.1-8b-instruct:free`).
  * Includes an in-memory TTL response cache (`llmResponseCache`) to return sub-5ms results on duplicate requests.

---

## 4. Current Scoring System

Located in [`src/lib/scoring.ts`](file:///Users/omkar/prompt-plus/src/lib/scoring.ts):

* **Method:** Deterministic heuristic scoring (`calculateDynamicPromptScore()`).
* **Dimensions:**
  1. `clarity` (20% weight) - Word count & persona check (`[ROLE]`)
  2. `specificity` (20% weight) - Constraints check (`[CONSTRAINTS]`)
  3. `structure` (20% weight) - Instructions check (`[STEPS]` / newline presence)
  4. `context` (15% weight) - Context section check (`[CONTEXT]`)
  5. `length` (10% weight) - Optimal word count range (30–300 words)
  6. `actionability` (15% weight) - Step count & explicit constraint presence
* **Output:** Aggregate score (0–100), dimensional breakdown, strengths, weaknesses, recommendations.

---

## 5. Current Database Schema (`prisma/schema.prisma`)

* `User`: Auth, profile, credentials hash, relations to sessions, apiKeys, prompts, collections, usageLogs.
* `Account` & `Session`: NextAuth schema.
* `Prompt`: Main prompt entity (`originalText`, `enhancedText`, `model`, `category`, `tone`, `length`, `score` (Json), `analysis` (Json), `isFavorite`, `sharedToken`).
* `Version`: Prompt version history (`promptId`, `version` Int, `text`, `score` Json, `changes` Json).
* `Collection`: Folders for grouping prompts.
* `Template`: Curated/official and community prompt templates with variable placeholders.
* `ApiKey`: User-supplied encrypted API keys per provider (`provider`, `apiKeyEnc`).
* `UsageLog`: Execution metrics (`action`, `provider`, `model`, `tokensIn`, `tokensOut`, `latencyMs`, `success`).
* `Analytics`: Event tracking metadata.

---

## 6. Current API Routes (`src/app/api/v1/`)

* `POST /api/v1/prompts/enhance-ai`: Enhances raw prompt using meta-prompting, stores result & versioning in DB asynchronously.
* `POST /api/v1/prompts/analyze`: Generates heuristic analysis & score metrics.
* `POST /api/v1/prompts/compare-models`: Runs prompt against multiple models in parallel.
* `POST /api/v1/prompts/score`: Calculates score breakdown.
* `GET/POST /api/v1/prompts`: CRUD list and save prompts.
* `GET/PATCH/DELETE /api/v1/prompts/[id]`: Single prompt operations & version history.
* `GET/POST /api/v1/api-keys`: Manage encrypted provider keys.
* `GET/POST /api/v1/collections`: Manage prompt categories.
* `GET/POST /api/v1/templates`: Retrieve curated prompt templates.
* `POST /api/v1/extension/enhance`: Lightweight endpoint for Chrome extension side-panel and FAB.

---

## 7. Current Extension Architecture (`extension/`)

* **Manifest:** MV3 (`manifest.json` v1.1.1).
* **Service Worker (`background.js`):** Intercepts commands (`Ctrl+Shift+P`), handles extension storage, routes requests to `/api/v1/extension/enhance` or executes on-device Gemini Nano when enabled.
* **Content Script (`content.js`):** Detects target input selectors on AI web platforms (ChatGPT, Claude, Gemini, DeepSeek, etc.), injects floating Sparkle FAB, renders 420px overlay Side Panel UI.
* **Popup (`popup.html` / `popup.js`):** Toggle between On-Device (Gemini Nano) and API mode, manage API keys.

---

## 8. Testing Infrastructure

* **Vitest Unit/Integration Tests (`src/__tests__/`):**
  * `auth-routes.test.ts`
  * `crypto.test.ts`
  * `integration.test.ts`
  * `polish.test.ts`
  * `reliability.test.ts`
  * `security.test.ts`
  * `validations.test.ts`
* **Playwright E2E Tests (`e2e/app-flow.spec.ts`):** Verifies authentication, prompt enhancement studio, side panel toggle, and dashboard navigation.
