---
title: GPU-animated crowd usage
description: Create, render, batch, and independently animate large glTF crowds.
---

import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';
import {GltfCrowdDocsTabs} from '@site/src/components/docs/gltf-crowd-docs-tabs';

# GPU-animated crowd usage

<GltfDocsTabs active="animated-crowd" />
<GltfCrowdDocsTabs active="usage" />

## Why GPU-animated instancing matters

Ordinarily, cloning an animated character also clones its renderable models. One character with
19 mesh primitives therefore becomes 1,900 draw calls when rendered 100 times, even when every
copy uses the same geometry and materials. Sharing an ordinary scenegraph avoids those extra
draws, but also forces every copy into the same animation pose.

`GLTFAnimatedCrowd` separates **private animation state** from **shared GPU rendering**:

| Scene contents | Separate animated scenegraphs | `GLTFAnimatedCrowd` |
| --- | --- | --- |
| One character with one primitive | 1 draw per character | 1 instanced draw |
| Two Robot Expressive characters | 38 separate draws | 19 instanced draws |
| 100 Robot Expressive characters | 1,900 separate draws | 19 instanced draws |
| Actor playback | Independently controllable | Independently controllable |
| Geometry, materials, and GPU models | Repeated per character | Created once per source primitive |

Robot Expressive has 19 reachable source primitives: four skinned draw groups and 15 rigid draw
groups. The draw count remains 19 when actors walk, run, dance, or wave simultaneously. A
multi-primitive asset does **not** become one draw; batching is per compatible source primitive.

Choose this API when many copies of one asset need independent node, skeletal, or morph animation while
retaining the same geometry, materials, and render state. Use ordinary scenegraphs when each copy
needs material variants or animated material properties.

### Choose the appropriate instancing path

| Requirement | Separate glTF scenegraphs | `EXT_mesh_gpu_instancing` | `GLTFAnimatedCrowd` |
| --- | --- | --- | --- |
| Independently posed skeletal actors | Supported, with one model and draw per actor. | Not represented by the extension. | Supported, with one draw per source primitive. |
| Distinct clips, speeds, phases, and crossfades | Supported with independent scenegraphs. | Not represented by the extension. | Supported without splitting draw groups. |
| Authored static copies in an interoperable glTF asset | Requires separate source nodes. | Source-defined instance transforms. | Runtime-created actors, not an interchange extension. |
| Screen-size-dependent actor mesh detail | Application-managed per scenegraph. | Not represented by the extension. | Authored or generated mesh levels, one draw per occupied detail bucket. |
| Actor-specific material variants | Supported with separate scenegraphs. | Source instances share render state. | Not independently rendered. |
| Independently rendered morph targets | Supported with separate scenegraphs. | Source instances share render state. | Supported through packed weights or baked GPU clip sampling. |
| GPU model, geometry, and texture duplication | Repeated for each independently parsed scenegraph. | Shared within the authored instance group. | Shared across all actors in the crowd. |

`EXT_mesh_gpu_instancing` and animated crowds solve different problems: the extension preserves
authored static instance transforms, while the crowd API creates independently animated runtime
actors. Nesting one instancing system inside the other is not currently supported.

## Architecture and package ownership

```text
One postprocessed glTF asset
  ├─ shared geometry, materials, morph deltas, and one GPU model per visible primitive
  ├─ CPU mode: actor clock → AnimationMixer → joint palette + morph weights → instance slot
  └─ baked mode: actor clock → frame addresses + blend weight → vertex-shader clip sampling
                                                            │
                                                            ▼
                                  one instanced GPU draw per source primitive
```

The asset is parsed once. Each actor receives its own lightweight CPU-side node hierarchy,
existing `GLTFAnimator`, format-independent `AnimationMixer`, and source skin controller. Those
actor nodes contain no renderable `Model` objects and allocate no duplicate geometry, textures,
or materials.

