---
title: GPU-animated crowd API
description: Crowd boundaries, ownership, cleanup, diagnostics, and public API contracts.
---

import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';
import {GltfCrowdDocsTabs} from '@site/src/components/docs/gltf-crowd-docs-tabs';

# GPU-animated crowd API

<GltfDocsTabs active="animated-crowd" />
<GltfCrowdDocsTabs active="api" />

## Current boundaries

- Source geometry and materials are shared; per-actor material factors, material variants,
  texture-transform pointers, camera/light pointers, and renderer state are not isolated.
- Actor morph weights can advance independently through packed CPU-mode weights or baked GPU clip
  sampling.
- Per-actor transparency sorting, source-authored `EXT_mesh_gpu_instancing` composition,
  GPU-driven indirect LOD draws, and material-level LOD are not supported.
- Each source primitive still has its own draw. CPU mode evaluates clips and palettes per actor;
  optional baked GPU mode instead samples bounded immutable clip atlases in vertex shaders.
- Crowd buffers have a fixed capacity; recreate the crowd to increase it.

Use the regular [glTF animation reference](/docs/api-reference/gltf/gltf-animation) when an asset
requires independently updated materials, morph geometry, cameras, or lights without batching.

## Ownership and cleanup

```ts
crowd.getActor('runner');
crowd.removeActors(['walker']);
crowd.update(1 / 60);

crowd.destroy();
crowd.destroy();
```

Removing an actor releases only its private CPU-side animation state; remaining actors continue
using the shared GPU models. Destroying the crowd releases its packed palette resources and calls
the shared `scenegraphs.destroy()` lifecycle exactly once. Destruction is idempotent and does not
destroy the application-owned device or borrowed image-based-lighting textures.

## Inspect and troubleshoot a crowd

Inspect actual shared primitive groups instead of estimating draw counts from the actor count:

```ts
console.table(
  crowd.primitiveGroups.map(group => ({
    animationNode: group.nodeIndex,
    sourceNode: group.sourceNodeIndex,
    detailLevel: group.lodLevel,
    indicesPerActor: group.vertexCount,
    trianglesPerActor: group.triangleCount,
    actorInstances: group.model.instanceCount,
    joints: group.jointCount,
    transformBuffers: group.transformBuffers.length,
    palette: group.skinJointMatrices ? 'packed GPU palette' : 'rigid'
  }))
);

console.table(
  crowd.actors.map(actor => ({
    id: actor.id,
    clip: actor.activeClip,
    seconds: actor.time,
    speed: actor.speed,
    playing: actor.playing
  }))
);
```

| Observation | Explanation or corrective action |
| --- | --- |
| More than one draw for a character. | One instanced draw is expected per reachable source primitive, not per complete asset. |
| Different actions still use the same draw. | Expected: independent clip and pose state selects packed instance data within the shared draw. |
| No pixels despite a nonzero actor count. | Configure every model's projection and camera inputs, end the render pass, and submit the device. |
| Adding actors fails at a fixed count. | Recreate the crowd with a larger `capacity`, subject to device storage or texture limits. |
| Individual actor changes make large crowds slow. | Prefer `addActors()`, `removeActors()`, and one crowd-level `update()` per frame. |
| Baked clips fall back to CPU playback. | Increase `gpuAnimation.maxFrames` or reduce the clip set or sampling rate. |
| The LOD sample never changes mesh. | Configure `lod`, enable it, supply `setLODView()`, and move actors across the authored coverage thresholds. |
| Several draws appear with Auto LOD enabled. | Expected: each occupied source-primitive/detail bucket submits one instanced draw. |
| An actor disappears at a great distance. | Actors below the lowest coverage threshold are culled; increase detail bias or lower the threshold. |
| The vertex count exceeds the configured limit. | Every visible actor may already be at its lowest available detail; inspect `budgetSatisfied` and add lower levels or raise the budget. |
| A faraway actor becomes less detailed than its screen coverage suggests. | The global vertex budget demotes smaller, more distant actors before reducing closer characters. |
| Generated detail stays at full resolution. | Boundary, topology, or joint constraints can prevent safe simplification; inspect `lodStats.source` and the source mesh. |

## Public API

```ts
import {
  createGLTFAnimatedCrowd,
  GLTFAnimatedCrowd,
  type GLTFAnimatedCrowdOptions,
  GLTFCrowdActor,
  type GLTFCrowdActorOptions,
  type GLTFCrowdClipSelectionOptions,
  type GLTFCrowdPrimitiveGroup
} from '@luma.gl/gltf';
```

| API | Purpose |
| --- | --- |
| `createGLTFAnimatedCrowd(device, gltf, options?)` | Parse one postprocessed asset and allocate shared crowd resources. |
| `crowd.addActors(options[])`, `crowd.addActor(options?)` | Add lightweight actors; the batched form uploads once. |
| `crowd.getActor(id)`, `crowd.removeActor(id)` | Inspect or remove one independent actor. |
| `crowd.removeActors(ids)` | Remove and compact many actors with one upload. |
| `crowd.actorCount`, `crowd.capacity`, `crowd.actors` | Inspect live actors and fixed storage capacity. |
| `crowd.scenegraphs`, `crowd.models`, `crowd.primitiveGroups` | Inspect the shared parsed asset and primitive draw groups. |
| `crowd.update(deltaSeconds, view?)` | Evaluate actor clips, optionally classify camera-dependent LOD, and upload once. |
| `crowd.setLODVertexBudget(vertexBudget?)`, `crowd.lodStats` | Adjust a global indexed-work budget and inspect its actual geometry and visibility diagnostics. |
| `crowd.draw(renderPass)` | Issue one instanced draw per compatible source primitive. |
| `crowd.destroy()` | Release owned actor, palette, and shared scenegraph resources. |
| `actor.selectClip()`, `actor.seek()`, `actor.setPhase()` | Select, crossfade, or reposition an independent clip. |
| `actor.play()`, `actor.pause()`, `actor.setSpeed()`, `actor.setLoop()` | Configure independent playback. |
| `actor.setTransform()`, `actor.root`, `actor.getNode()` | Set placement and inspect private source-node state. |
| `actor.update(deltaSeconds)`, `actor.destroy()` | Advance or remove one independent actor. |

## Related pages

- [GPU-animated glTF crowds](/docs/api-reference/gltf/gltf-animated-crowd)
- [glTF animation](/docs/api-reference/gltf/gltf-animation)
- [glTF overview](/docs/api-reference/gltf)
