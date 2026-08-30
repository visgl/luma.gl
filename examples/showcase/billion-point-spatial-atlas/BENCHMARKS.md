# Spatial Atlas reference benchmarks

This file records reference-device results separately from correctness tests. The figures are
diagnostic snapshots, not performance gates: browser, driver, power state, and timestamp-query
availability all affect them.

Run the one-million-point taxi view at 1440×900 with:

```bash
yarn workspace luma.gl-examples-showcase-billion-point-spatial-atlas benchmark
```

The harness waits for the 30-frame warm-up, samples eight additional seconds by default, rejects
page and console errors, and prints the adapter, corpus/residency counters, frame rate, and p50/p95
CPU/GPU stage timings. Set `SPATIAL_ATLAS_BENCHMARK_MILLISECONDS` to extend the sample window.

## Reference result

Recorded 2026-08-02 with Headless Chrome 145.0.7632.6 on its SwiftShader Vulkan adapter. This is a
repeatable software reference, not a claim about discrete- or integrated-GPU throughput. Timestamp
queries were unavailable. The bounded diagnostic counter readback did not drain within five
seconds, so matched/rendered counts are `n/a` for this run rather than the zero values left in the
inspector before readback.

| Metric | Result |
| --- | ---: |
| Corpus / GPU resident | 168.9M / 1M points |
| Candidate rows | 486.6K |
| Sample window | 8,000 ms after 30-frame warm-up |
| Sampled frame rate | 30 fps |
| CPU rebuild | 57.50 ms |
| CPU query encode p50 / p95 | 0.100 / 0.200 ms |
| CPU refinement encode p50 / p95 | 0.100 / 0.200 ms |
| CPU render encode p50 / p95 | 0.100 / 0.200 ms |
| GPU timings | unavailable on adapter |
| Matched / rendered | n/a; diagnostic readback budget exceeded |

Adapter: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)), SwiftShader
driver-5.0.0)`.
