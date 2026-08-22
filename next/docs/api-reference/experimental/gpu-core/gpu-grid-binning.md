# GPUGridBinning

[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-point-spatial-filter.md)

## Overview[​](#overview "Direct link to Overview")

`GPUGridBinning` counts packed `float32x2` positions into a row-major two-dimensional grid.

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Count packed 2D points into a dense row-major grid.                                                           |
| **Reads / writes**       | Reads float32x2 positions; atomically writes uint32 cell counts.                                              |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | Exact modulo-2^32 counts for the configured bounds and grid extent.                                           |
| **Expected work**        | One source-row visit plus grid initialization.                                                                |
| **Chunks**               | Preserves declared views and source identity; it does not implicitly concatenate or repack chunks.            |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | positions → GPUGridBinning → density texture, histogram, or threshold mask.                                   |

**Cost**Initialization scales with cells; updates scale with points and contention.

**Common mistake**Do not confuse cell counts with an exact object-level spatial query.

## Concepts[​](#concepts "Direct link to Concepts")

Grid binning maps a continuous two-dimensional domain to discrete cells. `gridSize: [width, height]` defines the columns and rows, while bounds define the inclusive spatial domain. Every accepted point increments exactly one cell; no source IDs or per-point assignments are returned.

Counts answer density questions and can feed heatmaps, occupancy tests, or later prefix sums. Use [`GPUGridAggregation`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-grid-aggregation.md) when each point should contribute a floating-point weight instead of the constant count `1`.

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

## Performance notes[​](#performance-notes "Direct link to Performance notes")

On subgroup-capable devices, grids with at most 16 cells combine lanes targeting the same cell before updating workgroup memory. This is intended for coarse, highly contended occupancy grids; larger grids and devices without both subgroup capabilities retain the existing paths.
