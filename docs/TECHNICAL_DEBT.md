# Remaining technical debt

Updated 2026-10-14 against current source.

| Area | Implemented | Remaining work |
| --- | --- | --- |
| Prompt compiler | PromptIR, intent/strategy engines, multiple candidates, validation, repair and security scanner exist | Calibrate behavior against real task outcomes; avoid scheduling duplicate modules |
| Evaluation | Symmetric comparisons, explicit unknown/tie/failure states, task rubrics and synthetic regression corpus | Run consented provider baselines, broaden rubrics beyond exact/substrings, calibrate human/LLM judging |
| Distributed protection | Awaited atomic Redis limiter, explicit outages, real Redis regression | Deployment proxy configuration and production Redis availability monitoring |
| Cache isolation | Complete options/tenant/credential identity, bounded capacity and bypass for evals | Consider a distributed cache only after measuring need |
| Extension | Session state persistence, navigation cleanup and browser fixture regressions | Manual live-site compatibility matrix; adapter-specific identity for query-only conversations |
| Model metadata | Historical web pricing is labeled unverified; chat capacity shown unknown | Verify model catalogs/prices with dates, consolidate legacy adapter heuristics, add supported model detection before capacity alerts |
| Database | Prisma with Neon HTTP adapter | Plain local PostgreSQL needs an appropriate adapter or Neon-compatible proxy; authenticated E2E setup is separate from public smoke tests |

See [reliability contracts](RELIABILITY.md). No model-quality improvement percentage, exact tokenizer accuracy, or live-site compatibility is established by source checks alone.
