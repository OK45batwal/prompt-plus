---
phase: 02-code-review-command
reviewed: 2026-07-29T12:00:00Z
depth: deep
files_reviewed: 48
files_reviewed_list:
  - src/app/api/auth/[...nextauth]/route.ts
  - src/app/api/auth/change-password/route.ts
  - src/app/api/auth/delete-account/route.ts
  - src/app/api/auth/forgot-password/route.ts
  - src/app/api/auth/providers/route.ts
  - src/app/api/auth/resend-otp/route.ts
  - src/app/api/auth/reset-password/route.ts
  - src/app/api/auth/signup/route.ts
  - src/app/api/auth/verify-email/route.ts
  - src/app/api/health/route.ts
  - src/app/api/v1/api-keys/route.ts
  - src/app/api/v1/collections/[id]/route.ts
  - src/app/api/v1/collections/route.ts
  - src/app/api/v1/extension/enhance/route.ts
  - src/app/api/v1/health/route.ts
  - src/app/api/v1/prompts/[id]/route.ts
  - src/app/api/v1/prompts/[id]/versions/route.ts
  - src/app/api/v1/prompts/analyze/route.ts
  - src/app/api/v1/prompts/enhance-ai/route.ts
  - src/app/api/v1/prompts/route.ts
  - src/app/api/v1/prompts/score/route.ts
  - src/app/api/v1/prompts/share/route.ts
  - src/app/api/v1/templates/[id]/route.ts
  - src/app/api/v1/templates/[id]/use/route.ts
  - src/app/api/v1/templates/route.ts
  - src/app/api/v1/usage/route.ts
  - src/app/(auth)/login/actions.ts
  - src/app/(auth)/login/page.tsx
  - src/app/(auth)/signup/page.tsx
  - src/app/(dashboard)/dashboard/analytics/page.tsx
  - src/app/(dashboard)/dashboard/collections/page.tsx
  - src/app/(dashboard)/dashboard/compare/page.tsx
  - src/app/(dashboard)/dashboard/history/page.tsx
  - src/app/(dashboard)/dashboard/library/page.tsx
  - src/app/(dashboard)/dashboard/new/page.tsx
  - src/app/(dashboard)/dashboard/settings/page.tsx
  - src/app/(dashboard)/dashboard/templates/page.tsx
  - src/app/(dashboard)/layout.tsx
  - src/app/layout.tsx
  - src/app/share/[token]/page.tsx
  - src/components/dashboard/prompt-diff.tsx
  - src/components/ui/toast.tsx
  - src/lib/api-error.ts
  - src/lib/api/response-headers.ts
  - src/lib/api/with-auth.ts
  - src/lib/auth/config.ts
  - src/lib/auth/csrf.ts
  - src/lib/auth/otp.ts
  - src/lib/context-memory.ts
  - src/lib/crypto.ts
  - src/lib/db/prisma.ts
  - src/lib/email.ts
  - src/lib/llm/meta-prompt.ts
  - src/lib/llm/providers.ts
  - src/lib/logger.ts
  - src/lib/rate-limit.ts
  - src/lib/token-calculator.ts
  - src/lib/utils.ts
  - src/lib/validations/auth.ts
  - src/lib/validations/collections.ts
  - src/lib/validations/common.ts
  - src/lib/validations/prompts.ts
  - src/lib/validations/templates.ts
  - src/proxy.ts
findings:
  critical: 2
  warning: 14
  info: 6
  total: 22
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-07-29T12:00:00Z
**Depth:** deep
**Files Reviewed:** 48
**Status:** issues_found

## Summary

Reviewed the entire prompt-plus codebase (62 source files across API routes, auth, LLM provider, library, and dashboard components). Found 2 critical security issues, 14 warnings (bugs and security gaps), and 6 info items. Key concerns: weak cryptographic OTP generation, CSRF bypass gap, in-memory rate limiter that doesn't work in serverless, dead middleware code that was meant to protect dashboard routes, LLM API calls with no timeout, and missing rate limiting on password reset.

## Critical Issues

### CR-01: Weak OTP Generation Using Math.random()

**File:** `src/lib/auth/otp.ts:4`
**Issue:** OTPs are generated using `Math.random()` which is not cryptographically secure. Node's `Math.random()` is predictable given enough observations, making the 6-digit OTP vulnerable to brute-force or prediction attacks. The `crypto` module is already imported in this file but unused for generation.

**Fix:**
```typescript
// Replace:
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// With:
import crypto from "crypto";

export function generateOtp(): string {
  // Use crypto.randomInt for cryptographically secure OTP
  return String(crypto.randomInt(100000, 999999));
}
```

