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
| web-mercator | native | 2.6191e+0 | 184 | 3.70 | 3.80 | 2.425 | 3.177 |
| web-mercator | adaptive | 2.6217e-6 | 352 | 8.00 | 8.40 | 7.529 | 7.825 |
| utm-north | native | 2.0397e+0 | 320 | 2.00 | 3.40 | 1.610 | 1.645 |
| utm-north | adaptive | 7.5591e-6 | 352 | 8.40 | 8.00 | 7.934 | 7.609 |
| utm-south | native | 2.4434e+0 | 320 | 2.10 | 2.80 | 1.730 | 1.746 |
| utm-south | adaptive | 7.2274e-6 | 352 | 7.50 | 7.70 | 7.080 | 7.238 |
| utm-inverse | native | 1.8814e-5 | 320 | 3.20 | 3.50 | 2.728 | 2.791 |
| utm-inverse | adaptive | 1.9179e-10 | 352 | 6.60 | 6.80 | 6.032 | 5.806 |

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
| web-mercator | native | 0.10 | 0.00 | 29.80 / 21.70 | 16.40 / 17.00 |
| web-mercator | adaptive | 1.20 | 0.10 | 19.50 / 21.10 | 14.50 / 18.80 |
| utm-north | native | 0.10 | 0.00 | 19.00 / 20.60 | 19.90 / 2.20 |
| utm-north | adaptive | 1.30 | 0.20 | 10.10 / 9.20 | 7.60 / 11.50 |
| utm-south | native | 0.00 | 0.00 | 7.70 / 7.80 | 17.20 / 2.70 |
| utm-south | adaptive | 1.00 | 0.20 | 9.60 / 9.30 | 9.40 / 7.00 |
| utm-inverse | native | 0.10 | 0.00 | 15.80 / 19.10 | 18.70 / 3.60 |
| utm-inverse | adaptive | 1.10 | 0.10 | 8.80 / 10.10 | 5.80 / 7.00 |

## Interpretation and follow-ups

The adaptive path retains substantially more precision in these fixtures; its Float32 storage
limbs are not evidence of Float32 arithmetic. Native timing does not justify silently relaxing the
application's error budget. The minimal consumer exposes intermediate-memory cost, but observed
inline/materialized latency differences are noisy and do not establish universal fusion speedups.

Keep P.6 analytic high-precision math conditional: this baseline measures its potential trade-off,
not whether an unimplemented high-precision analytic formula wins. Before P.8 routing decisions,
add larger/multi-patch domains and actual consumer workloads. Repeat on additional GPU vendors.

## Reproduce

```sh
VITE_LUPROJ_BENCHMARK_ROWS=65536 yarn test-headless --no-coverage --silent=false --reporter=verbose \\
  modules/experimental/test/gpu-project/projection-program-benchmark.spec.ts
```

The test prints full JSON reports prefixed with `PROJECTION_PROGRAM_BENCHMARK`, including all
minimum/median/95th-percentile/maximum distributions and numerical metadata. Ordinary hardware
checks use 32-row fixtures; software adapters retain the existing integer-fp64 skip policy.
