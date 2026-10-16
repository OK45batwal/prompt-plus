# UI/UX + backend improvement plan

Status: proposal. Nothing in here is implemented yet.
Every file:line below was read from the tree on 2026-10-16, not inferred.

---

## Ground rules

1. **Truthfulness before polish.** This app's whole pitch is "trustworthy results". The most damaging UX defect in it is not ugliness — it is the UI asserting numbers it does not have. That class of bug ships again and again here (fabricated metrics were already removed once, and leftovers remain). It is fixed first and mechanically.
2. **Delete beats add.** Where the honest fix is "stop showing this", do that instead of building a real version.
3. **No new layers.** Reuse `@base-ui/react` primitives, TanStack Query (installed, unused), Tailwind v4 tokens, and the existing `scripts/check-*.mjs` pattern. No state library, no CSS framework, no new abstraction.
4. **Every async surface has three states.** loading / empty / error. "Failed" must never render as "empty" or "0".
5. **Every phase is independently shippable and verifiable.** `main` is protected by 7 required checks; each PR must leave them green.
6. **Read `node_modules/next/dist/docs/` before writing Next.js code** (per `AGENTS.md`) — this Next version differs from training data.

### What "no AI slop" means here (operational definition)

- No unverifiable number reaches the user. If it isn't measured, it says "unknown", or it doesn't appear.
- One card language, one spacing scale, one type scale, one status-colour set across marketing → app → extension.
- Motion only when it conveys something; always respects `prefers-reduced-motion`.
- No widget built twice. If a second hand-rolled modal/table/tab appears, the first one becomes a primitive.
- Every interactive element has an accessible name and a visible focus state.

---

## What the app is today (context for the plan)

- Next.js App Router, Tailwind v4 (CSS-first tokens in `src/app/globals.css`), shadcn configured with `style: base-nova` and `@base-ui/react` (`components.json`).
- 30 routes, 43 API routes, 9 UI primitives (`src/components/ui/`).
- MV3 Chrome extension: 13 files, hand-written CSS, 6 adapters over 20 declared hosts.
- TanStack Query is installed (`package.json:26`) and mounted (`src/components/providers/query-provider.tsx`, `src/app/layout.tsx:136`) but **never used** — `grep -rn useQuery src/` → 0.

**The diagnosis in one paragraph.** The visual layer is not the problem; three near-misses are. (1) The UI presents invented data as fact in at least nine places. (2) The product's main loop is broken: five entry points link into `/dashboard/new` with the prompt, and the Studio ignores the query string — so "reuse this prompt" and the extension's "Web Studio" handoff silently open an empty editor. (3) Failures are swallowed with `.catch(() => {})` and rendered as zeros and empty states, which the user reads as truth — the same trust bug wearing different clothes. Underneath: three separate design systems (marketing bezel, app `rounded-xl`, extension hand-written CSS), 5 hand-rolled modals with no focus trap, and duplicated v1/v2 backends.

---

## Phase 0 — Tripwires (½ day, do first)

**Goal:** make the truthfulness and wiring rules enforced, not remembered. Prevents the regression that already happened once.

| # | Item | Change |
|---|---|---|
| 0.1 | `scripts/check-honesty.mjs` | New script in the style of `scripts/check-api-routes.mjs`: a small deny-list that fails on fabricated-rating/version/usage literals in shipped source (see Phase 1 for the exact list). Wire into `npm test` and `.github/workflows/ci.yml`. It is a tripwire, not a proof — comment it as such (`shortcut:` comment per house style). |
| 0.2 | Extend the honesty test that already exists | `e2e/measurement-honesty.spec.ts` currently covers the app only. Add assertions that the public layout emits **no** `aggregateRating`, and that no page renders a hardcoded "users"/"reviews" count. |
| 0.3 | Route-caller check | Extend `scripts/check-api-routes.mjs` (or a sibling) to fail when a route has zero callers in `src/`, `extension/`, `e2e/` — the dead-route list in Phase 7 then stays dead. |

**Verify:** `npm test`, `npm run lint`, `npx tsc --noEmit` green; intentionally adding `aggregateRating` must fail the gate.

---

## Phase 1 — The truthfulness purge (the "no slop" core)

**Goal:** every number a user sees is either measured or absent. Mostly deletion.

