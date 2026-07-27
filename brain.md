# AI Prompt+ — Codebase Brain

## Overview
Full-stack Next.js 16 app for writing, analyzing, scoring, enhancing, and sharing AI prompts. Users paste raw prompts → get AI-powered analysis (intent, complexity, missing elements), scoring (6-dimension quality), and enhancement (meta-prompt compiler). Supports OpenAI, Anthropic, OpenRouter, Google. Has a Chrome extension for in-place prompt optimization inside ChatGPT/Claude/Gemini.

## Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Database**: PostgreSQL (Prisma ORM + Neon serverless adapter via `@neondatabase/serverless`)
- **Auth**: NextAuth v5 (JWT, Credentials + GitHub/Google OAuth providers)
- **UI**: Tailwind CSS v4, `@base-ui/react`, `lucide-react`, `next-themes`, `class-variance-authority`, `tailwind-merge`
- **LLM**: Direct fetch to OpenAI/Anthropic/OpenRouter APIs (`src/lib/llm/providers.ts`)
- **Email**: Resend (`src/lib/email.ts`)
- **Testing**: Vitest (`src/__tests__/` — 7 test files: auth-routes, crypto, integration, polish, reliability, security, validations)
- **Linting**: ESLint v9 (`eslint.config.mjs`)
- **Validation**: Zod v4
- **Encryption**: AES-256-GCM (Node `crypto`) for stored API keys (`src/lib/crypto.ts`)
- **Package manager**: npm

## Directory Structure

```
src/
  app/
    (marketing)/        # Landing page, features, docs, contact
    (auth)/             # login/, signup/, forgot-password/, reset-password/
    (dashboard)/        # Authenticated area with layout + sidebar
      dashboard/        # Home page, new/, library/, history/, collections/,
                        # compare/, analytics/, settings/, templates/
    api/
      v1/               # REST API
        prompts/        # GET/POST (list/create), [id]/ (get/soft-delete),
                        # enhance-ai/ (main AI enhancement), analyze/, score/,
                        # share/, enhance-all/
        collections/    # GET/POST (list/create), [id]/ (get/update/delete)
        templates/      # GET (public), POST (create), [id]/, [id]/use/
        api-keys/       # GET/POST/DELETE (manage user API keys)
        usage/          # GET (usage stats)
        health/         # Health check
      auth/             # [...nextauth]/, signup/, forgot-password/, reset-password/
      health/           # App-level health check
    share/[token]/      # Public shared prompt page (server component)
    layout.tsx          # Root layout: ThemeProvider + SessionProvider + ToastProvider
    middleware.ts       # Auth guard for /dashboard/* + /api/v1/*, security headers
  components/
    ui/                 # avatar, button, card, dialog, dropdown-menu, input, logo,
                        # scroll-area, separator, sheet, toast
    dashboard/
      layout/           # dashboard-layout, header, sidebar, mobile-nav
      prompt-diff.tsx   # Side-by-side diff viewer
    providers/
      session-provider.tsx
  lib/
    api/                # with-auth.ts (HO wrapper for auth+CSRF+validation), response-headers.ts
    auth/               # config.ts (NextAuth config + providers), csrf.ts (Origin/Referer validation)
    db/                 # prisma.ts (PrismaClient singleton with Neon adapter)
    llm/                # providers.ts (callLLM — direct fetch to OpenAI/Anthropic/OpenRouter)
    validations/        # prompts.ts, collections.ts, templates.ts, common.ts (Zod schemas)
    api-error.ts        # Helper: apiError, apiValidation, apiNotFound
    context-memory.ts   # Client-side context blocks for enhancement (localStorage)
    crypto.ts           # AES-256-GCM encrypt/decrypt
    email.ts            # Resend email sending for password reset
    logger.ts           # Structured JSON logger
    rate-limit.ts       # In-memory token bucket (20 req/day per user)
    token-calculator.ts # Token estimation + cost estimates per model
    utils.ts            # cn() — clsx + tailwind-merge
prisma/
  schema.prisma         # 8 models: User, Account, Session, Prompt, Version, Analysis,
                        # Collection, Template, ApiKey, UsageLog, Analytics
  seed.ts               # DB seed script
extension/              # Chrome extension (manifest v3)
  manifest.json
  content.js            # Injected into ChatGPT/Claude/Gemini — adds "Prompt+" button beside input,
                        # opens modal that calls real API via background.js, shows loading + error states
  background.js         # Fetches enhance-ai API (tries prod URL first, falls back to localhost)
  popup.html            # Quick optimizer popup: textarea → enhance → copy with loading/error/success feedback
  popup.js              # Sends message to background.js for API call, inline feedback (no alerts)
docs/                   # Architecture, component hierarchy, workflows, database, etc.
```

