# Reliability contracts

## Rate limiting

All route callers use the awaited limiter. A single Redis EVAL increments and initializes/repairs expiry atomically. The policy is a fixed window starting with the first request. Requests have a 1.5-second Redis deadline; malformed results and provider failures produce 503 plus Retry-After: 5, not a local production bypass. Actual exhaustion produces 429 and quota/reset/retry headers. Existing per-IP and per-email budgets are retained. Redis keys contain hashed identifiers rather than raw email/IP strings.

Production requires both Upstash REST environment variables. Vercel supplies the [trusted forwarding header](https://vercel.com/docs/headers/request-headers). For other hosts, configure a proxy that overwrites the named TRUSTED_PROXY_IP_HEADER. Without verified identity requests share a conservative unknown bucket. Do not roll back to fire-and-forget counting during a Redis outage.

## Caches

Provider cache keys cover trusted tenant, full credential identity, resolved provider/model, separate system/user prompts, temperature, token budget and response format. Process-local HMAC keys expose neither raw prompts nor API keys. Calls without a trusted tenant bypass the shared cache. Enhancement-route caches are independently scoped to tenant, credentials and options. Cache lifetimes are ten minutes and capacity is bounded. Errors are not cached; provider/model metadata describes the actual response. Evaluation calls bypass caches and disable failover/retries.

## Evaluation API

POST /api/v2/evaluate requires authentication, existing CSRF protections, and `confirmLiveEvaluation: true`. Input is capped at 10,000 characters per prompt; each user can request five comparisons per hour. Each comparison makes at most two requests, with at most 800 output tokens each and a 20-second deadline per request. This is a request/token ceiling, not a guaranteed dollar ceiling; provider prices vary. No live calls run in default CI.

Optional rubric fields: `exact` (trimmed exact match), `required` (all case-sensitive substrings), `forbidden` (none may occur). Scores are task-check pass/fail, not general semantic correctness. With no rubric, scores/delta/winner are null and status is unevaluated. Failures and model mismatches have null scores/winner; measured equal scores produce tie. Original and optimized runs use identical system prompts and settings. Token usage is returned only when supplied by the provider.

The 30-case versioned fixture corpus in src/__tests__/fixtures/prompt-evaluation-v1.json covers code, writing, extraction, short outputs, multilingual text and embedded instruction distractions, with held-out cases marked. It tests grading contracts with synthetic outputs; it is not a measured model-quality benchmark. Use held-out prompts for future live baseline runs without tuning against their results.

## Extension state and estimates

Minimal token counters are stored in chrome.storage.session, serialized through a queue and hydrated on worker startup. Conversation identity is a hash of origin plus path; raw URLs and message text are not stored in this state. Query/hash-only conversation identities need adapter-specific support if a supported site introduces them. Navigation and tab closure clear stale state. Health begins unknown and becomes connected only after measurement.

Visible-message token estimates cannot establish chat-product context capacity. Capacity and remaining exchanges are unknown; threshold alerts and the notifications permission have been removed until a verified capacity source exists. Existing adapter limits are legacy heuristics, not a verified provider catalog. Historical web prices are held in src/lib/model-pricing.ts with source URLs; no entry is considered current until verifiedAt is supplied, and verification expires after 30 days. API limits and chat-product limits must remain distinct.

## Release checks

CI runs web and extension browser checks, unit tests, real Redis integration, lint/typecheck and a production build. Extension packaging validates manifest references and includes tokenizer assets. Public download ZIPs are not automatically rebuilt by implementation tests.

Before a release, manually check insertion, no automatic send, SPA navigation, selected-model detection, and popup behavior on each supported chatbot; record browser version, site, date and result. Fixture Chromium tests cannot certify changing third-party DOMs. Authenticated database flows and actual provider grading require separately configured integration environments.

Research: [Upstash](https://upstash.com/docs/redis/sdks/ratelimit-ts/features), [Chrome worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle), [Playwright extensions](https://playwright.dev/docs/chrome-extensions), [Anthropic evaluation guidance](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

## Score provenance and verification

Structural scores are keyword/rule checks and carry `kind: structural`. Quality aggregates include only stored model assessments with `measuredBy: llm`; legacy and structural totals are excluded. Empty aggregates return null. Assessment change uses stored original/enhanced pairs from the same model and provider, in points, including negative changes. Clients cannot persist model scores through prompt PATCH.

The Studio live verification panel makes two uncached requests with matching settings and user-reviewed, case-sensitive acceptance criteria. It stores request usage and an evaluation audit record, including rubric, outputs, status, and settings. Failed or mismatched runs have no winner. One comparison does not establish model reliability.

Extension and web local fallbacks share `extension/lib/synthesize.js` and are labeled Local template (offline). API response envelopes remain compatible; new source fields are additive.
