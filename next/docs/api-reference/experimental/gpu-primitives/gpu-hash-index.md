# GPUHashIndex

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUHashIndex` builds a fixed-capacity `uint32` key/value lookup table, and `GPUHashIndexQuery` looks up a packed batch of keys without submission or CPU readback. Together they provide the sparse identity lookup that dense group arrays cannot: map stable object IDs to rows, join sparse feature IDs to attributes, deduplicate identifiers, or resolve categorical dictionaries whose key space is much larger than their population.

The first contract is deliberately bounded. Capacity is chosen up front, every row examines at most `maxProbeCount` slots, one key value is reserved as the empty marker, and both build and query publish collision-work statistics. This makes worst-case GPU work and memory visible to command- graph consumers instead of hiding resize, allocation, or readback behind a map-like API.

## Choosing the right hash-graph feature[​](#choosing-the-right-hash-graph-feature "Direct link to Choosing the right hash-graph feature")

These features compose; they do not provide competing command schedulers or silently concatenate their inputs:

| Feature                                                                                                                 | Input it owns logically                                       | Use it when                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GPUHashIndex`                                                                                                          | One packed right-side key batch.                              | The complete lookup dictionary or property table already lives in one contiguous chunk.                |
| [`GPUBatchHashIndex`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md) | Several ordered right-side key chunks.                        | Streamed record batches must populate one shared index without repacking or losing source-row offsets. |
| `GPUHashIndexQuery`                                                                                                     | One left-side key batch against either index type.            | Every source row must retain its position, a found mask, and an optional matched value.                |
| [`GPUHashJoin`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)              | One left-side key batch against either index type.            | Only matching left/right row pairs should be published, with an explicit output capacity.              |
| [`GPUBatchHashJoin`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)   | Several preserved left-side chunks against either index type. | Independent source batches need separate stable pairs, counts, capacities, and diagnostics.            |

The right-index choice and left-query choice are independent. For example, a `GPUBatchHashIndex` can index many Arrow record batches while `GPUHashIndexQuery` looks up one interactive selection, or `GPUBatchHashJoin` can join many left batches against that same shared multi-batch index. Every object contributes commands to the caller's existing `GPUCommandGraph`.

## Concepts[​](#concepts "Direct link to Concepts")

### Sparse identity is different from dense grouping[​](#sparse-identity-is-different-from-dense-grouping "Direct link to Sparse identity is different from dense grouping")

`GPUGroupAggregation` is ideal when category IDs are dense: group `i` writes output row `i`. That would be wasteful for object IDs such as `17`, `8042`, and `3900000000`, because a direct-address array must cover the largest possible ID. A hash index stores only a caller-selected capacity and turns each sparse key into a bounded sequence of table probes.

This is the useful bridge between GPU-resident datasets. A visibility result can contain stable object IDs while a property table uses unrelated row numbers; a hash query maps the IDs to rows so a later compute or render pass can gather attributes. The same mechanism supports sparse joins, feature registries, selection membership, and dictionary decoding.

### Why hash instead of sort and binary search?[​](#why-hash-instead-of-sort-and-binary-search "Direct link to Why hash instead of sort and binary search?")

A sorted key/value table offers deterministic layout and logarithmic lookup, and is often better when ordered traversal or range queries are also required. A hash index targets repeated exact-key queries: build once, then resolve many changing batches with near-constant expected work. It also avoids sorting the source solely to establish an identity map.

The tradeoff is explicit. Open addressing becomes more expensive as the table fills, and hostile or unlucky key distributions can consume the probe limit. The build statistics make that cost observable so an application can choose a larger capacity, increase the probe bound, or switch to a sorted representation based on evidence.

### Capacity, probing, and overflow[​](#capacity-probing-and-overflow "Direct link to Capacity, probing, and overflow")

