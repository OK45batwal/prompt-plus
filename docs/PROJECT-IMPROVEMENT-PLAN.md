# Prompt+ project improvement plan

Prepared: 2026-10-20 against checkout `b7e74a7`.

Status: first implementation batch landed on 2026-10-20 (see [Implementation status](#implementation-status-2026-10-20)); later milestones remain proposed. The findings, evidence and completion criteria below are unchanged from the review.

## Direction

Make the core journey dependable and easy to understand:

**Write a rough prompt → choose local or cloud enhancement → review the changes → save, copy, or insert → reuse later.**

Prioritize protecting user work, accurate billing information, and verified execution. Then simplify the interface and measure actual prompt outcomes. Broader features should follow evidence that users can complete and return to this journey.

Assumption: keep the current free application with optional user-provided provider keys. Provider charges are separate from a Prompt+ subscription. Revisit monetization only after validating repeat usage and operating costs.

## Current baseline

The repository now contains JWT revocation, OAuth linking, encrypted API keys, a shared credential resolver, native Gemini support, model access labels, a deterministic compiler, saved prompts, evaluation, and a browser extension. Continue these implementations instead of scheduling them as new features.

The earlier [JWT and model-access plan](JWT-AND-MODEL-ACCESS-PLAN.md) contains implementation evidence and identifies live verification still needed. Its production observations are historical; this review did not recheck production.

Checks performed for this plan:

- `npm test`: API-route and honesty gates passed; 232 tests passed. The Redis suite failed during setup, leaving two tests skipped.
- A focused Redis startup diagnostic returned `Failed opening Unix socket: bind: Operation not permitted`. This establishes a sandbox restriction for this run, not a production Redis defect.
- Reviewed current source, test setup, CI configuration, and existing plans. No fresh browser usability study, provider inference, dependency audit, or production performance measurement was performed.

## Priority order

| Order | Work | User benefit | Completion condition |
| --- | --- | --- | --- |
| First | Fix persistence, billing-policy, and false-success defects | Work and credentials are preserved; users understand possible charges | Failure-path tests prove the behavior |
| Next | Verify real sign-in, database, provider, and release flows | Features work together beyond mocked tests | Authenticated preview flow passes with recorded evidence |
| Then | Simplify Studio and onboarding | Users reach a useful result with fewer decisions | Representative users complete the journey without assistance |
| Then | Improve prompt quality and reuse | Enhancements preserve intent and become useful saved assets | Held-out task results and reuse events provide evidence |
| Then | Unify extension state and review | Moving between chat, popup, panel, and website preserves work | Handoff, restart, insertion, and undo checks pass |
| Ongoing | Measure performance, reliability, and adoption | Improvement decisions follow actual bottlenecks | Baselines and trends are computed from collected data |

## Milestone A — Protect user work and billing expectations

These are concrete source findings and should be the first implementation batch.

| Finding | Evidence | Planned change and acceptance check |
| --- | --- | --- |
| Preferences disappear across server restarts or instances | `src/app/api/v1/user/preferences/route.ts` uses a process-local `Map`. | Persist validated preferences in PostgreSQL with a user relation. A write must survive a new server process and appear on another device. |
| A free-tier-capable model can bypass paid-use consent | `src/lib/models.ts:canIncurProviderCharges()` accepts only `paid` and `unknown`; Gemini is `free_tier_available`. The selector and resolver reuse this helper. | Treat conditional free-tier access as potentially billable unless there is authoritative account-level evidence otherwise. Test Gemini with no consent, a paid project, and unknown billing. |
| Legacy key migration can delete the browser copy without a successful server save | Settings awaits POST requests without checking `res.ok`, then removes `promptplus_user_apikeys`; its catch also removes the entry. | Migrate per credential, verify acknowledged persistence, retain failed items for retry or explicit deletion, and never claim migration success on failure. |
| Delete and “Save all” can report success after an HTTP failure | `handleDeleteApiKey()` and parts of `handleSaveAll()` in Settings do not check response status. | Use a shared typed request/mutation layer; show individual success/failure, preserve unsaved input, and refresh confirmed server state. Cover unauthorized, validation, and server-error responses. |
| Browser drafts/history/context use account-independent storage keys | Studio, History, and `src/lib/context-memory.ts`; header sign-out clears the legacy key entry but not these records. | Scope signed-in local data to account identity and reset in-memory state on account change. A second account must not hydrate the first account's drafts/history. Offer deliberate recovery for old unowned drafts rather than silently assigning them. |
| Analytics “all” is implemented as a bounded recent window | `src/app/api/v1/analytics/stats/route.ts` maps `range=all` to 90 days. | Either implement all-time summaries or rename the option to its real range. Define attempts versus successful enhancements explicitly. |

Google associates API billing with projects, so free-tier model availability cannot establish that a particular request is free. This informs the billing-policy fix. [Gemini billing documentation](https://ai.google.dev/gemini-api/docs/billing).

Keep cloud drafts and context synchronization as a follow-up after ownership and local recovery are correct. Synchronization needs explicit revision/conflict handling; it should not overwrite a newer local edit.

## Milestone B — Establish release confidence

The existing browser tests cover useful interactions, but `e2e/dashboard-wiring.spec.ts` injects a JWT and intercepts API responses. Those tests do not establish that actual login, database persistence, and provider execution work together.

Planned work:

1. Create a repeatable integration environment with a disposable account, a database compatible with the runtime adapter, and a test email inbox. The current Neon HTTP runtime cannot be validated simply by declaring a plain PostgreSQL CI service.
2. Add an authenticated flow covering signup/verification, login, draft creation, save/reload, preferences, account switching, password reset, and session revocation.
3. Keep deterministic provider fixtures in normal CI. Separately run a budgeted preview smoke check with real OpenRouter and Gemini keys, including missing key, rejected key, quota, and paid-consent behavior.
4. Make critical dependency-audit failures block CI. `.github/workflows/security.yml` currently uses `continue-on-error: true`. Run a fresh audit before deciding which dependencies need remediation; historical vulnerability counts are not current evidence.
5. Retain the existing route, honesty, type, lint, build, Redis, web, and extension checks. Improve Redis test setup diagnostics and isolate tests that do not need a live Redis process.
6. Record release evidence by commit/environment, including migration status, deployment result, and remaining live checks. A local test pass must not be presented as a deployment pass.
7. Add a migration/restore rehearsal on disposable data, a rollback procedure, and dependency-health monitoring for database, Redis, and email. Do not expose secrets or account data through public health responses.
8. Keep one current roadmap in the documentation index. Mark older architecture/master-plan descriptions as historical where they conflict with source, including provider routing, database setup, and licensing/product assumptions.

Completion condition: the complete account → prompt → provider → saved-result flow passes in preview, and failing critical checks prevent release.

## Milestone C — Make the first useful result easier

These are proposed UX improvements to validate with users, not findings from a new visual audit.

- Make **New Prompt**, **Library**, **Templates**, and **Settings** the primary destinations. Group Batch, Model Lab, Compare, and Analytics under advanced tools while preserving their URLs.
- Make onboarding action-based: start from a small example or the user's own prompt, run the local engine, review changes, then copy/save. Introduce cloud setup when the user chooses cloud execution.
- Keep prompt input, execution mode, and the main action visible. Put less-used tone, format, model, and context controls behind clearly labeled disclosures where appropriate.
- Explain the selected execution mode and actual result source. Cloud failure, local output, unsaved result, expired session, and quota exhaustion each need a specific recovery action.
- Add cancellation and a request identity/revision guard to the web flow. Preserve the draft; discard cancelled or stale responses. If upstream cancellation cannot be guaranteed, do not promise that provider execution or charges stopped.
- Use task-specific loading text without fabricated progress. Keep “What changed,” original text, and the editable result available together.
- Clarify “Saved on this device” versus “Saved to your account.” Offer retry for account-save failure without repeating a billable model call.
- Fix accessible names on icon-only/collapsed navigation, focus handling, keyboard operation, and narrow-screen layouts. The old UI review is not evidence of current accessibility compliance.
- Check whether voice input works under the current `microphone=()` Permissions Policy before presenting it as a dependable onboarding action.

Main surfaces: `src/app/(dashboard)/dashboard/new/page.tsx`, `src/components/dashboard/onboarding-tour.tsx`, dashboard navigation, Settings, and `src/components/studio/`.

Use task walkthroughs and [W3C's accessibility checks](https://www.w3.org/WAI/test-evaluate/easy-checks/) to assess the changes. Record observed problems instead of assigning an unsupported design score.

Completion condition: a new user can create, review, save, and reopen a prompt; a keyboard-only user can complete the same path; failures preserve their work.

## Milestone D — Prove quality and improve reuse

The existing evaluator checks exact output and required/forbidden substrings. That is useful for narrow acceptance criteria but does not establish broader semantic correctness.

Planned work:

- Build on the existing versioned fixture corpus. Add representative coding, writing, extraction, and multilingual tasks with explicit success criteria and held-out cases.
- Compare original and enhanced prompts with matching provider/model/settings. Record failures and ties. Add task-appropriate checks such as JSON-schema validation and field accuracy; reserve subjective writing judgments for documented human review or a separately calibrated judge.
- Include “no rewrite needed,” preservation of constraints, factual additions, unwanted verbosity, and ambiguous requests as regression cases.
- Separate prompt structure, task outcome, user preference, execution latency, and cost. Keep unknown measurements null.
- Let users mark whether a result helped and give a reason such as “changed intent,” “too long,” or “missed context.” Treat this as user feedback, not an objective quality score.
- Improve reuse through editable titles/tags, version restoration, searchable context blocks, and a deliberate “Use as draft” action.
- Add safe export/import of saved prompts and context, with duplicate handling and schema validation. Preserve model/source metadata where available.

Main files: `src/lib/prompt-engine/`, `src/__tests__/fixtures/`, `src/lib/score-summary.ts`, Library, History, and Collections.

Completion condition: changes are evaluated against a recorded baseline on held-out tasks, and users can recover/reuse work without losing versions. Publish improvement claims only when the measurement supports them.

## Milestone E — Carry the same workflow into the extension

Use the existing [extension workspace proposal](EXTENSION-WORKSPACE-REDESIGN.md) as the design starting point.

- Give popup, side panel, and web handoff a shared draft contract with revision, source, selected context, request status, and result.
- Persist enough state to recover after popup close or service-worker restart. An interrupted request must not appear completed.
- Keep the popup for quick editing and the side panel for the complete Write/Library/History workflow.
- Review once, then validate the insertion target and expected draft immediately before changing the host input.
- Preserve guarded undo, explicit local/cloud labels, and the rule that the user sends the message.
- Record a live-site compatibility matrix for supported chat products. Local DOM fixtures remain regression evidence, not certification of the changing live sites.
- Align versioned extension packages, public downloads, and displayed release information.

Completion condition: a draft survives moving between surfaces, insertion cannot overwrite newer typing, and the packaged extension passes the recorded compatibility checks.

## Milestone F — Measure and improve operations

Instrument the core journey before adding more dashboards:

| Measure | Definition |
| --- | --- |
| Activation | Eligible new accounts completing an enhancement and then copying or saving, divided by the observed signup cohort |
| Time to useful result | Elapsed time from starting a draft to the first confirmed copy/save action; report abandonment separately |
| Run reliability | Completed cloud requests divided by attempted cloud requests, segmented by provider/model and error type |
| Save reliability | Confirmed account saves divided by attempted saves; distinguish local recovery |
| Return/reuse | Accounts returning in a defined cohort window and accounts deliberately reusing a saved prompt |
| Task improvement | Paired task-outcome differences on the evaluation corpus, with failures, ties, and sample size |

These are proposed measures. No current conversion, retention, or quality lift was established in this review.

Collect minimal event metadata; keep API keys and prompt contents out of general analytics. Deduplicate retries and exclude internal/test traffic. Start with a baseline, then choose targets.

Measure production-mode page loading, responsiveness, layout stability, API latency, and database query cost. Use [Core Web Vitals](https://web.dev/articles/vitals) and the [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist), applying APIs from the installed Next.js documentation.

Optimize where measurements point: database-side aggregates for growing analytics data, pagination for history, and deferred loading for advanced controls. Refactor the large Studio, Settings, popup, and content-script files along feature/state boundaries as those areas change. Add a distributed cache or background queue only when observed load requires it.

For discovery, turn working templates into useful task-specific examples and improve existing landing/extension pages. Measure visits through successful use; do not invent testimonials, model-quality percentages, or compatibility claims.

## First implementation batch

Keep the first changes small enough to review independently:

1. Correct conditional-free billing consent and its server/client regression tests.
2. Repair key migration, deletion, and partial-save reporting.
3. Persist preferences and isolate browser drafts/history by account.
4. Add authenticated persistence tests and make the critical security audit enforceable.
5. Simplify onboarding and the primary Studio journey after the reliability fixes pass.

Dependencies: establish Milestones A and B before promoting cloud access broadly. Milestones C and D improve the core product; extension work depends on the agreed draft/review contract. Measurement starts early and continues throughout.

Defer additional providers, subscriptions, team administration, a new database, and broad architectural rewrites until the current workflow and user demand justify them.

## Implementation status (2026-10-20)

Evidence is from this checkout, not from production. Nothing below was verified against live provider accounts.

| Batch item | State | Where | Evidence |
| --- | --- | --- | --- |
| Preferences survive restarts | Implemented | `prisma/schema.prisma` (`UserPreference`), `prisma/migrations/20261020152000_persist_preferences`, `src/app/api/v1/user/preferences/route.ts` | One row per user; GET merges the stored row over defaults; PATCH validates and upserts. Test writes then re-reads through a separate request. |
| Free-tier consent | Implemented | `src/lib/models.ts` (`canIncurProviderCharges`), Studio consent, model picker filter | `free_tier_available` now requires consent; only `free` is presumed non-billing. Tests cover Gemini without consent (402, no database read), a free model, and a paid model. |
| Key migration cannot delete the only copy | Implemented | `src/app/(dashboard)/dashboard/settings/page.tsx` | Each legacy key is kept until its POST is confirmed; failures stay in `promptplus_user_apikeys` and are reported. A parse failure no longer deletes anything. |
| Delete and save-all report confirmed state | Implemented | same file | Both check `res.ok`, keep unconfirmed input, and surface an error instead of success. |
| Browser data is account-scoped | Implemented | `src/lib/account-storage.ts`, Studio, History, `src/lib/context-memory.ts` | Drafts, local history, and custom context use `<key>::<userId>` and wait for the session before reading. An older unscoped draft is offered for explicit recovery, never assigned silently. |
| Analytics "all" was 90 days | Implemented | `src/app/api/v1/analytics/stats/route.ts`, analytics page | The real range is now `90d`; `all` stays as a deprecated alias. No all-time summary is offered. |
| Critical audit failures block CI | Implemented | `.github/workflows/security.yml` | `continue-on-error` removed. `npm audit --audit-level=critical` exits 0 after upgrading Next 16.4.2, `next-auth` 5.0.0-beta.32, nodemailer 8.0.11, and overriding `proxy-addr` to 2.0.8. |
| Authenticated end-to-end persistence test | Not done | — | Needs a disposable account and a runtime-compatible database, as described in Milestone B. |
| Real provider smoke (Gemini/OpenRouter) | Not done | — | Needs provider keys and a budgeted preview run. |
| Onboarding / Studio simplification | Not started | — | Batch item 5; planned after the reliability work above. |

Known limits:

- Nodemailer stays on 8.0.11: `npm audit` still reports a high-severity advisory fixed only in 10.x, which `next-auth`'s peer range does not accept. It is not exercised by the critical gate.
- Local history written before this change is no longer shown to a signed-in account. It remains in browser storage under `pp_local_history`; only drafts have a recovery action.
- The preferences API returns a generic 500 if PostgreSQL is unreachable during the write; it never falls back to an in-memory store.

Verification run: 239 Vitest tests passed, `tsc --noEmit` and ESLint clean, production build succeeded, and the 7 Playwright dashboard/measurement flows passed.
