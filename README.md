# Prompt+ Architect AI

Prompt+ combines a web prompt editor, a deterministic prompt compiler, optional cloud-model enhancement, and a Manifest V3 browser extension. The current extension source version is **3.0.0**. This is a source version, not a claim about Chrome Web Store publication.

## Features

- Prompt cleanup, intent extraction, structured intermediate representation, candidate generation and repair.
- Optional cloud enhancement using supported provider credentials.
- Saved prompts, collections, templates and authentication in the web app.
- In-chat text insertion and approximate token counts from visible conversation messages.
- Opt-in task-rubric comparisons with explicit ties, failures and unmeasured results.

Structure scores are heuristics, not evidence of better model answers. Browser conversation counts omit hidden/system context and messages absent from the DOM. Chat-product capacity is shown as unknown until verified. Historical pricing entries are displayed as unverified, not as current cost quotes.

## Development

Requirements: Node.js 20+, npm, and a Neon PostgreSQL database. The current runtime uses Prisma's **Neon HTTP adapter**; a plain local PostgreSQL server alone is not sufficient. Prisma migrations use the database URL separately.

```sh
npm ci
```

Create `.env.local` with your own values:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@YOUR-NEON-HOST/DB?sslmode=require"
AUTH_SECRET="replace-with-a-random-secret-at-least-32-characters"
ENCRYPTION_KEY="replace-with-your-own-32-character-key"
```

Make the same `DATABASE_URL` available to the Prisma CLI (for example through `.env`, which is ignored by Git), then run:

```sh
npx prisma migrate deploy
npm run check-env
npm run dev
```

Open http://localhost:3000. Configure SMTP or Resend for verification/reset emails; see [database setup](docs/DATABASE-SETUP.md) and [reliability configuration](docs/RELIABILITY.md). Never commit credentials.

## Production configuration

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Protected auth/enhancement endpoints fail with **503 and Retry-After** if the limiter is unavailable or missing; exhausted budgets return **429**. Development uses a bounded in-memory fallback only when Redis is not configured.

On Vercel, the limiter uses `x-vercel-forwarded-for`. Elsewhere, set `TRUSTED_PROXY_IP_HEADER` only for a header your trusted reverse proxy overwrites. Untrusted forwarding headers are ignored. Missing client identity shares an `unknown` budget rather than bypassing protection. **Required for non-Vercel deployments:** configure this header before enabling public signup/login; otherwise unrelated users can exhaust the same authentication budget. Do not trust a forwarding header that clients can supply unchanged.

## Verification

```sh
npm test
npm run test:extension
npx playwright install chromium
npm run test:extension:e2e
npm run test:e2e
npm run lint
npx tsc --noEmit
npm run build
```

Install `redis-server` and `redis-cli` to exercise the real atomic Redis test; it is skipped when Redis is absent. CI installs Redis explicitly. The extension suite uses deterministic local browser fixtures. Supported live sites still require a manual release smoke test.

## Extension development and packaging

In `chrome://extensions`, enable Developer mode and load the `extension/` directory. To create a reviewable archive without changing the public downloads:

```sh
node scripts/package-extension.mjs --output-dir /tmp/prompt-plus-release
```

Packaging verifies that every manifest script exists in the archive, including `lib/tokenizer.js`. `npm run build:extension` additionally updates the public ZIP downloads; do this only when preparing a release.

## Further documentation

- [Reliability and evaluation contracts](docs/RELIABILITY.md)
- [Implementation plan](.planning/phases/03-reliability-and-quality/03-PLAN.md)
- [Remaining technical debt](docs/TECHNICAL_DEBT.md)

License: proprietary; see LICENSE.
