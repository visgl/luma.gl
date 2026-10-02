# GPU Project multi-patch and reuse measurements — 2026-09-16

## Scope and reproducibility

This is the first local P.8a sweep, not completion of the cross-vendor/production-consumer tranche.
It extends the [original native/adaptive baseline](gpu-project-programs.md) with **equal-budget
double-single comparisons** and multiple consumers. No execution default or projection formula
was changed to obtain these measurements.

Captured on the local Apple WebGPU adapter reporting `metal-3`, non-fallback, feature level
`max`, subgroup size 32, using Chromium 151. The browser did not expose an exact GPU model or
driver version. Full user-agent/device metadata and all distributions are in the
[raw JSONL reports](data/gpu-project-performance-2026-09-16.jsonl) (one report per line).

The implementation accompanies this report and is based on master `80fc29583`. The primary
capture ran from 2026-09-16T22:09:05.521Z to 2026-09-16T22:09:31.815Z, after this task's
build/test jobs finished. An exploratory run is not included in the archived data. This is one
device/session with five samples per path, not a confidence interval or cross-device guarantee.

## Method

- Three domains: UTM zone 10 local `[-122.5, 37.7, -122.3, 37.9]`, UTM zone 10 regional
  `[-123, 37.3, -122, 38.3]`, and regional Albers `[-72, 41.3, -71, 42.3]`, all in degrees.
- Quadratic (degree 2) and cubic (degree 3) plans both fit at 0.5 mm tolerance and must pass an
  independent serialized proj4 oracle at **1 mm Euclidean output error**. Inputs are binary64;
  arithmetic and absolute outputs remain double-single. Sampled error is not a global guarantee.
- Each requested row count (1,024 / 16,384 / 65,536) adds nine valid boundary/first-subdivision
  seam probes and two invalid rows. The largest workload therefore has 65,547 rows, 65,545 valid.
- One or four independent axis-swap consumers each write their own coordinate and validity
  buffers. Inline mode repeats projection per consumer. Materialized mode projects once and shares
  that result **within the same submission**. This is not caching across frames.
- Every output of every consumer is checked before warmup and after timing. Each path runs two
  GPU warmups and five measured submissions. No throughput is reported for a failing path.
- Primary measurements disable GPU timestamps so normal compute-pass coalescing remains enabled.
  Synchronized time covers submission through fence completion; CPU encoding is reported
  separately. Upload, correctness checks, readback, planning and compilation are outside that
  interval. Source-row throughput refers to the whole consumer workload, not rows × consumers.
- Degree 2 precedes degree 3; inline precedes materialized. Warmed timing still has order, cache,
  thermal and system-load sensitivity. Setup and first-use columns in JSON are cache-sensitive,
  not cold-driver compilation guarantees. Nearest-rank p95 with five samples is the maximum.

## Patch count, parameter memory, planning and accuracy

These rows use the 65,536-row/one-consumer cases. Times are medians in milliseconds;
observed errors are millimetres. The factory includes CRS planning and its internal compilation;
the program-compile column is an **additional rebuild**, not a decomposition of factory time.

| Fixture | Degree | Patches | Parameter bytes | Maximum observed error (mm) | Planning ms | Program compile ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| utm-local | 2 | 16 | 4,192 | 0.1094 | 14.10 | 0.20 |
| utm-local | 3 | 1 | 352 | 0.0076 | 0.80 | 0.10 |
| utm-regional | 2 | 256 | 65,632 | 0.2140 | 226.80 | 0.90 |
| utm-regional | 3 | 4 | 1,120 | 0.2958 | 3.60 | 0.20 |
| albers-regional | 2 | 256 | 65,632 | 0.1602 | 148.20 | 0.90 |
| albers-regional | 3 | 4 | 1,120 | 0.0999 | 2.40 | 0.10 |

Cubic regional plans use 4 patches rather than 256, and 1,120 rather than 65,632 parameter bytes.
Degree and patch count change together: this does **not** isolate routing cost or prove that an
indexed lookup is worthwhile. Patch selection still uses the existing linear scan.

## Reuse at 65,547 total rows

All entries are uninstrumented synchronized medians in milliseconds. Speedup compares the
four-consumer inline workload with the four-consumer materialized workload, at identical rows,
precision, budget and independent output count.