| # | File | Problem | Fix |
|---|---|---|---|
| 1.1 | `src/app/layout.tsx:109-113` | Hardcoded JSON-LD `aggregateRating: 4.9 / 1280` served on **every** page. There is no review system. Fabricated review markup risks a Google structured-data manual action. | **Delete the `aggregateRating` block.** If ratings are ever collected, generate it from real data server-side. |
| 1.2 | `src/app/(dashboard)/dashboard/templates/page.tsx` (18 `usageCount:` literals, e.g. `:25,:42,:62`) **and** `src/app/api/v1/templates/route.ts` (16 literals, e.g. `:31,:48`) | The same static array is duplicated on client and server, and `usageCount: 1420` is rendered as real usage (`templates/page.tsx:527`). | Delete the client-side copy, fetch from the API. Delete `usageCount` from the payload and the "uses" label — or derive it from `UsageLog`. Do **not** keep a number nobody measured. |
| 1.3 | `src/app/api/v1/notifications/route.ts:19-56` | Four invented notifications ("+40pt quality gain", "v1.3.2 Released") served to every user, backed by in-memory maps that reset on deploy (`:17,:118`). | Delete the fabricated array; return `[]`. Keep the bell and render an honest empty state ("No notifications yet"). Add real triggers only when something real happens (email verified, new version actually deployed). |
| 1.4 | `src/app/api/v1/api-keys/test/route.ts:52-59` | Returns `"Successfully validated … credentials!"` after a **prefix/length check only** — it never contacts the provider. This is a false success on a security-adjacent surface. | Either make one real `models.list` call per provider and report the true result, or relabel honestly: "Format looks valid — not verified with the provider." Lazy-correct option is the relabel; do the real call for OpenAI/Anthropic at minimum. |
| 1.5 | Version strings, all invented and mutually inconsistent: `(marketing)/page.tsx:94` (`v2.1.3`), `(marketing)/layout.tsx:145` (`v1.1.1`), `signup/page.tsx:173`, `(marketing)/extension/page.tsx:21,69` (`v1.2.0`), `settings/page.tsx:743` (`v2.1.3.2`), `dashboard/page.tsx:333,337`, `extension/popup.html:7`, `api/v1/extension/templates/route.ts:101` — vs `package.json` `0.1.0` and `extension/manifest.json:4` `3.0.0`. | One source per artefact: web reads `package.json` version at build time; extension reads `chrome.runtime.getManifest().version`; the API returns the real value. Delete every hardcoded string. |
| 1.6 | `(marketing)/page.tsx:510` (`-60% hallucinations`), `features/page.tsx:12` (`~40% token reduction`), `prompt-cost-calculator/page.tsx:26,79,88` (`-40%`, blind `× 0.6`), `prompt-engineering-guide/page.tsx:24` | Unmeasured quantitative claims presented as product performance. | Delete the unverifiable ones. Keep only claims the product can demonstrate; if a benchmark exists, cite it and link it. |
| 1.7 | `(marketing)/page.tsx:458-492` | Comparison table asserting competitor facts ("$9–$19/month", "Unencrypted logs", "Mandatory credit card wall") with no named competitor or source. | Delete, or rewrite as neutral capability statements about Prompt+ with no claims about others. |
| 1.8 | `signup/page.tsx:144` ("Join thousands of builders"), `login/page.tsx:241-256` (hardcoded "Extension Auto-Sync Ready / Active" panel) | Invented user count; status panel shows a state it hasn't checked. | Delete the count. Drive the status panel from the same real check the extension-sync route already performs, or remove it. |
| 1.9 | `(marketing)/page.tsx:205-208,228-233` (static "100/100", `w-[92%]`) | A static mock presented as product evidence. | The demo component already labels itself honestly elsewhere (`prompt-demo.tsx:135,204,232`). Make the hero mock carry the same label, or replace with the labelled component. |
| 1.10 | `extension/popup.html:1488-1492,1351` (`Connected`, `Studio`, `100 / 100`), `popup.js:825-832` (`calculateScore` hardcoded 70+…) | Placeholder values visible before sync; a client-side score that the server ignores and recomputes (`api/v1/extension/save-prompt/route.ts:74`). | Render "—"/unknown until real data arrives; delete the client score and show the server's, or none. |
| 1.11 | `extension/content.js:699-738` + `:803`, `:1045` | Hardcoded model context limits printed as `Limit: 128K` while the same code sets `contextLimitKnown = false` (`:1402`) and the README claims limits are not treated as confirmed. | Print "unknown" when `contextLimitKnown` is false; keep the numbers only as internal heuristics, never as displayed fact. |

**Deletes:** 4 fake notifications, the duplicated template array (~265 lines), the fabricated JSON-LD, ~8 hardcoded version strings, the competitor table.
**Verify:** `scripts/check-honesty.mjs` passes; grep for `aggregateRating`, `usageCount:`, `Successfully validated` returns nothing in shipped code; `e2e/measurement-honesty.spec.ts` extended and green.

---

## Phase 2 — Fix the broken core loop

**Goal:** the product does what its own UI promises. These are live bugs, not polish.

