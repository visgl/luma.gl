# GPUGridIndex

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUGridIndex` builds a flat uniform-grid index over packed two- or three-dimensional points. It publishes exclusive cell offsets, capacity-bounded stable object IDs, the full accepted count, and an overflow flag. The structure stays in storage buffers so later visibility, picking, simulation, or neighborhood passes can consume candidates without first downloading them.

A grid index trades one rebuild for cheaper repeated spatial queries. It is most useful when many objects share a bounded domain, queries are local, and the same index serves several frames or several queries. Examples include screen-space label neighborhoods, map points, particle collision candidates, nearby simulation agents, and coarse 3D visibility cells.

## Concepts[​](#concepts "Direct link to Concepts")

### Flat cell storage[​](#flat-cell-storage "Direct link to Flat cell storage")

The index uses a compressed row-major layout analogous to CSR adjacency:

```
cellOffsets: [0, 2, 2, 5]

objectIds:   [8, 3, 4, 9, 1]

               cell 0    cell 2
```

Cell `i` owns the logical range `[cellOffsets[i], cellOffsets[i + 1])`. Two-dimensional cells use `row * width + column`; three-dimensional cells use `(layer * height + row) * width + column`. Exact maximum coordinates enter the last cell on an axis. Non-finite and out-of-domain positions are ignored.

The final offset and `count` report the full required object-ID length even when `objectIds` is too small. `overflow` then becomes `1`, and only destinations below capacity are written. This preserves an honest sizing signal and prevents out-of-bounds writes. A query must clamp every cell range to the available object-ID capacity when consuming an overflowed build.

### Stable identity, not stable cell order[​](#stable-identity-not-stable-cell-order "Direct link to Stable identity, not stable cell order")

By default, IDs are logical source-row indices plus `firstSourceIndex`. `sourceIds` can instead provide application-owned stable IDs with the same atomic or vector topology as the positions. Position vector chunks remain separate inputs and retain their logical bases; the build never packs or rewrites them.

Atomic scatter order inside one cell is unspecified. The set of IDs and every cell boundary are stable, but two equal builds need not place IDs in the same within-cell order. Consumers that need a deterministic priority should sort candidates explicitly or apply a deterministic reduction after querying.

### Build and update cost[​](#build-and-update-cost "Direct link to Build and update cost")

Every graph encoding performs a complete build: clear cell counts, count accepted positions, exclusive-scan counts into offsets, and scatter IDs. Graph-owned count, cursor, and scan buffers make the allocation cost visible through command-graph statistics and reusable across encodings.

The current `updatePolicy` is `'rebuild'`. An application may upload only a changed source range or replace one vector chunk, but changing any position or membership rebuilds the compact index. This is an explicit cost contract, not incremental index maintenance. A future incremental mode must demonstrate bounded relocation or reserved per-cell capacity and compare its memory and update cost with this compact rebuild before it can share the API.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Use a grid when the domain and useful cell size are known, object density is reasonably distributed, and multiple selective queries can amortize construction. Cell size controls the tradeoff: smaller cells reduce query candidates but increase offset storage and clearing work; larger cells build a smaller index but leave more candidates for exact filtering.

An unindexed GPU scan is often better for one broad query, frequently changing data, or a small population. Highly clustered or scale-varying data may favor a BVH once that contract is available. `GPUGridBinning` and `GPUGridAggregation` are summaries rather than indexes: they return counts or statistics per cell but intentionally discard the object IDs needed for spatial queries.

## Usage[​](#usage "Direct link to Usage")

```
const index = new GPUGridIndex({

  positions,

  gridSize: [64, 64],

  bounds: [-180, -90, 180, 90],

  cellOffsets,

  objectIds,

  count,

  overflow

});



index.addToGraph(graph);
```

Three-dimensional positions use `float32x3`, a three-component `gridSize`, and minima followed by maxima in `bounds`:

```
new GPUGridIndex({

  positions: particlePositions,

  gridSize: [32, 16, 32],

  bounds: [-100, -50, -100, 100, 50, 100],

  cellOffsets,

  objectIds,

  count,

  overflow

}).addToGraph(graph);
```

`cellOffsets.length` must equal `width * height + 1` or `width * height * depth + 1`. `objectIds.length` is the ID capacity. `count` and `overflow` each provide at least one packed `uint32` row. Generated IDs and the accepted population must fit in `uint32`.

The primitive records build work only. It does not submit commands, allocate persistent output, read results back, choose a cell size, grow capacity, or perform an exact spatial query.