Capacity must be a positive power of two. Keys are hashed to an initial slot and use linear probing for at most `maxProbeCount` slots, which defaults to capacity. `0xffffffff` is reserved as `GPU_HASH_INDEX_EMPTY_KEY`; source rows containing it are counted as invalid and query rows containing it are reported missing without probing.

The build never resizes. When a distinct key cannot claim or find a slot within the bound, its row increments the overflow statistic. At capacity, the number of retained distinct keys is exact but the retained subset is intentionally unspecified because parallel insertion order is not a source- order contract. Applications that require a particular retained subset must size the table to avoid overflow or preprocess the keys.

### Duplicate keys retain a deterministic value[​](#duplicate-keys-retain-a-deterministic-value "Direct link to Duplicate keys retain a deterministic value")

Parallel insertion order does not decide duplicate values. Each occupied slot atomically retains the lowest source-row index, and a final pass copies that row's value. Rebuilding the same inputs therefore produces the same key-to-value mapping even when workgroups execute in a different order. When no value input is supplied, the retained value is `firstValue + sourceRow`, making the primitive directly useful as a key-to-row index.

An empty explicit values view is also valid, including a zero-length view positioned at the end of its backing buffer. Empty rebuilds clear the table and statistics without binding unavailable input rows.

### Statistics expose the cost model[​](#statistics-expose-the-cost-model "Direct link to Statistics expose the cost model")

Build statistics contain:

```
[unique keys, duplicate rows, overflow rows, invalid rows, total probes, maximum probes]
```

Query statistics contain:

```
[found keys, missing keys, total probes, maximum probes]
```

The per-query `probes` output supports finer diagnostics. Load factor `unique / capacity`, average probes, maximum probes, and overflow together indicate whether the chosen capacity and bound are healthy. Counters are `uint32`; construction rejects workloads whose maximum aggregate probe count would overflow them.

### Graph ownership and current scope[​](#graph-ownership-and-current-scope "Direct link to Graph ownership and current scope")

Callers own the persistent input and output buffers. The build contributes initialization, parallel insertion, and deterministic value-finalization passes; the graph owns only one transient source-row buffer. Query contributes statistics initialization and lookup. Neither object compiles, encodes, submits, resizes, or reads back on its own.

This single-batch primitive supports packed `uint32` keys and values and full rebuilds. `GPUBatchHashIndex` adds preserved right-side vector chunks, while `GPUHashJoin` and `GPUBatchHashJoin` provide bounded row-pair publication. Deletion and tombstones, 64-bit keys, custom hash callbacks, independently partitioned right tables, and one-to-many matches remain outside the current contracts.

## Usage[​](#usage "Direct link to Usage")

```
const index = new GPUHashIndex({

  keys: objectIds,

  values: objectRows,

  tableKeys,

  tableValues,

  statistics: buildStatistics,

  maxProbeCount: 32

});

index.addToGraph(graph);



new GPUHashIndexQuery({

  index,

  keys: selectedObjectIds,

  values: selectedRows,

  found: selectedRowsFound,

  probes: selectedRowsProbeCounts,

  statistics: queryStatistics

}).addToGraph(graph);
```

To generate row IDs instead of reading an aligned values buffer:

```
new GPUHashIndex({

  keys: featureIds,

  firstValue: batchBaseRow,

  tableKeys,

  tableValues,

  statistics: buildStatistics

}).addToGraph(graph);
```

## Constructors[​](#constructors "Direct link to Constructors")

```
new GPUHashIndex({

  id?,

  keys,

  values?,

  firstValue?,

  tableKeys,

  tableValues,

  statistics,

  maxProbeCount?

});



new GPUHashIndexQuery({

  id?,

  index,

  keys,

  values,

  found,

  probes,

  statistics,

  maxProbeCount?

});
```

All views are packed `GraphDataView<'uint32'>` values in the target graph. Table key and value capacities must match, build statistics require six rows, query statistics require four rows, and aligned query outputs must match the query-key length. Writable views cannot overlap each other or their read inputs.
