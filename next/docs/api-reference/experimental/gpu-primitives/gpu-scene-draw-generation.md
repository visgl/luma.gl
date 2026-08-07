# GPUSceneDrawGeneration

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUSceneDrawGeneration` turns active, visible `GPUScene` records into bounded indirect draw commands. It is the bridge between GPU visibility decisions and rendering: the CPU can encode the same graph and the same fixed set of indirect draws each frame while compute updates which command slots actually draw an instance.

This is useful when visibility changes much more often than geometry or pipeline setup. Frustum culling, spatial queries, hierarchy expansion, and selection masks can remain GPU-resident instead of forcing a readback, rebuilding a CPU draw list, and uploading counts again. Geometry arguments remain stable; the workflow changes only `instanceCount` and `firstInstance`.

### GPU Scene Graph Explorer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-scene-graph)Info

InfoSource

```
// Loading source…
```

## Concepts[​](#concepts "Direct link to Concepts")

### Explicit slots separate selection from renderer policy[​](#explicit-slots-separate-selection-from-renderer-policy "Direct link to Explicit slots separate selection from renderer policy")

Each scene row carries a `commandSlot`. A visible active row requests that slot, while `GPU_SCENE_INVALID_REFERENCE` means that the row intentionally has no draw command. The command buffer is initialized by the renderer with stable geometry arguments such as vertex or index count and starting offsets. Draw generation does not infer materials, pipelines, or resource bindings.

This division lets applications choose their own slot assignment and issue indirect calls in the order required by their renderer. It also keeps this primitive useful before pipeline/resource grouping is standardized.

The live scene-graph example records every renderer-owned slot once in a reusable render bundle. Changing a group checkbox alters only the GPU visibility mask; moving or removing a selected object updates its ordinary scene record. The same compiled graph then republishes counts and source-indexed indirect commands without the application constructing a CPU-selected draw list.

### Fixed capacity is observable[​](#fixed-capacity-is-observable "Direct link to Fixed capacity is observable")

The workflow publishes three GPU-resident scalar results:

| Result           | Meaning                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `requiredCount`  | Active, visible rows that request a command slot, including invalid capacity requests and collisions |
| `publishedCount` | Unique in-range command slots that received a draw                                                   |
| `overflow`       | Nonzero when a requested slot is out of range or more than one row requests the same slot            |

These values distinguish an empty result from an incomplete result without requiring hidden allocation. A renderer can size conservatively, inspect diagnostics asynchronously, or treat overflow as a signal to rebuild its slot assignment at a deliberate boundary.

### Collisions are deterministic, not silently racy[​](#collisions-are-deterministic-not-silently-racy "Direct link to Collisions are deterministic, not silently racy")

When multiple visible rows request one slot, the lowest scene-record index owns it. The command is therefore repeatable across runs, while `overflow` records that some requested work was not published. Inactive, invisible, invalid-reference, and losing rows cannot leave a stale draw: every encoding first clears all command instance counts and first-instance fields.

The winner's scene-record index becomes `firstInstance`. Shaders can use that index to fetch the record's transform, bounds, stable object ID, or renderer-owned references from the scene buffer. Because scene rows beyond zero produce nonzero `firstInstance` values, the device must expose the optional WebGPU `indirect-first-instance` feature. `addToGraph()` rejects unsupported devices before adding passes; applications should request the feature when creating their device.

### Visibility is optional and parameter-only[​](#visibility-is-optional-and-parameter-only "Direct link to Visibility is optional and parameter-only")

Without a visibility view, every active row participates. With one, each packed `uint32` row is a source-aligned flag and nonzero means visible. The view must cover the scene's entire reserved capacity, including currently inactive rows. The visibility contents may change between graph encodings; the graph does not need to be rebuilt or recompiled.

Dispatch also covers the full reserved capacity rather than just the active prefix captured when the scene was imported. Records inserted later with `scene.mutate()` therefore participate in the same compiled graph immediately, while inactive spare slots remain suppressed by their scene flags.

The scene and command capacities remain compile-time topology. Changing either requires building a new workflow so allocation, dispatch, and overflow behavior remain inspectable.

### Submission and draw recording stay with the application[​](#submission-and-draw-recording-stay-with-the-application "Direct link to Submission and draw recording stay with the application")

`addToGraph()` adds initialization, eligibility, ownership, and publication passes but does not compile, encode, submit, or read back. After the graph runs, the application still records one indirect draw for each renderer-owned command slot. Slots with `instanceCount === 0` do no visible work.

WebGPU does not provide a portable bindless multi-draw contract that would let this primitive choose arbitrary pipelines and bindings. [`GPUSceneResourceGroups`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md) therefore adds explicit renderer-owned binding windows as a separate workflow rather than hiding pipeline policy inside draw generation.

## Usage[​](#usage "Direct link to Usage")

```
const graph = new GPUCommandGraph(device);

const sceneView = scene.importToGraph(graph);

const commandView = commands.importToGraph(graph);



const generation = new GPUSceneDrawGeneration({

  scene: sceneView,

  visibility,

  commands: commandView,

  requiredCount,

  publishedCount,

  overflow

});



generation.addToGraph(graph);



// The application compiles, encodes, and submits the graph, then records its stable slots.

for (let slot = 0; slot < commands.capacity; slot++) {

  commands.draw(renderPass, slot);

}
```

`commands` may contain either `draw` or `draw-indexed` records. Its backing buffer must have both storage and indirect usage. The three diagnostic outputs are distinct packed `uint32` graph views and may not overlap the scene, visibility, command, or one another.

## Methods[​](#methods "Direct link to Methods")

### `addToGraph(graph)`[​](#addtographgraph "Direct link to addtographgraph")

Adds the fixed-capacity draw-generation passes to the target graph. Every supplied view must belong to that graph.

## Properties[​](#properties "Direct link to Properties")

`stats` reports the imported scene row count, reserved scene capacity, command capacity, record size, transient ownership storage, and total output bytes without GPU readback.

## Current scope[​](#current-scope "Direct link to Current scope")

This implements roadmap Tranche 6.2a: deterministic explicit-slot publication and overflow. It does not allocate slots, issue render calls, or mutate scene records. Resource grouping remains a separate renderer-owned contract implemented by `GPUSceneResourceGroups`.

See also [`GPUScene`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md), [`GPUVisibilityWorkflow`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md), and [`DrawCommandBuffer`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md).
