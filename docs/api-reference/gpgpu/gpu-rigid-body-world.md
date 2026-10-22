---
title: GPURigidBodyWorld
description: General-shape GPU rigid bodies, solver configuration, capacity, diagnostics and resource ownership.
---

# GPURigidBodyWorld

Experimental WebGPU rigid-body dynamics with persistent contacts, an ordered
reference solver and an opt-in parallel solver. The simulation maintains separate
position, orientation, linear-velocity and angular-velocity buffers for rendering.
Setup and geometry cooking run on the CPU; simulation does not require pose readback.

## Usage

```ts
import {GPUCommandGraph} from '@luma.gl/gpu-graph/gpu-core';
import {GPURigidBodyWorld} from '@luma.gl/gpu-graph/gpu-physics';

// device is an existing WebGPU Device.
const world = new GPURigidBodyWorld({
  bodies: [
    {shape: {type: 'box', halfExtents: [8, 8, 0.5]}, position: [0, 0, -0.5], mass: 0},
    {shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}, position: [0, 0, 2]}
  ],
  timeStep: 1 / 120,
  iterations: 32,
  solver: 'parallel'
});
const capacity = world.getCapacityInfo(); // CPU-only allocation estimate
const definition = new GPUCommandGraph(device);
world.addToGraph(definition);
const graph = await definition.compileAsync();

// Encode once for each fixed simulation step selected by the application.
const encoder = device.createCommandEncoder();
graph.encode(encoder, {parameters: undefined});
device.submit(encoder.finish());

const diagnostics = await world.readSimulationDiagnostics();
if (!diagnostics.complete) {
  // Stop accepting results; correct the budget/scene and replay from known state.
}

// Finish pending rendering/readbacks and release render bindings first.
graph.destroy();
world.destroy();
```

A world attaches to one graph. Attachment validates planned world-buffer sizes and
pair dispatch dimensions against the device limits before allocating state. A
capacity-preflight failure leaves it unattached. This is not an out-of-memory
recovery guarantee for pipeline compilation or driver allocation.

## World settings

| Property | Default | Meaning |
| --- | --- | --- |
| `bodies` | Required | Nonempty fixed body array |
| `gravity` | `[0, 0, -9.81]` | World acceleration |
| `timeStep` | `1 / 120` | Positive finite seconds per graph encoding |
| `iterations` | `16` | Integer constraint iterations, 1–64 |
| `solver` | `'ordered'` | `'ordered'` or experimental `'parallel'` |
| `broadPhase` | Automatic | All-pairs if both body and collider counts are at most 128; hierarchical grid otherwise |
| `maximumPairs` | Power of two covering `max(64, 16 * colliderCount)` | Sparse candidate and persistent pair-cache capacity |
| `maximumCandidateTestsPerCollider` | `4096` | Hierarchical traversal budget, 1–65,535 |
| `maximumMeshTraversalTestsPerPair` | `65536` | Mesh BVH node/triangle visits per collider pair per traversal, 1–1,048,576 |
| `eventCapacity` | `0` | Optional GPU contact ring capacity, 0–65,536; zero disables |
| `impactImpulseThreshold` | `1` | Sustained-contact impulse threshold for impact samples |
| `enableQueries` | `false` | Allocate parallel collider-query and reduction resources |
| `failurePolicy` | `'report'` | `'rollback'` checkpoints body/contact state and rejects incomplete steps on the GPU |
| `continuous` | Disabled | `{bodies, maximumImpacts?: 4}`; centered dynamic spheres against static spheres, boxes and planes; rollback required |
| `triggers` | Disabled | Compound spherical sensor groups with target collider selections and optional swept sphere crossings; rollback required |
| `triggerEventCapacity` | `256` | Trigger ring capacity, 1–65,536 when triggers are enabled |
| `contactSlop` | `0.002` | Allowed contact penetration in world units |
| `contactMatchDistance` | `0.05` | Distance for matching persistent contacts |
| `restitutionThreshold` | `0.5` | Closing-speed threshold for bounce |
| `linearDamping`, `angularDamping` | `0` | Nonnegative velocity decay rates in inverse seconds; dynamic bodies only, using exponential decay each fixed step |
| `sleepAfter` | `0.5` | Quiet simulation seconds before sleeping; zero disables |
| `sleepLinearSpeed` / `sleepAngularSpeed` | `0.04` / `0.04` | Quiet-motion thresholds |
| `warmStartFactor` | `1` | Retained fraction of matched cached impulses, 0–1 |
| `penetrationRecoveryFraction` | `0.15` | Penetration correction fraction per step, 0–1 |
| `maximumRecoverySpeed` | `2` | Nonnegative cap on penetration recovery velocity |
| `parallelRelaxation` | `1` | Additional parallel under-relaxation, greater than zero and at most one |

