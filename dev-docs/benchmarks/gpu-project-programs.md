# GPU Project program comparison — 2026-09-16

## Method

Captured from the reproducible hardware test on an Apple WebGPU adapter reporting `metal-3`,
non-fallback, feature level `max`, subgroup size 32. The browser did not expose a specific renderer
or driver version. The repository test runner uses Chromium. This is one device/session, not a
cross-device performance guarantee.

Each fixture uses 65,536 deterministic finite rows plus one invalid row, raw binary64 input and
absolute double-single output. Two GPU warmups precede five measured submissions. Native formula
arithmetic is Float32; adaptive arithmetic is double-single. Both execute the same axis-swap
consumer. Every row is validated against an independent math.gl/proj4 oracle before GPU warmup
and after measurement. Native budgets are 20 metres (forward) or 0.0001 degrees (inverse);
adaptive budgets are 0.00001 metres or 1e-9 degrees. These budgets are deliberately not equivalent.

| Fixture | Source bounds | Output units |
| --- | --- | --- |
| Web Mercator | [-122.5, 37.7, -122.3, 37.9] degrees | metres |
| UTM north, zone 10 | [-122.5, 37.7, -122.3, 37.9] degrees | metres |
| UTM south, zone 56 | [150.9, -33.1, 151.1, -32.9] degrees | metres |
| UTM inverse, zone 10 | [550000, 4180000, 570000, 4200000] metres | degrees |

## Observed accuracy, memory and execution

Times below are medians in milliseconds. Synchronized execution includes queue submission through
fence completion; GPU time sums timestamped compute-pass durations. Neither includes source upload,
validation or readback. Inline and materialized modes had identical observed errors in this run.

| Fixture | Arithmetic | Maximum observed error | Parameter bytes | Inline sync | Materialized sync | Inline GPU | Materialized GPU |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| web-mercator | native | 2.6191e+0 | 184 | 2.60 | 2.70 | 2.275 | 2.228 |
| web-mercator | adaptive | 2.6217e-6 | 352 | 6.30 | 6.30 | 5.817 | 5.857 |
| utm-north | native | 2.0397e+0 | 320 | 2.10 | 2.00 | 1.626 | 1.642 |
| utm-north | adaptive | 7.5591e-6 | 352 | 9.00 | 8.30 | 8.468 | 7.897 |
| utm-south | native | 2.4434e+0 | 320 | 3.00 | 3.30 | 2.682 | 2.978 |
| utm-south | adaptive | 7.2274e-6 | 352 | 10.80 | 8.70 | 10.255 | 8.447 |
| utm-inverse | native | 1.8814e-5 | 320 | 3.40 | 3.30 | 3.082 | 2.743 |
| utm-inverse | adaptive | 1.9179e-10 | 352 | 5.40 | 5.40 | 5.012 | 5.041 |

Materialization adds exactly **1,310,740 bytes** (20 bytes per row: double-single coordinates and
validity). Total owned/imported benchmark buffers ranged from 2,359,516 to 2,359,684 bytes inline,
and from 3,670,256 to 3,670,424 bytes materialized. These counts exclude driver/pipeline storage
and temporary query/readback allocations. All adaptive fixtures used one patch: these results do
not test large multi-patch routing costs.

## Planning, compilation and first use

CPU planning/program-compilation columns are medians. Graph/pipeline setup and first synchronized
use are single observations, affected by shared driver caches and prior variants. A printed 0.00
means below timer resolution, not zero work. First use can include deferred driver compilation.
The factories call `planCRSProjection()`, including its internal compilation. The separate program
compilation column measures an additional standalone rebuild, not a decomposition of factory time.

| Fixture | Arithmetic | Planning | Program compile | Graph setup inline / materialized | First use inline / materialized |
| --- | --- | ---: | ---: | ---: | ---: |
| web-mercator | native | 0.00 | 0.00 | 24.70 / 14.70 | 6.90 / 3.20 |
| web-mercator | adaptive | 0.90 | 0.20 | 18.20 / 18.60 | 12.60 / 8.00 |
| utm-north | native | 0.10 | 0.00 | 16.00 / 15.90 | 5.80 / 2.20 |
| utm-north | adaptive | 1.10 | 0.10 | 8.40 / 10.00 | 8.40 / 10.00 |
| utm-south | native | 0.00 | 0.00 | 7.40 / 7.60 | 6.20 / 3.20 |
| utm-south | adaptive | 0.90 | 0.20 | 9.70 / 10.20 | 18.70 / 10.50 |
| utm-inverse | native | 0.00 | 0.10 | 15.10 / 15.10 | 9.20 / 3.20 |
| utm-inverse | adaptive | 1.00 | 0.10 | 8.20 / 8.30 | 7.20 / 5.80 |

## Interpretation and follow-ups

The [multi-patch and consumer-reuse follow-up](gpu-project-performance-sweeps.md) adds equal-budget
quadratic/cubic comparisons and uninstrumented reuse measurements. It is still one Apple device,
not cross-vendor or production-consumer evidence.

The adaptive path retains substantially more precision in these fixtures; its Float32 storage
limbs are not evidence of Float32 arithmetic. Native timing does not justify silently relaxing the
application's error budget. The minimal consumer exposes intermediate-memory cost, but observed
inline/materialized latency differences are noisy and do not establish universal fusion speedups.

Keep P.6 analytic high-precision math conditional: this baseline measures its potential trade-off,
not whether an unimplemented high-precision analytic formula wins. Before P.8 routing decisions,
add larger/multi-patch domains and actual consumer workloads. Repeat on additional GPU vendors.

## Reproduce

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true VITE_LUPROJ_BENCHMARK_ROWS=65536 \
  yarn test-headless --no-coverage --silent=false --reporter=verbose \
  modules/experimental/test/gpu-project/projection-program-benchmark.spec.ts
```

The test prints full JSON reports prefixed with `PROJECTION_PROGRAM_BENCHMARK`, including all
minimum/median/95th-percentile/maximum distributions and numerical metadata. Opt-in fixtures
default to 32 rows; ordinary hardware checks retain the correctness-gate and output-frame tests.
Software adapters retain the existing integer-fp64 skip policy.