| # | File | Problem | Fix |
|---|---|---|---|
| 2.1 | `src/app/(dashboard)/dashboard/new/page.tsx` — **zero** `useSearchParams` matches | Five entry points hand the Studio a prompt and the Studio ignores it: `library/page.tsx:183,207` (`?promptId=`), `history/page.tsx:95` (`?prompt=`), and the extension's Web Studio (`extension/background.js:378-381` appends `?prompt=&tone=`). "Reuse this prompt" opens an empty editor. | Read the params (Next 16: `useSearchParams`, wrapped in the existing Suspense boundary pattern), hydrate the editor, select the tone. Support `promptId` (load from API) and `prompt` (inline text). This one change fixes both the app and the extension handoff. |
| 2.2 | `dashboard/page.tsx:49,109` vs `api/v1/usage/route.ts:46-56` | UI reads `usage.monthly.used`; the API returns `used` at the top level. The "this month" stat always renders **0** — a real-looking number that is always wrong. | Fix the contract on one side (rename to `monthly: { used }` in the response, or read `used` in the UI). Add a test asserting the displayed value. |
| 2.3 | `dashboard/page.tsx:255-262` | The "Side-by-Side Model Lab" card links to `/dashboard/compare`, while `/dashboard/model-lab` exists and does something different. | Point it at `/dashboard/model-lab`, or relabel the card to what it links to. |
| 2.4 | `settings/page.tsx:1010-1032` + `api/v1/user/preferences/route.ts:5-21` | "Default Target Model" and "Default Prompt Tone" update local state and are never saved; `new/page.tsx:137` reads `localStorage["pp_prefs"]` which **nothing ever writes** (grep-confirmed). Preferences silently do nothing. | Add the two fields to the preferences contract and persist them; have the Studio read them. Persist for real — the current store is an in-memory `Map` (`route.ts:24`) that dies on every deploy. See 7.4. |
| 2.5 | `library/page.tsx:188,212` vs no writer anywhere | `Prompt.isFavorite` is read and rendered as a star, but **no route ever writes it** (`grep isFavorite src/app/api/` → only the type in `fallback-store.ts:33`). The star can never appear. | Add `isFavorite` (and `isArchived`) to the existing `PATCH /api/v1/prompts/[id]` allow-list plus a toggle in the UI. The column and the render already exist; this is the small missing write. |
| 2.6 | `collections/page.tsx:160` | Rename uses `window.prompt()` — unstyled, blocking, outside the app shell, inaccessible. | Use a real dialog (see 4.1). |
| 2.7 | `api/v1/auth/extension-sync/route.ts:74` → `popup.js:641,766-779` | The route returns `savedBlocks` shaped `{id,name,description,category,content}` (`src/lib/context-memory.ts:1-6`); the popup renders `tpl.title` / `tpl.text`. Cloud blueprints render **blank**. | Align the field names on one side, or map in the popup. Add a contract test so the two shapes can't drift again. |
| 2.8 | `background.js:223-257` (`getTemplates`) and `:309-359` (`getSettings`/`saveSettings`) | Handlers with no caller anywhere (`grep getTemplates` → definition only). Dead message contracts. | Delete, along with the unused `pp_cached_blueprints` cache. |
| 2.9 | `src/app/(auth)/reset-password/[token]/page.tsx` | A route that unconditionally calls `notFound()` — a permanent 404 shipped as a real page; implies an abandoned token-reset flow (the live flow is OTP). | Delete the route. |
| 2.10 | `collections/route.ts:15` vs `:27` | `search` is parsed then never used in the query (`where = { userId }`), so collection search silently returns everything. | Use it, or remove the parameter and the UI affordance that sets it. |
| 2.11 | `prisma/schema.prisma` `Prompt.collectionId` — only ever written as `null` (`collections/[id]/route.ts:43-46`) | A prompt can never be put in a collection; the feature is decorative. | Either wire assignment (add `collectionId` to the PATCH allow-list + a UI control, see 7.6) or remove the collections feature. Decide — see "Decisions". |

**Verify:** click-through — save a prompt → "Reuse in Editor" → editor is populated. Dashboard "this month" matches the DB count. Extension → Web Studio lands with the prompt filled. Star toggles and persists across reload.

---

## Phase 3 — Honest failure states

**Goal:** a failed request looks failed. Today it looks like success with zeros.

**The sweep:** every `.catch(() => {})` and `.catch(() => setX([]))` on a data fetch becomes a real error state. Confirmed offenders:

| File:line | Today | Should |
|---|---|---|
| `dashboard/page.tsx:53-61` | empty `catch` → four cards render `0` / `—` as if real | error card + retry |
| `library/page.tsx:45-57` | `.catch(() => setPrompts([]))` → failure shown as the legitimate empty state (`:164-175`) | distinct error state |
| `collections/page.tsx:39-43,61-65` | same pattern → "No collections yet" on failure | distinct error state |
| `settings/page.tsx:262,304` | `.catch(() => {})` → page shows defaults, implying nothing was configured | error state |
| `settings/page.tsx:454,460,504` | six swallowed calls while a global toast at `:512` announces **"saved successfully!"** | real per-call error; success only when all succeed |
| `notification-bell.tsx:51-53` | empty `catch` → bell shows a permanent, believable `0` | error/unknown state |

Then:

