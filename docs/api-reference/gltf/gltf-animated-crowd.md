import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';

# GPU-Animated glTF Crowds

<GltfDocsTabs active="animated-crowd" />

`GLTFAnimatedCrowd` renders independently animated characters using one shared GPU model and one
instanced draw per compatible source primitive. Actors retain independent animation clocks,
hierarchies, joint palettes, and placement transforms without duplicating geometry, materials, or
draw calls for every character.

## Create and render a crowd

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';
import {Matrix4} from '@math.gl/core';

const asset = await load('/models/character.glb', GLTFLoader);
const gltf = postProcessGLTF(asset);
const crowd = createGLTFAnimatedCrowd(device, gltf, {capacity: 256});

const [walker, runner] = crowd.addActors([
  {
    id: 'walker',
    clip: 'Walking',
    phase: 0,
    transform: new Matrix4().translate([-2, 0, 0])
  },
  {
    id: 'runner',
    clip: 'Running',
    phase: 0.35,
    speed: 1.5,
    transform: new Matrix4().translate([2, 0, 0])
  }
]);

function renderFrame(
  deltaSeconds: number,
  viewProjectionMatrix: Matrix4,
  cameraPosition: [number, number, number]
): void {
  crowd.update(deltaSeconds);

  const modelMatrix = new Matrix4();
  for (const model of crowd.models) {
    model.shaderInputs.setProps({
      pbrProjection: {
        camera: cameraPosition,
        modelViewProjectionMatrix: viewProjectionMatrix,
        modelMatrix,
        normalMatrix: modelMatrix
      }
    });
  }

  const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});
  const drawCount = crowd.draw(renderPass);
  renderPass.end();
  device.submit();

  console.log({actors: crowd.actorCount, draws: drawCount});
}
```

`update()` takes a frame delta in **seconds**, not the absolute millisecond value supplied by
`requestAnimationFrame()`. `addActors()` prepares every actor first, then uploads the complete
group in one refresh; prefer it over repeatedly calling `addActor()` when building large crowds.
Provide initial placement matrices in the batched actor options to avoid a separate upload per
transform. `removeActors()` similarly compacts many actor slots with one upload.
Placement, clip-selection, and seek operations refresh their packed data immediately; use
`update()` to advance every actor's independent playback clock.

Only active actor transforms and joint-palette slots are uploaded; unused fixed-capacity storage
is not rewritten every frame.

The default capacity is 16 actors. Capacity is fixed so shared GPU allocations and binding layouts
remain stable; creating more actors than the configured capacity is rejected.

The glTF Asset Studio exposes this path through its **GPU Crowd Actors** control, supporting
1–100 actors and reporting the actual number of shared GPU draws.
Its default CC0 Robot Expressive model provides 14 named actions, including walking, running,
dancing, waving, and idling. Neighboring actors can play different actions without splitting a
shared primitive into separate draw calls.

## Independent playback

Every actor has its own lightweight node hierarchy, existing glTF animator, engine animation
mixer, and joint-palette state:

```ts
walker.selectClip('Running', {crossFadeDuration: 0.4});
runner.selectClip('Idle', {phase: 0.5});

walker.pause();
runner.setSpeed(2);
crowd.update(0.25);

walker.play();
walker.seek(1.25);
runner.setPhase(0.75);
runner.setLoop('ping-pong', 3);
runner.setTransform(new Matrix4().translate([4, 0, 0]));

console.log(walker.activeClip, runner.activeClip);
console.log(walker.time, runner.speed, runner.playing);
```

Clip times, crossfade durations, and update deltas are measured in seconds. Normalized `phase`
values select a position within the active clip. Loop modes are `once`, `repeat`, and
`ping-pong`; negative playback speeds run the selected clip backward.

`actor.root` and `actor.getNode(indexOrId)` expose private CPU-side scenegraph nodes. Those nodes
do not own duplicate `Model` objects. GPU models, source geometry, and runtime materials belong
to the single shared `crowd.scenegraphs` bundle.

## Batching model

Each compatible source mesh primitive owns one shared luma.gl `Model`. Its draw uses the number
of live crowd actors as its instance count. Different source primitives, materials, primitive
topologies, or render-state requirements remain separate draw groups.

For example, a character containing 19 source primitives requires approximately 19 instanced
draws whether the crowd contains two actors or 100. Rendering 100 independent scenegraphs
would instead require approximately 1,900 draws. This API does **not** claim that arbitrary
multi-primitive or multi-material models collapse into one universal draw call.

Animated rigid node transforms are uploaded as per-actor instance attributes. Authored source
skins additionally read a palette selected by the GPU instance index, so actors playing different
clips or phases deform differently while sharing the same vertex buffers.

The existing CPU `AnimationMixer` evaluates glTF keyframes and builds each actor's joint
matrices. Vertex shaders then apply those actor-specific matrices on the GPU. This is GPU
instanced skinning, **not** GPU sampling of baked animation clips or GPU-side interpolation.
Batching reduces GPU draw calls, but large crowds can still be limited by CPU animation work.

## Graphics backends

| Backend | Actor joint-palette storage | GPU access |
| --- | --- | --- |
| WebGPU | One packed read-only storage buffer per skinned primitive draw group. | Vertex shaders index the buffer with the instance and joint indices. |
| WebGL 2 | One nearest-sampled `rgba32float` palette texture per skinned primitive draw group. | Vertex shaders retrieve four matrix columns using `texelFetch()` and `gl_InstanceID`. |

A joint matrix occupies 64 bytes. One 43-joint palette for 100 actors therefore requires
approximately 275 KB of packed GPU data per pose update. Each skinned primitive draw group owns
its own packed palette; assets with multiple skinned primitives allocate one palette per group.

WebGPU capacity is constrained by storage-buffer and binding-size limits. WebGL 2 capacity is
constrained by vertex-stage texture support and maximum texture dimensions: a palette texture is
`4 × jointCount` texels wide and one row per actor. Float linear filtering is unnecessary because
palette data is read at exact texel coordinates.

If a backend cannot support the required storage or float-texture path, crowd rendering is not
silently replaced with one ordinary draw per actor.

## Current boundaries

- Source geometry and materials are shared; per-actor material factors, material variants,
  texture-transform pointers, camera/light pointers, and renderer state are not isolated.
- Actor morph weights can advance independently on their CPU-side nodes, but independently
  deformed morph-target vertex data is not yet evaluated or drawn per actor.
- Per-actor visibility, culling, transparency sorting, and source-authored
  `EXT_mesh_gpu_instancing` composition are not promised by this crowd API.
- Each source primitive still has its own draw, and every actor's clip evaluation and palette
  preparation currently occur on the CPU.
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
| `crowd.update(deltaSeconds)` | Evaluate actor clips and upload current transforms and palettes. |
| `crowd.draw(renderPass)` | Issue one instanced draw per compatible source primitive. |
| `crowd.destroy()` | Release owned actor, palette, and shared scenegraph resources. |
| `actor.selectClip()`, `actor.seek()`, `actor.setPhase()` | Select, crossfade, or reposition an independent clip. |
| `actor.play()`, `actor.pause()`, `actor.setSpeed()`, `actor.setLoop()` | Configure independent playback. |
| `actor.setTransform()`, `actor.root`, `actor.getNode()` | Set placement and inspect private source-node state. |
| `actor.update(deltaSeconds)`, `actor.destroy()` | Advance or remove one independent actor. |
