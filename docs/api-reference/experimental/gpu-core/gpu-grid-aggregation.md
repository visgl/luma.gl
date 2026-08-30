import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUGridAggregation

<GPUCoreDocsTabs active="grid-aggregation" />

## Overview

`GPUGridAggregation` computes sum, minimum, maximum, or mean statistics for paired `float32`
weights in a row-major two-dimensional grid. It is the weighted counterpart to `GPUGridBinning`:
binning answers “how many points are in each cell?”, while aggregation describes their values.

<GPUOperationContract operation="gpu-grid-aggregation" />

## Concepts

Every input row contains a position and one weight. The bounds and grid dimensions map the
position to a cell, then `operation` chooses the statistic. Non-finite or out-of-bounds positions
and non-finite weights are ignored. Exact maximum coordinates enter the final column or row.

### When to use it

Grid aggregation answers spatial questions where every point carries a measurement. Examples
include mean temperature per map cell, total bytes transferred per screen tile, maximum particle
speed in a simulation region, and minimum elevation in a terrain overview. The fixed grid produces
a compact texture-like summary that can drive heatmaps, labels, or a later compute decision.

Use [`GPUGridBinning`](./gpu-grid-binning) for population or occupancy alone. Use
[`GPUGroupAggregation`](./gpu-group-aggregation) when rows already carry categorical IDs rather
than continuous positions, and use a spatial index when the application needs the individual
objects in a queried region instead of one statistic per cell.

`'sum'` is the default. Sum and mean use an atomic compare/exchange addition, so ordinary
`float32` rounding applies but cross-invocation accumulation order is not promised. Finite inputs
may overflow a sum or mean to infinity, or produce NaN after opposite-sign overflow. Mean owns one
transient `uint32` count per cell and divides after all aligned chunks have contributed; total
input length must therefore fit in `uint32`.

Minimum and maximum encode each finite float as a monotonically ordered `uint32` and use native
integer atomics. This makes their value independent of invocation order and preserves the expected
signed-zero order: minimum prefers `-0`, maximum prefers `+0`.

Empty sum cells contain positive zero. Empty minimum, maximum, and mean cells contain a canonical
quiet NaN, making “no accepted rows” distinct from a real zero-valued statistic.

For vectors, positions and weights must have identical ordered chunk lengths. Each encoding clears
the output once, then accumulates non-empty chunk pairs without concatenating or repacking either
input. This keeps table batches aligned while producing one grid-wide result.

## Usage

```ts
new GPUGridAggregation({
  positions,
  weights: temperatures,
  output: cellTemperatureMeans,
  operation: 'mean',
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
  operation?: 'sum' | 'min' | 'max' | 'mean';
  gridSize: readonly [number, number];
  bounds: readonly [number, number, number, number] | GraphDataView<'float32x4'>;
};
```

`output.length` must equal `width * height`. Inputs and output are caller-owned and must use
separate output storage. The graph owns no persistent result buffer, performs no submission, and
does not read the sums back.

Counts remain independently available from [`GPUGridBinning`](./gpu-grid-binning) when an
application needs both population and value statistics. Irregular spatial bins,
higher-dimensional aggregates, variance, and custom associative operations remain future work.

## Performance notes

On subgroup-capable devices, grids with at most 16 cells combine weights from lanes targeting the
same cell before issuing sum, minimum, maximum, or mean atomics. This targets coarse, highly
contended spatial summaries. Larger grids and devices without both subgroup capabilities retain
the existing direct-global-atomic implementation.