| # | Item | Change |
|---|---|---|
| 3.1 | Settings save | Disable the button + pending label while saving (`:534-548` has no pending state; double-submit is possible during a multi-second 6-call waterfall), and `Promise.all` the independent calls instead of serial `await`s (`:447-509`). Aggregate the result; never report success for a failed call. |
| 3.2 | Settings avatar | A 2 MB upload (allowed at `settings/page.tsx:408`) is ~2.7 M chars, but `auth/profile/route.ts:8` caps `avatar` at 500 chars and `v1/user/profile/route.ts:28` at 1 M — both reject, and `.catch` hides it, so the avatar lives only in `localStorage`. Fix the cap or the transport (upload to Blob, store the URL). Validate size client-side with a visible message. |
| 3.3 | Skeletons + layout reserve | `history/page.tsx:203-206` uses a bare centered spinner (layout shift); `compare`, `model-lab` (`:121`), `batch` have no skeleton. Add one `Skeleton` primitive (4.1) and use it. |
| 3.4 | Error boundaries | `(dashboard)/error.tsx:1-13` ignores the `error` prop entirely and there is only one boundary for 11 routes. Show the message + a retry, and add per-section boundaries where a failure would otherwise blank the page. |
| 3.5 | `(dashboard)/loading.tsx:1-16` | One generic 6-card grid is wrong for Settings/Analytics/Admin/Compare/Model Lab. Make it neutral or per-route. |
| 3.6 | Adopt TanStack Query | Replace `useEffect` + `fetch` with `useQuery`/`useMutation` across the dashboard (`query-provider.tsx` is already mounted, `package.json:26`). This is the structural fix that makes 3.1–3.5 fall out for free: `isError`, `isPending`, retries, dedupe, and cache. Biggest single reduction in bespoke code. |
| 3.7 | Optimistic + truthful mutations | Where a toast already exists (collections), use the mutation's error instead of assuming success; `templates/page.tsx:344-347` optimistically increments a **fabricated** count and ignores the 404 (`.catch` at `:348`). |

**Verify:** throw a 500 from each of `/api/v1/usage`, `/api/v1/prompts`, `/api/v1/collections`, `/api/v1/notifications` (e2e mock) and assert an error state renders — never `0` or "empty". Add to `e2e/`.

---

## Phase 4 — Shared primitives, then delete the hand-rolled copies

**Goal:** stop implementing the same widget five times with different bugs. `components.json` is already `style: base-nova` on `@base-ui/react`, so these are generated, not invented.

Add, in this order (each justified by an existing bug, not by aesthetics):

| # | Primitive | Replaces | Why it's a bug fix |
|---|---|---|---|
| 4.1 | `Dialog` | 5 hand-rolled modals: `templates/page.tsx:579-650`, `collections/page.tsx:206-253`, `history/page.tsx:306-339`, `export-code-modal.tsx:38-121`, `command-palette.tsx:56-149` | None has `role="dialog"`, a focus trap, focus restore, Escape-to-close, or scroll-lock (`templates/page.tsx:581`, `export-code-modal.tsx:40`). One primitive fixes all five. |
| 4.2 | `Skeleton` | duplicated `animate-pulse` blocks (`(dashboard)/loading.tsx:4-12`, `templates:461-478`, `collections:123-135`, `library:160-162`) | consistent loading, fixes 3.3 |
| 4.3 | `EmptyState` + `Alert` | 5 empty states and 3 alert blocks, each bespoke (`library:164,266`, `history:207,216`, `collections:137`, `templates:480`, `analytics:97`; `new:578`, `model-selector:144`, `settings:163`) | makes "empty" vs "failed" a deliberate choice |
| 4.4 | `Card` / `Badge` | `double-bezel-*` and `rounded-xl border bg-card` repeated ~15×; pills hand-rolled in 4 files (`dashboard:70,146,220…`) | one card language (Phase 5) |
| 4.5 | `Tabs` | re-implemented 4× (`settings:553-568`, `export-code-modal:82-96`, `compare:76-95`, `model-selector:90-139`) | correct roles/`aria-selected`/keyboard |

**Not** adding: `Label` (the a11y fix is `htmlFor` + `id`, which no wrapper provides — do it inline), `Select`/`Textarea` wrappers (native elements are fine; just style and label them), `Tooltip` (until a real `title=` becomes insufficient).

