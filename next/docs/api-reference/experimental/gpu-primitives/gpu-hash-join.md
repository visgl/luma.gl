# GPUHashJoin

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUHashJoin` turns sparse exact lookup into stable, capacity-bounded inner-join row pairs. It queries a previously built `GPUHashIndex` or `GPUBatchHashIndex`, scans the match mask, and publishes aligned left and right row IDs without CPU selection, hidden submission, or readback.

This solves a common GPU data-boundary problem: one buffer contains observations, instances, or selected objects identified by sparse stable keys, while another buffer contains properties in a dense row table. A join maps those independent identities into row pairs that later compute and render passes can gather directly.

`GPUHashIndexQuery` already provides aligned left-join semantics: every left row receives either a matched value or `GPU_HASH_INDEX_EMPTY_KEY`, plus a found mask. `GPUHashJoin` adds the stable compaction needed when downstream work should run only for matching rows.

## Concepts[​](#concepts "Direct link to Concepts")

### Sparse joins connect independently owned GPU data[​](#sparse-joins-connect-independently-owned-gpu-data "Direct link to Sparse joins connect independently owned GPU data")

Dense row numbers work only while producers share one ordering. Real applications often do not: telemetry events refer to long-lived sensor IDs, visible objects refer to scene-property IDs, features refer to dictionary or style IDs, and linked selections carry stable IDs across filtered views. The key space may span all of `uint32` even when each table contains only thousands of rows.

A direct-address array would allocate for the key space rather than the data. Downloading IDs for a CPU map would interrupt a GPU-resident pipeline. The hash index instead maps sparse right-side keys to compact right rows, and the join resolves a changing left batch inside the same command graph.

### Left lookup and inner publication are two views of one operation[​](#left-lookup-and-inner-publication-are-two-views-of-one-operation "Direct link to Left lookup and inner publication are two views of one operation")

An aligned left join preserves every left row. `GPUHashIndexQuery` writes matched right rows, `0xffffffff` for misses, and a source-aligned `found` mask. This form is useful when downstream code must preserve observation or instance alignment and branch on whether a property exists.

An inner join removes misses. `GPUHashJoin` scans the same found mask and writes matched `[leftRow, rightRow]` pairs in left source order. Duplicate left keys remain duplicate output rows, which is normally what event and instance joins require. Optional `found` and `probes` outputs keep the aligned diagnostics available even when the primary result is compacted.

### The first contract is many-to-one[​](#the-first-contract-is-many-to-one "Direct link to The first contract is many-to-one")

The right index stores one value per distinct key. If right-side input contains duplicate keys, either hash-index implementation deterministically retains the value from the lowest source row. For `GPUBatchHashIndex`, that winner is the earliest row across all preserved right-side chunks. The resulting join is therefore many-left-to-one-right: repeated left keys may all map to one right row.

This is intentional. One-to-many and many-to-many joins require a different right-side structure, usually key-group offsets plus a value list, and can expand output far beyond left input length. Adding that behavior to an exact map would obscure both memory requirements and overflow. It remains a separate future contract.

### Stable pairs make downstream work reproducible[​](#stable-pairs-make-downstream-work-reproducible "Direct link to Stable pairs make downstream work reproducible")

Matches are compacted in left source order using `GPUScan`. Atomic hash insertion may choose a different physical table layout between builds, but it does not affect join order or duplicate right-value selection. A left row that matches always appears before any later matching left row.

Stable order is valuable for deterministic rendering, reproducible exports, and carrying a second left-aligned payload through the same pair indices. It also means capacity truncation retains the stable matching prefix rather than an arbitrary set of atomically appended rows.

### Required count and overflow are part of the result[​](#required-count-and-overflow-are-part-of-the-result "Direct link to Required count and overflow are part of the result")

`outputLeftRows.length` defines pair capacity, and `outputRightRows` must have the same length. `count` reports the total required pair count before truncation. `overflow` is nonzero when that count exceeds capacity. When the index exposes its build statistics, overflow also propagates an incomplete source index: a join cannot claim completeness when right-side keys were dropped during the build. Thus a caller can render or process `min(count, capacity)` pairs safely while still observing that the result is incomplete.

The join never resizes its outputs. A workload can choose fixed worst-case storage, use observed counts to size a later frame, or reject overflow in correctness-sensitive processing. The contract keeps allocation and latency policy with the application.

### Probe statistics separate lookup cost from join density[​](#probe-statistics-separate-lookup-cost-from-join-density "Direct link to Probe statistics separate lookup cost from join density")

The four-row statistics block comes directly from `GPUHashIndexQuery`:

```
[found keys, missing keys, total probes, maximum probes]
```

Join density is `found / left row count`; lookup health is described by average and maximum probes. A sparse join can legitimately have many misses while still using a healthy hash table, or match nearly every row while paying excessive probes because the right index is overfull. Keeping these measurements separate points to the right response: change application filtering for the former, or index capacity and probe bounds for the latter.

### Composition and ownership[​](#composition-and-ownership "Direct link to Composition and ownership")

The workflow reuses `GPUHashIndexQuery` and `GPUScan`, then adds one pair-scatter pass. Callers own the persistent right index, left keys, published pairs, count, overflow, and statistics. The graph owns transient matched rows, flags, probe counts, and scan offsets unless their diagnostic outputs are supplied explicitly.

All current inputs are packed `uint32` views. Preserved chunk topology, multiple right matches, payload materialization, outer joins, and join chaining remain future contracts. Keeping this slice row-ID-oriented lets downstream consumers gather their own typed columns without making the join primitive depend on Arrow or a particular table representation.

## Usage[​](#usage "Direct link to Usage")

```
const propertyIndex = new GPUHashIndex({

  keys: propertyObjectIds,

  firstValue: propertyBaseRow,

  tableKeys,

  tableValues,

  statistics: indexStatistics

});

propertyIndex.addToGraph(graph);



new GPUHashJoin({

  index: propertyIndex,

  keys: visibleObjectIds,

  firstLeftRow: visibleBaseRow,

  outputLeftRows: matchedVisibleRows,

  outputRightRows: matchedPropertyRows,

  count: requiredMatchCount,

  overflow: matchOverflow,

  statistics: lookupStatistics,

  found: visibleObjectsWithProperties

}).addToGraph(graph);
```

For an aligned left join without compaction, use the underlying query directly:

```
new GPUHashIndexQuery({

  index: propertyIndex,

  keys: visibleObjectIds,

  values: propertyRowsOrEmpty,

  found: visibleObjectsWithProperties,

  probes: lookupProbeCounts,

  statistics: lookupStatistics

}).addToGraph(graph);
```

## Constructor[​](#constructor "Direct link to Constructor")

```
new GPUHashJoin({

  id?,

  index,

  keys,

  leftRows?,

  firstLeftRow?,

  outputLeftRows,

  outputRightRows,

  count,

  overflow,

  statistics,

  found?,

  probes?,

  maxProbeCount?

});
```

`leftRows` and `firstLeftRow` are mutually exclusive. Without explicit left rows, generated IDs are `firstLeftRow + sourceRow`. Output capacities must match. `count` and `overflow` require one row, statistics require four rows, and optional found/probe outputs must match the left key length. All views must belong to the target graph, and writable ranges cannot alias each other or read inputs.
