# GPUVisibilityWorkflow

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUVisibilityWorkflow` is a renderer-independent command-graph fragment that intersects source-aligned visibility masks, stably compacts visible source IDs, and publishes the visible count. The count can point directly at an indirect draw command, so neither filtering nor drawing requires CPU readback.

## Concepts[​](#concepts "Direct link to Concepts")

A predicate answers one visibility question per source row; the workflow combines those answers into one canonical mask and materializes the accepted identities. Stable compaction preserves source order, and the GPU-resident count defines the valid prefix of the output. Renderers consume that fixed contract without knowing whether rows were rejected by time, bounds, LOD, selection, or a combination of them.

Use the workflow when several renderers or examples should share the same fixed visibility plumbing. Time-window filtering in a timeline, frustum culling in a 3D view, LOD selection for map tiles, and linked-selection filtering can all produce masks independently and receive the same stable IDs plus indirect count. This keeps renderer-specific shaders focused on producing predicates and consuming identities.

Use `GPUMask` and `GPUCompaction` directly when an application needs different boolean semantics, custom outputs, or only one of those stages. The workflow intentionally does not accept arbitrary WGSL callbacks: fixed predicate-mask contracts remain easier to compose, validate, and reuse.

```
import {GPUVisibilityWorkflow} from '@luma.gl/experimental';

const count = graph.importGPUData(
  'visible-object-count',
  drawCommands.getInstanceCountData(0)
);

new GPUVisibilityWorkflow({
  id: 'visible-objects',
  predicates: [
    {kind: 'time-range', mask: timeRangeMask},
    {kind: 'bounds', mask: boundsMask},
    {kind: 'lod', mask: lodMask},
    {kind: 'selection', mask: selectionMask}
  ],
  outputMask: visibleMask,
  output: visibleIds,
  count
}).addToGraph(graph);
```

The workflow owns mask intersection, identity generation, scan, stable scatter, and count publication. Applications remain responsible for producing predicate masks. This fixed contract lets a time filter, frustum test, LOD rule, or selection kernel share the same downstream workflow without embedding renderer state or application WGSL in the API.

## Predicates[​](#predicates "Direct link to Predicates")

Each predicate has a semantic `kind` and a packed `uint32` mask. A zero rejects the corresponding source row; any nonzero value accepts it. All predicates are intersected. The supported semantic roles are:

* `'time-range'`
* `'bounds'`
* `'lod'`
* `'selection'`

A producer that fuses several tests into one mask can provide an array of kinds, such as `{kind: ['time-range', 'bounds', 'lod'], mask}`. Kinds describe the fixed contract for diagnostics and workflow composition; they do not inject shader callbacks.

When `outputMask` is provided, the workflow writes the canonical composed mask as `0` or `1`. This allows hierarchy projection or another algorithm to consume the exact visibility decision.

## Stable identity and output[​](#stable-identity-and-output "Direct link to Stable identity and output")

By default, the workflow generates consecutive source IDs beginning at zero. Set `firstSourceIndex` when the input represents a slice of a larger stable identity space:

```
new GPUVisibilityWorkflow({
  predicates: [{kind: 'selection', mask: groupMask}],
  output: groupVisibleIds,
  count: groupInstanceCount,
  firstSourceIndex: group.firstRow
}).addToGraph(graph);
```

Alternatively, supply `sourceIds` to compact an explicit ID vector. `sourceIds` and `firstSourceIndex` are mutually exclusive. Selected IDs preserve source order.

`count` is one packed `uint32` row. It may be ordinary storage or a borrowed `DrawCommandBuffer` count field. Updating predicate data and encoding the compiled graph again updates the output IDs and count without recompiling the graph.

## Chunked vectors[​](#chunked-vectors "Direct link to Chunked vectors")

Predicates, source IDs, output masks, and outputs may all be atomic `GraphDataView<'uint32'>` values or all be `GraphVectorView<'uint32'>` values. Vector inputs must have identical ordered chunk topology. The workflow preserves chunk boundaries, generates IDs in the global logical order, and reports one vector-wide count; it never concatenates or repacks the caller-owned buffers.

Output capacity must cover every source row. All views must belong to the target graph, and generated IDs must fit in `uint32`.

## Current consumers[​](#current-consumers "Direct link to Current consumers")

The hierarchical trace viewer combines time-range, viewport, LOD, and focused-selection masks, then routes the workflow's stable IDs and counts into grouped indirect draws. The frustum-culling example supplies a bounds mask and consumes the same output contract for indexed indirect rendering. Neither consumer owns scan or compaction plumbing.

Application-defined WGSL predicate callbacks remain deferred until these fixed mask contracts demonstrate which extension points are necessary.
