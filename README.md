# Prompt+

Prompt+ turns a rough request into a structured, model-ready prompt. It ships as a Next.js web app and a Manifest V3 Chrome extension. A deterministic engine needs no API key; cloud models are optional and only run when you supply a key.

- Web app: <https://prompt-plus-three.vercel.app>
- Chrome extension: <https://chromewebstore.google.com/detail/gdfaohfmmjjmpiggdcankjjihpljoccn>
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## What it does

**Web app**

- Rewrite a prompt with the deterministic engine: cleanup, intent extraction, structured output, scoring, and repair. No provider call, no key, no model.
- Optional cloud enhancement through a saved provider key (OpenRouter, NVIDIA, OpenAI, Anthropic, Google). The catalog holds 29 models with explicit free / paid / free-tier-available labels, including frontier models like Claude 3.7 Sonnet (Hybrid Reasoning), GPT-4.5, o1, o3-mini, Gemini 2.5 Pro & Flash (Adaptive Thinking), DeepSeek R1 & V3, and Qwen 2.5 Coder 32B.
- Explainable prompt diff view: side-by-side or inline view with additions, removals, and transparent rationales for each transformation.
- Structured output contract selector: specify role persona, execution constraints, and structured deliverable formats across coding, research, writing, and system architecture profiles.
- Model Lab: run prompt benchmarks and compare outputs across multiple models side by side.
- Interactive Prompt Cost Calculator: forecast daily, monthly, and annual token burn across providers with verified pricing per 1M tokens.
- Save prompts and collections, browse official templates, compare variants side by side or as a diff, enhance up to 20 prompts at once, and share a prompt by link.
- Accounts with email/password, email verification, optional GitHub and Google sign-in, and session revocation.

**Extension**

- Enhance in the composer of supported chat sites, review the diff and token change, then insert or copy.
- In-page dock with tone presets and a live usage readout.
- Copy the visible conversation from one chat and insert it into another, after review.
- Approximate token counts for visible messages only, plus prompt history and a launcher for eight chat platforms.
- Source in [`extension/`](extension) is version **2.1.7**. The Chrome Web Store listing is published separately, so it can lag the repository.

### What the numbers mean

Structure scores are heuristics, not evidence that a model will answer better. Token counts are approximate and exclude hidden or system context. Chat-product capacity is shown as unknown until verified, and unverified prices are never presented as current cost. Free models are never silently swapped for a paid one; paid usage requires a key that you chose to save.

## Quick start

