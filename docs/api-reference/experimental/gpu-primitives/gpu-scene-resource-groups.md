import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUSceneResourceGroups

<GPUPrimitivesDocsTabs active="scene-resource-groups" />

## Overview

`GPUSceneResourceGroups` classifies generated indirect draws into stable, renderer-owned pipeline
and resource groups. Each group has an application identity, a fixed indirect-command window, an
optional compatible geometry identity, and GPU-resident active-count and overflow diagnostics.

The important separation is that WebGPU can decide which existing commands are active, but it
cannot portably choose arbitrary pipelines or bind groups inside one indirect draw. Applications
therefore keep their pipeline/binding order on the CPU while GPU compute maintains membership,
detects incompatible geometry changes, and identifies commands that no current resource group can
render safely.

This is useful for map tiles that move between material buckets, simulation objects that change
geometry, CAD scenes with distinct pipeline states, and table-backed features grouped by shared
textures or vertex buffers. Visibility changes update GPU counts without rebuilding CPU-selected
draw lists.

## Concepts

### Groups describe binding topology, not a second scene graph

A group descriptor contains:

| Field | Meaning |
| --- | --- |
| `id` | Scene `groupId` naming one renderer-owned pipeline/resource configuration |
| `firstCommand` | Beginning of the group's fixed indirect-command window |
| `commandCount` | Number of command slots owned by the group; zero represents an explicit empty group |
| `geometryId` | Optional required scene geometry reference for a group with fixed geometry bindings |

Descriptor order is preserved exactly. It is the order in which an application can bind pipelines
and resources before recording indirect draws from each group's command window. Group IDs must be
unique and nonempty windows must not overlap, so one command cannot belong to two incompatible
binding configurations.

The class never owns a pipeline, material, bind group, scene hierarchy, or draw encoder. Those
remain application concerns and may differ between a conventional renderer and a preserved-batch
table application.

### Generated commands are the source of truth

Run [`GPUSceneDrawGeneration`](/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation)
before group classification in the same command graph. A command with a zero instance count is
inactive. An active command uses `firstInstance` to locate its scene row, then reads that row's
group and geometry identities.

This avoids a second visibility pass and ensures group counts describe commands that can actually
be issued. Renderer-authored geometry arguments and command slots remain untouched.

### Resource changes are observable, not guessed

`counts[i]` reports active commands compatible with descriptor `i`. `overflows[i]` becomes nonzero
when a scene row names that group but its command falls outside the reserved slot window or its
geometry conflicts with the descriptor. The global `overflow` also reports active commands whose
scene row is invalid or whose group identity has no descriptor.

These diagnostics let applications distinguish an empty visible group from stale binding topology.
For example, changing an object's material may require updating both its scene `groupId` and its
command slot; changing a fixed-geometry mesh may require moving it to a group with compatible
vertex/index bindings. Until that explicit regrouping occurs, the mismatch is not silently counted
as renderable.

### Empty groups and changing visibility keep stable order

A zero-capacity group is a real descriptor with a stable diagnostic slot. It remains in the
pipeline order even when no command window is currently reserved. An active object targeting that
group sets its per-group overflow instead of borrowing a neighbor's slots.

Every encoding clears counts and overflow before classifying active commands. Updating visibility,
scene group membership, geometry identity, or command-slot assignment therefore refreshes the
same compiled graph without CPU draw selection, hidden allocation, or readback.

Classification validates command references against the full reserved scene capacity rather than
the record-count snapshot taken at graph import. A scene can therefore start empty, accept new
records through `scene.mutate()`, and immediately classify their generated draws using the same
compiled graph and stable renderer-owned resource windows.

### WebGPU limits remain explicit

The workflow groups existing renderer-owned indirect calls. It does not provide bindless material
selection, GPU-authored pipeline switches, portable multi-draw, or dynamic bind-group creation.
The CPU still records the fixed group order and binds compatible resources at each boundary.

## Usage

```ts
const sceneView = scene.importToGraph(graph);
const commandView = commands.importToGraph(graph);

new GPUSceneDrawGeneration({
  scene: sceneView,
  visibility,
  commands: commandView,
  requiredCount,
  publishedCount,
  overflow: drawOverflow
}).addToGraph(graph);

const groups = new GPUSceneResourceGroups({
  scene: sceneView,
  commands: commandView,
  groups: [
    {id: OPAQUE_GROUP, firstCommand: 0, commandCount: 256, geometryId: BUILDING_MESH},
    {id: WATER_GROUP, firstCommand: 256, commandCount: 64, geometryId: WATER_MESH},
    {id: OVERLAY_GROUP, firstCommand: 320, commandCount: 0}
  ],
  counts: activeGroupCounts,
  overflows: resourceGroupOverflows,
  overflow: anyResourceMismatch
});

groups.addToGraph(graph);

for (const group of groups.groups) {
  bindRendererResources(renderPass, group.id);
  for (let offset = 0; offset < group.commandCount; offset++) {
    commands.draw(renderPass, group.firstCommand + offset);
  }
}
```

## Methods and properties

`addToGraph(graph)` adds initialization and command-classification passes without compiling,
submitting, or reading results. Every supplied view must belong to the same graph.

`groups` contains immutable descriptors in renderer-authored order. `stats` reports the group
count, command capacity, largest command window, and caller-owned diagnostic output bytes.

## Current scope

This implements roadmap Tranche 6.2b. Group windows, resource identities, and binding order remain
explicit application policy; the GPU classifies active generated commands and reports every
incompatible or unassigned case. Conventional-scene and preserved-table consumers are the next
independent Phase 6 milestones.
