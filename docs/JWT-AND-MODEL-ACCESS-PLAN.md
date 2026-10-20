# JWT authentication and free/paid model access

Status: Phases 1–4 implemented and deployed; Phase 5 evidence below.

Implementation notes (2026-10-20):

- The catalog lives in `src/lib/models.json`; `src/lib/models.ts` adds types and labels.
  `npm run refresh-models` re-checks OpenRouter ids/prices/context and Google model
  presence; a failed fetch exits without touching the file.
- `src/lib/llm/resolve-credentials.ts` is the only path from a request to a provider key.
  Website routes never read operator keys; the public extension route does, and only for
  models that cannot bill.
- `POST /api/v2/optimize` takes `modelId` plus `confirmPaidUsage`. `mode: "api"` returns
  the failure; `auto` returns the deterministic result with a `cloud` reason.
- Stored keys keep a masked hint and the last authenticated check
  (`accepted`, `rejected`, `unreachable`) in `api_keys`.
- `vercel-build` runs `prisma migrate deploy` before `next build`, so a schema change
  cannot be promoted ahead of the code that needs it.

Prepared: 2026-10-20. Repository inspection and provider documentation checked during this planning session.

## Outcome and scope

Strengthen Prompt+'s existing JWT sign-in and let users connect either OpenRouter or Google Gemini, choose an available model, and understand whether a request can incur provider charges.

The user requested both provider options and a plan first. Here, “paid” means usage billed by the AI provider through the user's API key. A paid Prompt+ subscription, payment checkout, and selling Prompt+ API keys are separate product decisions.

Keep the existing local engine available without a provider key. Label its output as deterministic; it does not run a cloud model.

## What already exists

| Area | Evidence in this checkout | Change needed |
| --- | --- | --- |
| JWT sessions | `src/lib/auth/config.ts` uses Auth.js with `strategy: "jwt"` and a 30-day lifetime. | Extend the existing system with revocation and authoritative account checks. |
| Protected APIs | `src/lib/api/with-auth.ts` checks the session and calls the CSRF validator. | Centralize account-status/revocation checks and apply them to protected handlers that call `auth()` directly. |
| Password changes | Change/reset handlers update the password hash without a session-version change. | Invalidate earlier JWTs after password change/reset. |
| Email verification | Credentials login can mark an unverified email as verified after a valid password login. | Require the verification flow to establish email ownership. |
| Key storage | `src/lib/crypto.ts` encrypts keys with AES-256-GCM; the key API returns masked hints. | Separate authentication and encryption secrets, and make key replacement atomic. |
| Google support | Key Settings and validation accept `google`; `callLLM()` has no Google request branch, so Google falls through to the OpenAI endpoint. | Add a real Gemini adapter and include Google throughout routing and selection. |
| Model list | `src/lib/models.ts` contains a static catalog and a `free` boolean; the selector groups all OpenRouter entries under “Free Models.” | Introduce explicit access/pricing metadata and show paid OpenRouter options. |
| Credential selection | Provider inference and defaults are spread across helpers and API routes. Live evaluation currently uses server keys only. | Resolve the selected model and matching user key consistently across cloud features. |
| Browser key legacy | Studio still reads `promptplus_user_apikeys` from local storage. | Remove routine plaintext-key reads and provide a deliberate migration/reconnect path. |

These are source-code findings, not a claim that the deployed site was tested.

## Both provider options

| Option | Free access | Paid access | Key and setup |
| --- | --- | --- | --- |
| OpenRouter | Offer verified free model variants, initially `nvidia/nemotron-3.5-super-vl:free`, subject to availability and quotas. | Offer verified paid models, initially `google/gemini-3.8-flash`, with provider pricing shown before use. | One OpenRouter key can be used for the models the account can access. The selected model and account limits determine charges and availability. |
| Google Gemini directly | Offer `gemini-3.8-flash` where the project's free tier permits it. | The same model can run under a billing-enabled project at paid-tier rates. | Connect a Gemini API key from Google AI Studio. Project billing determines the tier; key text does not establish it. |

