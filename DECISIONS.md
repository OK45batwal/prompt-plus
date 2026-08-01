# Architecture Decision Records (ADR) — Prompt+

This document records high-stakes architectural decisions, security contracts, and technical tradeoffs in Prompt+.

---

## ADR-001: Structural Security Enforcement for API v1 Routes

- **Status**: Accepted
- **Context**: State-changing API routes (POST, PUT, PATCH, DELETE) previously had risk of omitting CSRF or session checks if built with raw `export async function POST`.
- **Decision**: All API v1 routes must be wrapped with `withAuth()`. An automated static analysis checker script (`scripts/check-api-routes.mjs`) runs in CI and `npm test`. Any unwrapped mutating method lacking an explicit `// @public-route` annotation fails the build.
- **Consequences**: Zero possibility of silently dropping anti-CSRF or session verification on new API routes.

---

## ADR-002: On-Device AI First Architecture (Chrome Gemini Nano)

- **Status**: Accepted
- **Context**: Users require instantaneous prompt enhancements without sending sensitive prompt text to third-party cloud servers.
- **Decision**: Default to Chrome Built-in AI (`window.ai.languageModel` / `LanguageModel` Prompt API) across the extension and floating toolbar. Fallback to server API routes only when requested.
- **Consequences**: Sub-100ms local inference latency, zero server compute costs, 100% data privacy.

---

## ADR-003: Sliding-Window Rate Limiting with Redis Fallback

- **Status**: Accepted
- **Context**: In-memory `Map` rate limit buckets reset on Vercel serverless cold starts.
- **Decision**: Implement sliding-window rate limiting in `src/lib/rate-limit.ts` using verified edge IP headers (`x-real-ip`, `x-vercel-forwarded-for`) with support for Upstash Redis REST fallback.
- **Consequences**: Untamperable IP resolution and scalable abuse protection across multi-region serverless deployments.

---

## ADR-004: Production ENCRYPTION_KEY Hard Fail-Loudly Contract

- **Status**: Accepted
- **Context**: Falling back to weak default encryption keys in production allows secret decryption if environment variables are misconfigured.
- **Decision**: In `NODE_ENV === "production"`, `src/lib/crypto.ts` immediately throws a fatal exception on boot if `ENCRYPTION_KEY` is missing or under 32 characters.
- **Consequences**: Guarantees zero unencrypted or weakly-encrypted user API keys in production database stores.