`@luma.gl/gltf` owns glTF-specific crowd orchestration. Generic animation and scenegraph
primitives stay in `@luma.gl/engine`, while the portable skinning implementation stays in
`@luma.gl/shadertools`. WebGPU and WebGL use the same public crowd and actor APIs.

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

The application owns its projection, camera, lighting, render pass, and submission. Configure the
shared models' `pbrProjection` input before drawing; `crowd.draw()` does not create a camera or
submit the device for you. If your renderer already manages a pass, draw the crowd into that
existing pass instead of creating a second one.

Convert browser timestamps into frame deltas before calling `update()`:

```ts
let previousFrameTime: number | undefined;

function animate(frameTimeMilliseconds: number): void {
  const deltaSeconds =
    previousFrameTime === undefined ? 0 : (frameTimeMilliseconds - previousFrameTime) / 1000;
  previousFrameTime = frameTimeMilliseconds;

  renderFrame(deltaSeconds, viewProjectionMatrix, cameraPosition);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

`update()` takes a frame delta in **seconds**, not the absolute millisecond value supplied by
`requestAnimationFrame()`. `addActors()` prepares every actor first, then uploads the complete
group in one refresh; prefer it over repeatedly calling `addActor()` when building large crowds.
Provide initial placement matrices in the batched actor options to avoid a separate upload per
transform. `removeActors()` similarly compacts many actor slots with one upload.
Placement, clip-selection, and seek operations refresh their packed data immediately; use
`update()` to advance every actor's independent playback clock.

Only active actor transforms and compact animation addresses are uploaded in baked mode. CPU mode
uploads active joint-palette slots and morph weights instead. Unused fixed-capacity storage is not
rewritten every frame.

### Bake clips once and sample them in the vertex shader

Pass `gpuAnimation` to trade one-time construction work and a bounded frame atlas for much lower
per-frame CPU animation work:

```ts
const crowd = createGLTFAnimatedCrowd(device, gltf, {
  capacity: 256,
  gpuAnimation: {
    sampleRate: 30,
    maxFrames: 8192
  }
});

console.log(crowd.animationStats);
// {mode: 'gpu', sampleRate: 30, frameCount, clipCount, morphGroupCount}
```

The constructor evaluates every clip at the requested rate once, storing authored node matrices,
skin palettes, and morph weights in one immutable frame atlas per primitive. Every frame then
uploads only each visible actor's primary and optional crossfade frame addresses, interpolation
fractions, blend weight, and placement transform. The vertex shader interpolates sampled frames,
blends an optional second action, applies independent morph deltas, and skins the vertex.

WebGPU uses read-only storage buffers; WebGL 2 uses nearest-sampled `rgba32float` textures with
`texelFetch()`. If requested clips exceed `maxFrames`, the crowd retains the ordinary CPU playback
path instead of allocating an unbounded atlas. `gpuAnimation` is opt-in because the actor's private
CPU nodes remain at their authored bind state while baked sampling is active; inspect `actor.time`,
actions, and `crowd.animationStats`, not animated node matrices, in that mode.

The default capacity is 16 actors. Capacity is fixed so shared GPU allocations and binding layouts
remain stable; creating more actors than the configured capacity is rejected.

### Build and remove large groups efficiently

```ts
const actionNames = ['Walking', 'Running', 'Dance', 'Wave', 'Idle'];

const actors = crowd.addActors(
  Array.from({length: 100}, (_, index) => ({
    id: `character-${index}`,
    clip: actionNames[index % actionNames.length],
    phase: (index * 0.618) % 1,
    speed: 0.85 + (index % 4) * 0.1,
    loop: 'repeat' as const,
    transform: new Matrix4().translate([(index % 10) * 2, 0, Math.floor(index / 10) * 2])
  }))
);

console.log(actors.length, crowd.actorCount, crowd.capacity);