Then: fix the a11y defects the primitives don't cover —
- Labels: `settings/page.tsx:694/695,705/707,720/721,798,825/826,839/840,1009/1010,1022/1023,217/218`, `templates:604-613`, `new:728-764`, `collections:217-234`, plus placeholder-only inputs at `settings:103-119,167-173`, `compare:141-146,186-191`, `batch:74-79`, `model-lab:83-88`, and auth pages (`login:144-166`, `signup:298-334,204-213`, `forgot-password:98-136`).
- Accessible names on icon-only buttons: `header.tsx:150,196`, `sidebar.tsx:83`, `notification-bell.tsx:155,185-214`, `library:140-153`, `collections:159-183`, `compare:120-137`, `settings:943`, `export-code-modal:47`, `command-palette:70`, `popup.html:1262,1266,1270`.
- Keyboard reachability: clickable `<div>`s at `history/page.tsx:225-228` and `notification-bell.tsx:245-247`; make them `<button>`/link.
- `command-palette.tsx:145` advertises "↑ ↓ to navigate" but `handleKeyDown` (`:13-20`) only handles ⌘K/Escape — implement it or remove the claim.
- Colour-only status: `admin/page.tsx:189` (bare `bg-green-500`/`bg-red-500`), `notification-bell.tsx:259-261`, `sidebar.tsx:120,145` — add text or `sr-only`.
- `aria-live` on async result regions (`new:813-961`, `compare:107-116`, `batch:93-121`); `analytics:83-84` and `live-evaluation.tsx:57` already do this correctly — copy that.
- Touch targets <44 px: `library:140-153`, `collections:159-183`, `notification-bell:262-269`, `compare:120-137`, `history:245-257`, `templates:504-513`.
- `collections/page.tsx:158` hides edit/delete until hover (`opacity-0 group-hover:opacity-100`) with no focus equivalent — invisible to keyboard/touch.
- `sheet.tsx:31` overlay is `bg-black/10` — nearly invisible backdrop.

