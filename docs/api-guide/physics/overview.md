---
title: Physics
sidebar_label: Overview
description: GPU-resident simulation, rendering integration, mechanisms and large-world workloads.
---

# Physics

luma.gl provides experimental WebGPU physics through `@luma.gl/graph/gpu-physics`.
Simulation state stays in GPU buffers, and command graphs schedule collision detection,
constraint solving and integration. Renderers can consume that state directly.

Choose a world according to the workload:

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
| [Getting started](./getting-started.md) | Create a world, schedule fixed steps, render GPU state and clean up |
| [Bodies and collisions](./bodies-and-collisions.md) | Shapes, mass, materials, filters, contact events, queries and CCD |
| [Joints and mechanisms](./joints-and-mechanisms.md) | Attachments, limits, motors, springs and solver selection |
| [Scenes and glTF](./scenes-and-gltf.md) | Shared scenegraph concepts, transform ownership and GPU pose publication |
| [Large worlds and batching](./large-worlds.md) | Independent worlds, streaming, local origins, resource reuse and budgets |
| [Performance and qualification](./performance.md) | Timesteps, GPU/CPU costs, headroom, numerical checks and failure reporting |
| [How physics engines work](/docs/api-guide/gpu/gpu-physics) | Algorithms and the tradeoffs of a fully GPU-based implementation |

## Try the examples

The examples sidebar has a **Physics** category. Start with
[Wrecking Ball](/examples/experimental/wrecking-ball) for a heavy pendulum demolishing a
204-block pyramid, or [Rigid Body Lab](/examples/experimental/gpu-rigid-body-world)
for smaller mechanisms and contact scenes. [Physics Stress Lab](/examples/experimental/physics-stress)
and [Physics Batch Lab](/examples/experimental/physics-batch) expose qualification and scale workloads.

## API contracts and maturity

The [module reference](/docs/api-reference/graph/gpu-physics) includes feature cards,
ownership rules and implementation boundaries. The [collision coverage matrix](/docs/api-reference/graph/gpu-physics-collision-coverage)
distinguishes implemented shape pairs from qualification evidence.

Physics remains experimental. Complete execution, a plausible image and competitive
performance are separate claims. Check diagnostics and numerical tolerances for the actual
scene, device and quality settings. The [roadmap](https://github.com/visgl/luma.gl/blob/master/dev-docs/roadmaps/gpu-physics-roadmap.md)
records remaining work.
