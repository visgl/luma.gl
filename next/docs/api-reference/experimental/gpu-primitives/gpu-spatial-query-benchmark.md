# GPU spatial query benchmark

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Run on your device[​](#run-on-your-device "Direct link to Run on your device")

Dataset size

<!-- -->

65,536 points (65536)

### Live luSpatial: CPU vs. WebGPU

Run the same bounds predicate and compact matching point IDs on your CPU, an unindexed WebGPU graph, and a reusable WebGPU grid index. GPU timings include command encoding, submission, and completed execution.

Run live CPU and WebGPU spatial benchmark

This opt-in benchmark runs a deterministic CPU bounds scan, the actual `GPUPointSpatialQuery` scan, and the same query against a reusable `GPUGridIndex`. Every GPU result must match the complete CPU-selected ID set. Grid construction is reported separately because its cost must be amortized across repeated queries; the timed GPU paths include graph encoding, submission, and a completion fence, not merely CPU-side command submission.

## Overview[​](#overview "Direct link to Overview")

`runGPUSpatialQueryBenchmark` compares unindexed scan, uniform-grid, and BVH query paths with one correctness gate and one measurement protocol. Each adapter encodes its existing command graph, reads exact stable IDs, classifies graph nodes as build, refit, query, or refinement work, and reports memory plus observable candidate or traversal counts.

The harness exists because “use an index” is not a useful performance rule. An index pays an up-front construction or update cost and consumes memory. It wins only when pruning and reuse repay that cost on the target adapter and representative data. The harness refuses overflow or a mismatch with the shared CPU oracle before it reports timings, so an incomplete result cannot appear faster.

## Concepts[​](#concepts "Direct link to Concepts")

### One dataset, query, and oracle[​](#one-dataset-query-and-oracle "Direct link to One dataset, query, and oracle")

All three paths must consume the same logical records and query. The application computes expected stable IDs on the CPU, then each GPU adapter returns its exact IDs through `readResult`. Result order is ignored because parallel compaction is unordered; duplicates, omissions, extra IDs, and overflow still fail the run.

Grid candidates must be followed by the same exact predicate used by the scan. BVH leaf bounds are exact only for axis-aligned-bounds queries; another shape needs the same final predicate too. This keeps broad-phase quality separate from answer correctness.

### Warmup and repeated measurements[​](#warmup-and-repeated-measurements "Direct link to Warmup and repeated measurements")

Warmup encodings populate pipelines and caches before measured iterations. The harness then creates a timestamp query set for every measured encoding when the adapter supports `timestamp-query`, submits the work, and explicitly reads per-node durations. Reports retain minimum, median, 95th percentile, and maximum values instead of selecting one favorable sample. CPU graph-encoding time is always available; GPU time is omitted rather than estimated when timestamps are unsupported.

Use multiple distributions and selectivities. Uniform, clustered, sparse, adversarially ordered, and moving data stress different structures. Tiny, selective, medium, and broad queries expose the difference between effective pruning and bookkeeping overhead.

### Phases and amortization[​](#phases-and-amortization "Direct link to Phases and amortization")

Each adapter maps its stable graph node IDs to these phases:

| Phase        | What it measures                                                      |
| ------------ | --------------------------------------------------------------------- |
| `build`      | Grid clear/count/scan/scatter or another topology construction        |
| `refit`      | BVH leaf reload and bottom-up bound propagation after data changes    |
| `query`      | Cell enumeration, hierarchy traversal, or unindexed predicate scan    |
| `refinement` | Exact application predicate and result compaction after a broad phase |

For reuse counts supplied by the caller, the report computes `(median build + median refit) / reuse + median query + median refinement`. This is a comparison aid, not a universal crossover: update frequency, asynchronous scheduling, contention, and surrounding render work still belong in the consumer benchmark.

### Work counters explain timings[​](#work-counters-explain-timings "Direct link to Work counters explain timings")

Timing alone says which run was faster; work counters help explain why. Grid adapters report the conservative `candidateCount`. BVH adapters report `visitedCount`. Every path reports exact result count and owned or borrowed memory bytes. A high candidate-to-result ratio suggests poor cell size or object/grid fit. A high visited-node ratio suggests overlapping or poorly ordered BVH parents.

These counters also make regressions easier to diagnose across adapters: a timing change with stable work often points to runtime or hardware variation, while a work-count change points to the data structure or query.

### Selection guidance[​](#selection-guidance "Direct link to Selection guidance")

| Situation                                                            | Start with                      | Why                                                                     |
| -------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| Small input, broad query, or one use before data changes             | Scan                            | No index construction or storage to amortize                            |
| Bounded domain with similarly sized objects and regular occupancy    | Grid                            | Parallel build and direct cell lookup are simple and predictable        |
| Sparse domain, widely varying object sizes, or coherent bound groups | BVH                             | Hierarchical rejection can avoid empty space and oversized cell fan-out |
| Unknown or mixed workload                                            | Scan baseline plus this harness | The crossover depends on distribution, selectivity, reuse, and adapter  |

Do not compare only query kernels. Include allocation or persistent memory, full build, updates, exact refinement, overflow capacity, and the number of queries between changes.

### Spatial v1 decision record[​](#spatial-v1-decision-record "Direct link to Spatial v1 decision record")

The implemented v1 includes full grid rebuild, conservative grid query, exact point refinement, BVH storage/refit, exact point and bounds traversal, and this correctness-gated cost model. Three extensions remain deliberately deferred:

* Incremental grid maintenance needs a moving-data consumer and a measured crossover that repays reserved-cell memory, fragmentation, and more complex overflow behavior. Full rebuild remains the supported update contract.
* A Morton or other BVH topology builder needs representative runs showing materially lower visited nodes and end-to-end time than source or producer ordering after its sorting/build cost. Callers can benchmark preordered inputs now without changing BVH storage.
* Ray or segment traversal needs a picking or simulation consumer to define intersection semantics, nearest-hit behavior, and bounded traversal storage. Bounds and point queries do not pretend to satisfy that separate contract.

These are scope decisions, not claims that the extensions are slow. Each can reopen as a focused feature when a consumer supplies semantics and positive evidence; none is required for the complete spatial filtering v1 contract.

## Usage[​](#usage "Direct link to Usage")

```
const report = await runGPUSpatialQueryBenchmark(device, {

  paths: [scanPath, gridPath, bvhPath],

  expectedIds: cpuOracleIds,

  warmupIterations: 5,

  measuredIterations: 50,

  reuseCounts: [1, 10, 100, 1000]

});
```

Each path supplies `encode(commandEncoder)`, `readResult()`, `memoryByteLength`, and `getNodePhase(nodeId)`. The harness owns command submission and temporary timestamp query sets. The caller owns datasets, graphs, buffers, readback strategy, query generation, and destruction. Keep those adapters next to representative consumers so the benchmark does not hide uploads, repacking, or application predicates.
