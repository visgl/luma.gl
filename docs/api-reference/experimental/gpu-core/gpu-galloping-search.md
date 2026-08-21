# GPUGallopingSearch

[Scan](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-scan.md)[Galloping Search](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-galloping-search.md)[Compaction](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-compaction.md)[Masks](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-mask.md)[Visibility](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-virtual-geometry-selection.md)

## Overview[​](#overview "Direct link to Overview")

`GPUGallopingSearch` performs many lower-bound queries over segmented sorted `float32` or `uint32` values. It is useful when the queries in each segment are also ordered, such as screen-pixel boundaries, sampled time domains, sorted joins, or repeated threshold lookup.

`values` may be a strided scalar column in canonical records. Supplying an optional packed `valueOrder` vector makes the search positions index that vector, which in turn identifies rows in `values`. This permits a compact sorted secondary index without copying the searched values out of their canonical storage.

Each tile begins with an ordinary binary search. Later nondecreasing queries start from the prior result, probe forward by exponentially increasing steps, finish with a bounded binary search, and switch to a linear scan when at most 16 values remain. Segment/tile pairs execute independently, retaining GPU parallelism without discarding locality between neighboring queries.

The design is based on Lalit Maganti's explanation of [Perfetto's batched exponential search](https://lalitm.com/post/exponential-search/) and [Perfetto PR #4648](https://github.com/google/perfetto/pull/4648). The GPU implementation is tiled: it does not assume that the CPU microbenchmark's reported speedup transfers unchanged to WebGPU.

## At a glance

| Question                 | Answer                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Problem**              | Resolve many ordered lower-bound queries while reusing locality between neighbors.                   |
| **Reads / writes**       | Reads sorted values, optional order, queries, and segments; writes lower bounds and validation bits. |
| **Ownership**            | Inputs, outputs, and validation storage are caller-owned; operation state is graph-owned.            |
| **Output contract**      | One exact lower-bound position per valid query; malformed queries are reported.                      |
| **Expected work**        | One binary-search seed per tile, then exponential probes and bounded finishing searches.             |
| **Chunks**               | Uses explicit segments rather than implicit vector chunk traversal.                                  |
| **Conditions / budgets** | Can sit inside a conditioned branch; it has no custom resumable plan.                                |
| **Neighborhood**         | sorted secondary index + ordered queries → GPUGallopingSearch → range selection or join.             |

**Cost**Benefits depend on ordered queries and locality; unrelated searches may not beat binary search.

**Common mistake**Do not apply galloping search to unsorted inputs or unordered query batches.

## Usage[​](#usage "Direct link to Usage")

```
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

```
[valueOffset, valueCount, queryOffset, queryCount]
```

Offsets are relative to their logical parent views. Output positions are absolute positions within the direct value view or optional value-order view and use the same addressing as the query view. Every value-order entry is a row index into `values`; validating and maintaining that immutable index is the caller's construction-time responsibility. Empty value or query segments are valid. `maximumQueryCount` reserves the largest per-segment query capacity used to compile the fixed dispatch topology; GPU-visible `queryCount` values may be smaller.

The output and validation word must not alias any source. `preserveValidationErrors` lets a higher-level contributor prepare queries and share the same validation word without a second clear.

## Validation[​](#validation "Direct link to Validation")

The validation word combines these bits:

| Bit | Meaning                                                                                   |
| --- | ----------------------------------------------------------------------------------------- |
| `1` | A value range exceeds the values view.                                                    |
| `2` | A query range exceeds the queries view.                                                   |
| `4` | Queries decrease inside a tile. The affected query falls back to full lower-bound search. |
| `8` | A floating-point query is not finite.                                                     |

Decreasing queries are therefore reported without making the corresponding output incorrect. Callers still need to guarantee that each value segment is sorted ascending; this immutable index invariant is normally established when the index is constructed.

## Cost model[​](#cost-model "Direct link to Cost model")

With one completely ordered query stream, the ideal CPU algorithm is `O(M + log N)`. GPU tiles trade some repeated binary-search seeds for parallelism. With `T` queries per tile the operation uses approximately `M / T` independent seeds, while the remaining queries gallop from a preceding position. The default `T = 32` is a policy starting point and should be benchmarked against the target adapter and data distribution.
