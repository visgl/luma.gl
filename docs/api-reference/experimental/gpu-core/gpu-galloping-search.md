import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUGallopingSearch

<GPUCoreDocsTabs active="galloping-search" />

## Overview

`GPUGallopingSearch` performs many lower-bound queries over segmented sorted `float32` or `uint32`
values. It is useful when the queries in each segment are also ordered, such as screen-pixel
boundaries, sampled time domains, sorted joins, or repeated threshold lookup.

`values` may be a strided scalar column in canonical records. Supplying an optional packed
`valueOrder` vector makes the search positions index that vector, which in turn identifies rows in
`values`. This permits a compact sorted secondary index without copying the searched values out of
their canonical storage.

Each tile begins with an ordinary binary search. Later nondecreasing queries start from the prior
result, probe forward by exponentially increasing steps, finish with a bounded binary search, and
switch to a linear scan when at most 16 values remain. Segment/tile pairs execute independently,
retaining GPU parallelism without discarding locality between neighboring queries.

The design is based on Lalit Maganti's explanation of
[Perfetto's batched exponential search](https://lalitm.com/post/exponential-search/) and
[Perfetto PR #4648](https://github.com/google/perfetto/pull/4648). The GPU implementation is tiled:
it does not assume that the CPU microbenchmark's reported speedup transfers unchanged to WebGPU.

<GPUOperationContract operation="gpu-galloping-search" />

## Usage

```ts
new GPUGallopingSearch({
  values: sortedValues,
  valueOrder: optionalSortedRowIds,
  queries: orderedQueries,
  segments,
  maximumQueryCount: 2049,
  queriesPerTile: 32,
  output: lowerBoundPositions,
  validationErrors
}).addToGraph(graph);
```

`segments` contains packed four-word records:

```text
[valueOffset, valueCount, queryOffset, queryCount]
```

Offsets are relative to their logical parent views. Output positions are absolute positions within
the direct value view or optional value-order view and use the same addressing as the query view.
Every value-order entry is a row index into `values`; validating and maintaining that immutable
index is the caller's construction-time responsibility. Empty value or query segments are valid.
`maximumQueryCount` reserves the largest per-segment query capacity used to compile the fixed
dispatch topology; GPU-visible `queryCount` values may be smaller.

The output and validation word must not alias any source. `preserveValidationErrors` lets a
higher-level contributor prepare queries and share the same validation word without a second
clear.

## Validation

The validation word combines these bits:

| Bit | Meaning |
| ---: | --- |
| `1` | A value range exceeds the values view. |
| `2` | A query range exceeds the queries view. |
| `4` | Queries decrease inside a tile. The affected query falls back to full lower-bound search. |
| `8` | A floating-point query is not finite. |

Decreasing queries are therefore reported without making the corresponding output incorrect.
Callers still need to guarantee that each value segment is sorted ascending; this immutable index
invariant is normally established when the index is constructed.

## Cost model

With one completely ordered query stream, the ideal CPU algorithm is `O(M + log N)`. GPU tiles
trade some repeated binary-search seeds for parallelism. With `T` queries per tile the operation
uses approximately `M / T` independent seeds, while the remaining queries gallop from a preceding
position. The default `T = 32` is a policy starting point and should be benchmarked against the
target adapter and data distribution.
