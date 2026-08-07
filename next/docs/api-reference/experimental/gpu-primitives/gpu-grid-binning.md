# GPUGridBinning

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUGridBinning` counts packed `float32x2` positions into a row-major two-dimensional grid.

## Concepts[​](#concepts "Direct link to Concepts")

Grid binning maps a continuous two-dimensional domain to discrete cells. `gridSize: [width, height]` defines the columns and rows, while bounds define the inclusive spatial domain. Every accepted point increments exactly one cell; no source IDs or per-point assignments are returned.

Counts answer density questions and can feed heatmaps, occupancy tests, or later prefix sums. Use [`GPUGridAggregation`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md) when each point should contribute a floating-point weight instead of the constant count `1`.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Typical uses include point-density heatmaps, screen-tile occupancy, coarse particle density, and finding overloaded spatial cells before a more expensive pass. Because the output size depends on the grid rather than the input population, millions of points can become a small summary that is cheap to render or read back.

Grid binning intentionally loses object identity. It is the wrong result for “which objects are in this cell?”, exact nearest-neighbor queries, or non-rectilinear regions; those require picking or a spatial index. Grid resolution is also an application tradeoff: finer grids preserve locality but increase clearing, contention, and result storage.

```
new GPUGridBinning({

  positions,

  output: cellCounts,

  gridSize: [32, 16],

  bounds: [-180, -90, 180, 90]

}).addToGraph(graph);
```

## Constructor[​](#constructor "Direct link to Constructor")

```
type GPUGridBinningProps = {

  id?: string;

  positions: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;

  output: GraphDataView<'uint32'>;

  gridSize: readonly [number, number];

  bounds: readonly [number, number, number, number] | GraphDataView<'float32x4'>;

};
```

`output.length` must equal `width * height`. Non-finite and out-of-bounds positions are ignored; exact maximum coordinates enter the final column or row. Each encoding clears the output. Up to 256 cells use workgroup-local atomics, and larger grids use direct global atomics.

For a `GraphVectorView`, each encoding clears the grid once and then accumulates every non-empty position chunk in source order. Chunk boundaries and backing buffers are preserved; the primitive does not concatenate or pack positions.

This API accumulates counts only. Weighted floating-point sums are provided separately by `GPUGridAggregation`, keeping integer count overflow and floating-point rounding contracts explicit.