These settings are construction-time values. Rebuild the world to change them.
The all-pairs reference supports at most 128 bodies/colliders; hierarchical mode
supports at most 65,535 IDs, subject to actual buffer, binding and dispatch limits.
Those limits are capacities, not performance guarantees.

## Bodies, colliders and coordinate frames

Supply either `shape` for one centered collider or `colliders` for a compound.
An empty collider array creates a body without collision geometry. Collider
`position` and `orientation` are local to the body's node frame. Colliders on the
same body never collide. `excludedColliders` contains global flattened collider
indices, not body indices or glTF node IDs.

Body `position` is the world-space **node origin**; `centerOfMass` is a node-frame
offset. GPU positions and `readState()` contain the world-space **center of mass**.
Recover the node origin by subtracting the rotated center-of-mass offset. Do not
apply GPU positions directly as node origins for offset bodies.

`orientation` and `inertiaOrientation` are xyzw quaternions. `velocity` and
`angularVelocity` are world-space values. Mass defaults to one. Without an explicit
mode, zero mass means static; explicit `mode: 'dynamic'` with zero mass means
infinite linear mass. Kinematic bodies receive prescribed motion and affect dynamic
contacts but do not respond to impulses or sleep.

`inertiaDiagonal` specifies principal inertia; zero entries lock impulse response
on those principal axes. `inertiaOrientation` places these axes in the node frame.
Otherwise inertia is computed from solid-shape volumes, rotated tensors and
parallel-axis offsets with additive uniform density across compound colliders.
Overlapping colliders contribute overlapping volume; this is not a solid-union
mass calculation. `gravityFactor` scales dynamic gravitational acceleration only.

## Shapes and cooking

| Shape | Parameters / behavior |
| --- | --- |
| `sphere` | Positive `radius` |
| `box` | Positive `halfExtents` along local X/Y/Z |
| `plane` | Local +Y normal; optional `sizeX`, `sizeZ`; `doubleSided` selects both faces |
| `capsule`, `cylinder` | Local Y axis; `height`, `radiusBottom`, `radiusTop` support taper |
| `convex-hull` | Cooked `RigidBodyMeshGeometry` from `makeConvexHullGeometry` |
| `triangle-mesh` | Cooked `RigidBodyMeshGeometry` from `makeTriangleMeshGeometry` |

Cooking computes geometry properties and mesh acceleration data on the CPU before
graph attachment. Dynamic mesh geometry must be closed with positive volume.
Convex cooking changes a nonconvex object's collision shape: cavities disappear.
Primitive parameters do not require matching render tessellation.

Convex/mesh and mesh/mesh contacts use bounded GPU traversal of cooked triangle
hierarchies. Moving meshes retain their original triangles, including nonconvex
openings; they are not replaced with convex hulls. Both triangle sides participate.
Mesh pairs use the existing convex contact query on candidate triangle pairs and
reduce results into the bounded persistent manifold.

These are **discrete surface contacts**. Deep initial containment without intersecting
surfaces is not detected, and fast bodies may tunnel between steps. Closed positive
volume is required for dynamic mass properties, but does not turn the surface query
into a solid-volume containment query. General CCD remains separate work.