const removedCount = crowd.removeActors(['character-2', 'character-7', 'character-23']);
console.log(removedCount);
```

`addActors()` initializes all private actor states before refreshing shared GPU data once.
`removeActors()` removes the requested IDs, compacts surviving instance slots, and also refreshes
once. Repeated `addActor()`, `removeActor()`, `actor.setTransform()`, or `actor.update()` calls
refresh immediately; avoid issuing hundreds of individual mutations in a single frame.

Actor IDs are unique within a crowd. Omit `id` to let the crowd assign one automatically. A batch
that would exceed `capacity` is rejected before creating new actor state.

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

### Initial actor options

| Option | Meaning |
| --- | --- |
| `id` | Stable application-owned actor identifier; automatically generated when omitted. |
| `clip` | Name of the initial authored animation clip. |
| `time` | Initial clip-local position in seconds; takes precedence over `phase`. |
| `phase` | Normalized initial position within the selected clip. |
| `speed` | Independent playback multiplier; negative values play backward. |
| `loop` | `'once'`, `'repeat'`, or `'ping-pong'`. |
| `repetitions` | Optional repetition count for the selected loop mode. |
| `playing` | Starts paused when explicitly set to `false`. |
| `transform` | Initial actor placement matrix, combined with authored animated node transforms. |

Different clip selections and crossfades do not create additional GPU models or draw groups:

```ts
const [walkingActor, wavingActor] = crowd.addActors([
  {id: 'walking', clip: 'Walking', phase: 0, speed: 1},
  {id: 'waving', clip: 'Wave', phase: 0.35, speed: 1.2}
]);

walkingActor.selectClip('Running', {crossFadeDuration: 0.4, phase: 0.1});
wavingActor.pause();

console.log(walkingActor.activeClip, walkingActor.time, walkingActor.speed);
console.log(wavingActor.activeClip, wavingActor.playing);
```

Keep one crowd-level `update(deltaSeconds)` call in the frame loop. Calling `actor.update()` for
every actor independently causes a shared-buffer refresh for every call and defeats batched
updates.

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

### Private actor state versus shared render state

| Private to each actor | Shared across the crowd |
| --- | --- |
| Authored node transforms and local scenegraph hierarchy. | One parsed source glTF document. |
| Active clip, elapsed time, phase, speed, loop mode, and crossfade. | One GPU `Model` per reachable source primitive. |
| Existing animation mixer and source-skin controller. | Source geometry, indices, textures, materials, and shader pipelines. |
| Joint matrices and CPU-side morph-weight values. | Four instance-transform column buffers per primitive. |
| World placement and independently evaluated rigid-node motion. | One packed GPU joint palette per skinned primitive. |

Detached glTF nodes that are not reachable from a source scene do not produce crowd draw groups
by default. When `lod` is explicitly configured, authored or generated `MSFT_lod` alternatives
are mapped back to their reachable highest-detail animation node. Each occupied detail level
then receives its own compact actor transforms and independently posed joint palettes.

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

### Joint-palette memory and upload estimates

Each joint matrix contains 16 `float32` values:

```text
palette bytes per skinned primitive = actor count × joints per actor × 16 × 4
                                     = actor count × joint count × 64
```

For a 43-joint character:

| Active actors | Palette upload per skinned primitive | Four skinned primitives |
| --- | --- | --- |
| 10 | 27,520 bytes | 110,080 bytes |
| 50 | 137,600 bytes | 550,400 bytes |
| 100 | 275,200 bytes | 1,100,800 bytes |

Those values describe joint palettes only. Every primitive also receives four packed
instance-transform columns, totaling another 64 bytes per active actor. Source vertex data,
textures, and materials are not reuploaded for each actor.

On WebGPU, the palette is a read-only storage buffer indexed by
`instanceIndex * jointCount + jointIndex`. On WebGL 2, each matrix occupies four adjacent RGBA
texels in its actor's texture row. The shader uses exact integer `texelFetch()` coordinates, so
float linear filtering is not required.

## Related pages

- [GPU-animated glTF crowds](/docs/api-reference/gltf/gltf-animated-crowd)
- [glTF animation](/docs/api-reference/gltf/gltf-animation)
- [glTF overview](/docs/api-reference/gltf)
