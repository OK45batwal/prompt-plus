Backend Fixes & Improvements Plan

🔴 Critical (Security & Correctness)
#	Issue	Location	Impact
1	Missing NEXTAUTH_SECRET / AUTH_SECRET in production	vercel env	Auth tokens unsigned → session hijacking possible
2	No AUTH_TRUST_HOST or NEXTAUTH_URL set	Vercel env / lib/auth/config.ts	NextAuth v5 may reject valid callbacks in production
3	In-memory rate limit bucket resets on deploy	lib/rate-limit.ts	Users bypass daily limit after each deploy; not scalable
4	Hardcoded fallback ENCRYPTION_KEY	lib/crypto.ts:6	If ENCRYPTION_KEY not set in prod, all encrypted API keys decrypt with same weak default
5	OAuth providers registered without env checks	lib/auth/config.ts:12-19	NextAuth initializes GitHub/Google providers with undefined → crashes or /api/auth/error on callback
6	No CSRF protection on state-changing API routes	All POST/PUT/DELETE in app/api/v1/*	Vulnerable to CSRF via browser cookies
7	Middleware only checks auth, not permissions	middleware.ts	No authorization layer; any authenticated user can access all /api/v1 routes

🟠 High (Reliability & Architecture)
#	Issue	Location	Impact
8	Prisma 7 driver adapter requires @prisma/adapter-neon	lib/db/prisma.ts	Works now but not idiomatic; connection pooling not configured
9	getDb() singleton not properly scoped for serverless	lib/db/prisma.ts	Cold starts may leak connections; no await prisma.$connect()
10	No request validation middleware	All routes duplicate request.json() + safeParse	Boilerplate, inconsistent error format, easy to forget
11	Duplicate auth check in every route	All app/api/v1/*/route.ts	Violates DRY; easy to forget auth() call
12	No structured logging / error tracking	Throughout	Hard to debug production issues
13	LLM provider errors not differentiated	lib/llm/providers.ts	All failures fall back silently; no alerting on quota/key errors
14	Rate limit uses global Map (not shared across instances)	lib/rate-limit.ts	Won't work in multi-instance Vercel/container deployments
15	Missing DELETE endpoints for collections, prompts, templates	app/api/v1/*	No way to clean up user data (GDPR compliance gap)

🟡 Medium (Developer Experience & Maintainability)
#	Issue	Location
16	Inconsistent response shape	Routes return { data }, { error }, { data, total, page }, { data: { ... } }
17	No OpenAPI / Swagger spec	Missing
18	Zod schemas defined inline or split across files	lib/validations/*
19	No integration tests for API routes	__tests__/ only unit tests
20	bcrypt with cost 12 in signup but default in authorize	lib/auth/config.ts vs app/api/auth/signup/route.ts
21	No health check / readiness endpoint	Missing
22	No API versioning strategy in URL	/api/v1/ hardcoded
23	Prompt score stored as untyped JSON	schema.prisma:82
24	Template variables field always empty array	templates/route.ts:73
25	No pagination cursor support	All list endpoints use offset/limit

🟢 Low (Nice-to-Have / Polish)
#	Improvement	Area
26	Add request ID header for tracing	Middleware
27	Implement API key rotation / expiry reminders	api-keys
28	Add webhook support for async LLM jobs	enhance-ai, analyze, score
29	Cache template list with next/cache	templates/route.ts
30	Add lastLoginAt update on credential sign-in	lib/auth/config.ts:47-52 (already done!)
31	Extract common auth() + getDb() into HOC/wrapper	All routes
32	Add X-RateLimit-* headers to all rate-limited endpoints	rate-limit.ts
33	Soft-delete instead of hard delete for user data	Prisma models + routes
Suggested Execution Order
1. Phase 1 (Security): #1-7 — deploy-blocking
2. Phase 2 (Architecture): #8-15 — refactor auth, rate-limit, validation, logging
3. Phase 3 (API Consistency): #16-22 — unify response format, add OpenAPI, versioning
4. Phase 4 (Features): #23-25, #27-33 — complete missing CRUD, improve schemas, add observability
