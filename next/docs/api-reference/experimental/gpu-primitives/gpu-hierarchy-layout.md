# GPUHierarchyLayout

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUHierarchyLayout` converts parent and child expansion flags into effective row heights and exclusive GPU-scanned positions. It supports interactive process/thread collapse without rebuilding source data or render commands.

The live trace viewer demonstrates the motivating interaction directly: collapsing a process retains one representative row, collapsing a thread retains its first lane, and later rows move into place through GPU-scanned offsets. The underlying source spans and their stable identities never move.

### GPU Hierarchical Trace Viewer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-trace-viewer)Info

InfoSource

```
// Loading source…
```

## Concepts[​](#concepts "Direct link to Concepts")

A hierarchical list can be laid out as a flat sequence when every child row publishes an effective height. Expanded rows keep their configured height; collapsed parents replace their child group with one summary height and zero out the remaining children. An exclusive scan turns those heights into stable row offsets. Updating expansion flags therefore changes layout entirely on the GPU without changing source identity.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

This layout fits large, regularly grouped views whose expansion state changes more often than their source data: process/thread lanes, grouped timelines, layer panels, and batched diagnostic rows. The resulting heights and offsets can drive rendering and picking in the same frame without asking the CPU to rebuild a visible-row array after every expand or collapse interaction.

The current contract assumes a fixed `childrenPerParent` and one parent level. Use a CPU layout or a more general hierarchy algorithm for arbitrary-depth trees, variable child ranges, text measurement, or constraints that depend on sibling content. The primitive computes scalar row placement; it does not choose styling or animation.

```
import {GPUHierarchyLayout} from '@luma.gl/experimental';



new GPUHierarchyLayout({

  id: 'process-thread-layout',

  parentStates: processExpansionFlags,

  childStates: threadExpansionFlags,

  heights: threadHeights,

  offsets: threadOffsets,

  childrenPerParent: 4,

  expandedChildHeight: 4,

  collapsedChildHeight: 1,

  collapsedParentHeight: 1

}).addToGraph(graph);
```

Inputs and outputs may be packed `GraphDataView<'uint32'>` values or ordered `GraphVectorView<'uint32'>` partitions. A nonzero state is expanded; a zero state is collapsed.

* Expanded parents publish one height for each child.
* Expanded children use `expandedChildHeight`.
* Collapsed children use `collapsedChildHeight`.
* A collapsed parent publishes `collapsedParentHeight` through its first child; its other children publish zero.
* `GPUScan` converts the effective child heights into stable exclusive row offsets.

`childStates.length` must equal `parentStates.length * childrenPerParent`. Both output lengths must equal the child count. Vector heights and offsets preserve the exact child-state chunk topology; parent partitions may use different boundaries.

### Partitioned hierarchy identity[​](#partitioned-hierarchy-identity "Direct link to Partitioned hierarchy identity")

Partition boundaries are storage and update boundaries, not hierarchy boundaries. Cumulative row counts assign every parent and child one stable global ID. When a child chunk crosses a parent chunk boundary, `GPUHierarchyLayout` emits an explicit pass for each intersecting range and uses the global child ID to select its parent. It never concatenates or repacks either vector.

This matters for streamed or incrementally replaced batches: an application can replace one parent or child allocation while preserving source identity and output partitions. Empty chunks retain their position. The exclusive scan carries layout offsets across child chunks, so the result is identical to laying out one explicitly packed sequence.

Heights and offsets are caller-owned and cannot alias each other or their input buffers.

Expansion states can be updated between graph encodings. The operation allocates only graph-owned scan scratch and does not submit, repack, or read back data.
