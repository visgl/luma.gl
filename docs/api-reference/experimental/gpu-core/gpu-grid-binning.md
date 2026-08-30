import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUGridBinning

<GPUCoreDocsTabs active="grid-binning" />

## Overview

`GPUGridBinning` counts packed `float32x2` positions into a row-major two-dimensional grid.

<GPUOperationContract operation="gpu-grid-binning" />

## Concepts

Grid binning maps a continuous two-dimensional domain to discrete cells. `gridSize: [width,
height]` defines the columns and rows, while bounds define the inclusive spatial domain. Every
accepted point increments exactly one cell; no source IDs or per-point assignments are returned.

Counts answer density questions and can feed heatmaps, occupancy tests, or later prefix sums. Use
[`GPUGridAggregation`](./gpu-grid-aggregation) when each point should contribute a floating-point
weight instead of the constant count `1`.

### When to use it

Typical uses include point-density heatmaps, screen-tile occupancy, coarse particle density, and
finding overloaded spatial cells before a more expensive pass. Because the output size depends on
the grid rather than the input population, millions of points can become a small summary that is
cheap to render or read back.

Grid binning intentionally loses object identity. It is the wrong result for “which objects are in
this cell?”, exact nearest-neighbor queries, or non-rectilinear regions; those require picking or a
spatial index. Grid resolution is also an application tradeoff: finer grids preserve locality but
increase clearing, contention, and result storage.

```ts
new GPUGridBinning({
  positions,
  output: cellCounts,
  gridSize: [32, 16],
  bounds: [-180, -90, 180, 90]
}).addToGraph(graph);
```

## Constructor

```ts
type GPUGridBinningProps = {
  id?: string;
  positions: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;
  output: GraphDataView<'uint32'>;
  gridSize: readonly [number, number];
  bounds: readonly [number, number, number, number] | GraphDataView<'float32x4'>;
};
```

`output.length` must equal `width * height`. Non-finite and out-of-bounds positions are ignored;
exact maximum coordinates enter the final column or row. Each encoding clears the output. Up to
256 cells use workgroup-local atomics, and larger grids use direct global atomics.

For a `GraphVectorView`, each encoding clears the grid once and then accumulates every non-empty
position chunk in source order. Chunk boundaries and backing buffers are preserved; the primitive
does not concatenate or pack positions.

This API accumulates counts only. Weighted floating-point sums are provided separately by
`GPUGridAggregation`, keeping integer count overflow and floating-point rounding contracts
explicit.

## Performance notes

On subgroup-capable devices, grids with at most 16 cells combine lanes targeting the same cell
before updating workgroup memory. This is intended for coarse, highly contended occupancy grids;
larger grids and devices without both subgroup capabilities retain the existing paths.
