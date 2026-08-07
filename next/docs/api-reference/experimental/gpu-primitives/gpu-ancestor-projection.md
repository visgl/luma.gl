# GPUAncestorProjection

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUAncestorProjection` reconnects filtered graph nodes to their nearest visible canonical parents. This lets dependency lines remain meaningful when intermediate spans disappear under duration, status, runtime, or topology filters.

In the live trace explorer, collapsing a process or excluding a classification can hide an operation that remains the endpoint of a dependency. Ancestor projection gives the renderer a visible canonical representative while preserving the hidden operation's original source identity.

### GPU Scene Trace Explorer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-trace-scene)Info

InfoSource

```
// Loading source…
```

## Concepts[​](#concepts "Direct link to Concepts")

Projection is different from traversal: it follows each node's one canonical parent chain until it finds a visible source ID. The output remains source-aligned, so renderers can replace a hidden endpoint without renumbering the original graph. A depth bound and invalid sentinel make cycles, missing parents, and malformed chains deterministic GPU data rather than CPU-side exceptions.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Ancestor projection is useful whenever filtering can hide structural intermediates but relationships should remain legible. A dependency viewer can reconnect an edge from a hidden operation to its visible service or process; an outline can attach annotations to the nearest expanded row; and a scene hierarchy can redirect a hidden object's relationship to its visible group. Because IDs stay source-aligned, picking and inspection can still recover the original endpoint.

Use [`GPUGraphTraversal`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md) instead when the question is which nodes are reachable through arbitrary edges. Projection follows exactly one parent chain per row and finds a representative; it does not select a neighborhood or rewrite the graph.

```
import {GPUAncestorProjection} from '@luma.gl/experimental';



new GPUAncestorProjection({

  id: 'visible-parent-projection',

  parents: canonicalParentIds,

  visibility: visibleSpanMask,

  output: visibleAncestorIds,

  maxDepth: 32

}).addToGraph(graph);
```

All three views are packed `GraphDataView<'uint32'>` values with identical logical row counts. For each source node:

* A visible node projects to its own stable source index.
* A hidden node projects to its nearest visible canonical parent.
* Missing, invalid, cyclic, or depth-exhausted ancestry resolves to `0xffffffff` by default.
* `invalidValue` can supply a different `uint32` sentinel.

`maxDepth` bounds the number of hidden parent links followed per source row. This makes malformed or cyclic inputs safe without CPU-side graph inspection. It must be a `uint32` because it is compiled into the WGSL projection bound. The writable output cannot alias either source view.

Projection preserves canonical source IDs; it does not rewrite dependency records, repack span buffers, submit GPU work, or read results back. Render and dependency-visibility shaders can use the projected indices directly while retaining original edge identity for picking and inspection.
