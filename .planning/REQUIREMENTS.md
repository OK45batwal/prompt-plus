# Requirements

Reconciled with the implemented product on 2026-10-14; replaces demonstration-only setup requirements.

| ID | Phase | Requirement | Verification |
| --- | --- | --- | --- |
| REL-01 | 03 | Distributed instances share an atomic fixed-window budget; unavailable protection returns 503, exhaustion 429 | Real Redis integration plus malformed/outage and route tests |
| REL-02 | 03 | Cached responses are isolated by trusted tenant, credential and all output-affecting options | Cache identity, expiry, bypass and error tests |
| EVAL-01 | 03 | Comparisons use identical settings; failures/unknown/ties cannot become wins | Symmetry, mismatch, failure and grading tests |
| EVAL-02 | 03 | Live evaluation requires explicit confirmation and bounded requests/tokens; default CI is offline | API schema, user budget and at-most-two-call tests |
| EXT-01 | 03 | Token state survives worker restart without persisting conversation text or duplicating alerts | Chromium lifecycle tests and mocked worker failure/race tests |
| EXT-02 | 03 | Text insertion never auto-submits; failed insertion can copy; navigation/tab closure clears stale state | Chromium input/contenteditable, clipboard and cleanup tests |
| META-01 | 03 | Unverified capacity/pricing is not presented as measured or guaranteed | Unknown UI states, unverified-price tests and documented metadata dates |
| RELEASE-01 | 03 | CI exercises web/extension behavior and packages all manifest assets | Workflow and isolated ZIP manifest validation |

These automated checks do not certify third-party live DOM compatibility, deployed Redis availability, authenticated database journeys, or task quality from live providers. Those release prerequisites are tracked separately.
