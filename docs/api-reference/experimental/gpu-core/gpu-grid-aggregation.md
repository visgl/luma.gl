# GPUGridAggregation

[Grid Binning](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-grid-index.md)[Grid Query](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-grid-index-query.md)[Point Filter](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-point-spatial-filter.md)

## Overview[​](#overview "Direct link to Overview")

`GPUGridAggregation` computes sum, minimum, maximum, or mean statistics for paired `float32` weights in a row-major two-dimensional grid. It is the weighted counterpart to `GPUGridBinning`: binning answers “how many points are in each cell?”, while aggregation describes their values.

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Accumulate weighted sum, minimum, maximum, or mean into a 2D grid.                                            |
| **Reads / writes**       | Reads float32x2 positions and weights; writes per-cell accumulators, counts, and final values.                |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | Dense row-major grid statistics with explicit empty-cell behavior.                                            |
| **Expected work**        | Input visits per output chunk plus initialization and finalization over cells.                                |
| **Chunks**               | Independent position, weight, and cell-output chunks; mean-count scratch follows output chunks.               |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | positions + weights → GPUGridAggregation → texture upload, contours, or chart readback.                       |

**Cost**Aligned input spans times output chunks, cell count, and atomic contention.

**Common mistake**Do not infer a mean from sums without preserving counts and empty-cell policy.

## Concepts[​](#concepts "Direct link to Concepts")

Every input row contains a position and one weight. The bounds and grid dimensions map the position to a cell, then `operation` chooses the statistic. Non-finite or out-of-bounds positions and non-finite weights are ignored. Exact maximum coordinates enter the final column or row.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Grid aggregation answers spatial questions where every point carries a measurement. Examples include mean temperature per map cell, total bytes transferred per screen tile, maximum particle speed in a simulation region, and minimum elevation in a terrain overview. The fixed grid produces a compact texture-like summary that can drive heatmaps, labels, or a later compute decision.

Use [`GPUGridBinning`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-grid-binning.md) for population or occupancy alone. Use [`GPUGroupAggregation`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-group-aggregation.md) when rows already carry categorical IDs rather than continuous positions, and use a spatial index when the application needs the individual objects in a queried region instead of one statistic per cell.

`'sum'` is the default. Sum and mean use an atomic compare/exchange addition, so ordinary `float32` rounding applies but cross-invocation accumulation order is not promised. Finite inputs may overflow a sum or mean to infinity, or produce NaN after opposite-sign overflow. Mean owns one transient `uint32` count per cell and divides after all aligned chunks have contributed; total input length must therefore fit in `uint32`.

Minimum and maximum encode each finite float as a monotonically ordered `uint32` and use native integer atomics. This makes their value independent of invocation order and preserves the expected signed-zero order: minimum prefers `-0`, maximum prefers `+0`.

Empty sum cells contain positive zero. Empty minimum, maximum, and mean cells contain a canonical quiet NaN, making “no accepted rows” distinct from a real zero-valued statistic.

Positions and weights require equal logical lengths but may use independent atomic/vector boundaries. Alignment borrows paired spans without copying either input. Output may independently partition consecutive cells of the global row-major grid, including splits inside rows. Each encoding initializes each output chunk, accumulates every aligned input span, then finalizes that chunk. Empty chunks remain in caller topology and emit no work. Mean-count scratch follows output chunks, so no contiguous whole-grid scratch is required. Each active chunk, including its binding-alignment prefix, must fit a storage binding.

## Usage[​](#usage "Direct link to Usage")

```
graph.add(new GPUGridAggregation({

  positions,

  weights: temperatures,

  output: cellTemperatureMeans,

  operation: 'mean',

  gridSize: [32, 16],

  bounds: [-180, -90, 180, 90]

}));
```

## Constructor[​](#constructor "Direct link to Constructor")

```
type GPUGridAggregationProps = {

  id?: string;

  positions: GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;

  weights: GraphDataView<'float32'> | GraphVectorView<'float32'>;

  output: GraphDataView<'float32'> | GraphVectorView<'float32'>;

  operation?: 'sum' | 'min' | 'max' | 'mean';

  gridSize: readonly [number, number];

  bounds: readonly [number, number, number, number] | GraphDataView<'float32x4'>;

};
```

`output.length` must equal `width * height`. Inputs and output are caller-owned and must use separate output storage. The graph owns no persistent result buffer, performs no submission, and does not read the sums back.

Counts remain independently available from [`GPUGridBinning`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-grid-binning.md) when an application needs both population and value statistics. Irregular spatial bins, higher-dimensional aggregates, variance, and custom associative operations remain future work.

## Performance notes[​](#performance-notes "Direct link to Performance notes")

On subgroup-capable devices, output chunks with at most 16 cells combine weights from lanes targeting the same cell before issuing sum, minimum, maximum, or mean atomics. This targets coarse, highly contended spatial summaries. Larger chunks and devices without both subgroup capabilities retain the existing direct-global-atomic implementation.

Dispatch count grows with aligned input spans times output chunks. Every output chunk revisits the input and accepts only its global cell range. Highly fragmented storage increases routing overhead; automatic repacking is not performed.
