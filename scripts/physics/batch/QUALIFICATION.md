# G10 exploratory qualification — October 25, 2026

Chromium 151.0.7922.34, WebGPU Apple/Metal. The adapter reports `gpuType: unknown`, `fallback: false`. The development host was shared; substantial run-to-run variance means these are diagnostic measurements, not hardware rankings.

Two repetitions per configuration, 60 frames with 10 warmup frames, one 1/120-second step per frame, eight parallel-solver iterations. Submission mode order alternates. Each range below spans repetition-level p95 values; percentiles are not pooled.

| Workload | Worlds × dynamic bodies | Submission | p95 batch latency (ms) | Body-steps/s | Resident MiB |
|---|---:|---|---:|---:|---:|
| sparse | 1 × 1024 | batched | 4.5–7.6 | 308,063–520,855 | 23.4 |
| sparse | 1 × 1024 | separate | 2.4–3.5 | 413,236–544,681 | 23.4 |
| sparse | 8 × 1024 | batched | 24.5–24.6 | 429,170–487,793 | 187.1 |
| sparse | 8 × 1024 | separate | 14.7–20.2 | 656,410–727,273 | 187.1 |
| sparse | 1 × 10000 | batched | 12.9–30.4 | 647,417–876,578 | 369.4 |
| sparse | 1 × 10000 | separate | 12.2–36.1 | 408,263–940,734 | 369.4 |
| pile | 8 × 128 | batched | 19.5–20.6 | 68,155–89,521 | 23.4 |
| pile | 8 × 128 | separate | 9.2–9.6 | 160,248–180,672 | 23.4 |
| pile | 1 × 1024 | batched | 3.3–4.9 | 283,776–434,322 | 23.4 |
| pile | 1 × 1024 | separate | 5.1–9.7 | 295,389–376,285 | 23.4 |

All 32 runs reported complete work and passed their declared finite-state/world-equivalence checks. Sparse runs additionally checked analytic ballistic motion: maximum final position error was below 0.000355 world units. Dense runs do **not** qualify penetration, energy, friction or stacking accuracy.

For the same 10,000-body configuration, omitting redundant rollback scratch from reset checkpoints reduces retained buffers from 499,659,648 to 387,390,560 bytes: **112,269,088 bytes (22.5%) saved**. This is allocation accounting, not measured process VRAM. Each reuse kept the original world allocation and compiled graph.

The eight-world 1,024-body workload favored separate submissions in both repetitions. One-world submission modes execute equivalent work, yet their timings also varied: that is evidence of measurement noise, not an algorithmic difference. Tune submission group size on the target adapter; do not assume the largest group wins.

Remaining G10 gates include fused independent-world kernels, shared GPU cooked assets, smaller persistent reset snapshots, peak-memory admission, interaction across streamed partitions, long-duration device-loss/recovery runs, and the supported hardware matrix.

[Raw reports and source digests](./results/apple-metal-2026-10-25.json) contain memory categories, setup/reuse times, encoding latency and individual repetition results.
