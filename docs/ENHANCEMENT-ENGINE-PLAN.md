# Enhancement Engine Plan

**Status:** proposed · **Depends on:** PR #2 (`fix/truthfulness-and-core-loop`)

This responds to the external audit proposing a unified engine, context profiles, a Studio
redesign, and an extension overhaul. The audit's instincts are right, but it misdiagnoses the
root cause, proposes rebuilding three things that already exist, and proposes two metrics that
would fail the honesty gate we just added.

Everything in §1 was verified against the live system, not inferred. Evidence is in §1.

---

## 1. What is actually broken (verified)

### 1.1 Cloud enhancement is dead in production — there is no server key

`vercel env ls production` lists 16 variables. **None of them is an LLM provider key.** No
`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY`, `GEMINI_API_KEY`,
or `GROQ_API_KEY`.

So `resolveServerApiKey()` (`src/lib/llm/server-api-key.ts:29`) always falls through to its last
line and returns `{ apiKey: "", provider: "openrouter" }`.

### 1.2 Every hardcoded fallback model has been delisted upstream

The audit called these "stale". They are gone. Queried against `openrouter.ai/api/v1/models`
(466 models, 15 free):

| Model ID | Result |
| --- | --- |
| `google/gemini-2.0-flash-exp:free` | **MISSING** |
| `deepseek/deepseek-r1:free` | **MISSING** |
| `meta-llama/llama-3.1-8b-instruct:free` | **MISSING** |
| `meta-llama/llama-3.3-70b-instruct:free` | **MISSING** |

These IDs are hardcoded in `src/app/api/v1/extension/enhance/route.ts:24-28`, plus
`compare-models/route.ts:15`, `templates/route.ts:65,113,244`, `analytics/stats/route.ts:130-131`,
and `src/lib/llm/providers.ts` (`OPENROUTER_FREE_MODELS`).

### 1.3 The "zero-key free fallback" cannot work, by design

`providers.ts:186` deliberately omits the `Authorization` header when the key is empty:

```js
...(apiKey && apiKey.trim() ? { Authorization: `Bearer ${apiKey}` } : {}),
```

I probed OpenRouter directly with a real free model and no key:

```
POST https://openrouter.ai/api/v1/chat/completions
{"model":"nvidia/nemotron-3.5-super-vl:free", ...}
→ HTTP 401 {"error":{"message":"No cookie auth credentials found","code":401}}
```

OpenRouter requires a key. `providers.ts:232` catches the 401 and throws **before** the failover
block, so the free-model retry loop never even runs.

### 1.4 That is why nobody noticed

`.env` (development only) contains a real `OPENAI_API_KEY`. Locally the cloud path succeeds and
enhancement looks fine. In production every request without a user-supplied key takes the failure
path. **The bug is invisible in local development and total in production.**

### 1.5 The real engine exists — keyless users just never reach it

`src/lib/prompt-engine/` is a genuine 2,285-line deterministic engine (intent extraction, prompt
IR, candidate generation, hybrid scoring, auto-repair, loop convergence) and it is reachable
without a key at `/api/v2/extension/optimize`.

The extension calls it — `extension/background.js:155-156`:

```js
: [`${baseUrl}/api/v1/extension/enhance`, `${baseUrl}/api/v2/extension/optimize`];
```

But that fallback **never fires**, because endpoint 1 does not fail. It catches its own LLM error
and returns **HTTP 200** with the toy template (`enhance/route.ts:215-222`):

```js
console.log("[Extension Backend] Serving dynamic Algorithmic Meta-Prompt Synthesis:", lastError);
const enhancedText = synthesizeAlgorithmicPrompt(text, level);
```

`synthesizeAlgorithmicPrompt` (`src/lib/llm/algorithmic-enhancers.ts:6`) is a 22-line string
wrapper — `extension/lib/synthesize.js`. So every keyless user gets 22 lines of Markdown
formatting while a 2,285-line engine sits one URL away, unused, because HTTP 200 looks like
success.

### 1.6 The website is already better than the extension

The Studio's `algorithmic` mode calls `/api/v2/optimize` (`dashboard/new/page.tsx:280`), which
imports the real engine. Only the extension's path lands on the toy.

### 1.7–1.11 Secondary, all verified

- **Mode toggle exists**: `ModelSelector` + `enhanceMode` (`dashboard/new/page.tsx:139,618`).
  `device` requires Chrome's built-in Prompt API, which most users do not have.
- **Debug panels are in the main flow**: `LoopTraceCard` and the candidate list render inline at
  `dashboard/new/page.tsx:877-890`, `ScoreBreakdown` at `:867`.
- **"Launch in ChatGPT / Claude / Gemini" already exists**: `src/lib/platform-redirect.ts`,
  used at `dashboard/new/page.tsx:590`, `batch/page.tsx:61`, `model-lab/page.tsx:68`. The audit
  lists this as something to add. It is built.
- **A Context Vault already exists**: `src/lib/context-memory.ts` (`DEFAULT_CONTEXT_BLOCKS`,
  `getSavedContextBlocks`), surfaced by `ContextMemoryPanel` in the Studio and by `contextRules`
  in the extension. It is local-only.
- **`scripts/check-api-routes.mjs:7` scans only `src/app/api/v1`.** Every `/api/v2` route bypasses
  the CSRF/auth gate, including the two the extension actually calls.

---

## 2. Corrections to the proposal

