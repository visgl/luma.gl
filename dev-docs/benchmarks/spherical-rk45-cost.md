# Adaptive spherical accuracy and cost

Native Apple WebGPU (`metal-3`), measured on 2026-11-27 on a shared host after
this worktree's validation and animated preview stopped. [Raw samples](spherical-rk45-cost.json)
retain three measurements per tolerance after one warmup, alternating tolerance order.

The fixture advects 4,096 particles from (1, 0, 0) for two seconds on a unit sphere.
A constant world vector (0, 0, 1) is projected into the tangent plane; its exact
trajectory is x = sech(t), y = 0, z = tanh(t). The 3×3 field has no interpolation
error, isolating the time integrator. Each call permits four attempts, with a
maximum step of one second and minimum step of 1e-5 seconds.

| Local tolerance | Measured trajectory error | Accepted / rejected steps per particle | Calls | Mean GPU ms | Mean wall ms |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1e-3 | 8.49e-5 | 3 / 0 | 1 | 0.081 | 1.20 |
| 1e-5 | 4.65e-6 | 6 / 2 | 2 | 0.184 | 1.73 |
| 1e-7 | 2.21e-7 | 16 / 9 | 7 | 0.597 | 5.37 |

Tighter tolerance reduces actual error while requiring more attempts and counter
synchronizations. Local embedded tolerance is not a global trajectory-error bound:
the tightest case's measured error exceeds its local tolerance. These measurements
qualify a manufactured field on one adapter, not real weather or cross-hardware accuracy.

Wall time includes encoding, submission, counter synchronization and optional timing
readback; it excludes allocation, final particle readback and rendering. GPU time
covers compute only. Each call reads 36 counter bytes (36 / 72 / 252 bytes per
completed horizon respectively); particle, previous and diagnostic buffers total
196,608 bytes. The tracer uses dense scheduling and one dispatch per call.

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true yarn test-headless --no-coverage --silent=false --testNamePattern='adaptive spherical tracing' modules/graph/test/experimental/simulation/scientific-flow-benchmark.spec.ts
```
