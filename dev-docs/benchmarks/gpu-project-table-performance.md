# Production projection table measurements

## Result: physical batching can reverse the CPU/GPU comparison

P.8a.2a measures the production `ProjectionTableTransform` / `GPUProjectionTable` adapters.
At 65K source rows on this Apple adapter, UTM's warmed CPU round trip is faster on GPU with
two physical batches, but slower with seventeen. Albers remains faster on the CPU table adapter.
All 4K-row cases favor CPU. This is evidence about the current adapters, not a backend selector,
an optimized readback implementation, or a comparison with the fastest possible math.gl API.

[Raw schema-v1 JSONL](data/gpu-project-table-performance-2026-10-08.jsonl) preserves all 12
cases, minimum/median/p95/maximum, accuracy, device, setup and memory. The accompanying
implementation is based on master `e40a0ea90` (#3402), independently of the proposed inline-render
adapter #3403. Capture: 2026-10-08, math.gl **5.0.0-alpha.13**, Chromium 151, Apple `metal-3`,
non-fallback. Exact GPU model and driver are not exposed. No other build/test job from this task
ran during capture; unrelated workstation load and thermal state were not controlled.

## 65,547 total rows: medians in milliseconds

Each requested row count adds nine valid boundary/subdivision probes and two invalid rows.
All rows use raw binary64 inputs, cubic double-single arithmetic/output, 0.5 mm fitting tolerance
and a 1 mm maximum Euclidean output budget. Local UTM has one patch; regional UTM and Albers
have four. All captures passed; maximum observed error was below 0.30 mm.

| Domain | Maximum batch rows / actual batches | CPU | Resident GPU | Upload/project | Round trip | CPU / round trip |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| UTM local | 4,096 / 17 | 21.2 | 13.2 | 12.7 | 33.7 | 0.63x |
| UTM local | 65,536 / 2 | 20.6 | 10.5 | 8.5 | 11.2 | 1.84x |
| UTM regional | 4,096 / 17 | 20.8 | 14.2 | 9.9 | 33.4 | 0.62x |
| UTM regional | 65,536 / 2 | 21.2 | 9.9 | 7.7 | 10.7 | 1.98x |
| Albers regional | 4,096 / 17 | 8.7 | 9.5 | 11.1 | 33.0 | 0.26x |
| Albers regional | 65,536 / 2 | 8.6 | 10.2 | 8.1 | 11.2 | 0.77x |

At 4,107 total rows, CPU medians range from 0.6–1.4 ms and round trips from 3.0–5.6 ms.
The raw data includes both one- and two-batch cases. Rows within a domain are identical across
batch sizes; no coordinates are repacked or merged inside the benchmark.

## Measurement contract

- Two warmups and five measurements per path, fixed CPU then resident/upload/round-trip order.
  These small samples do not establish confidence intervals. Timer resolution, JIT/cache state,
  ordering and system activity matter; p95 with five samples is the maximum. Upload/project can
  measure faster than resident in separate intervals. Do not subtract medians to infer isolated
  transfer cost or add them as a latency decomposition.
- CPU uses the actual batch adapter's retained `projectToSync`, bounds/mask checks and fresh
  binary64 output/validity arrays and provenance. The earlier
  [flat/bulk API sweeps](gpu-project-performance-sweeps.md) remain the broader CPU baseline;
  this capture does not prove a win against those APIs or motivate weakening precision.
- GPU resident includes encoding, submission and a completion fence. Upload/project also writes
  raw64 inputs and masks. Round trip additionally reads positions and validity sequentially for
  each nonempty physical batch, decodes absolute binary64 arrays and copies metadata. There is
  one dispatch and parameter buffer per nonempty batch. Timestamp queries are disabled to retain
  production pass coalescing. No overlap, batched readback or implicit packing is introduced.
- `roundTripSpeedupOverCPU` compares CPU-resident outputs after reused-resource execution. GPU
  values are approximate within the budget; binary64 decoding does not grant binary64 arithmetic.
  This metric includes recurring transfers/staging but excludes one-time allocation/compilation.
  Resident and upload/project return GPU-resident output and do not get CPU speedup claims.
- Engine preparation, fitting and WGSL generation are measured together before the runner.
  Resource creation plus initial upload enqueue, graph compilation, remaining queue drain and
  first use are separate. The queue drain can include asynchronous pipeline work; neither it nor
  graph compilation is a pure transfer or cold-driver-compilation measurement.
- CPU typed-array output is 1,310,940 bytes at 65K. GPU inputs cost the same (16-byte coordinate
  plus 4-byte mask), outputs another 1,310,940 bytes. Plan parameters add 352 bytes per batch for
  local UTM or 1,120 for the regional cases. Reported GPU totals are 2,622,584–2,640,920 bytes;
  driver objects, shader binaries, readback staging and CPU validation copies are excluded.
- Every CPU result is checked; each GPU mode is checked before/after timing and each round-trip
  sample is checked separately, outside the interval. Invalid rows require zero raw payload and
  mask zero. All allocation/compile/readback/validation failures reject the report and release
  owned buffers. Ordinary tests cover empty batches, masks, offset views, local-f32 decoding,
  source snapshots and failure cleanup; the performance sweep uses double-single only.
- The retained math.gl transform is authoritative for both fitting and comparison. This measures
  approximation/consumer correctness, not independent validation of math.gl against PROJ. Error
  sampling is not a certified bound over the continuous domain.

## Reproduce

Run without concurrent builds/tests:

```sh
VITE_LUPROJ_TABLE_ROWS=4096,65536 VITE_LUPROJ_TABLE_BATCH_ROWS=4096,65536 \
  yarn test-browser-benchmarks --silent=false --reporter=verbose \
  modules/experimental/test/gpu-project/projection-table-performance.spec.ts
```

Without explicit rows the suite is a small smoke run and emits no measurement record. Hardware
qualification skips software/fallback adapters. Repeat on additional hardware before selecting
defaults. P.8a.2b (inline-render consumer) and P.8a.2c (isolated routing and cross-vendor evidence)
remain open. Any batching/readback optimization must be explicit and preserve source ownership
and physical batch boundaries; this PR changes no production execution policy.