Requirements: Node.js `^20.19`, `^22.12`, or `>=24`, npm, and a PostgreSQL database (Neon is what production uses; the runtime goes through Prisma's Neon HTTP adapter).

```sh
npm ci
cp .env.example .env
```

Fill in the required values in `.env` (ignored by Git):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string, including `sslmode=require` |
| `AUTH_SECRET` | Session signing secret, 32+ characters (`openssl rand -base64 32`) |
| `ENCRYPTION_KEY` | Encrypts saved provider keys at rest, 32+ characters, different from `AUTH_SECRET` |
| `NEXT_PUBLIC_APP_URL` | Public origin, e.g. `http://localhost:3000` |

Then create the schema and start the app:

```sh
npx prisma migrate deploy
npm run check-env
npm run dev
```

Open <http://localhost:3000>. Provider keys, SMTP/Resend, OAuth, Redis, and admin settings are optional; `.env.example` documents each group. See [database setup](docs/DATABASE-SETUP.md) for provider-specific notes.

## Configuration

`.env.example` is the full, committed reference. The main groups:

- **Required:** `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`, `NEXT_PUBLIC_APP_URL`.
- **Auth:** `GITHUB_CLIENT_ID`/`SECRET`, `GOOGLE_CLIENT_ID`/`SECRET`. An empty pair disables that provider.
- **Rate limiting:** `UPSTASH_REDIS_REST_URL`/`TOKEN` (or the `KV_REST_API_*` pair injected by Vercel's Upstash integration). Production fails closed with `503` when the limiter is unavailable; exhausted budgets return `429`. Development uses a bounded in-memory fallback only when Redis is not configured.
- **Email:** SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) or `RESEND_API_KEY`.
- **Operator model keys:** `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `NVIDIA_API_KEY`. These serve the public extension demo only; they are never a fallback for a user's own key.
- **Trusted boundaries:** `TRUSTED_ORIGINS`, `EXTENSION_ORIGINS`, `TRUSTED_PROXY_IP_HEADER`. Set the proxy header only when your own reverse proxy overwrites it; untrusted forwarding headers are ignored.

`npm run check-env` validates a production configuration and warns about partial email or Redis setup.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run vercel-build` | `prisma migrate deploy && next build` (what Vercel runs) |
| `npm run lint` | ESLint |
| `npm test` | Route checks, honesty checks, and the Vitest suite |
| `npm run test:e2e` | Playwright app flows (starts its own server) |
| `npm run test:extension` | Extension structural checks |
| `npm run test:extension:e2e` | Playwright extension fixtures |
| `npm run check-env` | Required-variable check |
| `npm run check-routes` | Fail if a route is neither wrapped in `withAuth` nor marked `@public-route` |
| `npm run build:extension` | Package the extension ZIPs into `public/` |
| `npm run refresh-models` | Refresh the model catalogue |

## Testing

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Vitest covers domain rules, route handlers with mocked auth/database, and copy-honesty gates. Playwright covers dashboard wiring, measurement honesty, and extension fixtures. A local pass is not a deployment pass: live provider calls and the full sign-up → save key → enhance flow need a disposable account and real keys, which CI does not have. The real Redis test is skipped unless `redis-server` is installed; CI installs it.

## Deployment

Vercel is the target. `vercel-build` applies Prisma migrations before building, so a failed migration fails the deployment and the previous version keeps serving. CI runs lint, typecheck, route checks, tests, a production build, and a dependency audit; a critical advisory fails the pipeline.

**Previews share the production database.** A preview build applies its migrations to production data, so review any migration before opening a PR that adds one.

## Extension development

The extension talks only to the public `/api/v1/extension/*` and `/api/v2/extension/*` routes. Its install path for users is the Chrome Web Store link above.

For local work, load `extension/` as an unpacked extension in `chrome://extensions` with Developer mode enabled. It calls the deployed API first and falls back to `http://localhost:3000`, so run `npm run dev` alongside it when working on API changes.

To produce a reviewable archive without touching the published downloads:

```sh
node scripts/package-extension.mjs --output-dir /tmp/prompt-plus-release
```

Packaging verifies that every manifest script is present in the archive. `npm run build:extension` also updates the ZIPs in `public/`; only run it when preparing a release. Manual smoke tests on current live chat sites are still required before publishing.

## Documentation

- [Production Readiness Audit](docs/PRODUCTION_READINESS_AUDIT.md)
- [Competitive Analysis & Benchmarks](docs/COMPETITIVE_ANALYSIS.md)
- [QA Test Plan & Verification](docs/QA_TEST_PLAN.md)
- [Launch Checklist & Rollback Guide](docs/LAUNCH_CHECKLIST.md)
- [Architecture and conventions](docs/ARCHITECTURE.md)
- [Documentation index](docs/README.md)
- [Database setup](docs/DATABASE-SETUP.md)
- [Reliability contracts](docs/RELIABILITY.md)
- [Improvement plan and status](docs/PROJECT-IMPROVEMENT-PLAN.md)
- [Known technical debt](docs/TECHNICAL_DEBT.md)

## Limitations

- The deterministic engine is labelled as such and is not a language model; the extension runs it on-device.
- Cloud enhancement depends on the provider key and model the user selects. Provider outages surface as errors, not silent fallbacks.
- Token counts are estimates from visible content, not tokenizer-exact billing figures.
- The extension is tested against local fixtures, not every live chat site on every release.
- Scores and comparisons are heuristics; there is no claim that a higher score means a better model answer.

## License

Proprietary. See [LICENSE](LICENSE). No copying, modification, or distribution without permission.
