---
phase: 03
status: implemented-with-release-prerequisites
created: 2026-10-14
depends_on: []
---

# Prompt+ reliability and quality improvement plan

Implementation record: see [03-VERIFICATION.md](03-VERIFICATION.md). The following is the original plan; its baseline observations are historical.

## Goal and scope

Make rate limits enforceable across instances, prompt comparisons trustworthy, and extension state reliable after worker restarts. This is a proposed phase after the two placeholder roadmap phases, not a claim that either previous phase is complete. The existing PROJECT/REQUIREMENTS files describe a demonstration rather than the implemented product; reconcile them before execution. Preserve the current uncommitted extension work and ZIP artifacts.

Baseline: Next.js 16.2.10 / React 19 / Prisma PostgreSQL web application, deterministic prompt compiler, multi-provider LLM gateway, and Manifest V3 extension. `npm test` currently passes 107 tests in 18 files; `node extension/test-plan.js` passes 107 checks. These runs do not prove browser behavior, deployment health, or real provider quality.

## Ranked findings from current source

| Priority | Finding and evidence | User impact |
| --- | --- | --- |
| P1 | `src/lib/rate-limit.ts:51` returns local decisions while only asynchronously incrementing Redis. Auth routes still call this synchronous function. The async function separately sets expiry without awaiting it. | Limits can differ between server instances; expiry and outage behavior are unreliable. |
| P1 | `src/lib/llm/providers.ts:156` uses the last eight key characters as identity and omits temperature, maxTokens and responseFormatJson from the cache key. | Different generation requests can receive the same cached result; credential namespaces can collide. This is a correctness/isolation risk, not a demonstrated data breach. |
| P1 | `src/lib/prompt-engine/evaluation-engine.ts` compares outputs produced with different system prompts, rewards length/formatting, defaults evaluation input to 85, and calls ties an optimized win. | Displayed improvement can reflect the measurement setup rather than better task completion. |
| P2 | `extension/background.js:446` keeps token and alert state in Maps; initial health state claims connected with 18ms latency before measurement. | Worker restart loses state and can repeat alerts; health can appear measured when it is not. |
| P2 | `extension/test-plan.js` contains many source-string assertions. CI does not invoke the existing Playwright suite or extension runner. | Tests can pass despite broken injection, popup behavior, or worker messaging. |
| P2 | `src/lib/token-calculator.ts` hardcodes pricing/model data; README describes extension v2.1.3 while current manifest is 3.0.0 and recommends SQLite despite the PostgreSQL schema. Technical debt docs claim PromptIR and scanner modules are missing although they exist. | Estimates and onboarding can mislead users; planning can duplicate implemented work. |

## Research and decisions