`maximumMeshTraversalTestsPerPair` bounds each of two traversal passes (count and
write), including BVH nodes and triangle visits. Exhaustion sets
`incompleteMeshQueries`; the shared 65,536-entry triangle-task queue reports overflow
as `droppedTriangleQueries`. Both make lifetime execution incomplete. Neither a
larger queue nor a larger budget repairs an already incomplete step: recreate and
replay as described below. Static/static pairs remain excluded. Direct pose edits
are no longer constrained by a fixed-separation proof; follow the normal wake and
cache-invalidation contract after editing bodies.

## Contacts, friction and solver choice

Boxes use separating-axis tests with clipped face or edge contacts. Convex shapes
use bounded support-mapping queries. Persistent manifolds match nearby aligned
contact points and retain accumulated impulses. New impacts capture restitution;
normal impulses remain nonnegative.

Each collider can specify `staticFriction`, `dynamicFriction`, `restitution`,
`frictionCombine` and `restitutionCombine`. Named policies have increasing
precedence: `average`, `minimum`, `maximum`, `multiply`. Without named policies,
legacy combination uses geometric-mean friction and minimum restitution. The glTF
adapter selects its draft-profile defaults explicitly.

Friction solves the coupled two-dimensional tangent response, including anisotropic
inertia. An impulse that cancels slip inside the static friction cone is retained;
otherwise the dynamic limit applies. There is no fixed slip-speed threshold for
choosing static friction. Ordinary contact friction does not add the sphere world's
separate rolling/spinning resistance model.

Ordered solving applies impulses sequentially on the GPU and remains the default
numerical reference. Parallel block-Jacobi solving computes pair contributions and
gathers them per body with degree-based relaxation. Bounded island propagation
coordinates sleeping and waking without joining separate stacks through a static
floor. `parallelRelaxation` can reduce updates further, at a convergence cost.
Both solver modes can use either discovery path.

More iterations cost more dispatch work even when the graph inspector shows one
semantic solver node. A large connected pile and many independent pairs are not
equivalent workloads. Warm starting and penetration bias improve convergence but
do not guarantee stability at arbitrary mass ratios or timesteps. Reducing recovery
speed can reduce corrective kicks while allowing penetration to persist longer.

## State and controls

Buffers become available after `addToGraph` and are world-owned. Each body row is
16 bytes. Bind them as storage buffers in the renderer without copying to JavaScript.

| Field | Row layout |
| --- | --- |
| `positions` | Center of mass xyz; centered sphere radius or zero in w |
| `orientations` | Quaternion xyzw |
| `velocities` | Linear velocity xyz; inverse mass in w |
| `angularVelocities` | Angular velocity xyz; reserved w |
| `sleepStates` | Internal sleep data; prefer snapshot `sleeping` for application logic |

After graph attachment:

- `applyImpulse(index, impulse, worldPoint)` applies one impulse at a required
  world-space point and wakes affected state.
- `setKinematicTarget(index, position, orientation)` supplies a world-space node
  target, reached in the next step and then held. Contact velocity derives from
  this motion. A large target jump is still subject to discrete collision limits.
- `wake()` invalidates cached contacts and wakes bodies. Call it after intentional
  direct state edits ordered between submissions.
- `await readState()` returns position, orientation, velocity, angular velocity and
  `sleeping` for each body. It is an explicit full-state readback, not part of stepping.
- `destroy()` releases world-owned resources and is idempotent. Finish outstanding
  work/readbacks and destroy the graph and render bindings first.

Control methods submit immediately. Submit previously encoded simulation commands
before calling them, or their ordering will differ from the JavaScript encode order.
There is no rigid-world teleport, live mass-edit or reset method. Recreate the world
from its original body definitions to reset a scene; camera state belongs to the app.

## Capacity and diagnostics

`getCapacityInfo()` performs CPU-only layout calculation before or after attachment.
It returns body/collider counts, pair capacity, pair workgroup count, individual
buffer byte lengths and `ownedBufferBytes`. These are logical world allocations;
they exclude graph scratch, pipelines and driver overhead, and are not measured
VRAM residency. Geometry packing is part of the calculation; cache the result for UI.