| Fixture | Degree | 1 consumer inline | 1 consumer materialized | 4 consumers inline | 4 consumers materialized | 4-consumer reuse speedup |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| utm-local | 2 | 8.80 | 8.00 | 29.30 | 6.40 | 4.58× |
| utm-local | 3 | 8.40 | 9.50 | 33.90 | 8.50 | 3.99× |
| utm-regional | 2 | 14.60 | 13.20 | 54.20 | 13.50 | 4.01× |
| utm-regional | 3 | 7.60 | 5.70 | 24.40 | 5.90 | 4.14× |
| albers-regional | 2 | 13.90 | 14.70 | 52.70 | 13.10 | 4.02× |
| albers-regional | 3 | 6.60 | 5.50 | 24.70 | 5.40 | 4.57× |

Materializing once is consistently useful for four consumers in these synthetic cases.
Single-consumer differences are smaller, noisy and sometimes reverse; these samples do not
justify an automatic crossover threshold.

Materialization adds exactly **1,310,940 bytes** at the largest row count: 20 bytes per row for
double-single coordinates plus validity, independent of consumer count. Each consumer also
has its own 20-byte-per-row output, counted in both paths. Source input costs 16 bytes per row.
Reported totals exclude driver/pipeline storage and temporary query/readback allocations.

### Example row scaling: cubic regional UTM

| Total source rows | 1 consumer inline ms | 4 consumers inline ms | 4 consumers materialized ms |
| ---: | ---: | ---: | ---: |
| 1,035 | 1.80 | 5.30 | 1.00 |
| 16,395 | 3.50 | 6.80 | 2.10 |
| 65,547 | 7.60 | 24.40 | 5.90 |

All other row-count combinations and minimum/median/p95/maximum distributions remain in JSONL.

## Separate timestamp-instrumented profile

These are **different runs**, with GPU timestamps enabled, at 65,547 rows and four consumers.
Instrumentation prevents compute-pass coalescing. Do not substitute these values into the
uninstrumented tables or attribute the timing difference solely to GPU computation.
The reported GPU metric sums per-pass timestamp intervals; it is **not elapsed GPU latency**.
For the independent inline consumers, these sums exceed the submission-to-fence interval on this
adapter. Overlapping pass intervals or backend timestamp behavior need separate attribution;
this capture does not establish the cause. Use the uninstrumented synchronized measurements for
the performance conclusions above, not these sums. Synchronized and summed-pass medians summarize
separate per-submission measurements.

| Fixture | Degree | Mode | Synchronized ms | Summed pass intervals ms |
| --- | ---: | --- | ---: | ---: |
| utm-local | 2 | inline | 27.70 | 52.09 |
| utm-local | 2 | materialized | 7.50 | 6.82 |
| utm-local | 3 | inline | 35.90 | 67.95 |
| utm-local | 3 | materialized | 8.10 | 7.66 |
| utm-regional | 2 | inline | 56.60 | 119.14 |
| utm-regional | 2 | materialized | 11.90 | 11.58 |
| utm-regional | 3 | inline | 27.40 | 47.11 |
| utm-regional | 3 | materialized | 7.10 | 6.98 |
| albers-regional | 2 | inline | 57.10 | 115.33 |
| albers-regional | 2 | materialized | 11.90 | 11.75 |
| albers-regional | 3 | inline | 24.50 | 43.57 |
| albers-regional | 3 | materialized | 6.30 | 6.48 |

## Reproduce

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true \
  VITE_LUPROJ_SWEEP_ROWS=1024,16384,65536 VITE_LUPROJ_SWEEP_CONSUMERS=1,4 \
  VITE_LUPROJ_SWEEP_GPU_TIMING=false \
  yarn test-headless --no-coverage --silent=false --reporter=verbose --fileParallelism=false \
  modules/experimental/test/gpu-project/projection-performance.spec.ts
