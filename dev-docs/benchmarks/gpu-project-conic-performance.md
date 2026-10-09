# Native conic optimization measurements

## Result: an opt-in optimization at metre-scale budgets

P.5a.1/P.5a.2 add native Float32 Lambert 1SP/2SP and Albers formulas to existing adaptive
coverage. On this Apple adapter, native inline execution at 64K regional rows is **1.95–2.97x
faster** than cubic adaptive execution at the same **20 m maximum output budget**. Parameter
storage and planning also decrease. This does **not** justify replacing the default high-precision
adaptive path: native observed error is approximately 3–4 m, while the local adaptive fixtures
happen to achieve approximately 1–2 mm despite their deliberately loose fitting tolerance.

[Raw schema-v1 JSONL](data/gpu-project-conic-performance-2026-10-08.jsonl) preserves all twelve
cases, both inline/materialized paths, six CPU APIs, distributions, errors, setup, memory and
device metadata. Capture: 2026-10-08 America/New_York (2026-10-09 UTC), Chromium 151,
math.gl **5.0.0-alpha.13**, Apple `metal-3`, hardware WebGPU. The API does not expose the exact
GPU model or driver. Based on benchmark PR #3404 (`f262aee72`) plus this P.5 implementation.
No other builds/tests from this task ran during capture; unrelated workstation load/thermal
state was not controlled.

## Regional 65,546 total rows

All cases use bounds `[-100, 25, -60, 60]` degrees, the independent serialized WGS84 conic
definitions in the fixtures, raw binary64 input, double-single **output encoding**, one axis-swap
consumer, two warmups and five measured samples. Adaptive fitting uses degree three and a 10 m
target; every GPU result must pass the shared 20 m Euclidean output gate and exact validity checks.
Native arithmetic is Float32, not double-single just because its output has two limbs.

| Method | Adaptive patches | Parameter bytes adaptive / native | Planning median ms adaptive / native | Inline resident ms adaptive / native | Observed error m adaptive / native |
| --- | ---: | ---: | ---: | ---: | ---: |
| Lambert 1SP | 28 | 7,264 / 272 | 19.1 / <0.1 | 8.4 / 3.6 | 9.79 / 4.11 |
| Lambert 2SP | 28 | 7,264 / 272 | 17.2 / 0.1 | 7.8 / 4.0 | 9.90 / 3.23 |
| Albers | 52 | 13,408 / 272 | 32.2 / 0.1 | 9.2 / 3.1 | 8.58 / 4.08 |

Materialized medians are respectively 8.4/5.0, 9.8/6.3 and 9.1/4.1 ms (adaptive/native).
Materialization uses one extra dispatch and 1,310,920 bytes of intermediate position/validity
storage. Total inline buffers are 2,366,920 / 2,359,928 bytes for Lambert and
2,373,064 / 2,359,928 for Albers. Parameter savings are real but small relative to per-row data.
The fastest measured CPU inline API here is `projectFlatSync`: 8.1, 9.5 and 6.0 ms. The raw report
also includes allocating/reusable scalar and `ProjectionBuffer` flat, strided and column baselines.
Resident-GPU comparisons assume the coordinates already live on GPU and results stay there;
they exclude uploads/readback and are not CPU-memory round trips.

## Local domains, small batches and setup caveats

Local bounds `[-72, 41, -71, 42]` need just one adaptive patch: 352 bytes versus native's 272.
At 64K local rows, inline resident medians are 8.1/3.2 ms (Lambert 1SP), 7.3/3.7 (2SP),
and 5.7/3.4 (Albers). At 4K, native GPU typically takes 1.0–1.1 ms while the fastest CPU inline
path takes 0.4–0.5 ms. No universal GPU crossover or automatic selector follows from this run.

Planning and CPU WGSL generation are measured separately. Some native planning/generation samples
fall below the 0.1 ms timer resolution; zero is not free work. Driver graph construction ranges
from approximately 5 ms on reused shaders to hundreds of milliseconds on initial shapes. In
particular, local Albers native graph construction costs about 291–341 ms while the already-used
adaptive shader takes 6–8 ms. This fixed ordering/cache-sensitive run is **not** evidence that
native always compiles faster. First-use, upload drain and graph construction are not additive
components of a guaranteed cold-start time; inspect their raw fields separately.

## Accuracy and reproducibility contract

- Each variant uses identical common-domain rows, nine valid boundary/subdivision probes and one
  nonfinite row. Native's wider branch and adaptive's fitted rectangle are not treated as equivalent
  domains outside these inputs. Dedicated qualification tests cover outside/seam/inverse rejection.
- Every output is validated before and after timing; a mismatch rejects the report. Native
  forward/inverse tests separately cover both hemispheres, raw64/split/f32 encodings, parameter
  variants and guarded inverse footprints. Albers' local area Jacobian is checked independently.
  Opposite-cone stress coordinates can exceed 60 million metres and use a separate 32 m per-axis
  gate (23.4 m observed in this capture's hardware qualification), not the regional 20 m benchmark
  budget. Float32 formula error is domain-dependent; no global 20 m claim is made.
- The conic oracle is independently serialized through math.gl, not generated from our native
  constants. This is not a PROJ binary cross-validation or a proof over the continuous domain.
- Default adaptive sub-Float32 regressions remain separate. A 20 m gate permits this comparison;
  it says nothing about native compliance with mm/cm requirements or other adapters.
- Resident timing includes CPU encoding, submission and completion fence. Timestamp queries are
  disabled to retain normal pass coalescing. Five samples, fixed ordering, timer resolution and
  driver caches limit statistical claims; p95 is the largest of five samples.
- This is forward-only performance evidence. Inverse correctness is tested, but inverse
  performance, cross-vendor qualification and further consumer reuse remain unmeasured here.

Run without concurrent builds/tests:

```sh
VITE_LUPROJ_CONIC_ROWS=4096,65536 yarn test-browser-benchmarks --silent=false --reporter=verbose \
  modules/experimental/test/gpu-project/projection-conic-performance.spec.ts
```

Without explicit rows this opt-in suite runs a small smoke matrix and emits no measurements.
Software/fallback adapters skip hardware precision qualification. Use the separate
[production-table large sweep](gpu-project-table-performance.md) for 4K–4M resident versus
transfer-inclusive comparisons at a fixed 1 mm adaptive budget.