`readCollisionDiagnostics()` reports the most recent step's broad-phase, contact,
mesh-query and island failures. It is useful for investigating a particular step,
but occasional sampling can miss a brief overflow.

`readSimulationDiagnostics()` reads 64 bytes of persistent lifetime statistics:

| Fields | Interpretation |
| --- | --- |
| `steps`, `incompleteSteps` | Total encoded/executed steps and steps with any reported failure |
| `droppedPairs`, `droppedManifolds` | Cumulative discovery-output or persistent-cache losses |
| `incompleteQueries`, `invalidBounds` | Cumulative discovery traversal failures |
| `droppedTriangleQueries`, `unresolvedQueries` | Cumulative bounded mesh/convex-query failures |
| `incompleteMeshQueries` | Cumulative collider-pair mesh traversal exhaustion |
| `incompleteIslandUnions` | Cumulative island propagation exhaustion |
| `maximumCandidatePairs`, `maximumCandidateTests` | Peak per-step discovery demand/work; zero where that discovery path is absent |
| `saturated` | A lifetime counter exceeded uint32 capacity; sticky |
| `complete` | No incomplete steps and no counter saturation in this world's lifetime |

A single GPU invocation updates these statistics after each step. Sampling never
clears them. `complete` is also true before the first step, so verify `steps` when
checking execution. Complete execution means no reported work loss; it does not
certify numerical accuracy, conformance or performance.

**Incomplete work does not roll back the step.** Stop accepting results, correct
capacity, geometry or traversal settings, create a replacement world and replay from
known valid initial/checkpoint state. Increasing capacity after a bad step cannot
restore already-lost contact impulses. There is no automatic resize/retry mechanism.

## Game-facing collision APIs

