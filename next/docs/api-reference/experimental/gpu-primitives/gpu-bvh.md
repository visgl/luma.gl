# GPUBVH

[Foundation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Tables & joins](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Graphs](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Spatial](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Rendering](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)

[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)

## Overview[​](#overview "Direct link to Overview")

`GPUBVH` builds and refits a flat, complete-binary bounding-volume hierarchy over packed 2D or 3D axis-aligned bounds. Source order defines stable leaf slots, every node has caller-visible bounds and child indices, and each graph encoding reloads the bounded leaf prefix before reducing parent bounds bottom-up. Small hierarchies fuse that complete operation into one portable workgroup and one command-graph node; larger hierarchies retain separate, safely ordered passes for each tree level. Optional explicit source identities add one inexpensive, two-buffer remapping node to either strategy while keeping every pass within standard WebGPU CORE limits.

This first BVH contract emphasizes storage, identity, update behavior, and measurable cost. It does not claim that source order is a high-quality spatial topology. Query and spatial-rebuild policies can be added against a concrete layout instead of coupling those decisions to hidden ownership or a CPU scene graph.

## Concepts[​](#concepts "Direct link to Concepts")

### Flat complete-binary storage[​](#flat-complete-binary-storage "Direct link to Flat complete-binary storage")

For a power-of-two `leafCapacity`, the hierarchy contains `2 * leafCapacity - 1` nodes:

```
node 0                         root

nodes 1 … leafCapacity - 2     internal nodes

nodes leafCapacity - 1 … end   leaf nodes
```

Internal node `i` stores children `2 * i + 1` and `2 * i + 2`. Leaves store `[0xffffffff, 0xffffffff]`. Minima and maxima use the source `float32x2` or `float32x3` format; stable IDs occupy a separate leaf array. The public `stats` object reports dimensions, node counts, levels, and caller-owned output bytes before any submission or readback.

A complete tree deliberately trades unused leaf slots for simple traversal, deterministic memory, and logarithmic refit depth. Rounding a requested capacity up to a power of two uses less than twice the leaf storage, but sparse capacities can still waste meaningful memory.

### Refit is not rebuild[​](#refit-is-not-rebuild "Direct link to Refit is not rebuild")

`updatePolicy` is `'refit'`. Every encoding:

1. reloads current source bounds into the reserved leaf prefix;
2. republishes stable leaf IDs and fixed child topology;
3. reduces internal levels bottom-up until the root is current.

Changing bounds therefore needs no graph recompilation and preserves leaf identity. Changing capacity, source ordering, or topology requires constructing a new BVH and recompiling the graph. That distinction matters: refit is predictable and cheap, but repeatedly moving objects far from their source-order neighbors can leave a poor hierarchy poor.

### Fused and per-level execution[​](#fused-and-per-level-execution "Direct link to Fused and per-level execution")

`strategy: 'auto'` is the default. When `leafCapacity` is at most 128 and the adapter can fit the required invocations and workgroup memory, construction and refit run in a single `fused-refit` compute node. The workgroup keeps two copies of each reduction level in shared memory and uses portable `workgroupBarrier()` synchronization; it never waits for another workgroup or assumes a particular scheduler. The pass uses the eight storage-buffer bindings available in default WebGPU CORE. Explicit source IDs are published by a separate two-buffer `remap-source-ids` node after implicit leaf indices are initialized, so stable identities do not require an elevated adapter limit.

Larger trees automatically select the existing `level` strategy: one `load-leaves` node followed by one `refit-depth-*` node for each internal tree level. Set `strategy: 'level'` to force that path for a small tree, or `strategy: 'fused'` to require the one-workgroup path. An unsupported forced fused configuration throws during construction. Inspect `strategy` for the requested policy and `resolvedStrategy` for the concrete graph shape. Both strategies publish exactly the same bounds, children, source IDs, count, overflow, and query-compatible storage. Without explicit source IDs, fused graphs contain one node and per-level graphs contain one node per tree level; providing `sourceIds` adds exactly one remapping node to either graph.

### Why source-order topology exists[​](#why-source-order-topology-exists "Direct link to Why source-order topology exists")

A hierarchy is correct when every parent encloses its children; it is efficient only when traversal can reject large subtrees. Source order may already carry useful locality for tiled data, Morton- ordered tables, simulation blocks, or producer-sorted batches. For arbitrary order, parent bounds can overlap heavily and a query may visit nearly every leaf.

The initial topology is therefore a useful baseline and refit target, not an assertion that sorting never matters. A later spatial-rebuild policy can compare Morton or other construction strategies against this deterministic baseline while preserving the same node and leaf storage contract.

### Capacity, invalid bounds, and identity[​](#capacity-invalid-bounds-and-identity "Direct link to Capacity, invalid bounds, and identity")

`count` reports the full source row count. `overflow` becomes `1` when it exceeds `leafCapacity`; only the stable prefix is stored. Unused leaves contain an invalid ID and empty bounds. Non-finite or reversed source bounds also produce empty leaf bounds, while retaining the row's stable ID slot so a later valid update does not silently change identity.

Generated IDs equal source rows. Optional explicit IDs are copied without reordering. This makes the hierarchy suitable for table rows, scene records, simulation entities, or other flat databases without making any of those representations part of the BVH.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Use a BVH when object sizes vary substantially, the domain is sparse, or grid cells would produce too many false positives. Prefer a uniform grid when cell lookup and highly regular parallel build cost dominate. Prefer an unindexed scan for small inputs, broad one-off queries, or update rates that cannot amortize either structure.

Measure storage, leaf loading, per-level refit, traversal, exact refinement, and rebuild cost separately. A lower asymptotic query bound does not compensate automatically for poor topology or a rebuild on every query.

## Usage[​](#usage "Direct link to Usage")

```
const bvh = new GPUBVH({

  minima: objectMinima,

  maxima: objectMaxima,

  strategy: 'auto',

  sourceIds: stableObjectIds,

  leafCapacity: 1 << 16,

  nodeMinima,

  nodeMaxima,

  nodeChildren,

  leafIds,

  count: sourceCount,

  overflow: capacityOverflow

});



bvh.addToGraph(graph);
```

All views must be packed and belong to the target command graph. `nodeMinima`, `nodeMaxima`, and `nodeChildren` each contain `2 * leafCapacity - 1` rows; `leafIds` contains `leafCapacity` rows. The primitive does not allocate caller-visible storage, submit, read back, or spatially sort the hierarchy. Use [`GPUBVHQuery`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md) for exact point containment and bounds-intersection traversal.
