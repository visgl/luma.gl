---
title: GPU physics
description: Choose a WebGPU physics world and integrate its simulation, rendering and diagnostics.
---

import {GPUPhysicsExample} from '@site/src/components/docs/gpu-physics-example';

# GPU physics

<GPUPhysicsExample />

Newton's cradle runs the rigid-body solver on the GPU and renders its position and orientation
buffers directly. Use Reset to release the raised ball again, Pause to inspect a moment, or drag
to orbit. Open **GPU Graph** and **GPU Graph Timeline** (the GPU Trace view) in the lab to inspect simulation work.
The cradle uses a fixed 1/480-second timestep; its discrete solver approximates contact and
constraint response rather than guaranteeing lossless, indefinitely periodic motion.

See [command graph debugging](/docs/api-reference/experimental/gpu-core/debugging) for how to
interpret the panels.


`@luma.gl/graph/gpu-physics` provides experimental WebGPU simulation. Import this
subpath explicitly; the physics API is not exported from the package root. It
requires a WebGPU device and has no WebGL or CPU simulation fallback.

| World | Use it for | Important boundary |
| --- | --- | --- |
| [GPUSphereWorld](./gpu-sphere-world.md) | Large sphere fields, rolling balls, pool and small continuous sphere scenes | Dynamic shapes are spheres; continuous mode and events are bounded to small worlds |
| [GPURigidBodyWorld](./gpu-rigid-body-world.md) | Oriented shapes, compounds, mass properties and glTF physics workloads | Discrete contacts with opt-in sphere/static and bounded moving-convex CCD envelopes; parallel solving remains experimental |

These are separate implementations with different controls, storage ownership and
failure counters. A feature on one world does not imply support on the other.
Neither establishes complete glTF proposal coverage or state-of-the-art performance.
The [background guide](/docs/api-guide/gpu/gpu-physics) explains the algorithms and
GPU tradeoffs; the references below describe the actual contracts.

## Feature cards

**Available** means an implemented API within the limits shown, not full performance
qualification. **Experimental** marks an opt-in path needing broader numerical or
scale evidence. **Partial** means important cases remain unsupported. **Planned**
means no general rigid-body implementation is offered yet. All physics remains
experimental as a module.

| Feature | Status | What you can use today | Remaining boundary |
| --- | --- | --- | --- |
| GPU simulation and rendering | Available | Fixed-step command graphs; position/orientation buffers consumed directly by renderers | Applications own scheduling, catch-up and submission limits; glTF publication is separate |
| Large sphere worlds | Available | GPU grid discovery, angular dynamics, friction, rolling resistance and sleep/wake | Body count alone is not a frame-rate guarantee; dense contacts can exhaust budgets |
| General rigid bodies | Available | Oriented boxes, spheres, tapered primitives, convex hulls, planes and compounds; mass, COM and inertia | Pairwise geometry and numerical qualification remain incomplete |
| Triangle-mesh contacts | Partial | Convex/mesh and bounded moving mesh/mesh surface contacts; original nonconvex openings preserved | Deep solid containment, degenerate geometry and high-speed traversal are not generally covered |
| Scalable rigid-body discovery | Available | Hierarchical discovery and sparse contact storage; all-pairs reference for small scenes | Dense scenes and mixed-size extremes still require capacity and performance qualification |
| Parallel rigid-body solving | Experimental | Opt-in parallel contact response, GPU contact compaction/indirect work, persistent manifolds, coupled friction and island sleep/wake | Ordered solving remains the default; deep stacks and extreme mass ratios need broader evidence |
| Continuous collision detection | Partial | Bounded small-world continuous mode in `GPUSphereWorld` | Rigid worlds offer sphere/static-surface CCD and opt-in moving-convex CCD with swept queues, angular bounds, friction and rollback; jointed/nonconvex continuous coverage remains open |
| Collision events | Available | Opt-in rigid-body begin/end and thresholded impact samples with IDs, step ordering and explicit loss reporting | Event recording scans the bounded pair cache; large-world compaction and recoverable consumer overflow remain work |
| Scene queries | Partial | Parallel collider rays, sphere overlap and bounded sphere casts across analytic shapes and cooked mesh geometry | One pending query per world; bounded casts report incomplete results; spatial batching and general shape casts remain planned |
| Trigger volumes | Partial | Step-local compound sensors, per-collider glTF events, bounded general geometry and swept sphere crossings | Curved trajectories, general swept sensor geometry and large-world event throughput remain work |
| Joints and articulations | Partial | Bounded ordered distance/fixed/hinge/slider constraints, frames, limits, warm starts, springs, position/velocity drives and island sleeping | Parallel scheduling, breakage and articulations remain planned |
| glTF physics | Partial | Pinned draft import, shape/body/material/filter semantics and explicit capability reports | General attachment constraints, nested triggers, behavior operations and resolved motion/material/joint property bindings are implemented; scale/deformation rebuilds and full-profile qualification remain work |
| GPU scenegraph pose publication | Partial | Reusable geometry snapshots and GPU body-node matrices/visual AABBs; cradle PBR and shadows consume published matrices | The glTF gallery consumes GPU matrices directly and binds rigid animation targets; deformation, live scene edits and export/reimport remain work |
| Capacity and diagnostics | Available | Allocation preflight, bounded queues, lifetime diagnostics and GPU rollback; opt-in bounded automatic growth/replay for sparse pair, traversal and swept-candidate budgets | Recovery synchronizes each tick and replays from initial state; fixed mesh-task/CCD impact failures, event continuity and GPU-only adaptive growth remain work |
| Qualification and tooling | Partial | Independent analytic shape/motion references, command replay, whole-step measurements and Physics Stress Lab with JSON exports | Named-case evidence only; difficult-contact, multi-device and full-profile qualification remain work |