| Proposal | Verdict |
| --- | --- |
| "Remove stale free OpenRouter endpoints" | **Right, and worse than stated** — all four are delisted, and keyless access 401s regardless. |
| "Unify everything onto `/api/v2/extension/optimize`" | **Reverse it.** That route has no rate limiting and no CORS; `v1/extension/enhance` has both, plus caching. Keep v1 as the front door and give it the real engine as its fallback. |
| "Fall back to configured server keys" | **Impossible today** — no server keys exist. This is a spend decision, not a code change (§3). |
| "Upgrade `synthesizeLocalPrompt` with PromptIR" | **Wrong layer.** `extension/lib/synthesize.js` is a plain-JS file with no bundler in the repo. Point the server at the engine that already exists instead. |
| "Add direct Launch-in-AI links" | **Already built** (`openAIPlatform`). |
| "Add a Context Profile switcher" | **Already built** locally; only *persistence* is missing (§3, Phase 13). |
| "Add a Token Savings metric card" | **Reject.** "tokens saved by getting the result on Turn 1 instead of Turn 5" cannot be computed from anything we store. |
| "Tokens Reclaimed: `+45% specificity · ~520 tokens saved`" | **Reject the percentage.** A before/after token delta is real and computable; "+45% specificity" is invented and would fail `check-honesty.mjs`. |

---

## 3. The decision that gates everything

Which promise do we make to a user with no API key?

| Option | Cost | Consequence |
| --- | --- | --- |
| **A. Provision a server LLM key** (OpenAI/Gemini/Groq/AI Gateway) | Recurring, usage-based | Makes "free server model" true. Needs a spend cap and abuse protection. |
| **B. Make the deterministic engine the free tier** | Zero | Honest, real, instant, private, offline-capable. **Not AI.** Copy must stop saying "server model". |
| **C. BYOK only** | Zero | Most honest, least useful. Loses the free demo entirely. |

**Recommendation: B as the floor, A on top if you will fund it, C always available.** B is the
only option that is simultaneously free, honest, and real — and it is mostly a *routing* change,
because the engine already exists.

I have **not** picked this for you: A costs money and B changes the product's promise.

---

## 4. Phases

Each phase ships alone and is independently verifiable.

### Phase 8 — Stop the free tier from lying *(small; do first)*

**8.1** The "Free server model / No API key needed" tile I added to
`src/app/(marketing)/page.tsx:296` is **my own regression** — there is no working server model.
Replace with wording true under every option: `No API key required → Deterministic engine
included`. *This is in open PR #2 and should be fixed there before merge.*

**8.2** The Studio's `device` mode (`dashboard/new/page.tsx:259`) silently degrades when Chrome's
Prompt API is absent. Either feature-detect and hide it, or label it "requires Chrome 138+".

**8.3** Extend `check-honesty.mjs` with a `dead-model-id` rule pinned to the OpenRouter list, so
a delisted model ID cannot be reintroduced.

**Verify:** `npm test`, `npm run test:e2e`.

### Phase 9 — Route keyless users to the real engine *(highest value, smallest diff)*

**9.1** Replace the toy fallback in `enhance/route.ts:215-222` with the real engine, so endpoint 1
stops returning a 200 that blocks the good path.

**9.2** Have the route report `provider: "engine"` (not `local`) when the deterministic engine
produced the text, so `background.js:186`'s `local` detection stays correct.

**9.3** Deleting `src/lib/llm/algorithmic-enhancers.ts` and, if nothing else needs it,
`extension/lib/synthesize.js` (note: `local-template.test.ts` and the extension's offline path
depend on it — check both).

**Verify:** new unit test asserting a keyless request returns engine output, not a `### Task`
header. Manual: unset the key, confirm a real rewrite.

**This one change is what "make enhancement work 100% of the time" actually means.**

### Phase 10 — Delete the dead cloud path

**10.1** Remove the four delisted IDs and all copies (§1.2).
**10.2** In `server-api-key.ts:29`, delete the "zero-key free fallback" comment — it is a lie in
the code — and return an explicit `null` so callers make a deliberate choice.
**10.3** Make `/api/v1/extension/enhance` skip the LLM attempt entirely when no key resolves,
instead of burning two 401 round-trips before falling back.

**Verify:** `npm test`; `grep -r ":free" src/` returns only genuinely-listed models.

### Phase 11 — Studio cleanup

**11.1** Remove the manual mode toggle. Selection becomes automatic: engine if no key, LLM if a
key resolved. (`ModelSelector` keeps the model picker; the mode switch goes.)
**11.2** Move `LoopTraceCard`, the candidate list, and `ScoreBreakdown` into a collapsed
"Developer details" disclosure. Default closed.
**11.3** Wire `withAuth` or `@public-route` into the two `/api/v2/extension/*` routes, and widen
`check-api-routes.mjs:7` to cover `api/v2`.

**Verify:** `npm run test:e2e` + a screenshot check that the default result view is clean.

### Phase 12 — Extension: real diff, real numbers

**12.1** Floating diff popover before replacing editor text (`Tab` accept / `Esc` keep). Reuse the
existing injection code in `content.js`.
**12.2** Show a **real** token delta computed by `extension/lib/tokenizer.js` (before → after).
No percentage, no "specificity" score.

**Verify:** `npm run test:extension` + `npm run test:extension:e2e`.

### Phase 13 — Parked on your decision

- **Server LLM key** (Option A). If yes: add the key, a spend cap, and per-user quota.
- **DB-backed context profiles.** Needs a Prisma migration. Preview and production **share one
  Neon database**, so this affects live data on merge, and the deploy pipeline runs no
  `prisma migrate deploy` (verified: `package.json` scripts + `.github/workflows/ci.yml`). This
  needs a deliberate migration plan and explicit sign-off — not a side effect of a feature.

---

## 5. What this plan will not do

- Invent a savings percentage, a specificity score, or a quality delta.
- "Unify" onto the endpoint that lacks rate limiting.
- Run a Prisma migration against the shared live database without sign-off.
- Rebuild `openAIPlatform` or the Context Vault, which already exist.
