import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUGridBinning

<GPUPrimitivesDocsTabs active="grid-binning" />

`GPUGridBinning` counts packed `float32x2` positions into a row-major two-dimensional grid.

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
  positions: GraphBufferView<'float32x2'>;
  output: GraphBufferView<'uint32'>;
  gridSize: readonly [number, number];
  bounds: readonly [number, number, number, number] | GraphBufferView<'float32x4'>;
};
```

`output.length` must equal `width * height`. Non-finite and out-of-bounds positions are ignored;
exact maximum coordinates enter the final column or row. Each encoding clears the output. Up to
256 cells use workgroup-local atomics, and larger grids use direct global atomics.

This first API accumulates counts only. Weighted and floating-point cell aggregates are deferred.
