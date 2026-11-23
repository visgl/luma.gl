# Active ensemble qualification — October 25, 2026

Exploratory Apple Metal / Chromium run with 1,024 independent sparse worlds of 32 bodies
(32,768 resident bodies), 65,536 contact slots, 60 frames (10 warm-up), three repetitions.
The order of active fractions alternates across repetitions. Device uses standard WebGPU limits;
all passes fit eight storage bindings. Timings include encoding, submission and fence completion,
exclude compilation, diagnostics and rendering, and were collected on a shared development host.
These are observations, not portable performance thresholds.

| Requested active fraction | Actual active worlds | Median run p50 (ms) | Median run p95 (ms) | Median active body-steps/s |
| --- | ---: | ---: | ---: | ---: |
| 1% | 11 | 12.10 | 17.10 | 26,355 |
| 10% | 103 | 11.40 | 18.00 | 266,064 |
| 50% | 512 | 12.70 | 18.50 | 1,237,275 |
| 100% | 1024 | 12.40 | 18.30 | 2,448,662 |

All twelve runs passed completion, finite-state, analytic ballistic and active-world equivalence
checks. Paused worlds stayed at their initial positions. Per-instance participation summaries
matched active counts; no rejected steps or shared failures were recorded. The exported report
summarizes individual status rows to avoid repeating 1,024 rows per case.

**Low activity does not yet yield proportionate frame-time savings.** This workload is dominated
by fixed dispatch and capacity-sized scans/copies. Active queues avoid full-population sorting and
skip integration/bounds/collision discovery for inactive instances, but wake scans, bucket clears,
contact-cache/solver preparation and shared rollback copies remain. The next performance tranche
should measure and remove those costs rather than claim active-proportional throughput here.

GPU regression tests additionally cover collision isolation/equivalence, bounded candidate traversal,
shared overflow rollback, selective pause/reset/replay, fixed reset memory, sleeping/waking,
rebased reset, retained resting contacts and paused event suppression. Dense contact accuracy,
long-duration churn, independent failure recovery and additional adapters remain unqualified.

[Machine-readable report](./results/apple-metal-active-ensemble-2026-10-25.json).
