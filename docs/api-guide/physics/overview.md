---
title: Physics
sidebar_label: Overview
description: GPU-resident simulation, rendering integration, mechanisms and large-world workloads.
---

# Physics

luma.gl provides experimental WebGPU physics through `@luma.gl/graph/gpu-physics`.
Simulation state stays in GPU buffers, and command graphs schedule collision detection,
constraint solving and integration. Renderers can consume that state directly.

## Start here

If you already have a scenegraph, begin with
[Getting started](./getting-started.md): create a floor and a box, attach physics by node
path, and render their evaluated GPU transforms. `PhysicsController` handles setup and
fixed steps; the shared `SceneRenderer` handles retained PBR meshes. You can add advanced
controls after that small scene works.

If you are investigating how the pieces fit together, read
[Scenes and glTF](./scenes-and-gltf.md). For solver design and GPU execution details, read
[How physics engines work](/docs/api-guide/gpu/gpu-physics). The reference pages are useful
once you need a specific setting or a precise coverage boundary.

## Choose the level of control

Use the controller for scene-driven applications. Use the lower-level worlds when you
need explicit command-graph composition, specialized simulation or independent-world
batching. Choose a world according to the workload:

| World | Best starting point | Scope |
| --- | --- | --- |
| `GPUSphereWorld` | Sphere fields, rolling balls and pool | Specialized sphere dynamics and static colliders |
| `GPURigidBodyWorld` | Block piles, mechanisms, authored scenes and varied shapes | Oriented rigid bodies, compounds, sparse contacts and bounded joints/CCD |
| `GPUPhysicsBatch` | Ensembles and independent streamed simulations | Residency and submission management for independent rigid-body worlds |

These implementations have different contracts. A feature implemented in one world is
not automatically available in another. WebGPU is required; there is no CPU or WebGL
simulation fallback.

## Guides

| Guide | What it covers |
| --- | --- |
| [Getting started](./getting-started.md) | A complete scene → bodies → update/render → reset/cleanup walkthrough |
| [Bodies and collisions](./bodies-and-collisions.md) | Shapes, mass, materials, filters, contact events, queries and CCD |
| [Joints and mechanisms](./joints-and-mechanisms.md) | Attachments, limits, motors, springs and solver selection |
| [Scenes and glTF](./scenes-and-gltf.md) | Shared scenegraph concepts, transform ownership and GPU pose publication |
| [Large worlds and batching](./large-worlds.md) | Independent worlds, streaming, local origins, resource reuse and budgets |
| [Performance and qualification](./performance.md) | Timesteps, GPU/CPU costs, headroom, numerical checks and failure reporting |
| [How physics engines work](/docs/api-guide/gpu/gpu-physics) | Algorithms and the tradeoffs of a fully GPU-based implementation |

## Try the examples

The examples sidebar has a **Physics** category. Start with
[Wrecking Ball](/examples/experimental/wrecking-ball) for a heavy pendulum demolishing a
204-block pyramid, [Newton's Cradle](/examples/experimental/newtons-cradle) for momentum
transfer, or [Spiral Dominoes](/examples/experimental/dominoes) for a propagating contact chain.
[Rigid Body Lab](/examples/experimental/gpu-rigid-body-world) provides the full scenario selector. [Physics Stress Lab](/examples/experimental/physics-stress)
and [Physics Batch Lab](/examples/experimental/physics-batch) expose qualification and scale workloads.

## Common questions

**Why has `node.matrix` not moved?** It describes authored or animated placement.
The solver's evaluated poses stay on the GPU; the renderer consumes the publication.
Use GPU picking for evaluated selection and deliberate readback for CPU inspection.

**Why does the simulation run slowly even though it looks smooth?** Smooth rendering is
not proof of real-time simulation. Inspect `droppedTime`, simulated seconds per wall second,
GPU timings and queue latency. See [Performance](./performance.md).

**Why does changing a mesh not change its collider?** Collision geometry is cooked at
preparation. Geometry, scale and hierarchy edits require an explicit rebuild. A material
change affects appearance, not collision friction or mass.

**Does loading a glTF file enable every proposed physics feature?** Importing a declaration,
executing it correctly and qualifying its performance are different promises. Check the
pinned capability report and collision matrix for the workload you need.

## API contracts and maturity

The [module reference](/docs/api-reference/graph/gpu-physics) includes feature cards,
ownership rules and implementation boundaries. The [collision coverage matrix](/docs/api-reference/graph/gpu-physics-collision-coverage)
distinguishes implemented shape pairs from qualification evidence.

Physics remains experimental. Complete execution, a plausible image and competitive
performance are separate claims. Check diagnostics and numerical tolerances for the actual
scene, device and quality settings. The [roadmap](https://github.com/visgl/luma.gl/blob/master/dev-docs/roadmaps/gpu-physics-roadmap.md)
records remaining work.