## Database Models (Prisma — PostgreSQL)
- **User**: email, name, avatar, passwordHash, provider (email/github/google), resetToken, soft-delete
- **Account**: OAuth accounts linked to users
- **Session**: Session tokens (JWT strategy primary, but session model exists)
- **Prompt**: originalText, enhancedText, model, category, tags, tone, length, score (JSON), analysis (JSON), isFavorite, isArchived, sharedToken, soft-delete. Relations: user, collection, versions, analyses
- **Version**: versioned text snapshots per prompt (auto-saved on enhance)
- **Analysis**: AI analysis result per prompt (intent, category, complexity, confidence, entities, keywords, missing fields, suggestions)
- **Collection**: user-owned folder (name, description, color, icon, soft-delete)
- **Template**: system/official templates (title, description, category, prompt, variables (JSON), model, usageCount)
- **ApiKey**: user API keys per provider (encrypted with AES-256-GCM)
- **UsageLog**: per-request usage (action, provider, model, tokensIn, tokensOut, latencyMs, success)
- **Analytics**: tracked events with userId, promptId, action, metadata (JSON)

## Authentication
- NextAuth v5 with JWT session strategy (30-day expiry)
- Providers: Credentials (email/password with bcrypt), GitHub, Google (conditional on env vars)
- `middleware.ts`: guards `/dashboard/*` and `/api/v1/*` routes by decoding JWT cookie
- CSRF protection in `with-auth.ts`: validates Origin/Referer headers + requires custom header or application/json content-type
- Password reset flow: forgot-password generates resetToken → email via Resend → reset-password with token

## API v1 Endpoints (src/app/api/v1/)

### `/prompts`
- `GET` — List user prompts (paginated, searchable, soft-delete filtered)
- `POST` — Create new prompt (`createPromptSchema`)
- `GET /[id]` — Get single prompt with versions (uses `with-auth` HOF)
- `DELETE /[id]` — Soft-delete prompt

### `/prompts/enhance-ai` (main feature)
- `POST` — AI enhancement via `with-auth` HOF
- Rate-limited (20/day token bucket)
- Resolves API key chain: user-provided key > stored encrypted key > env var (OpenRouter > Anthropic > OpenAI)
- Calls `buildArchitectMetaPrompt()` — 8-step meta-prompt compiler → `callLLM()`
- Saves version snapshot, usage log, updates API key usage count
- Returns enhanced text + provider/model metadata

### `/prompts/analyze`
- `POST` — AI analysis with heuristic fallback (word-count based)
- Returns: intent, category, complexity (1-5), confidence, entities, keywords, missing fields, suggestions

### `/prompts/score`
- `POST` — AI scoring with heuristic fallback
- Returns: total score (0-100) + 6 dimensions (clarity, specificity, structure, context, length, actionability) + strengths/weaknesses/recommendations

### `/prompts/share`
- `POST` — Generate shared token (URL) for a prompt
- `DELETE` — Remove shared token

### `/collections`
- `GET` — List collections with prompt counts
- `POST` — Create collection
- `GET/PUT/DELETE /[id]` — Get/update/delete collection

### `/templates`
- `GET` — Public template listing (filterable by category, model, search, official flag)
- `POST` — Create template (authenticated)
- `GET/PUT/DELETE /[id]` — Per-template operations
- `/templates/[id]/use` — Track template usage

### `/api-keys`
- `GET` — List user's stored keys (provider, active, dates, no raw key)
- `POST` — Store API key (encrypted via AES-256-GCM)
- `DELETE` — Remove key(s)

### `/usage`
- `GET` — User usage stats (total, by action, by model, daily trends)

### `/health`
- Simple health check (static response)

## Frontend Routes

### Marketing (`/(marketing)`)
- `/` — Landing page (features: AI Enhancement, Prompt Scoring, Templates, Free)
- `/features` — Features page
- `/docs` — Documentation
- `/contact` — Contact form

### Auth (`/(auth)`)
- `/login` — Sign in (email/password + OAuth buttons)
- `/signup` — Create account
- `/forgot-password` — Request password reset
- `/reset-password` — Set new password with token

### Dashboard (`/(dashboard)`)
- `/dashboard` — Home with quick actions (New, Library, History, Collections, Compare, Templates)
- `/dashboard/new` — Create & enhance a prompt (main workflow: write → analyze → score → enhance)
- `/dashboard/library` — Browse/paginate saved prompts
- `/dashboard/history` — Usage history
- `/dashboard/collections` — Manage folders
- `/dashboard/compare` — Side-by-side diff (original vs enhanced)
- `/dashboard/analytics` — Usage stats & insights
- `/dashboard/settings` — Profile, API keys, theme, account
- `/dashboard/templates` — Browse & use prompt templates