### CR-02: CSRF Protection Bypass When Origin/Referer Headers Are Absent

**File:** `src/lib/auth/csrf.ts:24-58`
**Issue:** The CSRF validation returns `{ valid: true }` when both `origin` and `referer` headers are missing AND the request has `Content-Type: application/json` (line 24). An attacker can craft a cross-origin form with `enctype="text/plain"` and a properly formatted JSON body, or use a Fetch API request with a manipulated `Origin` header. The check only validates Origin/Referer when they're present — absent headers pass through.

**Fix:**
```typescript
// In validateCsrf, add a check when both origin and referer are missing
// for state-changing methods:
if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
  const origin = headers.get("origin");
  const referer = headers.get("referer");
  const host = headers.get("host") || headers.get("x-forwarded-host");

  if (!origin && !referer) {
    return {
      valid: false,
      reason: "Missing Origin and Referer headers for CSRF validation"
    };
  }
  // ... rest of existing checks
}
```

Also note: the `withAuth` wrapper applies CSRF, but several v1 routes (`src/app/api/v1/prompts/route.ts`, `src/app/api/v1/collections/route.ts`, `src/app/api/v1/templates/route.ts`) use direct request handling without `withAuth`, so they have NO CSRF protection at all on mutating methods.

## Warnings

### WR-01: In-Memory Rate Limiter Broken in Serverless Deployments

