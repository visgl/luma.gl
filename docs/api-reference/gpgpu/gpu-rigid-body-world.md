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
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {GPURigidBodyWorld} from '@luma.gl/gpgpu/gpu-physics';

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
| `contactSlop` | `0.002` | Allowed contact penetration in world units |
| `contactMatchDistance` | `0.05` | Distance for matching persistent contacts |
| `restitutionThreshold` | `0.5` | Closing-speed threshold for bounce |
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

Convex/triangle-mesh contacts have bounded GPU work. General moving mesh/mesh
collision is unsupported. Potential mesh/mesh interactions are rejected unless
static/static or covered by a conservative fixed-separation proof; bodies needed
by that proof cannot subsequently be moved through controls. Do not use arbitrary
collision filtering to disguise missing shape-pair support.

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
CCD, joints/drives, unrestricted moving mesh/mesh response and cross-device bitwise
reproducibility remain outside the current contract.

See the [background guide](/docs/api-guide/gpu/gpu-physics),
[Rigid Body Lab](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-rigid-body-world)
and [qualification tools](https://github.com/visgl/luma.gl/tree/master/scripts/physics)
for integration examples and measurement methodology.
