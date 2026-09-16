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
graph.add(new GPUGridBinning({
  positions,
  output: cellCounts,
  gridSize: [32, 16],
  bounds: [-180, -90, 180, 90]
}));
```

## Constructor

```ts
type GPUGridBinningProps = {
  id?: string;
  positions: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;
  output: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  gridSize: readonly [number, number];
  bounds: readonly [number, number, number, number] | GraphDataView<'float32x4'>;
};
```

`output.length` must equal `width * height`. Non-finite and out-of-bounds positions are ignored;
exact maximum coordinates enter the final column or row. Each encoding clears the output. Up to
256 cells per output chunk use workgroup-local atomics; larger chunks use direct global atomics.

Positions and output may independently use atomic views or vectors. Output chunks cover consecutive
ranges of the global row-major grid, including splits inside rows. Each encoding clears each output
chunk once, then visits every non-empty position chunk in source order. Empty chunks are skipped;
source buffers and destination partitions are preserved without concatenation or scratch storage.
Each active chunk, including its binding-alignment prefix, must fit a storage binding.

This API accumulates counts only. Weighted floating-point sums are provided separately by
`GPUGridAggregation`, keeping integer count overflow and floating-point rounding contracts
explicit.

## Performance notes

On subgroup-capable devices, output chunks with at most 16 cells combine lanes targeting the same cell
before updating workgroup memory. This is intended for coarse, highly contended occupancy grids;
larger grids and devices without both subgroup capabilities retain the existing paths.

Dispatch count grows with position chunks times output chunks. Each destination chunk revisits
the source points and accepts only its global cell range. This preserves bounded bindings; routing
points to destination chunks more efficiently remains performance work.
