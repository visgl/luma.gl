---
title: GPU physics
description: How rigid-body physics works, how luma.gl maps it to WebGPU, and the tradeoffs of GPU-resident simulation.
---

# GPU physics

A physics engine advances a model of a world through time. For rigid bodies, that means
predicting motion under forces and finding impulses that prevent objects from passing
through each other while allowing bouncing, sliding, rolling and constrained movement.
The difficult part is making those interactions stable and fast when many bodies touch.

luma.gl's experimental `@luma.gl/graph/gpu-physics` module approaches physics as a GPU
computation pipeline. It reuses sorting, scanning and command-graph infrastructure,
keeps simulation state in buffers, and makes that state available to rendering. The
long-term goal is a state-of-the-art GPU rigid-body library. Complete, performant support
for a pinned glTF physics proposal profile is the first qualification milestone, not a
claim about current coverage.

This page explains the architecture rather than prescribing an application API. See the
[API reference](/docs/api-reference/gpgpu/gpu-physics)
for API details and limitations, and the
[roadmap](https://github.com/visgl/luma.gl/blob/master/dev-docs/roadmaps/gpu-physics-roadmap.md)
for implementation status and qualification gates.

## Bodies, shapes and rendered objects

A **body** stores position, orientation, linear and angular velocity, mass, center of
mass and inertia. Inertia describes resistance to rotation; for general bodies it is a
tensor, so the response depends on the axis and orientation. An impulse away from the
center of mass changes both linear and angular motion.

A **collider** attaches a collision shape to a body, possibly at an offset. Several
colliders can form one compound body. A sphere or capsule can be described analytically
with a few parameters; it does not need a triangle mesh for collision. Convex hulls and
nonconvex triangle meshes represent more general geometry at greater computational cost.

The **render mesh** is a separate representation. Its materials, textures and tessellation
do not determine the collision shape. A visually detailed object can have a simple
collider, but that approximation must be intentional: replacing a hollow object with its
convex hull closes its holes and changes its behavior.

| Body mode | Who determines motion? | Typical use |
| --- | --- | --- |
| Static | Application places it; dynamics does not move it | Floors and walls |
| Kinematic | Application supplies motion; contacts affect dynamic bodies | Moving platforms |
| Dynamic | Forces, impulses and constraints determine motion | Falling and colliding objects |

A trigger detects overlap without generating a contact response. Collision filters decide
which pairs are eligible for interaction. Consequently, two visible objects passing
through each other can be correct when their filters exclude collision; the same symptom
can also indicate unsupported geometry, exhausted capacity or missed fast motion.

## What happens during a simulation step?

The exact ordering varies between solvers, but a typical velocity-based rigid-body step
contains these stages:

| Stage | Purpose | Main challenge |
| --- | --- | --- |
| Apply inputs and forces | Update velocities from gravity, forces and user commands | Consistent units, mass and time |
| Broad phase | Find pairs whose bounding volumes could overlap | Avoid testing every possible pair |
| Narrow phase | Compute actual contacts for candidate shape pairs | Robust geometry and contact normals |
| Build constraints | Turn contacts and joints into equations for allowable motion | Persistent contact identities and coupled bodies |
| Solve | Iteratively compute normal, friction and joint impulses | Convergence without adding energy |
| Integrate and stabilize | Advance positions and orientations; control accumulated error | Penetration and joint drift |
| Publish and maintain | Expose poses/events, update caches and sleep state | Correct ownership and synchronization |

An all-pairs broad phase tests roughly `bodyCount² / 2` pairs. Spatial grids and bounding
volume hierarchies eliminate distant candidates before expensive shape tests. They do
not eliminate the cost of a genuinely dense pile: many nearby objects still require work.

The narrow phase may use analytic sphere tests, the separating axis theorem for boxes,
or support-mapping algorithms such as GJK and EPA for convex shapes. Triangle meshes
need acceleration structures to avoid testing every triangle. Generating one overlap
result is not enough for stable stacking: a **contact manifold** retains a small set of
contact points that represent the supporting surface.

The solver applies impulses to prevent inward motion at contacts. Restitution models
bounce; friction limits tangential impulses according to the normal response. Rolling
and spinning resistance are additional material choices. Ordinary contact friction alone
does not guarantee that an ideally rolling sphere will eventually stop.

Iterative solvers make repeated passes because changing one body's velocity affects its
other contacts. **Warm starting** reuses previous contact impulses to accelerate
convergence. Persistent identities matter: reusing an impulse for a different geometric
feature can produce a false kick.

These concepts also appear in CPU engines; the
[Box2D simulation guide](https://box2d.org/documentation/md_simulation.html) provides
background on bodies, contacts, joints, substeps and sleeping. Its implementation is 2D;
it is a conceptual reference rather than the specification for luma.gl's 3D solver.

## Time, fast motion and sleeping

Physics should advance in fixed simulation steps, independently of render frame duration.
An application accumulates elapsed time, schedules a bounded number of fixed steps, and
may interpolate published poses for rendering. It must choose an explicit overload policy
rather than submit an ever-growing backlog of simulation work.

Substeps divide a time interval into smaller intervals. Solver iterations refine the
constraints within a step. Increasing one does not have the same effect as increasing
the other, and both affect cost.

Discrete collision detection examines sampled configurations. A fast ball can cross a
thin wall between samples without overlapping it at either end. **Continuous collision
detection (CCD)** considers swept motion and, depending on the method, finds impact times
or constructs predictive contacts. Robust CCD must also handle rotation, repeated impacts
and bounded work. Smaller steps reduce risk but do not constitute a general CCD guarantee.
The bounded continuous sphere path does not establish general rigid-body CCD coverage.

Sleeping skips work for bodies that have settled. Bodies connected through contacts or
joints form **islands** that often need to sleep and wake together. A shared static floor
must not connect every resting object into one dynamic island. Sleeping is an optimization;
it must not change the response when a moving support or new impact should wake a body.

## The luma.gl approach

There are currently two related paths, with different maturity and scope:

- `GPUSphereWorld` specializes discovery and response for spheres. It uses a hashed grid,
  sort/scan operations and bounded contact storage, with out-of-place iterative solving.
  Its state buffers can feed rendering directly.
- `GPURigidBodyWorld` handles more general shapes and mass properties. Its ordered GPU
  solver remains the default reference path. It includes hierarchical
  discovery, sparse persistent contacts and an opt-in parallel solver; these foundations
  do not yet establish fully qualified large-world general rigid-body simulation.

Independent state streams, such as positions, orientations and velocities, use separate
buffers: a **structure-of-arrays** layout. Passes can bind the state they need, and renderers
can consume poses without reconstructing CPU objects. Contact and solver records can use
packed layouts where measurements justify them; one layout is not optimal for every pass.

The GPU command graph expresses dependencies and resource lifetimes. Sorting, scanning,
contact generation and solving become reusable operations. A logical solve operation can
encode multiple dispatches: fewer inspector nodes need not mean fewer GPU kernels or less
work. The timeline must still expose the actual cost.

The general-body path uses a size-aware hierarchical grid to avoid forcing
small shapes and very large colliders into one cell scale. Sparse contact caches replace
storage proportional to all possible body pairs. Small all-pairs configurations remain
valuable correctness references even though they are unsuitable production defaults for
large worlds.

### Parallel solving requires an explicit conflict strategy

Two contacts can update the same body. Letting independent shader invocations write its
velocity concurrently creates races. An ordered solver avoids those races but exposes
little parallelism, even if it runs entirely on the GPU.

The experimental parallel path computes per-contact changes and then gathers them per
body. Each stage has a clear owner for every output. This Jacobi-style approach exposes
parallel work but needs relaxation and convergence checks, particularly for deep stacks
and large mass ratios. A different option is to color constraints into groups that do
not share writable bodies, then process those groups in sequence. Coloring costs work
and introduces scheduling choices; it is not automatically faster.

Our acceptance criteria must compare residual error, penetration, energy behavior and
runtime together. Making a solver faster by reducing iterations while allowing much
larger errors is a different quality setting, not an equivalent performance improvement.

## What “fully GPU based” means

The target is GPU-resident simulation: broad phase, contact generation, solving,
integration and pose publication do not require per-step CPU results. It does not require
moving every setup task to a shader.

| CPU responsibilities | GPU responsibilities |
| --- | --- |
| Parse assets and validate supported semantics | Maintain evolving body state |
| Cook hulls, mass properties and mesh acceleration data | Discover candidate pairs and generate contacts |
| Allocate resources and compile pipelines/graphs | Solve contacts and constraints |
| Submit input commands and schedule fixed steps | Integrate poses and produce compact events |
| Consume requested diagnostics or gameplay events asynchronously | Publish state for GPU rendering |

This is the intended boundary. In particular, the glTF example's CPU pose bridge is a
remaining integration limitation; a GPU solver alone does not make that whole application
GPU-resident.

Readback has two costs: copying data and waiting for the producer. Even a small readback
can stall progress if the next simulation step depends on it. Diagnostics should normally
be asynchronous and optional. Gameplay events need explicit tick identities and latency
semantics; JavaScript cannot synchronously consume a GPU result that has not completed.

### Capacity and failure are part of correctness

GPU queues, pair lists, manifolds and event buffers have finite capacities. Every bounded
operation needs an observable overflow or incomplete-work result. A frame that silently
drops contacts can look plausible while being physically wrong.

Capacity planning should consider dense piles, extreme size ratios, mesh complexity and
contact-cache churn, not just body count. Recovery may require reallocating and rebuilding
resources between submissions, retrying from preserved state, or rejecting a scene beyond
the declared envelope. A failed step must not be labeled valid merely because it rendered.

The rigid world retains lifetime failure counters on the GPU, so infrequent sampling
does not hide an incomplete step. Its simulation still advances when work is incomplete;
recovery requires corrected settings and replay from known valid state. Allocation
preflight catches device-limit violations before state allocation, but cannot predict
all driver memory failures. See [capacity and diagnostics](/docs/api-reference/gpgpu/gpu-rigid-body-world#capacity-and-diagnostics).

### Synchronization and portability constrain the design

A workgroup barrier does not synchronize all workgroups. Global dependencies generally
require dispatch boundaries and appropriate resource ordering. Fusing stages is useful
only when those dependencies remain satisfied. Atomic counters can allocate work, but
contention and unpredictable ordering can still limit throughput.

Portable WebGPU code must respect the adapter's storage bindings, buffer sizes and dispatch
limits. It cannot assume a CUDA-specific execution model or specialized floating-point
atomic operations. Float32 precision also requires declared world scales and tolerances;
large coordinates can erase small contact separations. See
[GPU floating-point precision](/docs/api-guide/shaders/gpu-floating-point-precision).

Parallel execution and floating-point rounding complicate deterministic replay. Stable
pair ordering and controlled reductions help, but cross-device bitwise reproducibility
requires a separate contract and evidence. It is not implied by a fixed timestep.

## glTF is an adapter and a qualification workload

The glTF adapter translates authored shapes, body modes, mass properties, filters and
source identities into engine concepts. Simulation kernels should not depend on glTF
node indices or special-case a named example. Render-node origins and body centers of
mass are different frames and must stay correctly related.

Support has several distinct levels: accepting a schema field, importing it, simulating
its intended behavior, and doing so within a qualified performance envelope. Four working
example scenes do not prove all four levels for an extension. Draft revisions also need
to be pinned; historical sample conventions and newer proposal semantics can differ.

Remaining work includes general moving nonconvex mesh interactions, broad general-body CCD
qualification, proposal joints and drives, complete trigger/interactivity semantics, and
GPU pose publication through the glTF renderer. Unsupported behavior must remain visible.
An asset-specific collision exclusion is not a substitute for implementing the shape pair.

## Measuring progress toward state of the art

GPU acceleration is a workload-dependent result. Small scenes can be dominated by dispatch
and synchronization overhead; large independent workloads expose more parallelism. A
single connected stack or mechanism can remain difficult despite having many bodies.

Measure **latency** for one interactive world's step separately from **throughput** across
many worlds. MuJoCo's documentation explicitly distinguishes these goals for
[MuJoCo Warp](https://mujoco.readthedocs.io/en/latest/mjwarp/). Likewise,
[PhysX's GPU documentation](https://nvidia-omniverse.github.io/PhysX/physx/5.7.0/docs/GPURigidBodies.html)
distinguishes GPU broad phase from GPU dynamics. Accelerating discovery alone does not
establish whole-simulation performance.

A useful qualification report records:

- Accuracy and stability: contact error, penetration, joint drift, conservation where
  appropriate, energy injection, sleep/wake behavior and timestep convergence.
- End-to-end cost: CPU encoding, complete GPU step time, render publication latency,
  queue depth, memory and p50/p95 timings after warm-up.
- Workload and quality settings: shape distribution, contacts, density, timestep,
  substeps, iterations, CCD policy, tolerances and any geometry approximation.
- Device coverage and failure behavior: backend, adapter, limits, overflow counters,
  unsupported features and explicit fallback policy.

Independent analytical cases and reference implementations provide stronger evidence
than visual plausibility alone. Broad-phase-only benchmarks must be labeled accordingly.
Competitive claims need equivalent workloads and error budgets, not just matching body
counts. This qualification work is what turns a compelling demonstration into a reliable
GPU physics library.

## Next steps

- [GPGPU programming](/docs/api-guide/gpu/gpgpu)
- [GPU command graphs](/docs/api-reference/experimental/gpu-core/gpu-command-graph)
- [Physics implementation and limitations](https://github.com/visgl/luma.gl/blob/master/modules/graph/src/gpu-physics/README.md)
- [glTF physics adapter profile](https://github.com/visgl/luma.gl/blob/master/modules/gltf/src/physics/README.md)
- [Physics roadmap](https://github.com/visgl/luma.gl/blob/master/dev-docs/roadmaps/gpu-physics-roadmap.md)
