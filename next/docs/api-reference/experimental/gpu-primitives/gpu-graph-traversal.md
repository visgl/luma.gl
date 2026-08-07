# GPUGraphTraversal

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUGraphTraversal` performs bounded, GPU-resident breadth-first selection over compressed sparse graph adjacency. It supports direct dependencies, incoming and outgoing neighborhoods, and multi-hop focused subgraphs without synchronizing the CPU.

The scene-backed trace explorer demonstrates why bounded traversal matters: select one operation, enable linked-span focus, and expand the hop radius to reveal the upstream and downstream work responsible for it. Selection stays on canonical GPU span rows while the same graph is encoded for each new focus state.

### GPU Scene Trace Explorer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-trace-scene)Info

InfoSource

```
// Loading source…
```

## Concepts[​](#concepts "Direct link to Concepts")

Compressed sparse row (CSR) adjacency stores each node's neighbor range in `offsets` and all neighbor IDs in one packed array. Traversal starts from a seed frontier, atomically claims unseen nodes, and expands one frontier per depth. Forward CSR follows outgoing edges; reverse CSR follows incoming edges. The result is a source-aligned `0`/`1` reachability mask rather than a reordered list, so it composes directly with masks and compaction.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Traversal supports focus interactions over an existing graph: show the callers and callees of a selected operation, retain every dependency within three hops of an incident, reveal an object's incoming references, or propagate a selection through a network. `activeDepth` lets an interaction change the visible radius without rebuilding the compiled command graph.

It is not a general shortest-path or ordering API. Use ancestor projection for one canonical parent chain, and use a purpose-built graph algorithm when results require distances, weights, or a deterministic visit order. The bounded breadth-first contract is designed to produce a membership mask for later filtering.

```
import {GPUGraphTraversal} from '@luma.gl/experimental';



new GPUGraphTraversal({

  id: 'focused-dependencies',

  offsets: outgoingOffsets,

  neighbors: outgoingNeighbors,

  reverseOffsets: incomingOffsets,

  reverseNeighbors: incomingNeighbors,

  seeds: selectedSpanIds,

  seedCount: activeSelectionCount,

  output: reachedSpanMask,

  maxDepth: 4,

  activeDepth: selectedTraversalDepth,

  direction: 'both'

}).addToGraph(graph);
```

Inputs may use one packed `GraphDataView<'uint32'>` adjacency or partitioned `GraphVectorView<'uint32'>` adjacency:

* `offsets` has `nodeCount + 1` entries; `neighbors` stores the forward CSR destinations.
* `reverseOffsets` and `reverseNeighbors` provide reverse CSR for `'incoming'` or `'both'`.
* `seeds` contains stable source-node IDs.
* Optional `seedCount` selects how many leading seeds are active.
* `output` has one row per graph node and receives a canonical reachability mask.
* `maxDepth` defines the number of compiled frontier-expansion stages and must not exceed 1024.
* Optional `activeDepth` changes the number of effective stages without recompiling the graph.

### Partitioned CSR identity[​](#partitioned-csr-identity "Direct link to Partitioned CSR identity")

Partitioned traversal keeps one local CSR allocation per output partition. Each `offsets` chunk has `outputChunk.length + 1` entries beginning at zero, and the corresponding `neighbors` chunk contains that source partition's edges. Neighbor values remain stable global node IDs. Forward and reverse adjacency must each contain one offset and neighbor chunk per output chunk; seeds may use any chunk topology.

Arbitrary edges can cross partitions. For each hop, traversal therefore emits explicit source-to-target partition passes: source offsets and frontiers use local indices, while global neighbor IDs select the target output and next-frontier chunk. Empty partitions remain present but add no dispatch. No adjacency, frontier, or output chunk is concatenated or repacked.

The general cross-partition path has an O(partition²) dispatch envelope per hop. Coarse partitions are appropriate when boundaries represent streaming batches or independently replaced storage; each source partition's active adjacency is rescanned for every possible target partition. Applications with many fine partitions should pack explicitly or wait for a spatial/topological index that can route candidate targets without changing the global-ID contract.

The seed nodes are included at depth zero. Out-of-range seed and neighbor IDs are ignored. Atomic node claims make cycles, duplicate dependencies, shared descendants, and overlapping frontiers safe.

Frontier scratch is created as graph-owned transient buffers. Output buffers must not alias adjacency, seeds, or other traversal inputs. The operation neither submits commands nor reads results back; its output can be composed with `GPUMask` and passed directly to `GPUCompaction`.