Enable contact events with `eventCapacity` and queries with `enableQueries` before
attaching the world. These optional allocations appear in `getCapacityInfo()`.
The [Space Salvage example](https://github.com/visgl/luma.gl/tree/master/examples/experimental/space-salvage)
uses these public APIs for targeting, docking and impact damage.

```ts
const world = new GPURigidBodyWorld({bodies, eventCapacity: 1024, enableQueries: true});
// Attach, compile and submit simulation steps first.
const contacts = await world.readContactEvents();
const target = await world.raycast({
  origin: [0, 0, 0], direction: [1, 0, 0], maximumDistance: 20, excludeBody: 0
});
const nearby = await world.overlapSphere({
  center: [4, 0, 0], radius: 2, colliderIndices: [1, 2, 3], maximumHits: 3
});
```

`maximumHits` must not exceed the world's collider count. Omit it to retain all
overlap hits. `colliderIndices` selects explicit construction-time collider IDs;
`excludeBody` removes every collider owned by a body. Query selection is independent
of simulation pair exclusions. Queries test static, kinematic and dynamic bodies.
Sphere/box rays retain analytic tests. Other shapes use bounded distance queries:
tapered capsules/cylinders, finite/infinite planes, convex hulls and original triangle
meshes are supported. Mesh proximity uses the cooked BVH. One-sided planes reject
queries from their back side. Triangle meshes retain surface semantics: a point deep
inside a closed mesh is not an overlap unless its query sphere reaches the surface.
Convex hulls use solid containment. Cooking rejects zero-area triangles after float32
conversion instead of passing invalid faces to the collision kernels.

`raycast` normalizes the direction and retains the nearest hit within the maximum
distance; ties select the lowest collider index. Sphere/box rays starting inside
return the origin with distance zero and a zero normal. Extended-geometry queries
may return a surface point with a zero normal for initial solid overlap. `overlapSphere` returns colliders
in index order, surface points and outward normals; its `distance` is zero.
`castSphere({...ray, radius})` sweeps a translated sphere against the selected
surfaces using conservative advancement. Sweeps use a 1e-5 world-unit surface
tolerance and at most 128 advancement iterations. They do not rotate the query
shape or advance target bodies. Use an appropriate world scale.

All return `{hits, totalHits, truncated, complete}`. **Check `complete` before using
results**: false means a bounded geometry traversal or advancement did not finish;
returned hits/counts are then partial. Ray/cast `totalHits` counts intersections while
retaining only the nearest; their `truncated` is false. Overlap truncation reports
output-capacity loss separately, including a zero-hit budget.

Queries run per collider in parallel followed by deterministic reduction. Only the
requested output prefix is read back. This is still a collider scan with one pending
query per world, not a batched spatial-index query API. Concurrent requests reject
instead of building an unbounded queue. Await reads before destruction. Poses are
those ordered before query submission; queries do not advance physics.

`readContactEvents()` returns new `begin`, `impact` and `end` records since its last
successful read. Each includes sequence, simulation step, both body/collider IDs,
a representative contact point, a normal from the first collider toward the second,
and the summed nonnegative normal impulse. The representative point/normal belongs
to the strongest manifold contact. End events have zero point, normal and impulse.
Impact records are sustained-contact samples above `impactImpulseThreshold`, not
independent impact onsets; resting support impulses may exceed that threshold.
Consumers should select phases/thresholds suitable for their gameplay. Events follow
pair-slot scan order within a step; do not assume ordering by collider ID.

The ring persists across graph encodings, so a batched simulation does not hide a
brief contact. `dropped` reports unread records overwritten by newer ones. Sequence
and step counters saturate instead of wrapping; `saturated` requires recreating the
world. Concurrent reads share one snapshot and cursor. Contact events do not certify
simulation completeness: also inspect `readSimulationDiagnostics()` for lost contact
work. Direct pose edits plus `wake()` preserve event history so the following step
can report contact exits/entries.

Advanced GPU consumers may read the world-owned `contactEvents` buffer: a 16-byte
u32 header (sequence, step, saturated, reserved) followed by `eventCapacity` 64-byte
records. Each record contains four vec4 fields: u32 sequence/step/phase/reserved,
u32 body IDs/collider IDs, f32 point/normalImpulse, and f32 normal/reserved. Phase IDs
are 0 begin, 1 impact, 2 end. Record sequence N occupies slot `(N - 1) % capacity`.
The recorder is an opt-in single GPU invocation scanning the bounded pair cache;
large-scene parallel event compaction is a separate performance tranche.

## Rejected steps and recovery

With `failurePolicy: 'rollback'`, a GPU copy operation checkpoints positions,
orientations, both velocities, sleep state, kinematic targets and persistent contact
state before each step. After a finite-state check and diagnostics, one rollback graph operation restores
those buffers if any lifetime failure is recorded. Contact and trigger events from
rejected steps are not published. Diagnostics retain attempted-step/failure counts;
further queued steps remain rejected until the world is reconstructed. `invalidBodyStates` reports nonfinite simulation results. No host
readback is required for that decision. Rendering and queries ordered after the
complete graph see accepted poses. Do not interleave consumers inside a physics step.

Checkpoint memory and copies are an explicit opt-in cost reported by
`getCapacityInfo()`. This protects against reported bounded-work failures; it is not
GPU device-loss recovery or a general validator for arbitrary caller buffer writes.
Event-ring consumer overwrite remains separately reported through `dropped`.

Stop submissions and pending reads before recovery. For worlds without kinematic
bodies, `await world.getRecoveryProps({maximumPairs: largerCapacity})` returns a
construction description with accepted poses/velocities and optional larger discovery
or mesh budgets. Construct/compile a replacement world, bind its new GPU buffers,
then dispose the old graph/world. Warm starts, sleep and event cursors restart;
IDs retain construction order but the replacement is a new event epoch. Kinematic
worlds require explicit reconstruction and target-command replay. Capacity growth
is an application-controlled recovery boundary, not allocation inside a GPU step.

## Bounded continuous motion

`continuous: {bodies: [bodyIndex], maximumImpacts: 4}` adds sphere/static-surface
sweeps after the discrete solver. Selected bodies must be dynamic single spheres
centered on their COM. Static sphere, box and plane obstacles are supported; filters
and sensors are respected. Each impact reflects the closing normal velocity using
the material restitution policy, then sweeps the remaining time. This first CCD
response does not add tangential impact friction or CCD-specific contact-event
payloads. Ordinary discrete contacts still provide friction and contact events.

Initial penetrations are handled by the discrete solver: CCD skips each initially
penetrating pair for that step while still sweeping other obstacles. This does not
guarantee recovery from arbitrary deep overlap.

The GPU rejects the step if the impact or sweep budget is exhausted. Inspect
`incompleteContinuousBodies` along with `complete` in lifetime diagnostics. Dynamic
pairs, moving kinematic obstacles, rotating convex shapes and meshes still have
discrete collision behavior. This is a declared CCD envelope, not general CCD.
The Rigid Body Lab's **Fast sphere / thin walls** scenario demonstrates it.

## Persistent triggers

Mark sensor colliders with `isTrigger: true` to exclude physical response while
keeping query visibility. Configure `triggers: [{colliders: [sensorIndex], targets:
[targetIndex]}]`; `colliders` is a union of spherical sensors, and `targets` defaults
to non-sensor colliders. Each group tracks one state per target body, including
compound targets; mutual collider exclusions still apply. Source/target IDs are
fixed for the world lifetime. Sensor mass properties are not automatically removed
from compound mass calculations; use separate static/kinematic sensor bodies or
authored body mass properties when appropriate.

`readTriggerEvents()` returns `{sequence, step, dropped, saturated, events}`. Events
contain `phase: 'enter' | 'exit'`, `trigger`, `body`, `collider`, `triggerCollider` and
`swept`. Step-local sampling retains transitions across several simulation steps
between reads. Compound groups do not emit duplicate entries while one member
remains overlapping. There is no assumed ordering between different groups within
a step; transitions are emitted in configured group/body order.

`swept: true` requires sphere targets and detects complete crossings along relative
center segments, emitting enter then exit in the same step. It does not track curved
rotational trajectories or every intermediate transition through disjoint compound
members. Non-sphere targets use discrete per-step overlap. Pair state is bounded to
65,536 configured source/target pairs; geometry exhaustion increments
`incompleteTriggerQueries` and rejects the step. Publication is gated on successful
simulation. Ring overwrite and saturation are explicit; concurrent reads share a
snapshot/cursor. Resetting/reconstructing the world resets trigger state.

Space Salvage uses these step-based events for docking. General sensor shapes,
spatially batched queries, scalable event compaction and glTF behavior bindings remain
separate qualification work.

## Troubleshooting and qualification boundaries

| Symptom | Check |
| --- | --- |
| Bodies pass through each other | Exclusions, shape support, lifetime failures, timestep and speed |
| Deep stacks drift or jitter | Iterations, mass ratios, bias settings, contact scale and ordered comparison |
| A rolling sphere never stops | Ideal no-slip rolling does not dissipate motion without a resistance model |
| Rendered mesh is offset | Center-of-mass to node-origin conversion and collider-local poses |
| Many graph nodes or slow passes | Inspect GPU work and dispatches, contact density and solver iterations |
| Readback dominates frame time | Bind poses directly; sample diagnostics asynchronously |

Tests cover coupled tangent response, static friction, moving supports, eight-box
stacks, sparse discovery, capacity overflow and recovery by replay. These are bounded
fixtures with tolerances, not qualification for arbitrary scenes. General rigid-body
CCD, parallel joint solving, joint breakage, solid mesh containment and cross-device bitwise
reproducibility remain outside the current contract.

See the [background guide](/docs/api-guide/gpu/gpu-physics),
[Rigid Body Lab](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-rigid-body-world)
and [qualification tools](https://github.com/visgl/luma.gl/tree/master/scripts/physics)
for integration examples and measurement methodology.

Omit the third argument of `applyImpulse(body, impulse)` to apply at the current GPU
center of mass, avoiding torque from stale CPU position snapshots. Providing a
world-space point retains off-center impulse behavior.

## Ordered joints and mechanisms

`joints` accepts up to 64 `distance`, `fixed`, `hinge` or `slider` constraints.
This initial reference envelope requires `solver: 'ordered'`. Joint rows run in each
contact-solver iteration; there is no CPU constraint solve or extra graph pass per joint.
Joint impulses persist across steps with `warmStartFactor` retention. Passive joints join
dynamic sleep islands; motors and moving kinematic attachments keep their connected
bodies active. Parallel joint scheduling, breakage and reduced-coordinate articulations
remain outside this envelope.

```ts
const world = new GPURigidBodyWorld({
  bodies,
  solver: 'ordered',
  joints: [{
    type: 'hinge', first: 0, second: 1,
    firstFrame: {position: [0, 0, 1]},
    secondFrame: {position: [0, 0, -1]},
    limits: [-1, 1],
    motor: {velocity: 0.5, maximumForce: 10}
  }]
});
```

Anchors are body-node-local positions, including when the body has an offset COM.
Frame orientations are local quaternions; the frame Z axis is the free hinge/slider
axis. Fixed joints align both frames. Distance joints preserve the specified anchor
separation and leave rotation free. Sliders align frame orientations and allow only
translation along the first frame Z axis. Hinge angles are signed and wrapped to
[-pi, pi]; limits must lie strictly within that interval. This is not a multi-turn
angle-tracking API. Start with aligned hinge axes and compatible attachment frames.

Motor velocity is radians/second for hinges and world-units/second for sliders.
`maximumForce` is a torque cap for hinges and force cap for sliders; its accumulated
impulse is capped by force times timestep, not multiplied by iteration count. Limits
are hard constraint rows, independent of the motor cap. They can exert larger forces.
Connected-body contacts are disabled unless `collideConnected: true`; this excludes
all collider pairs between the two bodies. Queries remain independent of this filter.

The Rigid Body Lab now includes a Mechanisms collection: pendulum, contact-loaded
motorized hinge, powered slider, spring suspension and position-driven hinge. These are bounded reference demonstrations,
not qualification for arbitrary mechanisms or extreme mass ratios.

## Debug capture and replay

After stopping graph submissions and control calls, `await world.captureState()`
returns a structured-cloneable `GPURigidBodyCapture`. It includes the construction
props, every world-owned buffer (poses, caches, targets, sleep, diagnostics, rollback
checkpoints and event history), and CPU event cursors. Optional captures incur a full
GPU readback; normal simulation remains GPU-resident.

Create/attach a world with the same props, or reuse the existing idle world, then call
`world.restoreState(capture)` before replaying the same ordered control calls and
fixed simulation steps. Restore validates the complete allocation layout before
writing any buffer. It does not wake bodies, clear failures or reset event cursors.
A failure capture therefore retains its failure latch; use `getRecoveryProps` for
recovery rather than expecting replay to repair a rejected step.

Capture format version 1 is an in-memory debugging contract for the same implementation
and configuration. Use structured clone; plain JSON does not preserve its typed arrays.
It does not capture application state, command history, graph parameters, rendering
resources or arbitrary external GPU writes. Callers must record/replay those separately.
Same-device regression tests reproduce trajectories; cross-device bitwise replay and
long-term serialized asset compatibility are not promised.


### Springs, position drives and attachment commands

Distance joints accept `spring: {stiffness, damping}`. Stiffness is force per unit
extension and damping is force per relative anchor speed. The implicit soft row
settles at the gravity-loaded equilibrium; a spring does not enforce the rest length
exactly under load. Omit `spring` for a hard distance constraint.

Hinge/slider motors accept `position`, optional `velocity` feed-forward (default 0),
`stiffness` (default 30), `damping` (default 5), and `maximumForce`. Position is radians
for a hinge and world units for a slider. The implicit drive uses these spring/damper
coefficients and retains the force/torque cap across all iterations. Hinge targets use
the same wrapped coordinate as limits; multi-turn control remains unsupported.

`enabled: false` creates a dormant joint. `world.setJointEnabled(index, enabled)`
submits an ordered GPU command between steps, invalidates cached impulses and wakes
bodies. Disabling a joint restores its connected-body collision policy. Space Salvage
uses this API for its spring tow attachment. Topology, coefficients and endpoints are
construction-time properties; rebuild the world to change them.

## Scenegraph geometry and GPU pose publication

`PhysicsGeometryNode` retains CPU `Geometry` plus physics authoring metadata.
`PhysicsGeometryNodeProps` accepts normal scenegraph props, `geometry`, `body`
(mode/mass/material), and `collision` (an explicit world-space body or `false`).
`makePhysicsScenegraph(root)` returns a `PhysicsScenegraphSnapshot` containing
`bodies`, `publicationBounds`, and source-node bindings with a body index and local
visual matrix. It snapshots accumulated parent transforms without mutating the source.
Axis-aligned centered cubes become boxes; other geometry is cooked as a convex hull.
Set `geometryMode: 'triangle-mesh'` explicitly to preserve concavity and openings.
An explicit collision body overrides inference while visual bounds still come from
the original geometry. CPU POSITION data must remain available during cooking.

```ts
const snapshot = makePhysicsScenegraph(authoredRoot);
const world = new GPURigidBodyWorld({
  bodies: snapshot.bodies,
  publicationBounds: snapshot.publicationBounds
});
world.addToGraph(graph);
// After each submitted step, bind world.poseMatrices and world.poseBounds on GPU.
```

`GPURigidBodyBounds` is `[minimum, maximum]` in body-node coordinates.
`publicationBounds` enables one compute publication pass after rollback resolution.
`poseMatrices` holds one column-major `mat4x4<f32>` (64 bytes) per body: rotation plus
body-node translation, with the rotated COM offset removed. Multiply it by a source
binding's `localMatrix` for that node's geometry. `poseBounds` holds two padded
`vec4<f32>` values (32 bytes) per body containing the conservative world visual AABB.
These buffers are world-owned and null before attachment or when publication is off;
their contents are initialized by the first physics step. Rendering and shadow passes
must execute after physics publication. The cradle consumes the same GPU matrices
in its PBR rendering and shadow passes, without per-frame pose readback.

The adapter is an explicit authoring snapshot, not an automatic scene observer.
Physics owns dynamic body poses after construction. Animate kinematic bodies through
`setKinematicTarget` before each step; do not also apply animation transforms to their
published poses. Rebuild snapshots/worlds after geometry or topology changes. Build
independent worlds for independent instances; destroy each world's buffers with its
world. Automatic glTF object-model mutations, exporter integration, shared instances
and a complete animation binding layer remain follow-up work.

### Tick-ordered command journal

`GPURigidBodyCommandJournal` records `GPURigidBodyCommand` values: `impulse`,
`kinematic-target`, and `joint-enabled`. `applyRigidBodyCommand` executes one command
without recording it. The journal's `apply(tick, command)` copies and executes a
command, preserving insertion order for equal ticks and rejecting decreasing ticks.
Stop simulation/control calls while awaiting `journal.begin()`; it captures a complete
checkpoint and starts a fresh command segment. Tick numbers are zero-based relative
to that checkpoint, owned by the application.

```ts
const journal = new GPURigidBodyCommandJournal(world);
await journal.begin();
journal.apply(0, {type: 'joint-enabled', joint: 0, enabled: true});
await advanceOneStep();
const replay = journal.export(); // GPURigidBodyReplay; structured-cloneable
await replayRigidBodyCommands(world, replay, 1, advanceOneStep);
```

`replayRigidBodyCommands` restores the checkpoint and invokes the supplied async
advance function once per tick, applying commands before that tick. Pause normal
simulation during replay. The callback must use the original fixed-step configuration.
The journal retains its own checkpoint for export; begin a segment before applying commands. No CPU pose readback occurs
per command; the initial checkpoint is an explicit debugging readback. Application
state, geometry rebuilds, arbitrary buffer writes, device loss recovery and portable
cross-device serialization are outside this journal contract.