**File:** `src/lib/rate-limit.ts:6`
**Issue:** The `userBuckets` Map is in-memory. On Vercel or any serverless platform, each cold start creates a fresh Map. A user can simply wait for function eviction (typically minutes of inactivity) or send requests that trigger different instances to bypass the 20/day limit entirely. Additionally, concurrent requests within the same event loop tick can race (despite Node's single thread, the synchronous nature here makes this unlikely but possible).

**Fix:** Use a shared store (e.g., Upstash Redis, Vercel KV, or database-backed tracking):
```typescript
// ponytail: in-memory Map is fine for single-server dev, but for production:
// Replace in-memory Map with Vercel KV / Upstash Redis calls.
// The DAILY_LIMIT check should atomically increment and compare:
// await kv.incr(userKey) > DAILY_LIMIT → reject
```

### WR-02: LLM API Calls Have No Timeout

**File:** `src/lib/llm/providers.ts:81`
**Issue:** The `fetch()` call to external LLM APIs has no timeout via `AbortController`. If Anthropic/OpenAI/OpenRouter hangs (which happens in practice), the serverless function will hang until the platform kills it (typically 10-30 seconds on Vercel), wasting billable duration and user experience.

**Fix:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

const res = await fetch(url, {
  method: "POST",
  headers,
  body: JSON.stringify(body),
  signal: controller.signal,
});
clearTimeout(timeout);
```

### WR-03: proxy.ts Is Dead Code — Middleware Will Never Run

**File:** `src/proxy.ts:1-27`
**Issue:** Next.js middleware must be in a file named `middleware.ts` (or `.js`) at the root of the project or `src/` directory. The file is named `proxy.ts` at `src/proxy.ts`, so it is never picked up. The dashboard route protection via cookie check and the `/login` redirect logic is completely dead. The dashboard layout (`src/app/(dashboard)/layout.tsx`) provides redundant server-side auth check, but the proxy's specific redirect-behavior (preserving `callbackUrl` for post-login redirect) is lost.

**Fix:** Rename to `src/middleware.ts`:
```bash
mv src/proxy.ts src/middleware.ts
```
And ensure the config matcher aligns with the actual intended routes.

### WR-04: Missing Rate Limiting on Password Reset

**File:** `src/app/api/auth/reset-password/route.ts:1-46`
**Issue:** The email verification endpoint (`verify-email/route.ts`) tracks `emailOtpAttempts` and rejects after 5 failures. The password reset endpoint (`reset-password/route.ts`) does NOT track attempts. An attacker can brute-force the 6-digit OTP (1M combinations) without any throttle because `verifyOtp` is called directly without rate limiting.

**Fix:** Add attempt tracking, similar to email verification:
```typescript
// Before verifyOtp check:
if (user.resetAttempts && user.resetAttempts >= 5) {
  return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
}
// After failed verifyOtp:
await getDb().user.update({
  where: { id: user.id },
  data: { resetAttempts: { increment: 1 } },
});
```
You'll also need a `resetAttempts` field in the User model (add to schema: `resetAttempts Int @default(0)`).

### WR-05: Auth Secret Leaked via process.env Mutation

**File:** `src/lib/auth/config.ts:11-19`
**Issue:** The fallback `"development-secret-fallback-key-32chars"` is used when no auth secret env var is set. While the production check throws an error, in development any user with access to this repo can determine the exact auth secret used for session signing. This allows forging session tokens in dev. More critically, line 18-19 mutates `process.env` at import time: `process.env.AUTH_SECRET = secret`, which may cause issues with module caching and environment variable immutability expectations.

**Fix:**
```typescript
// Remove the process.env mutations on lines 18-19
// The secret variable itself is passed to NextAuth config directly
// These mutations are unnecessary and potentially harmful
```

### WR-06: Template Privilege Escalation (Any User Can Set isOfficial)

**File:** `src/app/api/v1/templates/route.ts:96`
**Issue:** The `createTemplateSchema` accepts `isOfficial` from the request body with only `.optional().default(false)`. An authenticated user can send `{ "isOfficial": true }` to create official templates, which are supposed to be system-curated.

**Fix:**
```typescript
// Change the schema to strip isOfficial for non-admin users:
// Option A: Remove from schema, always set false:
data: {
  // ...
  isOfficial: false,
}

// Option B: Add admin role check:
const session = await auth();
const isAdmin = session?.user?.role === "admin";
// ...and only use isOfficial from body if isAdmin
```

### WR-07: Missing CSRF Protection on Direct API v1 Routes

**Files:**
- `src/app/api/v1/prompts/route.ts:57-93` (POST)
- `src/app/api/v1/collections/route.ts:55-90` (POST)
- `src/app/api/v1/templates/route.ts:65-115` (POST)
- `src/app/api/v1/prompts/share/route.ts:6-52` (POST, DELETE)
- `src/app/api/v1/prompts/[id]/versions/route.ts:40-95` (POST)

**Issue:** These routes use direct `auth()` + handler patterns instead of the `withAuth` wrapper. The `withAuth` wrapper includes CSRF validation via `validateCsrf()`. These routes skip that entirely, making them vulnerable to CSRF attacks on mutating HTTP methods.

**Fix:** Wrap handlers with `withAuth` where possible, or at minimum call `validateCsrf()` directly at the start of each mutating handler.

### WR-08: Prisma Search Without Case-Insensitive Mode

**Files:**
- `src/app/api/v1/prompts/route.ts:37-39`
- `src/app/api/v1/templates/route.ts:33-35`

**Issue:** The `contains` filter on PostgreSQL is case-sensitive by default. Searching for "hello" will NOT match "Hello" or "HELLO". Users will be confused when search doesn't find their saved prompts.

**Fix:**
```typescript
// Add mode: 'insensitive' to each contains search:
{ title: { contains: search, mode: 'insensitive' } },
{ originalText: { contains: search, mode: 'insensitive' } },
```

### WR-09: LLM Response JSON Extraction Is Fragile

**Files:**
- `src/app/api/v1/prompts/analyze/route.ts:149-155`
- `src/app/api/v1/prompts/score/route.ts:144-150`

**Issue:** The code uses `indexOf("{")` and `lastIndexOf("}")` to extract JSON from LLM responses. If the response contains nested JSON objects (e.g., within markdown code blocks), `lastIndexOf("}")` may match an inner closing brace, producing malformed JSON. The fallback heuristic hides the failure, but users get low-quality heuristic scores without knowing the LLM response was parsed incorrectly.

**Fix:** Use a JSON-first extraction with regex:
```typescript
const jsonMatch = response.content.match(/\{[\s\S]*\}/);
const jsonString = jsonMatch ? jsonMatch[0] : response.content;
```

### WR-10: Settings "Save" Button Does Nothing

**File:** `src/app/(dashboard)/dashboard/settings/page.tsx:259-262`
**Issue:** The `handleSave` function only sets a visual "Saved" confirmation state that auto-dismisses after 2 seconds. It does not actually persist any settings changes (name, email, preferences, notification toggles). Users will change their name, tone preferences, or notification settings, hit "Save," see a success message, and the changes will be lost on page refresh.

**Fix:** Implement actual API calls to persist settings:
```typescript
const handleSave = async () => {
  try {
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, defaultModel, defaultTone, toggles }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  } catch {
    // handle error
  }
};
```

### WR-11: Collections Page Duplicate Data Fetching

**File:** `src/app/(dashboard)/dashboard/collections/page.tsx:25-68`
**Issue:** There are two identical data-fetching implementations: the named function `fetchCollections` (line 25) and a duplicate inline call inside `useEffect` (line 46-68). Both do exactly the same thing. The `useEffect` call doesn't use the `fetchCollections` function. This makes maintenance harder and wastes bytes.

**Fix:**
```typescript
useEffect(() => {
  fetchCollections();
}, []);
```
Remove the duplicate block inside useEffect and just call `fetchCollections()`.

### WR-12: Unauthenticated Template Usage Tracking

**File:** `src/app/api/v1/templates/[id]/use/route.ts:4-22`
**Issue:** This route increments usage count for any template without any authentication. An attacker can repeatedly call this to inflate usage counts. The catch block returns 404 for ALL errors, including database connection failures, masking the real error.

**Fix:** 
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest with proper error types
}
```

