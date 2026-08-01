import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUGridAggregation

<GPUPrimitivesDocsTabs active="grid-aggregation" />

## Overview

`GPUGridAggregation` adds paired `float32` weights into a row-major two-dimensional grid. It is the
weighted counterpart to `GPUGridBinning`: binning answers “how many points are in each cell?”,
while aggregation answers “what is the sum of their values?”.

## Concepts

Every input row contains a position and one weight. The bounds and grid dimensions map the
position to a cell, then an atomic floating-point addition contributes the weight. Non-finite or
out-of-bounds positions and non-finite weights are ignored. Exact maximum coordinates enter the
final column or row.

Floating-point addition is not associative, and GPU invocations may reach a cell in different
orders. Results therefore use ordinary `float32` rounding but are not promised to be bitwise
deterministic. Empty cells contain positive zero. Finite inputs may still overflow a cell sum to
infinity or produce NaN after subsequent opposite-sign overflow.

For vectors, positions and weights must have identical ordered chunk lengths. Each encoding clears
the output once, then accumulates non-empty chunk pairs without concatenating or repacking either
input. This keeps table batches aligned while producing one grid-wide result.

## Usage

```ts
new GPUGridAggregation({
  positions,
  weights: temperatures,
  output: cellTemperatureSums,
  gridSize: [32, 16],
  bounds: [-180, -90, 180, 90]
}).addToGraph(graph);
```

## Constructor

```ts
type GPUGridAggregationProps = {
  id?: string;
  positions: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;
  weights: GraphDataView<'float32'> | GraphVectorView<'float32'>;
  output: GraphDataView<'float32'>;
  gridSize: readonly [number, number];
  bounds: readonly [number, number, number, number] | GraphDataView<'float32x4'>;
};
```

`output.length` must equal `width * height`. Inputs and output are caller-owned and must use
separate output storage. The graph owns no persistent result buffer, performs no submission, and
does not read the sums back.

The current operation is a weighted sum. Counts remain available from [`GPUGridBinning`](./gpu-grid-binning),
so applications can compose sums and counts to derive means in a later graph pass. Minimum,
maximum, and higher-dimensional aggregates remain future work.