The initial model candidates are listed on the providers' current pages: [OpenRouter free Nemotron](https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free), [OpenRouter Gemini](https://openrouter.ai/google/gemini-3.8-flash), and [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing). Recheck their availability when implementing and before release.

Google's billing setup is attached to the project. A free-tier-capable model must not be presented as guaranteed free for a billing-enabled project. See [Gemini billing](https://ai.google.dev/gemini-api/docs/billing). OpenRouter exposes model prices and account limits through its [model catalog](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties) and [key/limits API](https://openrouter.ai/docs/api_reference/limits).

Recommendation: implement OpenRouter access first because its adapter already exists, then add Gemini directly through the same model/key contracts. Expose both in Settings and Studio.

## Phase 1 — Strengthen JWT authentication

Retain Auth.js's encrypted JWT cookie strategy. Auth.js already handles token encoding and browser cookies; do not introduce a parallel custom login-token implementation. Its documented [session strategy](https://authjs.dev/concepts/session-strategies) also explains why clearing a cookie alone cannot revoke a copied JWT before expiry.

Planned work:

- Keep tokens in HttpOnly cookies, with Secure enabled on HTTPS and an appropriate SameSite policy. Verify the actual production cookie behavior and OAuth callbacks.
- Add `User.authVersion`, include its value in the JWT at sign-in, and compare it with the database on protected server operations. Reject deleted users and revoked versions. Never accept privilege or version changes from a client session update.
- Increment `authVersion` atomically with password change/reset and when the user selects “Sign out everywhere.” Normal sign-out clears the current browser cookie; “Sign out everywhere” revokes all earlier JWTs.
- Keep the current session lifetime initially, document renewal and expiry behavior, and test them. Revocation must work independently of cookie expiry.
- Route protected APIs and Server Actions through a shared server-side account verifier. Database unavailability produces a temporary-unavailable response and does not grant access from stale fallback data.
- Gate local fallback authentication to explicit development use. Remove the password-login shortcut that marks an email verified.
- Audit Google/GitHub OAuth persistence: the current Auth.js configuration does not configure an adapter. Persist OAuth identities against canonical database users, using the existing `Account` relation and safe linking rules before issuing a JWT.
- Tighten CSRF checks against configured trusted origins, including scheme and port. An arbitrary Authorization header must not bypass checks for a cookie-authenticated request. Extension access needs an explicit origin/auth policy.
- Apply login throttling at the Credentials authorization boundary so the Auth.js callback cannot bypass a limit on a separate login page/action.
- Validate `AUTH_SECRET` and `ENCRYPTION_KEY` independently. Plan migration of existing ciphertext before removing the encryption fallback to the auth secret.

Primary files: `src/lib/auth/config.ts`, `src/lib/auth/csrf.ts`, `src/lib/api/with-auth.ts`, `src/app/api/auth/`, `prisma/schema.prisma`, `.env.example`, and `scripts/check-env.mjs`.

Next.js constraint: follow the installed `node_modules/next/dist/docs/01-app/02-guides/authentication.md`. Authorization belongs near protected data access. A Proxy redirect, if added, is only an early navigation check.

Completion check: expired, tampered, revoked, and deleted-user sessions cannot access private data; password reset invalidates old sessions; legitimate sign-in and sign-out still work.

## Phase 2 — Make provider credentials consistent

Create a server-only credential resolver shared by enhancement, analysis, scoring, comparison, and evaluation.

Request flow:

```text
Authenticated user
  → validate account and session version
  → resolve catalog model and provider
  → enforce access/billing policy
  → load that user's matching encrypted key
  → call the selected provider
  → return actual model, usage, and execution source
```

Planned work:

