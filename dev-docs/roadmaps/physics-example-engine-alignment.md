# Physics example engine alignment

## Goal

Physics examples should author scenes, materials and application behavior. Shared engine
rendering should own geometry preparation, GPU transform binding, PBR lighting, shadow
passes, culling and resource lifetimes. Moving shader strings into another example helper
is useful deduplication, but does not by itself close that architectural gap.

Keep simulation state on the GPU. Replacing a small pose shader with per-frame CPU pose
readback and scenegraph matrix uploads would regress the architecture and large-data goal.

## Catalog audit

The twelve Physics catalog entries currently use eight rendering paths. The cradle,
dominoes and wrecking-ball pages share the rigid-body lab; the large sphere entry imports
the sphere-world runtime. They do not need separate renderer migrations.

| Entries / source | Existing engine integration | Remaining duplication | Recommended direction |
| --- | --- | --- | --- |
| Rigid Body Lab, Dominoes, Wrecking Ball — `examples/experimental/gpu-rigid-body-world/main.ts` | Engine Model and ShaderInputs; this change uses canonical PBR materials, a typed SpotLight and ShadowMapRenderer for every general lab scene | Procedural primitive/mesh vertex generation, body-index mapping, GPU pose shader and a constraint-line shader | Add a shared engine GPU transform source and shape batching; retain application scene definitions and controls |
| Newton's Cradle — `gpu-rigid-body-world/cradle-scene.ts` | GroupNode/ModelNode, engine geometry, shared PBR materials, environment generation, spotlight and shadows; GPU pose matrices | Custom pose/tether shader, separate caster models, node traversal and reflection-probe orchestration | Use the same transform adapter, engine caster preparation and an attachment visualizer; preserve the appearance and zero-readback update |
| Sphere World, Large Sphere World — `gpu-sphere-world/main.ts` | Engine Model, GPU-resident sphere state, graph diagnostics | Sphere-impostor intersection/depth/lighting shaders and floor renderer | Provide an engine sphere-impostor model with GPU position/radius/orientation inputs; keep a benchmarked fast path rather than replacing 10,000 impostors with high-tessellation meshes |
| Pool — `gpu-pool/render.ts` | Engine Model and GPU sphere dynamics | Table drawing, sphere impostors and surface lighting; gameplay also requests state readbacks | Reuse the sphere renderer and shared materials/lighting. Keep aiming, spin selection, pockets, trails, audio and rules in the game; separate gameplay readback from rendering |
| Space Salvage — `space-salvage/renderer.ts` | Engine Model and GPU body state | Primitive geometry, normals/lighting and starfield shaders | Reuse rigid-body shape batches and material/light support. Keep mission state, targeting, towing and stylized background artwork application-owned |
| glTF Physics — `examples/gltf/physics/app.ts` | Engine glTF scenegraph/material construction, ScenegraphPhysicsMotion, shared PBR models and GPU publication | Per-node draw traversal and publication/camera uniform binding | Treat this as the integration reference; migrate traversal/binding into a shared scene draw adapter without reintroducing glTF-specific runtime rules |
| Authored Scene Stress — `examples/gltf/authored-scene-stress/app.ts` | Inherits the glTF renderer and uses ScenegraphPhysicsSession for ownership, mutation, capture and restore | Test controls and scenario orchestration; inherited rendering glue | Reuse the glTF adapter improvements. Keep ownership/capture stress behavior in the example |
| Physics Stress / Physics Batch — `physics-stress/main.ts`, `physics-batch/main.ts` | Shared physics/recovery/batch APIs and diagnostics; Canvas2D diagnostic views | Stress draws sampled states in 2D; batch draws a completed benchmark result | These are two diagnostic paths, not duplicate GPU material implementations. An optional engine-based 3D viewer must remain outside timed benchmark work and retain the inspectable 2D diagnostics |

## Changes in this PR

- The lab exposes a typed initial-scenario prop and distinct cradle/domino catalog entries.
- Generic lab scenes use `createPBRMaterial` and `createPBRModel`. Per-body roughness and
  metallic values are material data; the example no longer implements a BRDF, spotlight
  attenuation, cone falloff or tone mapping.
- A single typed spotlight supplies both the lighting module and shadow projection.
- Visible and shadow passes share geometry/pose decoding, including cooked mesh geometry.
  Shadow maps are provided by ShadowMapRenderer; no CPU body-pose bridge is added.
- Cradle already uses these PBR/light/shadow services and keeps its existing retained scene.

This does not claim to remove all example-authored GPU vertex code or scene traversal.
Those remaining responsibilities need reusable engine contracts rather than another copy
of example-specific code under a different filename.

## Recommended engine work

### 1. GPU transform source and standard scene rendering

Define a renderer-facing GPU transform source with a borrowed buffer/view, matrix format,
count, byte stride/offset and instance-to-body mapping. Use the graph physics world's
published body-node matrices. Respect producer ownership and the distinction between
body center-of-mass, node-origin and collider-local transforms.

The existing engine `publishedTransforms` module and ScenegraphPhysicsPublication already
establish part of this contract. Generalize that integration so programmatic ModelNode
scenes and imported glTF scenes use the same path. The standard PBR model supports
instance-matrix attributes, but physics publication buffers are currently allocated as
storage/copy buffers; direct vertex use needs an explicit buffer usage contract or a
shared storage-backed pose lookup. Do not silently add a CPU upload bridge.

Extend the existing ANARI `SceneRenderer` rather than creating a second retained renderer.
Its `SceneSurface.transforms` currently accepts CPU matrix arrays, and
`updateInstanceTransforms` repacks and uploads those matrices into four vertex buffers.
That is appropriate for CPU-authored placements, but it is not yet a direct consumer of
physics publication buffers. A GPU-backed surface-transform alternative would let the
same renderer own batching, materials and caster preparation for physics-driven scenes.

Gate: one programmatic scene and one imported scene render moving bodies through the
same adapter, including their shadow casters, without per-frame pose readback. Test
nonuniform visual scale, collider offsets, body-index mapping and borrowed-buffer cleanup.

### 2. Geometry/material batching and caster reuse

Batch by geometry, material and pass rather than by example. Reuse engine geometries for
analytic primitives and prepared geometry for hulls/meshes. Share vertex transformation
between the lit, depth/shadow, picking and bounds paths. A material change should not
require copying a physics example's lighting shader.

Gate: dominoes and wrecking ball preserve their compact vertex workload and real-time
margin, with sphere/box/mesh silhouettes matching visible geometry. Exercise reset and
scene changes for stale bindings and resource leaks.

### 3. Shared sphere impostors and attachment visualization

Move reusable sphere surface/depth work into an engine model that accepts GPU data views.
Make material/lighting integration explicit while retaining an inexpensive large-count
mode. Use an engine attachment visualizer for suspension lines, joint frames and limits.
These are rendering features, not new physics solver responsibilities.

Gate: sphere world and pool share the model; validate depth/occlusion, orientation markers,
spotlight/shadow behavior and 10,000-sphere throughput. Verify the constraint display follows
GPU endpoints without CPU pose reconstruction.

### 4. Migrate callers and keep benchmark boundaries explicit

Migrate the general lab/cradle first, then sphere world/pool, then salvage. Fold the glTF
publication/draw glue into the same engine contracts as those callers converge. Keep
stress and batch rendering optional and outside measured simulation intervals.

Report before/after CPU encoding, complete GPU frame time, p95 latency, draw/vertex counts,
readback volume and memory. Matching pixels alone is insufficient if an engine migration
adds synchronization or silently changes collision geometry.
