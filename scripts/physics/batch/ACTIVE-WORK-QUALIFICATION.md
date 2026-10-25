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
| 1% | 11 | 17.10 | 1.90 | 2.50 | 6.84× | 172,888 |
| 10% | 103 | 18.00 | 1.60 | 2.10 | 8.57× | 1,992,745 |
| 50% | 512 | 18.50 | 4.20 | 6.10 | 3.03× | 3,727,025 |
| 100% | 1,024 | 18.30 | 6.80 | 7.60 | 2.41× | 4,687,840 |

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

## Correctness and limits

The GPU ensemble regression suite covers collision isolation, bounded/adversarial hash traversal,
paused manifold/event preservation with compact and noncompact solving, default-limit extended
geometry, selective reset/rebase/shape restoration, sleeping/wake notifications, contact retirement
and slot reuse, repeated overflow, and rollback after successful cached-contact steps. The latter
checks body vectors, existing/new manifold payloads, cache keys, epochs, links and instance heads.

Remaining capacity-dependent work is explicit: scheduler/status scans instance records; optional
events, pose publication and noncompact fallback can scan bodies/contacts. Reset invalidation,
initial bucket initialization, capture and explicit readback remain capacity operations. Per-instance
contact traversal is serial within each instance. Journal storage is still reserved at capacity.
Independent failure recovery, heterogeneous ensembles, dense single-world scaling, a sustained
long-duration churn campaign and additional GPU vendors are not qualified by this report.

[Machine-readable observations](./results/apple-metal-active-work-2026-10-25.json).