### Shared
- `/share/[token]` — Public read-only prompt view with CTA to sign up

## Dashboard UI Layout
- **Desktop**: Collapsible sidebar (main nav, content nav, insights, account) + header + content area
- **Mobile**: Hamburger menu → Sheet overlay (sidebar content) + bottom nav bar
- **Header**: Page title, search, theme toggle, notifications icon, user avatar dropdown (profile, API keys, preferences, logout)
- **Sidebar**: Groups: Main (Dashboard, New Prompt, Templates), Content (Library, History, Collections, Compare), Insights (Analytics), Account (Settings). Daily usage banner at bottom.

## UI Components (base-ui styled with Tailwind)
- `button.tsx` — Variants: default, destructive, outline, secondary, ghost, link
- `card.tsx` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `dialog.tsx` — Modal dialog with overlay
- `sheet.tsx` — Slide-in panel (used for mobile sidebar)
- `dropdown-menu.tsx` — Context menu (user avatar, etc.)
- `avatar.tsx` — User avatar with image + fallback
- `input.tsx` — Styled input
- `toast.tsx` — Toast notification system
- `scroll-area.tsx` — Custom scroll area
- `separator.tsx` — Divider line
- `logo.tsx` — Logo component

## LLM Integration Pattern
1. Client sends `POST /api/v1/prompts/enhance-ai` with text + optional model/provider/tone/length
2. `with-auth` HOF validates session, CSRF, and body schema
3. Resolve API key: user-provided > DB-stored (decrypted) > env var
4. `buildArchitectMetaPrompt()` constructs a structured meta-prompt
5. `callLLM()` in `src/lib/llm/providers.ts` handles all providers:
   - OpenAI: chat/completions with system+user messages
   - Anthropic: messages API with system param
   - OpenRouter: chat/completions with additional headers
6. Response saved as Version, logged to UsageLog
7. Falls back to heuristic if no API key available (for analyze/score)

## Key Libraries & Patterns
- `cn()` utility from `clsx` + `tailwind-merge` for class composition
- `with-auth` higher-order function in `src/lib/api/with-auth.ts` — wraps route handlers with auth, CSRF validation, body parsing, error handling, and logging
- `jsonResponse` helper — enriches responses with `x-request-id`, rate-limit headers
- In-memory rate limiting (token bucket, 20/day, no persistence)
- AES-256-GCM encryption for stored API keys (`src/lib/crypto.ts`)
- Heuristic fallback for analyze/score when no API key available
- Soft-delete pattern for prompts and collections (deletedAt field)

## Chrome Extension
- Manifest v3, injects into ChatGPT, Claude.ai, and Gemini
- **Content script**: Detects chat input fields, injects a floating pill button at bottom-right corner of input (`pp-wrap`). Button has a diamond sparkle icon with subtle glow animation + "Prompt+" label, frosted glass background. On click, opens modal → calls real API → Replace & Insert.
- **Popup**: Quick optimizer — paste prompt → calls API → auto-copies to clipboard. Inline success/error feedback (no alerts).
- **Background**: Fetches `enhance-ai` API (tries `prompt-plus-three.vercel.app` first, falls back to `localhost:3000`). 15s timeout.
- Targets: `https://chatgpt.com/*`, `https://claude.ai/*`, `https://gemini.google.com/*`
- Button design: frosted glass (`backdrop-filter: blur`), subtle glow pulse animation on the icon, entrance slide-up animation, hover expands brightness/border. All styling inline in content.js.
- **Credit bar**: Below the Prompt+ button, a thin 3px progress bar + "N/20" text showing remaining daily free-tier credits. Stored in `chrome.storage.local`, resets after 24h. Color shifts: green (>50%), yellow (>20%), red (≤20%). Decrements on each enhance click.

## Config & Env Vars
- `.env` — DATABASE_URL, AUTH_SECRET/NEXTAUTH_SECRET, ENCRYPTION_KEY
- Optional: GITHUB_CLIENT_ID/GOOGLE_CLIENT_ID, RESEND_API_KEY, SMTP_FROM
- Optional API keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY
- FREE_TIER_DAILY_LIMIT (default 20)
- `.env.example` has template

## Tests (Vitest — src/__tests__/)
- `auth-routes.test.ts` — Auth route behavior
- `crypto.test.ts` — AES encrypt/decrypt
- `integration.test.ts` — End-to-end flows
- `polish.test.ts` — UI polish checks
- `reliability.test.ts` — Error handling
- `security.test.ts` — Security checks
- `validations.test.ts` — Zod schema validation

## Deployment
- Vercel-ready (`.vercel/`, `next.config.ts`)
- Postgres via Neon (Prisma adapter for Neon HTTP)
- `prisma db push --accept-data-loss` runs on build
- Postinstall: `prisma generate`
