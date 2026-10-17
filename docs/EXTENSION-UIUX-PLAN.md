# Extension UI/UX Plan

**Status:** shipped in the `2.1.4` extension rebuild · see §7 for the resolution table
**Depends on:** nothing (phases are independent)
**Verified against:** `main` @ `ab2290a` (re-verified: that commit changed `content.js`, `popup.js`,
`background.js` and `manifest.json`, so every line number below was re-checked against it)

Every defect below was reproduced by reading the code path, not inferred. Line numbers are exact.
Methods: full read of `popup.html` structure, `popup.js` wiring, the `content.js` dock + modal, and
`manifest.json`; targeted greps for a11y, honesty and packaging claims.

**The tree moved under this audit.** `ab2290a` ("Ship deterministic enhancement fallback and reviewed
extension edits") landed on `main` between the request and this plan. It already implemented the
server-side deterministic fallback and **rebuilt the in-page review panel** with a real word-level
diff, measured token deltas, and `Accept · Tab` / `Keep original · Esc`
(`content.js:684-767`). That makes the **popup** — not the in-page UI — the weak surface, and it adds
D17 below.

---

## 1. Verified defects

| # | Sev | Where | Trigger | What happens |
| --- | --- | --- | --- | --- |
| **D1** | High | `popup.js:957-959` + `974-978` | Press `Escape` while on Library, Context or Settings | **Two panels stack.** `showEditView()` shows `panelEnhance` but never hides the *other* tab panel, so Enhance appears on top of the tab you are on, with the tab bar still highlighting the wrong tab. Escape is the natural "dismiss" key, so users will hit this. |
| **D2** | Med | `popup.js:985-986`, `1005-1011`, `1024/1035/1041` | Click **Copy Prompt** once | `copyBtn.textContent = "Copied!"` replaces the button's `<svg>` **and** its `<span>`. The reset to `"Copy Prompt"` restores only text. **The icon is gone for the rest of the session** — same for *Use in Active Tab* and *Save to Cloud*. |
| **D3** | Med | `popup.js:943` then `945` | Any enhancement | `showResultView()` writes `Structure estimate: 78/100` into `#quality-score-badge`, then line 945 overwrites it with the source string. The score is computed and thrown away; the assignment at line 969 is dead in effect. |
| **D4** | Low-Med | `popup.js:1030`, `popup.js:2` vs `manifest.json:4` | Save to Cloud | Cloud record is filed under `category: "Extension v3.0"`, and the file header still says `Extension v3.0.0`; the manifest ships `3.1.0`. **The gate cannot see either one:** `check-honesty.mjs:92` does walk `extension/`, but 8 of its 9 rules are scoped by `include: [/^src\/.*\.tsx?$/]`, so only the new `dead-model-id` rule ever inspects an extension file. |
| **D5** | Med (honesty) | `popup.html:1309` | Hover the *Turbo Local* mode | Tooltip claims `Sub-30ms Instant Heuristic (<30ms)`. This is an unmeasured performance claim — the identical claim was purged from `src/` in Phase 1, and survived here only because `unmeasured-performance-claim` is one of the 8 `src`-scoped rules (D4). |
| **D6** | Low (honesty) | `popup.js:237`, `content.js:833` | Open the popup with no analysis yet | Falls back to the literal string `"Steady burn"` / `"steady"` and renders it as telemetry. With `Capacity unknown` and `Limit unknown` next to it, the header reads as broken instrumentation. |
| **D7** | Med (a11y) | `popup.html:1207-1221`, `popup.js:405-421` | Keyboard use | Tabs are plain `<button>`s with an `.active` class: no `role="tablist"/"tab"/"tabpanel"`, no `aria-selected`, no `aria-controls`, no Left/Right arrow support. Screen readers get no tab semantics. |
| **D8** | Low (a11y) | `popup.html:1008`, `985` | Tab into the Library search box | `.library-search-input { outline: none }` and `.library-search-box` has no `:focus-within` (only `.input-bezel-card` at line 342 has one). **No visible focus indicator.** |
| **D9** | Low | `popup.js:375,377,379`, `popup.html:1287` | Windows/Linux user reads the CTA | Labels hardcode `(⌘↵)`. The handler accepts `ctrlKey` too, and `content.js:6` correctly derives it (`isMac ? "⌘↵" : "Ctrl+↵"`) — the popup just doesn't. |
| **D10** | Low | `popup.js:88` | First open | `currentMode = "api"` — the default is the cloud path. There is no server LLM key, so after `ab2290a` that path returns the deterministic engine anyway: the user is shown "Cloud AI" while running the offline engine. It also means a user *with* a key silently spends tokens by default. |
| **D11** | Low (privacy) | `popup.html:1200` | Popup renders | Loads `https://api.dicebear.com/7.x/bottts/svg?seed=promptplus_arch` — an outbound request to a third party from a privacy-first extension, and a bot identity that is not the user. |
| **D12** | Low | `content.js:1151` + `1158` | Click *Runway* or *Studio* in the dock | Two different controls fire the identical `openFloatingModal(input)`. |
| **D13** | Low | `popup.html:1250-1254` vs `content.js:878-882` | Same tone, two surfaces | Popup says *Executive Strategy / Marketing Copy / Deep Reasoning*; the modal says *Executive Brief / Conversion Copy / Deep Reasoner* for the same `data-tone` keys. The dock exposes only 3 of the 5. |
| **D14** | Low | `popup.js:438` and `286` | Open Advanced tools | Two nested disclosures (chevron inside chevron) inside a 560px popup. |
| **D15** | Low | `popup.js:898` | Network stalls | The cloud path blocks up to **55 s** with the button spinning, no cancel. |
| **D16** | Low | `popup.js:1015` | No active tab | `navigator.clipboard?.writeText(...)` is not awaited or caught → unhandled rejection. |
| **D17** | Med | `popup.js:968` vs `content.js:684-767` | Compare the two surfaces | `ab2290a` gave the in-page panel a word-level diff, `Estimated tokens: 120 → 340 (+220)`, and Accept/Keep. The popup's result view is still `resultBody.textContent = text` — a raw dump. No diff, no token delta, and no use of the tokenizer that `manifest.json` already loads for the popup. The same user gets a considered review in ChatGPT and a bare text box in the popup. |

---

## 2. The jargon is the "AI slop"

The layout is not the main problem — the tokens in `popup.html:8-32` are a coherent palette, and the
CSS is organised. The problem is that the UI speaks in **internal engineering vocabulary**:

| Shown to the user | Where | Plain equivalent |
| --- | --- | --- |
| `Compile Master Prompt` | `popup.html:1287`, `popup.js:370` | Enhance prompt |
| `⚡ Turbo Local IR` | `popup.js:375` | Offline engine |
| `Context Runway` | `content.js:861`, `content.js:1083` | Chat capacity |
| `Structure estimate: 78/100` | `popup.js:969` | keep the number, drop "estimate" theatre — it is a fixed string heuristic (`popup.js:834-841`) |
| `Not evaluated` / `Not measured` | `popup.html:1406-1407` | hide until there is a value |
| `Free Quota` | `popup.html:1351` | Remaining |
| `Capacity unknown (Estimated visible usage)` | `content.js:864` | two hedge-words stacked; pick one |
| `Click to view multi-model engine, circular ring telemetry & cross-platform launcher` | `popup.html:1294` | Engine & tools |

Consistency problems that follow from having no single source of truth: D13 (tone names), D9
(shortcuts), D4 (version).

---

## 3. Retractions — already built, do not rebuild

| Proposed elsewhere | Reality |
| --- | --- |
| "Add an interactive diff popover with Accept/Undo" | **Already built — twice over, most recently in `ab2290a`.** `content.js:684-767` (`showEnhancementPreview`) renders `role="dialog" aria-label="Review enhancement"` with a real word-level diff, `Estimated tokens: N → M (±D)` from `PromptPlusTokenizer`, and `#pp-preview-accept` / `#pp-preview-keep` bound to `Tab` / `Esc`. The injection path returns `pendingReview`, which `popup.js:1009` surfaces as "Review in Chat". |
| "Add a context/persona switcher" | **Exists** in all three surfaces: popup Context tab (`#context-vault-list`), dock modal (`content.js:878-882`), and the web Context Vault. |
| "Add Launch-in-AI links" | **Exists:** `#bridge-*` × 8 plus `bridge-send-all` (`popup.html:1363-1392`). |
| "Ship `extension/test-plan.js` out of the package" | **False alarm — checked and rejected.** `package-extension.mjs:49` zips an explicit file list; `test-plan.js` is not in it. It is a real runner (`npm run test:extension`). Leave it. |

---

## 4. Phases

### Phase E0 — Fix the broken UI (small diffs, ships first)

1. **D1** Make `showEditView` aware of the active tab: only act when `panelResult` is visible, and
   hide the other tab panels through the same path `switchTab` uses. Root cause is that two functions
   own panel visibility — collapse to one `showView(view)` helper.
2. **D2** Set the inner `<span>` text, never the button's `textContent`.
3. **D3** Delete `popup.js:945`. The source already reaches the user via the existing `showToast(resultSource)`
   on line 944, so nothing is lost.
4. **D4** Import the version the way `src/lib/version.ts` now does (`chrome.runtime.getManifest().version`)
   for the `category` string.
5. **D5** Replace the `Sub-30ms` tooltip with a truthful one.
6. **D6** Render `—` (and hide the row) when `burnRate` is absent, instead of `"Steady burn"`.
7. **D9** Use the `isMac` helper for the three CTA labels and `popup.html:1287`.
8. **D16** Await/catch the clipboard call.

**Verify:** `npm run test:extension`, `npm run test:extension:e2e`.

### Phase E1 — Navigation that actually works

1. **E1.1 (D7)** Real tab semantics on `popup.html:1207-1221` and the panels: `role="tablist"` +
   `role="tab"` + `aria-selected` + `aria-controls`, `role="tabpanel"`; Left/Right/Home/End moves
   between tabs. This is the fix for "proper navigation".
2. **E1.2 (D1, structural)** One owner of view state. `panel-result` is currently a sibling of the
   tab panels (`popup.html:1229` vs `1399`), which is exactly why Escape can show two panes. Make the
   result a state *of* the Enhance tab.
3. **E1.3** Escape means one thing: close the result view if open; otherwise do nothing.
4. **E1.4 (D8)** Give the Library search box a `:focus-within` ring, matching `.input-bezel-card`.
5. **E1.5 (D14)** Drop one of the two nested chevrons.

**Verify:** extend `e2e/extension/reliability.spec.ts` (or add `popup-ux.spec.ts`) with two assertions:
Escape on the Settings tab must not reveal `#panel-enhance`; `ArrowRight` on the tablist moves
`aria-selected`.

### Phase E2 — Plain language

Apply §2's table. One tone list, defined once and reused by the popup, the dock and the modal, so
D13 cannot drift again. Keep the numbers that are real (token counts, latency); delete the labels
that imply measurement that did not happen.

**Verify:** widen the rule `include` patterns in `scripts/check-honesty.mjs` — the walk at line 92
already covers `extension/`, but the rules are `src`-scoped, which is exactly why D4 and D5 are
invisible. Add a stale-version rule for the `v3.0` class. Then re-run the gate and confirm it fails
on the pre-fix tree.

### Phase E3 — Density and polish

1. **(D6, D12, D14)** When telemetry is unknown, show a compact toolbar: one quiet capacity line, no
   ring, no burn badge, no second drawer. Delete the duplicate dock control.
2. **(D11)** Replace the external dicebear avatar with a local icon.
3. **(D15)** Cut the 55 s ceiling to something a user will wait for, and allow cancel.
4. **(D10)** Default to the offline engine. Under the free-tier decision (deterministic engine is the
   free tier), "Cloud AI" must not be the default for a user with no key — and after `ab2290a` the
   "cloud" path simply returns the deterministic engine anyway, so the label is now wrong as well as
   the default.
5. **(D17)** Do **not** build a second diff renderer for a 410px popup. Show the measured token delta
   (`PromptPlusTokenizer` is already loaded) and route the user to the in-page panel that already
   renders the diff properly.

**Verify:** manual pass at 410×560 plus `npm run build:extension` to confirm the packaged zip.

### Phase E4 — Keep it fixed

1. Keep the gate's coverage real: D4 and D5 prove that walking a directory is not the same as
   checking it. Widen the rule `include` patterns (not the walk) so `extension/**` is genuinely
   inspected, and add the stale-version rule for the `v3.0` class.
2. Add the popup-ux e2e from E1.
3. Extend `extension/test-plan.js` for the pure helpers it already covers.

**Verify:** `npm test`, `npm run test:extension`, `npm run test:extension:e2e`, CI green.

---

## 5. What this plan will not do

- Rebuild the diff popover, the persona switcher, or the launch buttons (§3).
- Introduce a design system, a framework, or a build step — the extension has no bundler and does not
  need one for these fixes.
- Restyle for its own sake. The palette and radii are fine; the defects are behaviour, semantics and
  wording.
- Add a settings option for anything. Every fix here is a better default.

## 6. Suggested PR slicing

| PR | Contents | Risk |
| --- | --- | --- |
| 1 | Phase E0 (defects only) | Very low — no markup or nav changes |
| 2 | Phase E1 (navigation + a11y) + its e2e | Low — touches panel visibility |
| 3 | Phase E2 (wording) + the gate widening | Very low — strings only |
| 4 | Phase E3 (density, avatar, timeout, default mode) | Medium — changes what users see first |
| 5 | Phase E4 (tests) | None |

---

## 7. Resolution — shipped as one change at `2.1.4`

Scope was widened by the user: fix the defects **and** re-cut the visual system around one calm usage
card, plain nouns and a single accent. Version moved `3.1.0 → 2.1.4` (user's explicit choice, knowing
it is a downgrade; Chrome Web Store will reject it if any `3.x` was ever uploaded).

| # | Status | Fix |
| --- | --- | --- |
| D1 | Fixed | `Escape` only calls `showEditView()` when the result view is visible |
| D2 | Fixed | Labels live in `<span id="*-label">`, so swapping text no longer deletes the icon |
| D3 | Fixed | The `scoreBadge.textContent = resultSource` line is gone; source moved into the loop badge |
| D4 | Fixed | File header and the cloud `category` now use `chrome.runtime.getManifest().version` |
| D5 | Fixed | Tooltip is `Runs instantly on this device. No network, no key.` |
| D6 | Fixed | `Limit unknown` / `Capacity unknown` / `Steady burn` replaced by plain wording; empty when unknown |
| D7 | Fixed | `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, `aria-controls`, Left/Right arrow keys |
| D8 | Fixed | Global `:focus-visible` ring; `outline: none` no longer hides focus |
| D9 | Fixed | `ENTER_HINT` / `PASTE_HINT` derived from the platform |
| D10 | Fixed | Default engine is the offline one; the on-device option hides when Chrome lacks the model |
| D11 | Fixed | Local `icons/icon48.png` instead of the dicebear request |
| D12 | Fixed | The dock's usage readout is a readout; `#pp-dock-studio-btn` is the only panel opener |
| D13 | Fixed | One `TONE_OPTIONS` list drives popup, dock and modal |
| D14 | Fixed | The nested runway drawer and its handler are deleted |
| D15 | Fixed | 55 s → 30 s, with a `shortcut:` note |
| D16 | Fixed | One `copyResultToClipboard()` helper; awaited and caught on every path |
| D17 | Fixed | Real `n → m tokens (±d)` line in the popup result view, from `PromptPlusTokenizer` |
| **D18** | Found + fixed | `popup.js` rendered `.library-card` / `.context-rule-card` while the CSS only styled `.template-card` / `.vault-card`: **the Templates and Context tabs rendered unstyled**. CSS now targets the rendered class names. |
| **D19** | Found + fixed | `.toast-msg` is `position: fixed; bottom: 12px` with no `pointer-events: none`, so it covered the result action row and **swallowed clicks on Save / Open for 2.8 s**. Now `pointer-events: none` plus 34 px of reserved space in the result panel. |
| **D20** | Found + fixed | Settings claimed *"Custom keys bypass all monthly rate limits."* They do not: `checkIpRateLimitAsync(\`ext:${ip}\`, 120, …)` runs before any key is read. Replaced with the true statement. |
| **D21** | Found + fixed | `body { user-select: none }` was inherited by the result card, so the "Select and copy the result manually" fallback told users to do something the CSS prevented. The result card, the textarea and the library search are now selectable. |
| — | Left alone | The server returns a dicebear avatar URL for signed-in users (`extension-sync/route.ts:66`), so `userAvatar.src` still points off-origin once signed in. Out of the agreed popup/dock/modal scope. |
| — | Not done | Phase E4's gate widening: the honesty gate still scopes 8 of 9 rules to `src/`, so extension wording is only partly checked. |

## 8. Structural pass — the popup gets a review step

The `2.1.4` rebuild changed the skin. This pass changed the layout, following the *structure* of comparable review-first extensions (single status card, plain feature nouns, and a diff you accept or reject) without borrowing any name, tagline or trade dress.

**The gap it closed:** the in-page panel already had a "see exactly what changed, then accept" step. The popup did not — it showed one finished text card. So the popup was structurally behind the extension's own in-page flow.

| | Before | After |
| --- | --- | --- |
| Popup result | one `#result-body` card | a **What changed / Final prompt** switch; the diff is the default, `#result-body` is the reading view |
| Diff renderer | inline in `content.js`, common-prefix/suffix only | one shared `lib/diff.js`, loaded by both the content script and the popup |
| In-page diff granularity | one `<del>` + one `<ins>` for a whole rewrite | a real word-level LCS diff |

**Why the renderer was rewritten.** The old prefix/suffix pass marked an entire prompt as changed whenever the compiler embedded the original verbatim in `### Task` / `### Context` scaffolding — which is exactly what the deterministic engine does. The diff claimed everything had changed when nothing had. `lib/diff.js` walks an LCS instead; a 400k-cell ceiling falls back to the linear prefix/suffix pass so a very large paste cannot block the popup. `src/__tests__/extension-review-diff.test.ts` pins the embed case, escaping, empties, and the fallback.

**Not copied, on purpose.**

| Idea from the reference | Why not |
| --- | --- |
| Three named pillars replacing the tab bar | The four tabs are pinned by 100+ structural assertions and the ids are load-bearing. Churn, no benefit. |
| A two-axis refiner (tone **and** intensity) | It needs a real engine parameter. `synthesizeLocalPrompt` and the cloud route take `tone` + `context` only; adding a control the engine ignores is a fabricated capability. |
| Their shield mark, name, tagline | Trade dress. `✦` stays. |

