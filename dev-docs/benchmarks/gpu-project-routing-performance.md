# P.8 routing and execution qualification

P.8 adds three separate mechanisms: **indexed routing (optimization only)**, **explicit domain
partitions (new bounded coverage)**, and **measured inline/materialized selection (optimization
only)**. None changes default precision or routing. The existing table benchmark and 4M resident
sweep remain the production table evidence; this report does not replace those measurements.

## Local capture: 2026-10-08 (America/New_York)

[Resident raw JSONL](data/gpu-project-routing-resident-2026-10-08.jsonl) contains 24 passing cases:
4K/65K/262K requested rows, one/four consumers, two geographic fixtures and two stress budgets.
[Separate timestamp JSONL](data/gpu-project-routing-timestamps-2026-10-08.jsonl) contains four
passing 65K/single-consumer cases. UTC capture timestamps are 2026-10-09. The code is based on
master `e1772a57c` plus this P.8 working-tree implementation, recorded as
`136b31e32-p8-leaf-range-hardening` (refreshed after review). Hardware: Apple `metal-3`, non-fallback, Chromium 151,
math.gl 5.0.0-alpha.13 for the geographic oracle. Exact GPU model/driver are redacted. No other
build/test from this task ran concurrently; unrelated workstation load and thermal state were
not controlled.

At 65,536 requested rows (65,547 including probes), medians in milliseconds:

| Fixture | Consumers | Lookup scan / index | Full inline scan / index | Full materialized scan / index |
| --- | ---: | ---: | ---: | ---: |
| utm-regional | 1 | 6.4 / 1.4 | 11.0 / 4.7 | 11.0 / 4.7 |
| utm-regional | 4 | 5.7 / 0.8 | 42.2 / 18.0 | 11.1 / 4.8 |
| albers-regional | 1 | 5.7 / 0.9 | 10.9 / 4.6 | 10.7 / 4.7 |
| albers-regional | 4 | 5.7 / 0.8 | 41.4 / 17.5 | 10.9 / 4.7 |

Both geographic fits have 256 quadratic patches. Index storage adds 4,064 bytes to 65,584 bytes
of packed plan storage (about 6.2%); full-program headers are reported separately. CPU index
construction in these four cases was 0.1–0.6 ms. Largest observed geographic errors were about
0.214 mm for UTM and 0.160 mm for Albers, below the common 1 mm budget. Each lookup path
independently accepted 65,545 rows and rejected the two invalid probes; patch checksums match.

This is a useful opt-in win for these many-patch workloads, not a new default. The 16-patch stress
case did **not** show a consistent win: its 65K/single-consumer materialized time increased from
4.2 to 5.1 ms (inline: 5.2 / 5.0 ms), while the 400-patch inline case improved from 16.5 to 7.6 ms. Compare scan/index **within**
each budget, not between the two stress fits. Common cubic geographic plans can have far fewer
patches than these quadratic fits and need their own evidence. Setup/driver compilation can
outweigh execution savings for short-lived workloads; distributions and setup costs remain in
the raw data. Five ordered measurements are not enough to infer a universal crossover.

In the separate instrumented capture, median lookup GPU timestamps were 5.37 / 0.50 ms
(scan/index) for both UTM and Albers. These are kernel/pass measurements from a
different run, not components to subtract from the resident medians above.

### Measurement contract

`runProjectionRoutingBenchmark` receives one already-fitted double-single plan. Scan and indexed
variants share every patch, coefficient, degree, tolerance, source domain and destination frame.
It first runs the existing full-program benchmark against an independent oracle, with the same
axis-swap consumers for both variants. Both paths validate every row before/after timing. It then
runs two lookup-only graphs, requiring every selected patch ID (including invalid IDs) to agree
before/after measurement. The full-program gate must pass before lookup timings are returned.

Reports separate:

- CPU index construction (one sample; no fitting), parameter packing and index storage overhead;
- program generation/packing, pipeline construction, resource setup and first use;
- lookup-only CPU encoding, submission-to-fence time, and optional GPU timestamps;
- full-program resident encode-plus-fence time, memory, accuracy and validity;
- one versus four consumers, where materialization projects once and inline projects per consumer.