See the [remaining tranches](https://github.com/visgl/luma.gl/blob/master/dev-docs/roadmaps/gpu-physics-roadmap.md#remaining-tranches-after-space-salvage)
for completion gates. The detailed [sphere](./gpu-sphere-world.md) and
[rigid-body](./gpu-rigid-body-world.md) references define the API contracts.

## Integration contract

1. Create the world and add it to a `GPUCommandGraph` on your WebGPU device.
2. Compile the graph once, then encode it once for every fixed simulation step.
3. Submit encoded work before issuing immediate body-control commands.
4. Bind the state buffers directly to rendering where possible. Snapshot readback
   is optional and should not become a per-frame pose bridge.
5. Sample failure diagnostics. Incomplete collision work invalidates that run even
   when it produces a plausible image.
6. Stop scheduling, finish pending GPU work/readbacks, destroy render bindings and
   the compiled graph, then destroy the world and any caller-owned state.

The application owns wall time, catch-up limits and queue depth. `timeStep` is
simulation time per encoding, not the elapsed duration of a render frame. More
iterations improve a step's constraint solve; more substeps also refresh geometry
and integrate motion. Neither provides a general CCD guarantee.

Use consistent units. Metres, kilograms and seconds are a useful convention;
angular velocities use radians per second and rotations use quaternions in xyzw
order. Changing world scale also changes meaningful slop, sleep and speed thresholds.

## Ownership and mutation

`GPUSphereWorld` borrows required position/velocity buffers and can borrow optional
state. `GPURigidBodyWorld` allocates all its state. Exposing a buffer for rendering
does not transfer ownership to the renderer. Graph scratch belongs to the compiled
graph. A world can be attached to one graph.

Use each world's control methods instead of writing buffers when possible. Direct
writes must be ordered between submissions and invalidate the relevant contact and
sleep state. The sphere world has `clearContactCache()`; the rigid world has `wake()`.
Do not modify geometry, mass or capacity by changing the constructor input after
attachment; construct a replacement world.

## Examples and qualification

The Sphere World, Pool, Rigid Body Lab and Space Salvage examples use procedural scenes.
Space Salvage exercises public collision events and queries for towing, docking and
impact feedback. The glTF
Physics example tests authored semantics through the separate `@luma.gl/gltf/physics`
adapter. Its supported draft profile and render integration limitations are documented
in the [adapter reference](https://github.com/visgl/luma.gl/blob/master/modules/gltf/src/physics/README.md).

[Qualification tooling](https://github.com/visgl/luma.gl/blob/master/scripts/physics/README.md)
separates schema/import evidence, numerical behavior, capacity and performance.
A successful import, finite poses or zero overflow alone is not proof of accuracy.

See the [collision coverage contract](./gpu-physics-collision-coverage.md) for pairwise
response fixtures and the distinction between coverage and numerical qualification.

## Capacity recovery and numerical qualification

`GPURigidBodyRecoveryRunner` is an opt-in asynchronous owner of a world and its graph.
It checks completion after each fixed tick. Recoverable sparse-pair or traversal
exhaustion grows the relevant budget, reconstructs a world and replays the accepted
command history plus the pending tick from the authored initial state. This avoids
copying incompatible contact caches and preserves kinematic targets and joint toggles.
A replacement becomes visible only after the complete replay succeeds.

```typescript
const runner = await GPURigidBodyRecoveryRunner.create(device, {
  bodies,
  broadPhase: 'hierarchical-grid',
  maximumPairs: 16
}, {maximumRetries: 8, maximumReplayTicks: 4096});
const result = await runner.advance([
  {type: 'impulse', body: 0, impulse: [1, 0, 0]}
]);
if (!result.accepted) {
  // Stop and inspect result.diagnostics; this runner will reject subsequent advances.
}
// Rebind render buffers from runner.world after advance: recovery replaces the world.
runner.destroy();
```

All external mutations must use `advance(commands)`. Do not encode `runner.graph` or
mutate `runner.world` independently; those accessors support inspection and rendering.
Calls must be serialized. `maximumReplayTicks` bounds retained command history and is
also the maximum accepted run length; reaching it requires creating a new runner.
`maximumOwnedBufferBytes` defaults to 256 MiB **per world**. Recovery temporarily keeps
both old and candidate worlds, and graph scratch/pipelines/driver memory are additional.
An allocation or compilation failure throws and blocks the runner; exhaustion without
a viable growth plan returns `accepted: false`. Destroy it after inspection.

Ticks with commands save pre-command state into a reusable GPU checkpoint for atomic
rejection. These copies stay on the GPU; there is no full-state readback on commanded
ticks. Checkpoint allocations count against the per-world memory budget. The runner reads compact diagnostics each tick and replays from initial conditions,
not from a portable checkpoint. It is intended for bounded sessions, tools and
qualification, not a zero-readback high-throughput simulation loop. Event rings retain
their existing explicit overflow semantics; this runner does not guarantee delivery
of every event across world replacement. Consumer event cursors must not be carried
across replacements. Numerical/geometry failures and CCD impact-budget exhaustion
are rejected instead of being disguised as capacity problems.

The **Physics Stress Lab** exposes recovery counters, buffer capacities, completion
p50/p95 and JSON reports. Independent GPU qualification tests cover rotated-box slab
intersections, sphere ray intersections across scales, convex/capsule/cylinder/triangle
surfaces, elastic momentum/energy,
ballistic timestep convergence and analytic sphere/static-wall rebound positions.
These qualify named cases; general mesh containment, rotational CCD, deep stacks and
cross-device performance still require separate evidence.


### Awake solver work

With `solver: 'parallel'` and contact compaction enabled, island construction retains
all contact edges so wake propagation remains correct. After waking connected bodies,
the engine compacts awake bodies and contacts into separate GPU queues. Iterative pair
solving and body gathering use indirect dispatches over those queues. Sleeping islands
retain their manifolds without participating in iterative work.

`readSolverWork()` reports contact-cache occupancy (`activeContacts`) separately from
`awakeContacts` and `awakeBodies`, with the actual pair/body workgroup counts. Reading
these diagnostics is optional; queue construction and dispatch require no CPU readback.
`compactContacts: false` retains the scan path for numerical and performance comparisons.

`createGPUCheckpoint()` returns a reusable, same-world checkpoint with `save()`,
`restore()` and `destroy()`. It copies buffers on the GPU and retains CPU-side event
cursors and mutable joint settings. It is not a portable capture; use `captureState()`
for downloadable debug artifacts. Checkpoints are also destroyed with their world.
