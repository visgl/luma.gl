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
| Screen-size-dependent actor mesh detail | Application-managed per scenegraph. | Not represented by the extension. | Authored or generated mesh levels, one draw per occupied detail bucket. |
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
6. Enable **Auto LOD** to assign each actor a mesh detail level from its projected screen size.
7. Adjust **Detail Bias** and optionally set **Vertex Budget** to cap submitted indexed work;
   leave the budget at zero for ordinary screen-size selection without a global limit.
8. Inspect the authored/generated source, per-level actor counts, culled actors, submitted
   vertices and triangles, budget-driven demotions, and actual shared draws.
9. Choose **Simple Skin LOD** to inspect three authored skeletal detail levels, or keep
   **Robot Expressive** to inspect automatically generated index-only levels.

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

## Performance characteristics

Batching removes repeated draw submission and duplicated immutable GPU resources; it does not
eliminate the cost of independently evaluating animations:

- Source parsing, material creation, and geometry allocation happen once per crowd.
- Each frame evaluates one existing animation mixer per active actor.
- Each actor's node hierarchy and skin transforms are updated on the CPU.
- Active transform columns and joint palettes are uploaded once per occupied primitive/detail group.
- Without LOD, the CPU submits one instanced draw per compatible reachable source primitive.
- With LOD, each occupied source-primitive/detail bucket submits one instanced draw; empty
  buckets submit none.
- Unused fixed-capacity slots are allocated but are not rewritten every frame.

Real performance therefore depends on actor count, source node count, joint count, clip
complexity, primitive count, and the number of skinned groups. Measure representative scenes on
your target devices instead of assuming that fewer draws imply proportional frame-rate gains.

Prefer `addActors()`, `removeActors()`, and one `crowd.update()` per frame. Avoid rebuilding the
crowd when clips change, issuing one `actor.update()` per character, or allocating a capacity
that greatly exceeds your actual hardware budget.

Screen-space actor classification, compact bucket assignment, and mesh decimation currently run
on the CPU; the resulting instance transforms and skin palettes are consumed by GPU vertex
shaders. GPU-side clip sampling, distance-based animation-rate reduction, compute-driven
classification, GPU-produced indirect commands, lazy geometry upload, and progressive streaming
remain separate potential improvements.

## Screen-space levels of detail

Opt in to detail selection when creating the crowd, then provide the current camera and viewport
whenever they change:

```ts
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';

const crowd = createGLTFAnimatedCrowd(device, gltf, {
  capacity: 100,
  lod: {
    enabled: true,
    autoGenerate: true,
    ratios: [0.5, 0.25],
    preserveBoundary: false,
    screenCoverage: [0.5, 0.2, 0.01],
    hysteresis: 0.1,
    vertexBudget: 12000
  }
});

crowd.update(deltaSeconds, {
  viewMatrix,
  projectionMatrix,
  viewportWidth: canvas.width,
  viewportHeight: canvas.height
});

console.table(crowd.lodStats.levels);
console.log({
  source: crowd.lodStats.source,
  visibleActors: crowd.lodStats.visibleActors,
  culledActors: crowd.lodStats.culledActors,
  instancedDraws: crowd.lodStats.drawCount,
  submittedTriangles: crowd.lodStats.triangles,
  submittedVertices: crowd.lodStats.vertices,
  vertexBudget: crowd.lodStats.vertexBudget,
  demotedActors: crowd.lodStats.demotedActors,
  budgetSatisfied: crowd.lodStats.budgetSatisfied
});
```

If the asset already contains authored `MSFT_lod` nodes, those levels take precedence and
`lodStats.source` is `'authored'`. Otherwise `autoGenerate: true` attempts to create lower-detail
index buffers and reports `'generated'` when simplification succeeds. Assets that cannot be
simplified retain their original geometry and report `'none'`.

