# GPUReduction

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUReduction` records a deterministic hierarchical reduction over a packed `uint32`, `sint32`, or `float32` graph data view or fixed-width graph vector.

## Concepts[​](#concepts "Direct link to Concepts")

A reduction combines many scalar rows into one summary. `sum`, `min`, and `max` produce one value; `extent` produces the pair `[minimum, maximum]`. Workgroups first reduce independent blocks, then higher levels reduce those partial results until one row remains. This fixed tree avoids CPU readback and makes the floating-point order repeatable for a fixed input topology.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Reductions answer whole-input questions that should remain on the GPU: compute an automatic chart domain, total selected bytes or work, find the largest simulated value, or verify a generated count. The one- or two-row result can feed uniforms, histogram domains, allocation decisions with fixed capacity, or a small asynchronous readback.

Use grouped, grid, or histogram aggregation when the result must retain categories, spatial cells, or a distribution. A reduction deliberately discards row identity and intermediate structure; it does not report which row produced a minimum or maximum.

```
new GPUReduction({input: values, output: extent, operation: 'extent'}).addToGraph(graph);
```

## Constructor[​](#constructor "Direct link to Constructor")

```
type GPUReductionProps<T extends 'uint32' | 'sint32' | 'float32'> = {

  id?: string;

  input: GraphDataView<T> | GraphVectorView<T>;

  output: GraphDataView<T>;

  operation: 'sum' | 'min' | 'max' | 'extent';

};
```

`sum`, `min`, and `max` require one output row; `extent` writes `[minimum, maximum]` and requires two. Inputs and outputs use separate caller-owned buffers. Hierarchical scratch is graph-owned.

For a `GraphVectorView`, each non-empty `GraphDataView` chunk is reduced independently into graph-owned partial storage, followed by one global reduction. Chunk order and storage remain unchanged; no input is packed or concatenated. An all-empty vector follows the same zero-result behavior as an empty data view.

Integer sums wrap to 32 bits. Floating sums use a fixed 256-way tree. Floating minimum, maximum, and extent ignore NaN and infinity. Empty inputs and all-invalid floating inputs produce zero.

## Reduction hierarchy[​](#reduction-hierarchy "Direct link to Reduction hierarchy")

The reduction is planned in levels. Each level dispatches one 256-thread workgroup for every group of at most 256 input rows, producing one partial row per workgroup. The next level consumes those partial rows. For example, 100,000 input rows produce 391 partial rows, then 2, then 1.

| Stage               | Input                 | Output                             |
| ------------------- | --------------------- | ---------------------------------- |
| First level         | Packed scalar rows    | One partial row per 256 input rows |
| Intermediate levels | Previous partial rows | One partial row per 256 input rows |
| Finalize            | One partial row       | Caller-owned output view           |

`extent` represents each partial row as two adjacent values: minimum and maximum. Floating-point `min`, `max`, and `extent` carry a parallel `uint32` validity row so that NaN and infinity can be ignored without choosing a sentinel value. The finalize pass maps a result with no finite values to zero.

For a multi-chunk vector, each non-empty chunk gets its own hierarchy. The last level of each chunk writes directly into one slot of a shared partial view. A merge hierarchy then reduces those slots. Empty chunks add no passes and do not change the result.

All intermediate views are graph-owned transients. Their declared node uses let the command-graph compiler infer ordering and reuse physical scratch allocations when lifetimes do not overlap.

## `addToGraph(graph)`[​](#addtographgraph "Direct link to addtographgraph")

Declares reduction levels and a final normalization pass. It does not compile, encode, submit, map, or destroy imported buffers.