- [Upstash rate-limit features](https://upstash.com/docs/redis/sdks/ratelimit-ts/features) and [methods](https://upstash.com/docs/redis/sdks/ratelimit-ts/methods): use awaited distributed decisions with bounded latency. Timeout behavior must be explicit; a library's allow-on-timeout default is not automatically suitable for auth endpoints.
- [Chrome service-worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle): globals do not survive worker shutdown. Store minimal ephemeral state in session storage, reconstruct it on startup, and keep event listeners registered synchronously.
- [Playwright extension testing](https://playwright.dev/docs/chrome-extensions): use bundled Chromium and a persistent browser context for extension tests.
- [Anthropic evaluation guidance](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): use task-specific outcomes and calibrated graders. Apply the principle to prompt comparisons with small fixed datasets before adding a large evaluation platform.

Research retrieved 2026-10-14. No current provider prices or model limits were verified; this plan deliberately does not prescribe replacement numbers.

## Execution order and acceptance criteria

### 03-01 — Distributed rate limiting (medium, first)

Files: `src/lib/rate-limit.ts`, every importing route, related auth/API tests.

1. Inventory route budgets and preserve their existing limits. Standardize an awaited interface; choose a documented fixed-window policy initially rather than silently changing semantics to sliding windows.
2. Use one atomic Redis operation for increment and expiry, with a bounded request deadline and validated response shape. Remove background duplicate increments. Keep a bounded local implementation for development only.
3. For production auth and paid enhancement, return a recoverable 503 on limiter unavailability; return 429 only for actual budget exhaustion, including Retry-After and rate-limit headers. Verify this availability tradeoff before release.
4. Define trusted deployment proxy headers; use only headers the deployment overwrites. Preserve account/email budgets in addition to IP budgets and avoid logging raw identifiers.

Acceptance: two independent instances sharing Redis enforce one limit; expiry boundary and concurrent first requests work; malformed responses/timeouts do not bypass auth budgets; route tests verify 429 vs 503 and retry guidance. Test against an ephemeral Redis instance as well as mocks. Rollback must retain a safe production outage policy.

### 03-02 — Correct LLM cache identity (small, after 03-01)

Files: `src/lib/llm/providers.ts`, provider tests; audit `src/lib/llm/cache.ts` callers before consolidating caches.

1. Canonicalize all effective output-affecting options into the cache key, including system/user prompt, resolved provider/model, temperature, token budget and output format.
2. Replace credential suffix identity with a server-side cryptographic digest; include explicit tenant scope when using server-owned credentials. Do not log secrets or cache identities.
3. Preserve TTL/capacity behavior, avoid caching errors, and ensure failover results retain actual provider/model provenance. Add a cache-bypass option for evaluation runs.

Acceptance: repeated identical requests hit the cache; each output-affecting option causes a miss; two synthetic credentials with the same suffix and two tenants remain isolated; expiry/failover/error cases behave correctly. Reset process-local cache on rollout.

### 03-03 — Honest prompt evaluation (medium, after 03-02)

Files: evaluation engine, its types and consumers, evaluation tests and a versioned fixture dataset.

1. Use identical system prompts and generation settings for original/optimized runs. Disable result caching for measured runs and prohibit cross-provider failover within a comparison; mismatches are inconclusive.
2. Represent tie, execution failure and unevaluated explicitly. Remove fabricated default evaluation scores; keep structural scores clearly labeled as heuristics.
3. Start with 30 synthetic cases across code, writing and extraction, including concise answers, preserved constraints, injected instructions and multilingual input. Store task-specific expected outcomes and a held-out subset.
4. Use deterministic rubrics first; optional blinded human/LLM judging must be separately labeled and calibrated. Record model/version, run settings, latency, token use and task pass rate. Live evaluation remains opt-in with a request and cost cap.

Acceptance: a concise correct answer outranks formatted nonsense; changed constraints fail; failed or tied runs never count as optimized wins; missing baseline cases are reported rather than silently diluting regression averages. Establish baseline metrics before claiming any percentage improvement. No paid provider calls in default CI.

### 03-04 — Extension lifecycle and browser coverage (medium, after 03-01; can precede 03-03)

Files: existing extension files, new Playwright extension fixture/specs, `playwright.config.ts`, `.github/workflows/ci.yml`.

1. Review the current uncommitted extension changes as the starting point. Persist only token counters/alert metadata in `chrome.storage.session`; avoid storing conversation text. Hydrate before handling state-dependent requests without delaying listener registration.
2. Key state by tab plus conversation identity; clear on navigation/new conversation/tab close. Serialize competing updates and handle storage failures. Health starts unknown and becomes connected only after a measured response; bound health requests.
3. Add persistent-context Chromium tests for input and contenteditable injection, SPA navigation, popup-to-tab messaging, clipboard fallback, worker restart, tab cleanup and notification deduplication. Use deterministic local fixtures without third-party account credentials.
4. Run extension smoke checks and browser tests in CI. Set up a test database, migrations and mocked provider responses as needed; retain traces on failure. Require green web and extension jobs before release packaging.

Acceptance: suspend/restart worker and reopen popup without losing counters or repeating alerts; no text is auto-submitted; insertion works in fixture editors; navigation resets the correct conversation only; CI catches an intentionally broken adapter. Fixture tests do not certify live third-party DOM compatibility: retain a manual release matrix for supported sites.

### 03-05 — Accurate estimates and documentation (small, last)

Files: token calculator, model registry, extension tokenizer/UI, README and relevant docs, GSD project/roadmap/requirements.

1. Inventory duplicate model metadata and use a versioned source with provider documentation URLs and verification dates. Model API context limits must not be presented as guaranteed chat-product limits.
2. Label approximate token counts and incomplete DOM conversation coverage. When the selected model/limit is unknown, show unknown instead of a precise remaining-context claim. Remove claims that earlier messages definitely will be dropped.
3. Verify provider-specific pricing before updating numbers; distinguish promotional/free availability from guaranteed zero cost. Add boundary and multilingual estimator checks without claiming exact tokenization.
4. Align setup instructions to PostgreSQL and actual environment validation. Reconcile extension versions with release artifacts, replace hardcoded test counts, and mark already-implemented debt items accurately. Replace placeholder planning context with verified product requirements and map this phase to them.

Acceptance: a fresh documented setup reaches the app; release docs match the packaged manifest; unknown/stale model metadata cannot produce guaranteed capacity/cost claims; existing compiler modules are not scheduled for duplicate implementation.

## Verification and completion

Read applicable `node_modules/next/dist/docs/` guides before implementation, per AGENTS.md. Run targeted regressions at each step, then `npm test`, extension tests, lint, typecheck, production build and the new CI browser jobs at phase completion. This review ran unit tests and extension checks only; lint/build/browser/provider/Redis integration remain unverified.

Do not expand scope to a redesign, additional chatbot platforms, subscriptions, or a new evaluation service until these correctness gaps are closed. Completion requires implemented acceptance criteria and recorded test evidence, not merely creation of this document.
