# GPUBatchHashJoin

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUBatchHashJoin` preserves `GraphVectorView` chunk boundaries while joining every left batch against one shared `GPUHashIndex`. Each input chunk has an independent pair-output capacity, required count, overflow flag, and four-row probe-statistics block. Empty chunks remain present and no match can spill into a neighboring batch.

This contract is designed for streaming record batches, Arrow chunks, tiles, partitions, and incremental uploads where the boundary is part of the data model rather than an implementation detail. It reuses `GPUHashJoin` per chunk; it does not concatenate, repack, submit, or read back.

## Concepts[​](#concepts "Direct link to Concepts")

### A batch boundary can carry meaning[​](#a-batch-boundary-can-carry-meaning "Direct link to A batch boundary can carry meaning")

Packing chunks into one buffer is sometimes the fastest route to one global answer, but it discards partition identity. A chunk may represent an ingestion batch, time window, tenant, tile, device, or independently replaceable allocation. Applications often need counts and failure state for each partition, and they may want to replace one batch without rebuilding unrelated input storage.

`GPUBatchHashJoin` treats the ordered chunk list as part of the contract. Batch `i` reads key chunk `i`, publishes into output chunks `i`, and writes diagnostics to scalar block `i`. This makes the result addressable using the same partition metadata as the source.

### One shared dimension table, many changing batches[​](#one-shared-dimension-table-many-changing-batches "Direct link to One shared dimension table, many changing batches")

The current workflow queries one shared right-side index. That matches a common analytical shape: many event, instance, or observation batches refer to one property, dictionary, material, or entity table. The right table can be built once and reused while left batches change.

For example, independently uploaded telemetry batches may carry sparse sensor IDs while one shared index maps those IDs to dense calibration rows. Scene tiles may carry stable material IDs while one global material-property table supplies the right rows. Each batch gets its own match count without duplicating the right index.

Independently partitioned right tables are a different routing problem: the workflow must know which right index owns each left key or pair corresponding left and right partitions explicitly. That remains a follow-up contract rather than being guessed from chunk position.

### Capacities are independent and matches never spill[​](#capacities-are-independent-and-matches-never-spill "Direct link to Capacities are independent and matches never spill")

Each `outputLeftRows` chunk defines the pair capacity for the corresponding input batch. The aligned `outputRightRows` chunk must have the same capacity. A dense batch may overflow while a neighboring sparse batch leaves unused storage; spare capacity is not borrowed across the boundary.

This is deliberate. Cross-batch spill would turn an ordered vector into a packed global output and make independent replacement, accounting, and partial consumption unsafe. Applications that want one shared capacity should use `GPUHashJoin` on a deliberately packed input instead.

### Counts and overflow remain batch-addressable[​](#counts-and-overflow-remain-batch-addressable "Direct link to Counts and overflow remain batch-addressable")

For `N` input chunks:

```
counts[N]       required inner-join pairs per batch
overflows[N]    source-index or output-capacity incompleteness per batch
statistics[N * 4]
                 [found, missing, total probes, maximum probes] for each batch
```

`counts[i]` reports required capacity before truncation. `overflows[i]` becomes nonzero when that count exceeds output chunk `i`, or when the shared right index dropped keys while building. Source index overflow therefore marks every batch incomplete, even an empty batch, because absence cannot be distinguished from a dropped right key.

Statistics use four consecutive rows per batch. Keeping lookup density and probe cost partitioned helps identify a single hostile or unusually sparse batch without averaging it into the whole stream.

### Global IDs survive empty and uneven chunks[​](#global-ids-survive-empty-and-uneven-chunks "Direct link to Global IDs survive empty and uneven chunks")

Without explicit `leftRows`, generated row IDs start at `firstLeftRow` and advance by every source row in chunk order. Empty chunks advance by zero but retain their diagnostic slot. Output truncation and missing keys do not change later IDs.

This produces the same global row identity the batches would have after conceptual concatenation, while preserving their physical storage and output boundaries. Callers may instead provide a `leftRows` vector with exactly the same chunk lengths as the keys.

### Source-aligned diagnostics remain optional[​](#source-aligned-diagnostics-remain-optional "Direct link to Source-aligned diagnostics remain optional")

Optional `found` and `probes` vectors must preserve the key topology. They provide left-join semantics and detailed lookup cost alongside the compact pair result. When omitted, those aligned intermediates remain graph-owned transients local to each batch.

The compact outputs may have different chunk lengths from the keys because those lengths represent capacities, not source topology. Only the two pair-output vectors must match one another exactly.

### Composition, ownership, and current limits[​](#composition-ownership-and-current-limits "Direct link to Composition, ownership, and current limits")

The wrapper contributes one `GPUHashJoin` per chunk. Each nonempty batch therefore composes hash lookup, exclusive scan, and stable bounded pair scatter; empty batches still clear their own count, overflow, and statistics. The caller owns all persistent vectors and scalar blocks.

The workflow remains packed `uint32`, many-left-to-one-right, and row-ID-oriented. It does not materialize typed payloads, combine capacities, infer right-index routing, or erase chunk boundaries. Those policies stay outside the primitive until demonstrated consumers establish their memory and identity contracts.

## Usage[​](#usage "Direct link to Usage")

```
new GPUBatchHashJoin({
  index: sharedPropertyIndex,
  keys: eventIdBatches,
  firstLeftRow: streamBaseRow,
  outputLeftRows: matchedEventRowBatches,
  outputRightRows: matchedPropertyRowBatches,
  counts: requiredMatchesByBatch,
  overflows: overflowByBatch,
  statistics: lookupStatisticsByBatch,
  found: propertyFoundByEventBatch
}).addToGraph(graph);
```

## Constructor[​](#constructor "Direct link to Constructor")

```
new GPUBatchHashJoin({
  id?,
  index,
  keys,
  leftRows?,
  firstLeftRow?,
  outputLeftRows,
  outputRightRows,
  counts,
  overflows,
  statistics,
  found?,
  probes?,
  maxProbeCount?
});
```

All vectors contain packed `uint32` chunks. `leftRows`, `found`, and `probes` must match key chunk lengths. Pair outputs must contain one chunk per key batch and match each other's capacity topology. Counts and overflows require at least one row per batch; statistics require four rows per batch. Writable ranges cannot overlap one another or any read input.