### WR-13: Change Password Does Not Invalidate Sessions

**File:** `src/app/api/auth/change-password/route.ts:38-42`
**Issue:** After changing the password, there is no invalidation of existing sessions. A user who changes their password (e.g., after account compromise) will leave all existing sessions active. The old password still works for any active JWT sessions until they expire (30 days by default).

**Fix:** After password change, invalidate existing sessions:
```typescript
await getDb().session.deleteMany({ where: { userId: user.id } });
// Force re-login by updating the session's token
```

### WR-14: Unhandled Auth Redirect Error in Login Action

**File:** `src/app/(auth)/login/actions.ts:8-19`
**Issue:** The `signIn("credentials", formData)` call throws a redirect error on success (NextAuth v5 throws `NEXT_REDIRECT` for routing). The catch block catches `AuthError` instances, then re-throws non-AuthError errors. This `throw error` at line 18 will propagate as an unhandled promise rejection in the client component if the redirect is not an `AuthError`.

**Fix:** 
```typescript
export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password";
        case "CallbackRouteError":
          return "Authentication failed. Please try again.";
        default:
          return "Something went wrong.";
      }
    }
    // NextAuth redirects on success by throwing — let it propagate
    throw error;
  }
}
```

## Info

### IN-01: Unused Import — `Edit` Icon

**File:** `src/app/(dashboard)/dashboard/collections/page.tsx:4`
**Issue:** The `Edit` icon is imported but the edit button it feeds (line 152) has no onClick handler — it's purely decorative. Consider either removing the icon or wiring it to an edit action.

### IN-02: History Page Always Shows Empty State

**File:** `src/app/(dashboard)/dashboard/history/page.tsx:21`
**Issue:** The `history` state is initialized as an empty array `[]` and never populated from an API. Users always see "No history yet." This appears to be a feature not yet wired up to a backend endpoint.

**Fix:** Fetch history from `/api/v1/prompts/enhance-ai` or a dedicated history endpoint:
```typescript
const [history, setHistory] = useState<HistoryItem[]>([]);

useEffect(() => {
  fetch("/api/v1/usage?action=enhance")
    .then(res => res.json())
    .then(data => setHistory(data.data || []))
    .catch(() => {});
}, []);
```

### IN-03: Signup Returns 409 for Existing Users

**File:** `src/app/api/auth/signup/route.ts:24`
**Issue:** The route returns HTTP 409 with "Invalid input" when the user already exists. The 409 status code reveals the existence of the account (distinguishes from 400). For better security, return the same status as validation failures (400) to not leak user existence.

**Fix:**
```typescript
return NextResponse.json({ error: "Invalid input" }, { status: 400 });
```

### IN-04: Encrypted API Key Storage in localStorage (Client-Side)

**File:** `src/app/(dashboard)/dashboard/settings/page.tsx:221-229`
**Issue:** When a user submits an API key, it's saved both server-side (encrypted) and client-side (plaintext in `localStorage` at key `promptplus_user_apikeys`). The client-side copy is unencrypted and accessible to any JavaScript running on the page, including third-party scripts. This contradicts the UI claim that "Your API keys are stored securely with AES-256-GCM encryption."

**Fix:** Remove the localStorage persistence, or encrypt the API key before storing on the client. The server-side encrypted storage is sufficient.

### IN-05: verify-email Route Exposes Email Existence via Different Error Messages

**File:** `src/app/api/auth/verify-email/route.ts`
**Issue:** The route returns specific error messages: "Too many attempts. Request a new code." (429) and "Code expired. Request a new one." (400) and "Invalid code" (400). An attacker can distinguish between no account, locked account, expired code, and wrong code by the error message. The `forgot-password` route correctly returns the same message regardless.

**Fix:** Use uniform error messages for all failure cases.

### IN-06: Dead Code — Proxy File Matcher Configuration

**File:** `src/proxy.ts:24-26`
**Issue:** Even if the file were properly named as middleware, the `config.matcher` export inside a non-middleware file has no effect. This is configuration drift that should be cleaned up or properly activated.

---

_Reviewed: 2026-07-29T12:00:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