- Make catalog identity and explicit provider selection authoritative. Key prefixes may help identify a mismatch but must not silently change the selected provider.
- Use the signed-in user's saved key for that provider. A missing or rejected user key must not silently switch to another provider or an operator-paid key.
- Keep any operator-funded access separately configured, clearly identified, and limited per user. Disable it by default for these BYOK flows.
- Add a unique `(userId, provider)` constraint after resolving existing duplicates. Replace the current delete-then-create save with an atomic upsert.
- Store masked hints and validation metadata alongside ciphertext. Distinguish “Saved,” “Credential accepted,” “Model unavailable,” and “Quota/billing required.”
- Test credentials with a provider-supported authenticated check. A successful model-list request does not prove that inference, credit, or every model is available.
- Use Google's API-key header for requests where supported; avoid putting secrets in URLs, logs, session objects, analytics, or browser storage.
- Let users test, replace, and delete a stored credential without receiving its plaintext. Check API responses before displaying save/delete success.
- If a legacy browser key exists, offer migration into encrypted account storage or reconnection. Clear it only after successful migration or an explicit remove action.

Primary files: `src/app/api/v1/api-keys/route.ts`, `src/app/api/v1/api-keys/test/route.ts`, `src/lib/crypto.ts`, `src/lib/llm/server-api-key.ts`, a new `src/lib/llm/resolve-credentials.ts`, and the cloud API routes.

Completion check: every cloud feature uses the selected provider and correct user's key, including live evaluation; concurrent key replacement cannot leave duplicates or discard the working key on failure.

## Phase 3 — Refresh the catalog and add Gemini

Replace `free: boolean` with metadata that can express:

- Provider, exact API model ID, display name, and stable internal ID.
- Access classification: `free`, `free_tier_available`, `paid`, or `unknown`.
- Availability: active, unavailable, or deprecated.
- Supported text/structured-output capabilities and context/output limits where verified.
- Pricing source, verification time, effective dates when published, and nullable prices.

Keep model capability separate from the user's key/billing status. Provider-specific access checks must not leak between accounts.

Planned work:

- Use one catalog for Studio, Settings, Model Lab, comparison, and server validation. Keep aliases for saved model preferences, but require a fresh choice when a retired model has no equivalent.
- Add a repeatable catalog-refresh script using official model metadata. Keep a reviewed snapshot for normal operation; failed refreshes must not empty the catalog.
- Revalidate prices and availability before enabling new models. Unknown or stale pricing must remain visibly unverified.
- Add the selected paid OpenRouter model without rewriting model IDs through substring heuristics.
- Implement a Gemini adapter using the documented native API. Map system instructions, text, output limits, structured responses, finish reasons, and actual usage into the existing response contract. Follow the provider's current API/deprecation guidance during implementation.
- Add Google to provider types, defaults, environment validation, selection, and all applicable route schemas.
- Preserve existing OpenAI, Anthropic, and NVIDIA support while replacing unsupported blanket “free” claims with verified metadata.
- Normalize missing-key, invalid-key, unavailable-model, quota, billing, blocked-output, timeout, and upstream-failure errors. Bound retries and do not retry permanent credential/billing errors.

Primary files: `src/lib/models.ts`, `src/lib/model-pricing.ts`, `src/lib/llm/providers.ts`, `src/lib/llm/server-api-key.ts`, `src/lib/prompt-engine/model-router.ts`, and provider request/response tests.

