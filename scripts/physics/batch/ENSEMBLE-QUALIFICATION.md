# Fused ensemble qualification — October 25, 2026

Exploratory WebGPU Apple/Metal measurements on a shared development host, Chromium
151.0.7922.34. Two repetitions, alternating mode order; 40 frames, 10 warmup frames,
one 1/120-second step per frame, eight parallel-solver iterations. Timings include encoding,
submission and GPU completion. Diagnostics, final pose readback and rendering are excluded.

| Workload | Instances × bodies | Mode | p95 range (ms) | Body-steps/s range | Retained MiB |
| --- | ---: | --- | ---: | ---: | ---: |
| Sparse | 8 × 128 | Fused | 2.4–2.7 | 409,600–448,467 | 4.11 |
| Sparse | 8 × 128 | Separate submissions | 6.5–7.2 | 171,429–177,367 | 6.42 |
| Sparse | 8 × 1024 | Fused | 7.2–7.3 | 1,143,602–1,160,888 | 32.85 |
| Sparse | 8 × 1024 | Batched submissions | 17.1 | 492,012–492,111 | 51.35 |
| Sparse | 8 × 1024 | Separate submissions | 12.0–12.9 | 684,759–694,433 | 51.35 |
| Sparse | 1024 × 8 | Fused | 9.2–9.3 | 907,868–935,160 | 62.10 |
| Sparse | 1 × 32768 | Fused | 19.3–20.6 | 2,203,631–2,244,384 | 72.89 |
| Pile | 8 × 128 (+ one static floor each) | Fused | 3.8–3.9 | 285,873–287,199 | 15.08 |
| Pile | 8 × 128 (+ one static floor each) | Separate submissions | 11.5–11.6 | 96,962–97,053 | 23.40 |

Sparse comparisons use four pair slots per body, scale runs use two, and pile runs use sixteen.
Each template's pair capacity rounds up to a power of two with a minimum of 64; the fused
capacity is their sum rounded up to a power of two. The 1024 × 8 case therefore reserves more
pair slots per body than the 32768-body case. These are explicit fixture budgets, not a claim
that sparse budgets suffice for arbitrary contacts. Pile throughput includes the static floors.

All 22 runs completed and passed their declared quality checks. Sparse analytic ballistic
position error was below 0.000375 world units. Pile checks cover finite state and agreement
between instances, not penetration, energy, friction or stacking qualification. Real WebGPU
regressions additionally compare colliding instances with an isolated reference, test coincident
worlds with a strict traversal budget, oversized planes and atomic rollback on capacity overflow.

The 8192-body fused case achieved approximately 1.65–1.67 times separate-submission throughput
in these repetitions. It encodes one solver graph per step instead of eight. Its retained storage
is about 36% smaller, largely because it does not retain the extra reset checkpoints that the
resident-slot API provides. This is not a like-for-like reset capability comparison. Storage
figures include graph scratch but exclude driver/pipeline allocation and compilation peaks.

Limits remain: 65,535 bodies/colliders per ensemble, fixed membership, common settings,
shared rollback/contact capacity, and no joints, CCD or authored triggers. No million-body,
active-only broad-phase or cross-adapter performance claim is made.

[Raw reports](./results/apple-metal-ensemble-2026-10-25.json) include all modes, per-run options,
quality, device metadata, source digests and allocation categories. The earlier report remains
unchanged as historical evidence of the separate-world implementation.
