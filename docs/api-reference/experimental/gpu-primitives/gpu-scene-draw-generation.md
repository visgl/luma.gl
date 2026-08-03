import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUSceneDrawGeneration

<GPUPrimitivesDocsTabs active="scene-draw-generation" />

## Overview

`GPUSceneDrawGeneration` turns active, visible `GPUScene` records into bounded indirect draw
commands. It is the bridge between GPU visibility decisions and rendering: the CPU can encode the
same graph and the same fixed set of indirect draws each frame while compute updates which command
slots actually draw an instance.

This is useful when visibility changes much more often than geometry or pipeline setup. Frustum
culling, spatial queries, hierarchy expansion, and selection masks can remain GPU-resident instead
of forcing a readback, rebuilding a CPU draw list, and uploading counts again. Geometry arguments
remain stable; the workflow changes only `instanceCount` and `firstInstance`.

## Concepts

### Explicit slots separate selection from renderer policy

Each scene row carries a `commandSlot`. A visible active row requests that slot, while
`GPU_SCENE_INVALID_REFERENCE` means that the row intentionally has no draw command. The command
buffer is initialized by the renderer with stable geometry arguments such as vertex or index count
and starting offsets. Draw generation does not infer materials, pipelines, or resource bindings.

This division lets applications choose their own slot assignment and issue indirect calls in the
order required by their renderer. It also keeps this primitive useful before pipeline/resource
grouping is standardized.

### Fixed capacity is observable

The workflow publishes three GPU-resident scalar results:

| Result | Meaning |
| --- | --- |
| `requiredCount` | Active, visible rows that request a command slot, including invalid capacity requests and collisions |
| `publishedCount` | Unique in-range command slots that received a draw |
| `overflow` | Nonzero when a requested slot is out of range or more than one row requests the same slot |

These values distinguish an empty result from an incomplete result without requiring hidden
allocation. A renderer can size conservatively, inspect diagnostics asynchronously, or treat
overflow as a signal to rebuild its slot assignment at a deliberate boundary.

### Collisions are deterministic, not silently racy

When multiple visible rows request one slot, the lowest scene-record index owns it. The command is
therefore repeatable across runs, while `overflow` records that some requested work was not
published. Inactive, invisible, invalid-reference, and losing rows cannot leave a stale draw:
every encoding first clears all command instance counts and first-instance fields.

The winner's scene-record index becomes `firstInstance`. Shaders can use that index to fetch the
record's transform, bounds, stable object ID, or renderer-owned references from the scene buffer.
Because scene rows beyond zero produce nonzero `firstInstance` values, the device must expose the
optional WebGPU `indirect-first-instance` feature. `addToGraph()` rejects unsupported devices
before adding passes; applications should request the feature when creating their device.

### Visibility is optional and parameter-only

Without a visibility view, every active row participates. With one, each packed `uint32` row is a
source-aligned flag and nonzero means visible. The view must cover the scene's entire reserved
capacity, including currently inactive rows. The visibility contents may change between graph
encodings; the graph does not need to be rebuilt or recompiled.

Dispatch also covers the full reserved capacity rather than just the active prefix captured when
the scene was imported. Records inserted later with `scene.mutate()` therefore participate in the
same compiled graph immediately, while inactive spare slots remain suppressed by their scene flags.

The scene and command capacities remain compile-time topology. Changing either requires building a
new workflow so allocation, dispatch, and overflow behavior remain inspectable.

### Submission and draw recording stay with the application

`addToGraph()` adds initialization, eligibility, ownership, and publication passes but does not
compile, encode, submit, or read back. After the graph runs, the application still records one
indirect draw for each renderer-owned command slot. Slots with `instanceCount === 0` do no visible
work.

WebGPU does not provide a portable bindless multi-draw contract that would let this primitive
choose arbitrary pipelines and bindings. Pipeline/resource grouping is therefore a separate
roadmap tranche rather than an implicit promise in this API.

## Usage

```ts
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

`commands` may contain either `draw` or `draw-indexed` records. Its backing buffer must have both
storage and indirect usage. The three diagnostic outputs are distinct packed `uint32` graph views
and may not overlap the scene, visibility, command, or one another.

## Methods

### `addToGraph(graph)`

Adds the fixed-capacity draw-generation passes to the target graph. Every supplied view must belong
to that graph.

## Properties

`stats` reports the imported scene row count, reserved scene capacity, command capacity, record
size, transient ownership storage, and total output bytes without GPU readback.

## Current scope

This implements roadmap Tranche 6.2a: deterministic explicit-slot publication and overflow. It
does not allocate slots, group commands by pipeline or resources, issue render calls, or mutate
scene records. Those policies remain renderer-owned until the grouping tranche demonstrates a
portable shared contract.

See also [`GPUScene`](/docs/api-reference/experimental/gpu-primitives/gpu-scene),
[`GPUVisibilityWorkflow`](/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow),
and [`DrawCommandBuffer`](/docs/api-reference/experimental/gpu-primitives/draw-command-buffer).
