# Roadmap

## Historical phases 1–2

The original roadmap listed Initial Setup and Core Features as demonstration placeholders. Their status is unverified; this update does not retroactively mark them complete.

## Phase 03: Reliability and quality

Plan: [03-PLAN.md](phases/03-reliability-and-quality/03-PLAN.md)

- 03-01: Awaited atomic distributed rate limiting and explicit outage policy.
- 03-02: Tenant/credential/options cache isolation.
- 03-03: Symmetric task evaluation with missing/tie/failure states.
- 03-04: Extension session state, browser regression coverage and CI.
- 03-05: Honest capacity/pricing estimates, setup and release documentation.

Implementation and remaining release prerequisites are recorded in [03-VERIFICATION.md](phases/03-reliability-and-quality/03-VERIFICATION.md). Independent external AI review remains unavailable as documented in 03-REVIEWS.md.

## Follow-up work

- Configure production Redis/proxy settings and verify auth/database flows in staging.
- Run consented real-provider baselines before making model-quality claims.
- Verify provider pricing and chat-product limits, then replace legacy adapter heuristics with verified metadata.
- Record live-site extension compatibility before publishing a release.

## Proposed Phase 04: Website and extension product flow

User decision: cloud AI first using the user's API key; local enhancement is an explicit secondary option.

[04-PLAN.md](phases/04-product-flow/04-PLAN.md) defines the verified flow gaps, common cloud contract, save/auth boundaries, website/extension journeys, minimal file extractions and six implementation gates. This phase is proposed, not implemented. It builds on phase 03 rather than replacing its reliability work.