| Option or control | Meaning |
| --- | --- |
| `lod.enabled` | Enables per-actor screen-size classification. Defaults to `false`. |
| `lod.autoGenerate` | Derives index-only alternatives when no authored node levels are present. |
| `lod.ratios` | Descending target index-count ratios, such as `[0.5, 0.25]`. |
| `lod.preserveBoundary` | Keeps open mesh-chart boundaries fixed when `true`; generated LOD defaults to `false`. |
| `lod.screenCoverage` | Optional descending thresholds overriding authored screen-coverage hints. |
| `lod.hysteresis` | Relative transition dead band; defaults to `0.1`. |
| `lod.vertexBudget` | Optional maximum submitted index references across all visible actors; zero or omission means unlimited. |
| `crowd.update(deltaSeconds, view)` | Advances animation and applies the current camera in one shared-buffer refresh. |
| `crowd.setLODView(view)` | Updates camera selection immediately when animation is paused or state changes independently. |
| `crowd.setLODEnabled(enabled)` | Toggles prepared levels without recreating actors or changing clips. |
| `crowd.setLODBias(bias)` | Positive detail multiplier; larger values retain higher-detail meshes longer. |
| `crowd.setLODVertexBudget(vertexBudget?)` | Applies or clears the global indexed-vertex limit and refreshes existing actor buckets immediately. |
| `crowd.lodStats` | Source kind, visibility, draw/triangle/index counts, level histogram, and budget diagnostics. |

Actor coverage is estimated from the model's bounding sphere, actor placement and maximum axis
scale, camera-space distance, projection scale, and viewport shape. Offscreen actors, actors
behind the camera, and actors smaller than the lowest coverage threshold are excluded. Hysteresis
prevents minor camera movement from repeatedly switching actors across a threshold.

For example, a one-primitive asset with three mesh levels and actors in every bucket submits
three instanced draws rather than one; 100 actors still do not create 100 draw calls:

```text
near actors   → LOD 0 → original indices      → one shared instanced draw
middle actors → LOD 1 → fewer indices         → one shared instanced draw
far actors    → LOD 2 → fewest indices        → one shared instanced draw
tiny actors   → culled                        → no draw
```

Each bucket preserves the selected actor's original animation hierarchy, clip, phase, world
placement, and skin pose. Actor identities do not change when the camera moves between buckets.

### Keep visible geometry within a global vertex budget

Screen coverage selects the appropriate detail for each individual actor, but many individually
reasonable actors can still exceed a frame's aggregate geometry budget. Set `lod.vertexBudget`
to redistribute detail across the entire crowd while preserving every visible character:

```ts
const crowd = createGLTFAnimatedCrowd(device, gltf, {
  capacity: 100,
  lod: {
    enabled: true,
    autoGenerate: true,
    ratios: [0.5, 0.25],
    vertexBudget: 12000
  }
});

crowd.addActors(actorOptions);
crowd.update(deltaSeconds, {
  viewMatrix,
  projectionMatrix,
  viewportWidth: canvas.width,
  viewportHeight: canvas.height
});

const {vertices, vertexBudget, demotedActors, budgetSatisfied, visibleActors} = crowd.lodStats;
console.log({vertices, vertexBudget, demotedActors, budgetSatisfied, visibleActors});

crowd.setLODVertexBudget(6000); // Reclassify and upload once immediately.
crowd.setLODVertexBudget(0); // Disable the limit without removing actors or LOD levels.
```

Here **vertices means submitted index references**, not distinct positions in the source mesh:

```text
submitted vertices = sum over visible actors and their selected source primitives
                     of that primitive's index count at the chosen detail level
```

A triangle-list primitive with 600 indices contributes 600 submitted vertices, or 200 submitted
triangles, for **each actor** using that level. Repeated references are counted intentionally:
the limit estimates indexed draw work across instances rather than immutable vertex-buffer size.
It is not a promise about exact GPU vertex-shader invocation counts, which also depend on
hardware post-transform caching, nor is it a memory-allocation budget.

The selection policy is deterministic:

1. Classify and cull actors using their ordinary projected screen coverage and hysteresis.
2. Add the selected index counts for every source primitive belonging to every visible actor.
3. If the total exceeds the configured limit, demote the actor with the smallest projected
   coverage first, changing all of that character's compatible source primitives together.
4. Continue toward lower prepared levels, resolving equal coverage in stable actor insertion
   order, until the budget is satisfied or every eligible actor is already at minimum detail.

This policy protects nearer, larger characters before reducing distant ones. A 19-primitive
character is charged for all 19 source primitives, not treated as one mesh. Independent clips,
joint palettes, placement, and actor identities remain intact; budget-only demotions do not
overwrite the screen-size hysteresis state used when the limit is relaxed.

An impossibly small budget **never hides actors to manufacture success**. Existing frustum and
minimum-screen-size culling still apply, but actors that remain visible stay visible at their
lowest available detail. In that case `lodStats.vertices` can exceed `lodStats.vertexBudget`,
and `lodStats.budgetSatisfied` is `false`. Increase the limit, supply more effective lower-detail
levels, or reduce the number of visible actors yourself.