Development captures exposed a lookup-only binding-order bug: both routes could agree while
rejecting valid inputs, and corrupt index reads could stall an unbounded traversal. The binding
order is corrected, traversal and leaf scans are explicitly bounded, and lookup validity/membership is now checked
independently against CPU domains before comparing GPU IDs. Aborted/debug and pre-gate captures
are not performance evidence. The multi-workgroup regression exercises this failure mode.
A separate borrowed-buffer GPU regression rejects out-of-bounds, reversed and oversized leaf
ranges, including a stored end of `0xffffffff`, before scanning any patch.

Lookup-only time includes dispatch and ID output writes; it is not a pure algorithmic instruction
cost. Resident full-program time excludes uploads and readback, assuming data remains on GPU.
Do not subtract independently measured medians to claim a latency decomposition. Parameter
packing does not include upload time. The plan is prepared once before this runner: its planning
timings measure the tiny program factory, **not refitting**. Index build time is reported separately.

UTM regional and Albers regional use the existing domains, independent retained math.gl provider
and six CPU APIs (allocating/reusable scalar, flat, contiguous/strided/column bulk). Quadratic
fitting uses a 0.5 mm target, with a common 1 mm output budget for scan/index. A sine/cosine stress
fixture uses the same quadratic arithmetic at two fitting tolerances; each scan/index pair shares
one immutable fit. Stress coordinates include every patch's lower/upper corner and invalid probes.
The stress cases measure lookup scaling, not a geographic throughput claim. Comparing their two
tolerances is not an equal-accuracy optimization comparison.

## Reproduce on each hardware adapter

Use Node from `.nvmrc` and installed dependencies. Do not run other builds/tests during captures.
First qualify the arithmetic, strict gaps, independent orthographic inverse and all three input
encodings (Float32, double-single and raw binary64):

```sh
yarn test-headless --no-coverage \
  modules/experimental/test/gpu-project/projection-routing.spec.ts
```

Then collect uninstrumented, production-like samples (two warmups, five measurements):

```sh
VITE_LUPROJ_REVISION=<commit-or-described-working-tree> \
VITE_LUPROJ_ROUTING_ROWS=4096,65536,262144 \
VITE_LUPROJ_ROUTING_CONSUMERS=1,4 \
yarn test-browser-benchmarks --silent=false --reporter=verbose \
  modules/experimental/test/gpu-project/projection-routing-performance.spec.ts
```

For a **separate** instrumented kernel capture, add `VITE_LUPROJ_ROUTING_GPU_TIMING=true`.
Timestamp support is reported, never assumed; instrumentation changes pass coalescing and those
reports are not eligible for production cost selection. Omit the row environment variable for a
small smoke run that emits no performance records. Software/fallback adapters are skipped, not
classified as successful hardware qualification.

Save each `PROJECTION_ROUTING_PERFORMANCE` JSON payload verbatim as JSONL. Each record includes
schema version, timestamp, revision, fixture, rows, error budget, device information, browser/runtime
identity, enabled features/limits, program signatures, patch counts, setup/storage and all timing
distributions. Record any available exact GPU model, OS/driver version, power/thermal state and
other workload activity separately; browsers may redact adapter identity. A five-sample p95 is
the maximum, not a confidence interval. Repeat and reverse experiment order before generalizing
small timing differences.

## Qualification status and remaining dependencies

External Intel/AMD/NVIDIA captures are **pending**. No external hardware runner is available for
this PR. A successful Apple capture does not qualify other vendors. External captures must use
the same revision/fixture/budget matrix and pass both correctness gates; skipped tests, masked
adapter identity, missing timestamps or timer-resolution zeros must be reported explicitly.

P.8a.2b remains **blocked on rendering adapter PR #3403**, by explicit request to target master
instead of stacking. Once it lands, measure CPU/materialized/inline rendering with matched
visibility, updates, picking, reuse, uploads and frame cost. Axis-swap timing is not render timing.

`selectProjectionExecution` is deliberately exact-capture-only: current program parameters and
shader, rows, reuse, workload identity, device capabilities, environment, accuracy and memory must
match. It returns `unqualified` otherwise. Overlapping observed ranges prefer lower memory. It
never extrapolates across vendors, selects a different precision, changes ownership or submits a
command. Generalized thresholds and a real-render selection policy await their own evidence.

Domain partition qualification is separate from performance. Disjoint branch envelopes and
independently fitted inverse domains reject seams. Disk partitions fit conservative interior
rectangles and leave unresolved boundary cells invalid. Source-segment clipping never connects
rejected gaps. Exact disk clipping, longitude unwrapping, curve densification and polygon topology
reconstruction remain caller-owned; no full horizon-crossing polygon renderer is claimed.
