# Active-work qualification — October 25, 2026

The active-work implementation removes capacity-sized steady-state payload snapshots, body wake
scans and contact-cache scans from the default ensemble path. It retains the shared failure
boundary and default eight-storage-binding WebGPU limit.

## Fixed-residency observations

Apple Metal-3, hardware WebGPU core device, Chromium; 1,024 independent sparse worlds × 32 bodies,
32,768 resident bodies, 65,536 contact slots. Sixty frames, ten warm-up, three repetitions, alternating
fraction order. Timing includes encoding, submission and fence completion; excludes diagnostics,
work-counter readback, compilation and drawing. GPU timestamp profiling is a separate additional
step after quality sampling and does not affect the timed frames.

| Active fraction | Active instances | Prior p95 (ms) | Active-work p50 (ms) | Active-work p95 (ms) | Observed p95 ratio | Active body-steps/s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1% | 11 | 17.10 | 1.20 | 1.50 | 11.40× | 288,052 |
| 10% | 103 | 18.00 | 1.60 | 1.90 | 9.47× | 2,107,417 |
| 50% | 512 | 18.50 | 1.40 | 1.60 | 11.56× | 11,299,310 |
| 100% | 1,024 | 18.30 | 1.90 | 2.10 | 8.71× | 16,925,620 |

Values are medians across run-level percentiles/throughput. The comparator is the previously
published [active-ensemble report](./ACTIVE-ENSEMBLE-QUALIFICATION.md), on the same adapter class
and dimensions, **not an interleaved baseline rerun**. Both were collected on a shared development
host. The observed ratios exceed the proposed 3×/2× low-activity targets and show no full-activity
regression, but they are exploratory observations, not a portable or controlled performance gate.
All twelve runs completed and passed finite-state, ballistic-position and world-equivalence checks.

At 1% activity the snapshot payload is 28,280 bytes/step (28,160 body bytes + 120 allocator bytes;
no contacts in this sparse fixture). At 100% it is 2,629,664 bytes. Reserved manifold capacity no
longer determines the copied payload. Contact scenes additionally snapshot 416 bytes plus 12
allocator bytes per distinct changed slot. These count payload writes, not total memory traffic.

The separate profile records scheduling, broad phase, contact maintenance, solver and rollback
CPU/GPU costs. The sparse configuration declares 63 compute dispatches across 46 semantic nodes.
Instrumentation separates passes for timestamps; throughput uses normal graph pass coalescing.

## Activity and residency stress

An additional 27 runs used the same device and three repetitions per case. All passed completion,
finite-state and independent-world equivalence checks. Dense contact trajectories were not compared
against a reference solver, so this is not a dense-contact accuracy qualification.

| Workload | Residency / enabled instances | Median p95 (ms) | Snapshot payload per sampled step |
| --- | --- | ---: | ---: |
| Sleeping | 32,768 bodies / 11 enabled | 1.4 | 32 B |
| Sleeping | 32,768 bodies / 1,024 enabled | 1.3 | 32 B |
| Wake every eight frames | 32,768 bodies / 11 enabled | 1.6 | 32–28,280 B |
| Wake every eight frames | 32,768 bodies / 1,024 enabled | 3.3 | 32–2,629,664 B |
| Dense pile | 8 × (32 spheres + floor) / 1 enabled | 1.5 | 4,820–43,340 B |
| Dense pile | 8 × (32 spheres + floor) / 8 enabled | 1.6 | 38,336–346,496 B |

Sleeping workloads reach zero scheduled bodies before the measured region and correctly report
zero body-step throughput. Wake storms alternate between active work and idle steps. Piles run
120 frames (ten warm-up); other workloads run 60 frames.

Holding work fixed at eight active instances × 32 bodies gives:

| Resident bodies | Resident instances | Median p95 (ms) | Snapshot payload |
| ---: | ---: | ---: | ---: |
| 4,096 | 128 | 1.6 | 20,576 B |
| 16,384 | 512 | 1.7 | 20,576 B |
| 32,768 | 1,024 | 1.4 | 20,576 B |

Inactive residency does not increase snapshot payload. The nonmonotonic timings show the shared-host
noise floor; these observations support bounded work rather than an exact residency latency law.

[Machine-readable stress observations](./results/apple-metal-active-work-stress-2026-10-25.json).

## Correctness and limits

The 23-test GPU ensemble regression suite covers collision isolation, bounded/adversarial hash traversal,
paused manifold/event preservation with compact and noncompact solving, default-limit extended
geometry, selective reset/rebase/shape restoration, sleeping/wake notifications, contact retirement
and slot reuse, repeated overflow, and rollback after successful cached-contact steps. The latter
checks body vectors, existing/new manifold payloads, cache keys, epochs, links and instance heads.
Tiny 1/2/4-slot budgets verify WGSL alignment; a capacity preflight preserves the previous default
storage-binding ceiling. Parallel finite-state validation rejects an overflowing angular integration
and clears its counter on the next idle step.

Remaining capacity-dependent work is explicit: scheduler/status scans instance records; optional
events, pose publication and noncompact fallback can scan bodies/contacts. Reset invalidation,
initial bucket initialization, capture and explicit readback remain capacity operations. Per-instance
contact traversal is serial within each instance. Journal storage is still reserved at capacity.
Independent failure recovery, heterogeneous ensembles, dense single-world scaling, a sustained
long-duration churn campaign and additional GPU vendors are not qualified by this report.

[Machine-readable observations](./results/apple-metal-active-work-2026-10-25.json).