**Verify:** axe (or Playwright's accessibility snapshot) on `/dashboard`, `/dashboard/new`, `/dashboard/settings`, `/dashboard/templates`, `/login` with zero serious violations; a keyboard-only pass through each modal.

---

## Phase 5 — One design system

**Goal:** marketing, app, and extension stop looking like three products.

| # | Item | Change |
|---|---|---|
| 5.1 | Card language | Pick one. Recommended: the app's `rounded-xl border bg-card` wins, and `double-bezel-*` (`globals.css:194-213`, used ~15×) is deleted. Cheaper alternative: keep the bezel and delete the flat variant. Do not keep both. |
| 5.2 | `globals.css:186-191` | `.glass-card` hardcodes a **dark** background `rgba(18,18,21,0.75)` — it is broken in light mode. | Delete, or make it token-based. |
| 5.3 | `globals.css:240-255` + `(marketing)/page.tsx:43-65` | The scroll-reveal is **dead code**: the observer toggles `reveal`/`is-visible` on `[data-reveal]` elements (13 of them), but nothing in the markup ever carries the `reveal` class — grep confirms 0. Content just appears. | Either apply the class (make the animation real) or delete both the CSS and the observer. Prefer delete: the page is fine without it, and it removes a client `useEffect`. |
| 5.4 | Motion inventory | `globals.css` ships float, spin-slow, pulse-glow, shimmer, bounce-in, drift, marquee, stagger(8), fade/slide/scale. Grep each; delete the unused ones. The reduced-motion block (`:279-292`) is good but misses `animate-pulse`/`animate-spin` used in `loading.tsx`, `sidebar.tsx:116,120`, `dashboard/page.tsx:68,102-155`, `loop-trace-card.tsx:18`, and misses `scroll-behavior: smooth` (`:79`). | Delete unused; extend the reduced-motion block to cover pulse/spin and reset `scroll-behavior`. |
| 5.5 | Semantic status colours | The same "success" meaning uses `text-emerald-500`, `emerald-400`, `emerald-600 dark:emerald-400`, `green-500`, `green-600 dark:green-400` across 5 files. | Add `--success` / `--warning` / `--info` tokens beside the existing ones (`globals.css:5-28`) and replace. |
| 5.6 | Contrast | `text-emerald-500` on white ≈ 2.5:1 (`prompt-cost-calculator:79,95`, `model-seo-page:41`); `text-muted-foreground/60` (`(marketing)/page.tsx:338`) dims already-muted text. Both fail WCAG AA. | Use the darker `emerald-600`/`green-600` variants on light, or the new tokens. |
| 5.7 | Marketing chrome for orphan pages | `privacy`, `terms`, `prompt-templates`, `prompt-cost-calculator`, `prompt-engineering-guide`, `share/[token]` sit **outside** `(marketing)/` and render with no site nav or footer (only a logo bar). They look like a different site. | Move them into `(marketing)/` (or extract the nav/footer into a shared layout) so every public page has the same chrome. `sitemap.ts:6-17` also omits the three tool pages — fix together. |
| 5.8 | Marketing mobile nav | `(marketing)/layout.tsx:33,39,47` hide Features/Extension/GitHub behind `hidden sm:inline` / `hidden md:inline-flex` with **no mobile menu** — on a phone the only nav is Log in / Get Started. | Add a mobile menu (reuse `sheet.tsx`). |
| 5.9 | Marketing uses no primitives | Every marketing CTA is a hand-rolled `<Link>` with bespoke classes; `@/components/ui/button` is used nowhere in marketing. Auth pages use `Input`/`Separator`. That's three button/input styles. | Use `Button`/`Input` in marketing too. |
| 5.10 | Metadata | Only 5 routes export `metadata`; the rest inherit the root title/description verbatim (duplicate titles). OG exists only at root (`layout.tsx:59-82`); no `alternates.canonical` anywhere. | Per-page `title`/`description`; OG on the 3 SEO pages; canonicals. Cheap, and it's the difference between indexing and not. |
| 5.11 | Heading order | `features/page.tsx:19→30` (h1→h3), `contact:8→17`, `extension:23→50→69` (h1→h3→h2). | Fix the levels. |

**Verify:** visual pass on all 3 surfaces at 360 px / 768 px / 1280 px in light **and** dark; Lighthouse a11y ≥ 95 on `/`, `/dashboard`, `/login`; contrast check on the token set.

---

## Phase 6 — Extension: honest, accessible, consistent

**Goal:** the extension stops being the third product with its own bugs. The web-app side of each fix is in earlier phases.

| # | Item | Change |
|---|---|---|
| 6.1 | `popup.js:976-977,996-1002,1027-1033` | Resetting a button with `textContent` **destroys its child `<svg>` icon permanently** — after the first copy, the icon is gone for the session. | Toggle a label span, or save/restore the original nodes. |
| 6.2 | `popup.html:1276` (textarea, placeholder-only), `:1262,1266,1270` (icon buttons, `title` only) | No accessible names. | Real `<label>`, `aria-label` on icon buttons. |
| 6.3 | `popup.html:1207-1224` + `popup.js:403-419` | "Tabs" are `<button>`s with no `role="tablist"`/`tab`/`aria-selected`/`aria-controls`. Tone pills (`:1250-1254`, `popup.js:422-428`) have no `aria-pressed`. | Add the roles/states, or use the new `Tabs` primitive's markup. |
| 6.4 | `popup.js:944-951` | A global keydown handler compiles on ⌘/Ctrl+Enter **even while focus is in Settings/Library**. | Scope the shortcut to the compose panel; `e.repeat` guard. |
| 6.5 | `popup.js:965-969` | `showEditView()` doesn't hide the open tab panel, so Escape from Settings renders two panels at once. | Explicitly reset panel visibility. |
| 6.6 | `popup.js:770-781` | Searching the library with no matches renders a **blank list** — no empty state. | Empty state. |
| 6.7 | `content.js:1238-1260` | Capture-phase handler steals **⌘/Ctrl+Enter** and **⌘/Ctrl+Shift+P** from the host page (`preventDefault` + `stopPropagation`). That breaks the host's own send shortcut and collides with DevTools. | Make the in-page trigger explicit (the dock button, or an opt-in setting). Do not silently own host shortcuts. |
| 6.8 | `content.js:29-393,834,1036` | Injects a `<style>` into the host `head` and raw nodes into `body`, all `!important`; blocked by strict host CSP, collides with host CSS. | Mount the injected UI in a **Shadow DOM** with its own stylesheet. Also replace `z-index: 99999999` (`:48`), `100000000` (`:222`), `100000001` (`:650`) with a sane value. |
| 6.9 | `content.js:771-772` | The in-page modal has no `role="dialog"`, no `aria-modal`, no focus management; Tab escapes to the host page (`:859-872`). Tone "chips" are non-focusable `<div>`s (`:810-814`). | Dialog semantics + focus trap; make chips buttons. |
| 6.10 | `content.js:1442-1479` | Two observers watch `document.body` with `characterData:true` + `subtree:true` and re-run a **full conversation scrape and tokenize** on a 350 ms debounce — fired repeatedly while an LLM streams. | Scope the observer to the message container, debounce harder, and skip when the transcript hash is unchanged. |
| 6.11 | Auth — the real problem | The session cookie is `SameSite=Lax` (`privacy/page.tsx:66`; no override in `lib/auth/config.ts`), so `background.js:88-118`'s cross-origin fetch of `/api/v1/auth/extension-sync` **cannot** send it. That's why the `postMessage` bridge exists (`header.tsx:83-107` → `web-bridge.js:37-78`), which itself posts to `"*"`. Result: "signed in" is unreliable, and there is **no sign-in affordance in the popup** — only "Force Sync", which also fails. | Make sign-in explicit and honest: a real **Sign in** button in the popup that opens the web app's bridge, a truthful "Not connected" state, and removal of the dead cookie-fetch path. Then retire the `postMessage("*")` broadcast for a targeted origin. (A token-based path is the robust fix; it needs a backend decision — see "Decisions".) |
| 6.12 | `manifest.json:18-23,36-62,100-112` | `activeTab` is redundant; `tabs` grants read of every tab URL for a cosmetic presence dot; `host_permissions` covers 25 origins the code doesn't support (only 6 adapters) plus `http://localhost/*` **and** `http://127.0.0.1/*` on **all ports**; `web-bridge` runs on every local dev server. | Drop `activeTab`; replace `tabs` with the specific query you need (or drop the dot); narrow hosts to the 6 supported adapters (or write adapters for the rest); restrict localhost to `:3000`. |
| 6.13 | `manifest.json:3` | Name is 67 chars; the Web Store caps titles at 45 → truncated/rejected. No `short_name`, `homepage_url`, `author`, `minimum_chrome_version`. | Shorten to ≤45; add the missing keys. |
| 6.14 | `background.js:20-22` | The AES key is stored in `chrome.storage.local` beside the ciphertext it encrypts — obfuscation, not encryption. | Say so (rename/comment), or store the key in memory + a real secret. Do not claim encryption. |
| 6.15 | `background.js:520-522` | A 60 s `setInterval` in an MV3 service worker that is torn down at ~30 s idle — it rarely runs; `README.md:25` advertises "regular background telemetry pings". | Delete the interval and the claim, or use `chrome.alarms`. |
| 6.16 | `background.js:147-158` vs `content.js:669`/`popup.js:889` | Enhance can try 4 endpoints × 20 s = 80 s, but the UI times out at 55 s and silently substitutes a local template. The user is told "offline" while the cloud call may still succeed. | One deadline shared by both sides; report timeout as a timeout. |
| 6.17 | Adapters (6 files, ~190 duplicated lines) | Each `insertPrompt` is a near-verbatim clone and **none is called by production code** (`content.js:1339-1356` uses only `getActiveModel`/`getConversationTurns`); `content.js:445-589,602-637` re-implements the same selectors. Selectors are stale/broad (`grok.js:64` `div[class*='response']`, `perplexity.js:63` `div.border-borderMain`, `chatgpt.js:17` `textarea[data-id='root']`). | Delete the dead `insertPrompt`/`getPromptInput` duplicates and the `execCommand` path (`content.js:619-620`); keep one implementation. Tighten the broad selectors. |
| 6.18 | `background.js:1-4`, `:378` | Prod URL is always tried before localhost; hardcoded. | Keep `localhost` first in dev builds, or make the base URL a build-time constant. |
| 6.19 | `extension/test-plan.js:98-101` | Mocks `document.querySelector` to always return `null`, so **no adapter selector is ever exercised** — the stale selectors in 6.17 cannot fail the test. | Add fixture-based selector tests (jsdom with saved host HTML). |
| 6.20 | Popup styling | ~1,100 lines of hand-written CSS with its own palette (`popup.html:9-32,54-68`) plus inline styles (`:1193,1279-1281,1351-1355,1405-1407,1450-1451,1474-1481,1500-1501`; `popup.js:724,729,734,800-808`) diverging from `globals.css`. Fixed `410×560`, no media queries. | Generate the popup's tokens from the shared ones (build-time) and delete the inline styles. Keep the hand-written layout if Tailwind isn't practical in an MV3 popup — the requirement is *shared tokens*, not a build system. |

**Verify:** load unpacked, run the new selector fixtures; keyboard-only pass through the popup; a page-CSP-strict host (e.g. GitHub) still renders the injected UI; sign out → popup says "Not connected" and offers Sign in.

---

## Phase 7 — Backend: one shape, real state, no dead routes

**Goal:** "proper working backend" — the API stops lying, duplicating, and forgetting.

| # | Item | Change |
|---|---|---|
| 7.1 | `api/v2/extension/optimize/route.ts:12` | The only **unauthenticated, unrate-limited** LLM-adjacent endpoint. | Add the same IP rate limit as `extension/enhance` (`:43`, 120/hr). |
| 7.2 | Response shapes | Nine distinct error shapes and eight success shapes ship today (`{error}`, `{error,details}`, `{error,code,provider}`, `{success:false,error}`, `{message}`, `{authenticated:false,…}`, `{data}`, `{data,message}`, `{success:true,data}`, flat objects). Clients can't have one error handler. | Introduce `ok()`/`fail()` in `src/lib/api/` and migrate **errors first** (`{error, code, details?}` everywhere), leaving success bodies alone to keep the diff honest. Enforce the shape for new routes in `check-api-routes.mjs`. |
| 7.3 | Dead routes | Zero callers anywhere: `/api/v1/health` (`v1/health/route.ts:2`), `/api/v1/prompts/analyze`, `/api/v2/analyze`, `/api/v2/repair`, `/api/v1/templates/[id]` (GET+DELETE), plus dead methods on `templates` POST, `usage` POST, `user/profile` GET, `prompts/[id]` GET, `collections/[id]` GET, `prompts/share`, `prompts/[id]/versions`. | Delete the confirmed-dead ones. **Confirm first** whether any is a documented public API (`docs/` references `prompts/analyze`) — public surface is a product decision, not a cleanup. Per-method deletion is nearly free. |
| 7.4 | In-memory persistence | `user/preferences/route.ts:24` is a `Map`; `notifications` uses `Map`s (`:17,118`). Both silently reset on **every deploy** (and differ per instance on Fluid Compute). | Move preferences to Prisma (a `UserPreferences` model or JSON column) — 2.4 depends on this. Notifications: per 1.3, keep them empty until something real generates them. |
| 7.5 | Duplicate engines | v1 and v2 implement the same jobs twice: enhance (`enhance-ai:15-260` vs `v2/optimize:38-159`), analyze (`prompts/analyze:53-170` vs `v2/analyze:16-56`), extension enhance (`extension/enhance:40-222` re-implements the whole v2 algorithmic path), scoring (`prompts/score:27-139` vs `v2/evaluate:21-78`), plus a hand-rolled auth+CSRF duplicate of `with-auth.ts:39-55` in `save-prompt:13-23`. | Pick one implementation per job and make the other a thin re-export or delete it. Highest-value: one scoring engine and one enhance engine. |
| 7.6 | Missing writes the UI needs | No `collectionId` assignment; no `isFavorite`/`isArchived` write; no restore after soft-delete (`deletedAt` is only ever set); `Template.variables` never read/written; `ApiKey.isActive` never toggled; `ApiKey.lastUsedAt`/`usageCount` only updated by one route (`enhance-ai:133-136`). | Add to the existing PATCH allow-lists (small), or remove the column (smaller). Undelete is a real user expectation once soft-delete exists. |
| 7.7 | Missing read capabilities | No filtering/sorting anywhere (`prompts/route.ts:30-38` searches title/originalText only; `orderBy` hardcoded); no pagination on versions/notifications/templates/api-keys (fixed slices at `analytics:193`, `admin:57`, `extension-sync:51`); `collections` search parsed but unused (2.10). | Add `sort`/`filter` params where the UI needs them; paginate the lists that can grow. Cursor pagination only where offset breaks. |
| 7.8 | Unused schema surface | `Account` and `Session` models (JWT auth, no adapter — `lib/auth/config.ts:38-41`); `User.providerId`, `User.onboardingCompleted`; `Prompt.isArchived`, `Prompt.tags`; `Template.deletedAt`. | Delete what nothing reads or writes — it costs migrations and misleads readers. Confirm against the Neon DB first (prod + preview share it — see Risks). |
| 7.9 | Quota `100` hardcoded in three places | `analytics/stats:179`, `usage:49`, `extension-sync:56` — no plan source. | One constant (or a plan field) so the three can't disagree. |

**Verify:** `scripts/check-api-routes.mjs` + a new shape check green; an integration test per consolidated route; deploy to a preview and confirm preferences survive a redeploy (the actual bug being fixed).

---

## Decisions I need from you

1. **Favorites / collections / archive** — wire them for real (PATCH allow-list + UI controls) or delete the columns and the UI? Currently they are decorative. My recommendation: wire `isFavorite` (star exists, column exists, one small write) and **delete** `isArchived`/`tags`/`collectionId` unless you want collections to be a real feature.
2. **Notifications** — remove until real (recommended, matches Phase 1) or build real triggers now?
3. **API-key "test"** — relabel honestly (cheap) or make real provider calls (OpenAI/Anthropic at minimum)?
4. **Dead v1/v2 routes** — safe to delete, or is any of them documented public API you want to keep?
5. **Extension auth** — explicit sign-in via the existing bridge (cheap, honest), or a token-based flow (needs a backend change but is the robust fix)?
6. **Popup styling** — shared tokens only, or a full rewrite to a build step?
7. **Marketing claims** — delete the competitor table + the -40%/-60% numbers, or invest in a real, cited benchmark?

---

## Suggested PR slicing

Each PR leaves the 7 required checks green. Do not batch across phases.

1. **PR 0** — Phase 0 tripwires (no product change).
2. **PR 1** — Phase 1 truthfulness (deletion-heavy, low risk, high trust).
3. **PR 2** — Phase 2 core loop (2.1 alone fixes the app *and* the extension handoff).
4. **PR 3** — Phase 3 error states (after 3.6 Query adoption, land it in one go).
5. **PR 4–5** — Phase 4 primitives, then the a11y sweep.
6. **PR 6–7** — Phase 5 design system, then marketing chrome/SEO.
7. **PR 8+** — Phase 6 extension (split: bugs → a11y/tabs → Shadow DOM → auth/permissions → manifest/store).
8. **PR 9+** — Phase 7 backend, one concern per PR (shape → dead routes → persistence → dedupe → capabilities → schema).

## Risks to hold in mind

- **Prod and Preview share the same Neon database.** Any Prisma migration (7.4, 7.8) applies to live data the moment it merges. Take a backup, and never drop a column in the same PR that stops reading it.
- **Real users are on production now** (the merge from earlier today is live). Phases 1 and 2 are user-visible: deleting the fake notification feed and fixing the Studio handoff change what people see. That is the point, but call it out in the release notes.
- **Deleting routes** is safe by grep but not by world-knowledge — an external client could call them. 7.3 stays behind decision 4.
- **`docs/` is stale in places** (it references dead routes and old versions). If Phase 7 deletes routes, update `docs/` in the same PR so it doesn't become a second source of lies.

## What I would explicitly not do

- No framework, no state library, no component library, no CSS rewrite. TanStack Query and `@base-ui/react` are already installed and unused; use them.
- No visual redesign for its own sake. The aesthetic changes in Phase 5 are all consequences of removing duplication and fixing contrast — not a new look.
- No new feature work (billing, teams, sharing) until the truthfulness and core-loop phases are done.
