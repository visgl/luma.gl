# Authored physics broad-phase baseline

Measured October 24, 2026 with Node 22.23.4 and Chromium 151 on a hardware
Apple Metal 3 adapter (`fallback: false`). The machine was also running development
and test work: this is a reproducible qualification baseline, not an isolated
competitive-performance comparison.

```sh
node scripts/physics/benchmark-broad-phase.mjs --url http://127.0.0.1:5240/ --count 10000 --samples 20
```

The mixed-size fixture contains 10,000 objects. All 9,999 expected pairs matched;
there were zero dropped pairs, invalid bounds or incomplete queries. Discovery
performed 23,273 candidate tests. The graph has 43 nodes and declares 2,662,304
buffer bytes. Three warmup encodings precede twenty measured encodings.

| Measurement | Median | p95 |
| --- | ---: | ---: |
| CPU encoding | 0.60 ms | 1.60 ms |
| Completion including compact counter readback | 4.70 ms | 7.50 ms |
| GPU work | 1.31 ms | 2.09 ms |
| GPU timestamp span | 1.96 ms | 2.94 ms |

See [raw results](./gpu-physics-authored-broad-phase.json) for limits, budgets and
correctness counters. This closes the profile's hardware discovery baseline row.
It does not measure contact solving, CCD, rendering, whole-step throughput, or a
multi-device performance envelope.