The limit is opt-in and applies only while crowd LOD is enabled. An omitted, `undefined`, or
zero budget is unlimited; `lodStats.vertexBudget` is then absent and normal screen-coverage
selection is unchanged. `lodStats.demotedActors` counts actors reduced below their preferred
screen-space level, not the number of primitive groups or individual level transitions.

Budgeting remains CPU-side and does not require GPU readback. Per-level primitive costs are
prepared once for the crowd, visible actors are sorted by projected coverage, and selected
levels reuse the existing single packed-buffer upload. For `A` visible actors, `P` source
primitive groups, and `L` detail levels, preparation costs `O(P × L)` once, followed by
approximately `O(A × log(A) + A × L)` when a refresh needs budget-driven demotion. Independent
CPU animation and skin-palette preparation can still dominate large crowds.

### Automatic index-only mesh decimation

Automatic levels use the reusable `simplifyMesh()` function from `@luma.gl/engine`. The
dependency-free simplifier performs deterministic, quadric-error edge collapses while retaining
existing vertex endpoints. It protects triangle orientation and categorical joint assignments,
and considers available normal, texture-coordinate, and skin-weight data. The standalone helper
preserves open mesh boundaries by default:

```ts
import {simplifyMesh} from '@luma.gl/engine';

const result = simplifyMesh({
  positions: sourcePositions,
  indices: sourceIndices,
  targetRatio: 0.5,
  attributes: [{values: sourceTextureCoordinates, size: 2}],
  preserveBoundary: true
});

console.log(result.indices.length, result.geometricError);
```

The resulting index array keeps the source `Uint8Array`, `Uint16Array`, or `Uint32Array` type
and references the original vertices. Position, normal, UV, joint, weight, material, and morph
accessors remain unchanged. Conservative boundary or skinning constraints can prevent reaching
an exact requested ratio; no invalid geometry is synthesized merely to satisfy a target.

Automatic crowd generation defaults to `preserveBoundary: false` because production character
meshes often split hard normals and UV charts into independent boundaries; preserving all of
those chart edges can prevent meaningful decimation. Enable `lod.preserveBoundary` when open
silhouette or chart-boundary fidelity is more important than reaching lower triangle counts.
Joint-domain protection, unchanged source attributes, and triangle-orientation checks remain
active in either mode.

For explicit document preparation, use `generateGLTFLODLevels()`:

```ts
import {generateGLTFLODLevels, getGLTFNodeLODs} from '@luma.gl/gltf';

const prepared = generateGLTFLODLevels(gltf, {
  ratios: [0.5, 0.25],
  screenCoverage: [0.5, 0.2, 0.01],
  preserveBoundary: false
});

const levels = getGLTFNodeLODs(prepared, 0);
console.table(
  levels?.map(level => ({
    level: level.level,
    nodeIndex: level.nodeIndex,
    screenCoverage: level.screenCoverage,
    indices: level.node.mesh?.primitives[0]?.indices?.count
  }))
);
```

The source document is not mutated. Lower-detail nodes remain detached alternatives and reuse
the original postprocessed vertex accessors, materials, skin references, and animation tracks.
Prepared render levels still own their normal GPU models and instance resources; index-only
source sharing does not imply lazy GPU upload or zero additional GPU memory.

### Authored `MSFT_lod` assets

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

The ordinary scenegraph and crowds without `lod` configured retain highest-detail fallback. An
opted-in crowd resolves authored alternatives with `getGLTFNodeLODs()`, selects each actor's
level from projected coverage, and submits one draw per occupied source-primitive/detail bucket.
Detached lower-detail meshes reuse the highest-detail node's animation and skin binding rather
than incorrectly evaluating their own detached hierarchy.

`getGLTFExtensionSupport()` reports `MSFT_lod` as `parsed-and-wired`, so strict extension
validation accepts supported node-level LOD assets. Material-level LOD, GPU-compute
classification, indirect drawing, progressive transfer, and lazy resource creation are not
implemented.

## Current boundaries

- Source geometry and materials are shared; per-actor material factors, material variants,
  texture-transform pointers, camera/light pointers, and renderer state are not isolated.
- Actor morph weights can advance independently on their CPU-side nodes, but independently
  deformed morph-target vertex data is not yet evaluated or drawn per actor.
- Per-actor transparency sorting, source-authored `EXT_mesh_gpu_instancing` composition,
  GPU-driven indirect LOD draws, and material-level LOD are not supported.
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
| Facial expressions differ in CPU state but not on screen. | Independent GPU morph deformation is not implemented for crowds. |
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
