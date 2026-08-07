import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';

# GPU-Animated glTF Crowds

<GltfDocsTabs active="animated-crowd" />

`GLTFAnimatedCrowd` renders independently animated characters using one shared GPU model and one
instanced draw per compatible source primitive. Actors retain independent animation clocks,
hierarchies, joint palettes, and placement transforms without duplicating geometry, materials, or
draw calls for every character.

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

Choose this API when many copies of one asset need independent node or skeletal animation while
retaining the same geometry, materials, and render state. Use ordinary scenegraphs when each copy
needs independently rendered morph geometry, material variants, or animated material properties.

### Choose the appropriate instancing path

| Requirement | Separate glTF scenegraphs | `EXT_mesh_gpu_instancing` | `GLTFAnimatedCrowd` |
| --- | --- | --- | --- |
| Independently posed skeletal actors | Supported, with one model and draw per actor. | Not represented by the extension. | Supported, with one draw per source primitive. |
| Distinct clips, speeds, phases, and crossfades | Supported with independent scenegraphs. | Not represented by the extension. | Supported without splitting draw groups. |
| Authored static copies in an interoperable glTF asset | Requires separate source nodes. | Source-defined instance transforms. | Runtime-created actors, not an interchange extension. |
| Actor-specific material variants or rendered morph targets | Supported with separate scenegraphs. | Source instances share render state. | Not independently rendered. |
| GPU model, geometry, and texture duplication | Repeated for each independently parsed scenegraph. | Shared within the authored instance group. | Shared across all actors in the crowd. |

`EXT_mesh_gpu_instancing` and animated crowds solve different problems: the extension preserves
authored static instance transforms, while the crowd API creates independently animated runtime
actors. Nesting one instancing system inside the other is not currently supported.

## Architecture and package ownership

```text
One postprocessed glTF asset
  ├─ shared geometry, materials, and one GPU model per visible primitive
  ├─ actor A: private nodes → AnimationMixer → joint palette → instance slot A
  ├─ actor B: private nodes → AnimationMixer → joint palette → instance slot B
  └─ actor C: private nodes → AnimationMixer → joint palette → instance slot C
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

Only active actor transforms and joint-palette slots are uploaded; unused fixed-capacity storage
is not rewritten every frame.

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

## Explore the Animation Studio

The glTF Asset Studio exposes this path through its **GPU Crowd Actors** control, supporting
1–100 actors and reporting the actual number of shared GPU draws.
Its default CC0 Robot Expressive model provides 14 named actions, including walking, running,
dancing, waving, and idling. Neighboring actors can play different actions without splitting a
shared primitive into separate draw calls.

1. Open the glTF example and keep the default **Robot Expressive** asset selected.
2. Increase **GPU Crowd Actors** from 1 to any value through 100.
3. Inspect the live crowd summary: it reports the actor count, actual shared draw count, and
   active action names.
4. Confirm that neighboring actors use different clips, phases, and playback speeds while the
   Robot Expressive draw count remains approximately 19.
5. Toggle **glTF Animation** to pause or resume playback, or toggle **Camera Animation** to stop
   the automatic orbit without changing actor state.
6. Choose another animated model, including **Simple Skin LOD**, from the model selector.

The model menu deliberately excludes static assets. Robot Expressive is an externally hosted CC0
model with 14 authored actions:

```text
Dance, Death, Idle, Jump, No, Punch, Running,
Sitting, Standing, ThumbsUp, Walking, WalkJump, Wave, Yes
```

The Studio's 100-actor limit is an intentional interactive-demo setting, not a hard limit of
`GLTFAnimatedCrowd`. Applications choose their own fixed `capacity`, subject to GPU limits and
CPU animation cost.

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

Detached glTF nodes that are not reachable from a source scene do not produce crowd draw groups.
This matters for authored `MSFT_lod` assets: lower-detail alternative nodes remain stored in the
document, but only the ordinary highest-detail scene root is drawn until actual LOD selection is
implemented.

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

## Performance characteristics

Batching removes repeated draw submission and duplicated immutable GPU resources; it does not
eliminate the cost of independently evaluating animations:

- Source parsing, material creation, and geometry allocation happen once per crowd.
- Each frame evaluates one existing animation mixer per active actor.
- Each actor's node hierarchy and skin transforms are updated on the CPU.
- Active transform columns and joint palettes are uploaded once per primitive group.
- The CPU submits one instanced draw per compatible reachable source primitive.
- Unused fixed-capacity slots are allocated but are not rewritten every frame.

Real performance therefore depends on actor count, source node count, joint count, clip
complexity, primitive count, and the number of skinned groups. Measure representative scenes on
your target devices instead of assuming that fewer draws imply proportional frame-rate gains.

Prefer `addActors()`, `removeActors()`, and one `crowd.update()` per frame. Avoid rebuilding the
crowd when clips change, issuing one `actor.update()` per character, or allocating a capacity
that greatly exceeds your actual hardware budget.

GPU-side clip sampling, distance-based animation-rate reduction, compute-driven culling, indirect
multi-draw, and automatic screen-space LOD selection are possible future improvements; none is
implemented or implied by the current API.

## Authored levels of detail

The Microsoft vendor extension `MSFT_lod` can describe multiple geometry levels on the highest
quality glTF node:

```json
{
  "mesh": 0,
  "skin": 0,
  "extensions": {
    "MSFT_lod": {
      "ids": [3, 4]
    }
  },
  "extras": {
    "MSFT_screencoverage": [0.5, 0.2, 0.01]
  }
}
```

The extension references progressively lower-detail node indices. Its optional
`MSFT_screencoverage` values are authored hints, including the highest-quality level. It is a
Microsoft vendor extension, not a Khronos-ratified core LOD standard.

The repository includes two complementary fixtures:

- `SimpleSkinLOD.gltf` is a 5.5 KB CC0 derivative of Marco Hutter's Simple Skin sample. It
  preserves one animation, a two-joint skeleton, and shared joint attributes across three mesh
  levels containing 24, 12, and 6 indices. The Animation Studio includes this animated asset in
  the model selector and under its `MSFT_lod` extension filter.
- `msft-lod.gltf` is an unmodified Apache-2.0 Babylon.js interoperability fixture. Its static
  three-level model contains 5,796, 324, and 36 indices. It is retained for reference and testing,
  and is intentionally excluded from the Studio's animation-only model menu.

**Current behavior is highest-detail fallback only.** The regular glTF scenegraph and animated
crowd render only scene-reachable mesh nodes. Authored lower-detail alternatives are preserved
but remain detached; no screen-size measurement, threshold evaluation, runtime mesh switching,
per-actor LOD bucketing, lazy loading, or progressive LOD streaming currently occurs.

`getGLTFExtensionSupport()` truthfully reports `MSFT_lod` as unsupported. Loading the example
demonstrates interoperable authored data and highest-detail compatibility, not an implemented
LOD renderer. Strict extension validation rejects assets that list the unsupported extension in
`extensionsRequired`; the crowd API does not override that policy.

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

## Inspect and troubleshoot a crowd

Inspect actual shared primitive groups instead of estimating draw counts from the actor count:

```ts
console.table(
  crowd.primitiveGroups.map(group => ({
    sourceNode: group.nodeIndex,
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
| Facial expressions differ in CPU state but not on screen. | Independent GPU morph deformation is not implemented for crowds. |
| The LOD sample never changes mesh. | `MSFT_lod` is authored fixture data; runtime screen-space LOD selection is not implemented. |

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
