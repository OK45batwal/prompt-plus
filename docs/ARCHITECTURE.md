# Architecture

Last reviewed: 2026-10-23. Describes the code as it exists; historical plans live in
`JWT-AND-MODEL-ACCESS-PLAN.md` and `PROJECT-IMPROVEMENT-PLAN.md`.

## Shape of the app

One Next.js App Router project serves the marketing pages, the authenticated dashboard,
the versioned HTTP API, and the public endpoints used by the Chrome extension.

```
src/
  app/
    (marketing)/          public pages (landing, SEO pages, legal)
    (auth)/               login, signup, password flows
    (dashboard)/          authenticated product surfaces
    api/                  HTTP handlers only
  components/
    ui/                   primitives (button, input, toast, …)
    studio/               prompt workspace pieces
    dashboard/            shell, navigation, onboarding
    marketing/            landing-page sections
    prompts/              export/code dialog
  lib/
    api/                  withAuth, response envelope, CSRF-adjacent helpers
    auth/                 Auth.js config, session checks, CSRF, OTP
    config/               environment-derived values
    db/                   Prisma client
    llm/                  provider adapters and credential resolution
    prompt-engine/        deterministic enhancement pipeline
    validations/          zod schemas shared by routes and clients
    *.ts                  domain rules (models, scoring, pricing, formatting, …)
  types/                  ambient and module augmentation types
prisma/                   schema and migrations
extension/                Manifest V3 extension source
e2e/                      Playwright browser tests
scripts/                  build, packaging, catalog and environment checks
```

### Where logic belongs

| Kind | Home | Rule |
| --- | --- | --- |
| HTTP parsing, status codes | `src/app/api/**/route.ts` | No business rules. Delegate to `lib`. |
| Auth/session enforcement | `src/lib/api/with-auth.ts` | Every non-public route goes through it. |
| Domain rules | `src/lib/**` | Pure or DB-backed, importable from routes and tests. |
| Data catalogues | `src/lib/official-templates.ts`, `src/lib/extension-blueprints.ts` | Data only, no handlers. |
| UI | `src/components/**` and page files | No direct Prisma or provider calls; use `fetch` to the API. |
| Environment values | `src/lib/config/env.ts`, `.env.example` | No secrets or deployment URLs in source. |

## Conventions

- Files and folders are kebab-case; React components are PascalCase and match their
  file name. Functions and variables are camelCase. `UPPER_SNAKE` is reserved for real
  constants such as storage keys and limits.
- A route file exports HTTP verbs plus route config only. Queries and rules move to
  `src/lib`.
- Types live next to the module that owns them; move them to `src/types` only when
  several unrelated modules need them.
- User-facing copy states what happened. The deterministic engine is never described
  as a model run, and unverified prices or scores are not shown.

## API conventions

- Versions live in the path: `/api/v1/*` (account features) and `/api/v2/*` (enhancement,
  evaluation, extension optimization).
- Protected routes export `withAuth(handler, { schema })`. It performs, in order:
  session lookup → CSRF check → account/revocation check → JSON body parse and zod
  validation → handler. Malformed JSON is `400`, not a `500`.
- Public routes carry a `// @public-route` comment and must justify it. They apply their
  own origin/rate-limit checks and still return the same JSON envelope.
- Responses use `jsonResponse(data, { status, requestId, headers })` so every reply has
  a request id and consistent error shape.
- Errors: `400` invalid input, `401` no session, `403` CSRF/ownership, `404` missing,
  `429` rate limit, `503` dependency unavailable, `500` unexpected (logged with the
  request id). Never return stack traces, SQL, or provider responses verbatim.
- Rate limits come from `src/lib/rate-limit.ts`; in production a missing Redis
  configuration fails closed (503) rather than allowing unlimited traffic.

### Adding a route

1. Create `route.ts` under the correct version.
2. If authenticated, wrap with `withAuth` and a zod schema from `src/lib/validations`.
3. If public, add `// @public-route`, CORS if the extension calls it, and an IP limit.
4. Reuse `jsonResponse`; put queries in `src/lib`, not in the handler.
5. Add a route test that covers the success path and at least one failure path.

## Data

- PostgreSQL via Prisma with the Neon HTTP adapter. `DATABASE_URL` is the only URL the
  app and migrations read; `prisma.config.ts` uses it for `migrate deploy`.
- `npm run vercel-build` runs `prisma migrate deploy && next build`. A failed migration
  fails the build and leaves the previous deployment serving.
- The model catalogue is data (`src/lib/models.json`) with provider identity, access
  label, availability, and pricing provenance. Prices are only shown when verified.
- User provider keys are encrypted (`src/lib/crypto.ts`) and resolved per request by
  `src/lib/llm/resolve-credentials.ts`. Operator keys are only for the public demo and
  never stand in for a user's key.

## Client state

There is no global store. State ownership is:

| State | Owner | Persistence |
| --- | --- | --- |
| Session/user | Auth.js `SessionProvider` | HTTP-only cookie |
| Page data (prompts, analytics, history) | the page component | server |
| Studio draft | `dashboard/new/page.tsx` | `localStorage`, debounced |
| Local history | Studio writes, History reads | `localStorage` |
| Preferences | Settings (server) + `pp_prefs` mirror | PostgreSQL + local mirror |
| Theme / avatar | `next-themes`, header | `localStorage` |

Rules:

- Browser keys are defined once in `src/lib/storage-keys.ts`. Values are persisted user
  data: renaming one requires a migration.
- Anything belonging to a person goes through `accountStorageKey(key, userId)` so two
  accounts on one browser do not share drafts, history, or context.
- Wait for the session before reading account-scoped keys; an unscoped value must be
  claimed explicitly, never assigned to whoever signs in next.
- Server data is fetched per page with `fetch`; failures render a retry, not a sample.
  Add a shared query library only when several pages need caching/refetch semantics.

## Configuration

- `.env.example` is the operator-facing list, grouped by required/optional. It is
  committed; real files are ignored.
- `npm run check-env` validates required production variables and warns on partial
  email/Redis setup.
- `src/lib/config/env.ts` holds values used by more than one module (public URL, sender).
  Read `process.env` directly only for a single-use value inside the module that owns it.

## Testing

- `src/__tests__/*.test.ts` — Vitest: domain rules, route handlers with mocked auth/DB,
  honesty gates that assert user-facing copy never claims unverified results.
- `e2e/*.spec.ts` — Playwright against a running production build: dashboard wiring,
  measurement honesty, extension flows.
- Extension packaging is validated by `scripts/package-extension.mjs`.

A local pass is not a deployment pass. Live provider calls and authenticated
signup→save→reopen flows still require a disposable account and real keys.

## Extension boundary

The extension talks to the public `v1/extension/*` and `v2/extension/*` routes only.
It has its own storage and must not assume a signed-in web session except through
`/api/v1/auth/extension-sync`. Extension and web share types only where they are
imported from `src/lib`; duplicated constants are a known risk.

## Previous documentation

`ARCHITECTURE-LEGACY.md` is the earlier broad information architecture. It is kept
for history; several parts of it describe features that do not exist. Where the two
conflict, this document reflects the source.

## Known debt

- `dashboard/settings/page.tsx` and `dashboard/new/page.tsx` are ~1.2k lines each and
  mix rendering with persistence effects. Split by feature when they next change.
- The extension has no end-to-end test against live chat products.
- Preview deployments share the production database, so preview builds apply
  migrations to production. Do not merge a migration without reviewing it first.
- Nodemailer 8 carries a high-severity advisory fixed only in 10.x, which `next-auth`'s
  peer range does not accept. It does not affect the critical audit gate.