API references: [Gemini models](https://ai.google.dev/api/models) and [Gemini content generation](https://ai.google.dev/api/generate-content).

Completion check: both providers support real text enhancement with the chosen model; incorrect provider/model pairs are rejected before any provider request.

## Phase 4 — Update the website experience

| Surface | Planned behavior |
| --- | --- |
| Settings → API Keys | Separate OpenRouter and Google Gemini entries; key-creation links, masked saved key, test/replace/delete controls, and truthful connection status. |
| Studio model selector | Filter by provider and access category; show “Free model,” “Free tier available,” “Paid,” or “Pricing unverified,” plus matching-key status. |
| Run controls | Clearly choose “Local engine” or “Cloud model.” Cloud errors remain visible, with a deliberate local-engine fallback action. |
| Paid usage | Explain that the provider bills the connected account. Require an explicit paid-use choice before the first paid or billing-unknown cloud request. Enforce the choice on the server. |
| Results | Show the actual provider/model or deterministic source. Keep measured model scores separate from structural assessments. |
| Errors | Provide actions such as reconnect key, choose another model, check provider billing, or retry after the reported limit. Preserve the prompt. |
| Account security | Add “Sign out everywhere,” clear expiry/revocation messaging, and a reliable return to sign-in. |

A strict “Free models only” control can allow only verified no-cost routes. For Gemini, if the project's current billing tier cannot be established reliably, show “Free tier available; billing depends on your project” and require the user to leave strict free-only mode before running. A local checkbox cannot force Google's billing behavior.

Never automatically fall back from a free model to a paid model, or between provider keys. Live evaluation must disclose that it runs both the original and candidate prompts and apply the same access policy to each.

Primary files: `src/components/studio/model-selector.tsx`, `src/components/studio/live-evaluation.tsx`, `src/app/(dashboard)/dashboard/new/page.tsx`, `src/app/(dashboard)/dashboard/settings/page.tsx`, and relevant Model Lab/comparison pages.

Completion check: users can connect either provider, identify the applicable billing condition, run a chosen model, and recover from errors without losing input. Keyboard navigation, focus, mobile layouts, and loading states work.

## Phase 5 — Verification and rollout

| Area | Required evidence |
| --- | --- |
| JWT | Tampering/expiry rejected; cookie settings correct; logout and revoke-all behave as documented; password change/reset revokes old tokens. |
| Accounts | Deleted/unverified users handled correctly; OAuth returns a canonical user; database failure cannot authorize a fallback identity. |
| Authorization | Cross-user key/prompt access denied; CSRF origin and fake-Authorization-header cases covered. |
| Credentials | No plaintext in API responses or logs; atomic replacement; failed saves/deletes shown accurately; legacy-key migration only clears after success. |
| Provider adapters | Correct host, authentication, payload, model ID, usage mapping, blocked output, and timeout/error handling. |
| Free/paid policy | No paid request in strict free-only mode; no automatic provider/key switch; unknown Gemini billing never labeled guaranteed free. |
| End-to-end | Sign in → save/test key → select model → enhance → evaluate → sign out, with missing-key and quota-failure paths. |
| Data honesty | Only measured scores aggregate; absent usage/pricing stays unknown; actual executed provider/model recorded. |

Implementation validation: focused Vitest tests, route/honesty checks, TypeScript, lint, production build, and focused Playwright flows. Use provider fixtures for automated tests. Live provider checks require configured test keys and a stated request budget; mock success does not establish live availability.

Rollout order:

1. Apply additive database changes and prepare encryption compatibility. Resolve duplicate key records before adding their unique constraint.
2. Ship JWT verification/revocation and the credential resolver. Existing JWTs without the new version claim require sign-in again; never assign them the current version automatically.
3. Enable the refreshed OpenRouter catalog, then Gemini, after adapter tests pass.
4. Enable the website controls and verify the complete flows in a preview deployment.
5. Release after remote checks and live behavior are verified. Keep provider enablement independently reversible; disabling a provider must preserve users' stored keys and prompts.

Implement in a focused branch while preserving unrelated extension/design work already present in the checkout. This planning change does not alter runtime code, database records, credentials, or deployment settings.

## Phase 5 evidence (2026-10-20)

Verified locally and against production:

- 234 Vitest tests pass, including 15 new catalog/resolver/Gemini cases, plus the
  API-route gate and the honesty gate. TypeScript, ESLint, and the production build
  are clean. The 7 dashboard/measurement Playwright flows pass.
- The `auth_version` and `api_key_validation` migrations are applied by the Vercel
  build before the new code is promoted; the production build reports no pending
  migrations.
- Production: `/api/health` reports `database: connected`; `/login` returns 200;
  `/api/v1/api-keys` and `/api/v2/optimize` return 401 without a session;
  `/dashboard/new` redirects to `/login`; the public extension endpoint returns the
  deterministic engine and no provider output.
- `npm run refresh-models` matches OpenRouter's live prices/context and finds the
  Gemini model on Google's pricing page.

Not verified here, because this checkout has no provider keys or test account:
a real Gemini/OpenAI inference call, a full sign-in → save key → enhance → evaluate
flow, and live OAuth callbacks. Run those in a signed-in preview before announcing
the Gemini entry.