```

For the separate profile, set `VITE_LUPROJ_SWEEP_ROWS=65536`,
`VITE_LUPROJ_SWEEP_CONSUMERS=4` and `VITE_LUPROJ_SWEEP_GPU_TIMING=true`.
Each JSON record is printed after `PROJECTION_PERFORMANCE_SWEEP `.
The archived file contains 18 uninstrumented reports (72 paths) followed by three instrumented
reports (12 paths), all passing the same independent accuracy/validity gate.

## Matched math.gl/proj4 CPU comparison

A subsequent isolated capture adds CPU baselines to the same 18-case uninstrumented sweep:
[CPU/GPU JSONL reports](data/gpu-project-cpu-comparison-2026-09-16.jsonl).
These schema-version-2 records ran from 2026-09-16T22:20:19.224Z to 2026-09-16T22:20:50.842Z
on the same adapter/browser described above. CPU reference versions were
`@math.gl/proj4 5.0.0-alpha.5` and `proj4 2.21.0`. This is the JavaScript
`Proj4Projection.project()` implementation, **not native C++ PROJ**.

The oracle wrapper applies the same finite/domain validity checks and calls an already-constructed
CPU projection. `oracleTimeMilliseconds` measures one callback per source row plus a checksum,
without consumer output buffers. Its 65,547-row medians were:

| Fixture | CPU oracle/checksum ms |
| --- | ---: |
| utm-local | 30.80 |
| utm-regional | 30.00 |
| albers-regional | 20.40 |

For the matched workloads, CPU inline mode actually projects once per consumer; CPU materialized
mode projects once into a shared intermediate then executes each consumer. Both write preallocated
binary64 coordinate arrays and uint32 validity arrays; every output is checked before warmup and
after timing. This gives CPU the same reuse opportunity instead of multiplying its projection-only
time by consumer count. CPU output is more precise than double-single and is not the same encoding.

CPU timings include callback/provider allocations, domain checks and consumer writes; constructor,
output allocation and validation are excluded. GPU timings below add CPU encoding to synchronized
submission-to-fence time **per sample before summarizing**. Upload/readback, planning, allocation
and compilation are excluded. Thus these are **GPU-resident, steady-state** ratios, not full
CPU-memory round-trip speedups. Provider and workload warmups are two iterations, followed by five
samples; ordering and single-session limitations still apply.

### 65,547 rows, cubic adaptive GPU versus matching CPU mode

GPU uses the same 1 mm error budget and double-single arithmetic as the original sweep.
Ratios greater than one favor GPU; ratios below one favor CPU.

| Fixture | Consumers | Mode | CPU workload ms | GPU encoding + fence ms | CPU / GPU |
| --- | ---: | --- | ---: | ---: | ---: |
| utm-local | 1 | inline | 30.30 | 8.20 | 3.70× |
| utm-local | 1 | materialized | 30.30 | 10.10 | 3.00× |
| utm-local | 4 | inline | 120.50 | 33.30 | 3.62× |
| utm-local | 4 | materialized | 30.70 | 8.20 | 3.74× |
| utm-regional | 1 | inline | 30.20 | 6.20 | 4.87× |
| utm-regional | 1 | materialized | 30.10 | 7.20 | 4.18× |
| utm-regional | 4 | inline | 121.20 | 26.30 | 4.61× |
| utm-regional | 4 | materialized | 31.10 | 6.70 | 4.64× |
| albers-regional | 1 | inline | 20.40 | 5.30 | 3.85× |
| albers-regional | 1 | materialized | 20.80 | 5.70 | 3.65× |
| albers-regional | 4 | inline | 82.10 | 22.60 | 3.63× |
| albers-regional | 4 | materialized | 21.10 | 6.60 | 3.20× |

The raw reports also include both quadratic GPU paths; the table does not silently compare
materialized GPU reuse against repeated CPU projection.

### Small batches can favor CPU

Cubic regional UTM, one consumer, shared-result mode:

| Total rows | CPU workload ms | GPU encoding + fence ms | CPU / GPU |
| ---: | ---: | ---: | ---: |
| 1,035 | 0.50 | 1.90 | 0.26× |
| 16,395 | 7.90 | 2.10 | 3.76× |
| 65,547 | 30.10 | 7.20 | 4.18× |

These samples demonstrate a workload-size effect, not a portable crossover threshold.
Both medians must be positive to publish a ratio; otherwise the report uses `null`.
The existing reproduction command now emits the CPU baselines and ratios as well.
The original schema-version-1 capture above remains unchanged for provenance.


## Decisions and remaining evidence

- Retain cubic fitting as the default; it already avoids much of the regional patch-count and
  planning cost demonstrated here. This work measures existing choices rather than changing them.
- Prioritize a real multi-consumer P.9a workload before P.8c automatic cost selection.
- Keep P.8b indexed routing conditional: isolate lookup cost and measure lookup-build/storage
  overhead before claiming a gain. Polynomial-degree sweeps alone cannot establish it.
- Keep native Lambert/Albers formulas and analytic double-single transcendental work as
  **optimization-only** candidates; these measurements establish no win for unimplemented formulas.
- P.8a remains partial until other GPU vendors, real consumers and isolated routing evidence are
  available. No 3D, datum/grid or additional projection coverage is claimed here.
