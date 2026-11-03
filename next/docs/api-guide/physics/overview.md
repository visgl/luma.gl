# Physics

luma.gl provides experimental WebGPU physics through `@luma.gl/graph/gpu-physics`. Simulation state stays in GPU buffers, and command graphs schedule collision detection, constraint solving and integration. Renderers can consume that state directly.

## Start here[​](#start-here "Direct link to Start here")

If you already have a scenegraph, begin with [Getting started](https://luma.gl/next/docs/api-guide/physics/getting-started.md): create a floor and a box, attach physics by node path, and render their evaluated GPU transforms. `PhysicsController` handles setup and fixed steps; the shared `SceneRenderer` handles retained PBR meshes. You can add advanced controls after that small scene works.

If you are investigating how the pieces fit together, read [Scenes and glTF](https://luma.gl/next/docs/api-guide/physics/scenes-and-gltf.md). For solver design and GPU execution details, read [How physics engines work](https://luma.gl/next/docs/api-guide/gpu/gpu-physics.md). The reference pages are useful once you need a specific setting or a precise coverage boundary.

## Choose the level of control[​](#choose-the-level-of-control "Direct link to Choose the level of control")

Use the controller for scene-driven applications. Use the lower-level worlds when you need explicit command-graph composition, specialized simulation or independent-world batching. Choose a world according to the workload:

| World               | Best starting point                                        | Scope                                                                    |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `GPUSphereWorld`    | Sphere fields, rolling balls and pool                      | Specialized sphere dynamics and static colliders                         |
| `GPURigidBodyWorld` | Block piles, mechanisms, authored scenes and varied shapes | Oriented rigid bodies, compounds, sparse contacts and bounded joints/CCD |
| `GPUPhysicsBatch`   | Ensembles and independent streamed simulations             | Residency and submission management for independent rigid-body worlds    |

These implementations have different contracts. A feature implemented in one world is not automatically available in another. WebGPU is required; there is no CPU or WebGL simulation fallback.

## Guides[​](#guides "Direct link to Guides")

| Guide                                                                                              | What it covers                                                             |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Getting started](https://luma.gl/next/docs/api-guide/physics/getting-started.md)             | A complete scene → bodies → update/render → reset/cleanup walkthrough      |
| [Bodies and collisions](https://luma.gl/next/docs/api-guide/physics/bodies-and-collisions.md) | Shapes, mass, materials, filters, contact events, queries and CCD          |
| [Joints and mechanisms](https://luma.gl/next/docs/api-guide/physics/joints-and-mechanisms.md) | Attachments, limits, motors, springs and solver selection                  |
| [Scenes and glTF](https://luma.gl/next/docs/api-guide/physics/scenes-and-gltf.md)             | Shared scenegraph concepts, transform ownership and GPU pose publication   |
| [Large worlds and batching](https://luma.gl/next/docs/api-guide/physics/large-worlds.md)      | Independent worlds, streaming, local origins, resource reuse and budgets   |
| [Performance and qualification](https://luma.gl/next/docs/api-guide/physics/performance.md)   | Timesteps, GPU/CPU costs, headroom, numerical checks and failure reporting |
| [How physics engines work](https://luma.gl/next/docs/api-guide/gpu/gpu-physics.md)            | Algorithms and the tradeoffs of a fully GPU-based implementation           |

## Try the examples[​](#try-the-examples "Direct link to Try the examples")

The examples sidebar has a **Physics** category. Start with [Wrecking Ball](https://luma.gl/next/examples/experimental/wrecking-ball) for a heavy pendulum demolishing a 204-block pyramid, [Newton's Cradle](https://luma.gl/next/examples/experimental/newtons-cradle) for momentum transfer, or [Spiral Dominoes](https://luma.gl/next/examples/experimental/dominoes) for a propagating contact chain. [Rigid Body Lab](https://luma.gl/next/examples/experimental/gpu-rigid-body-world) provides the full scenario selector. [Physics Stress Lab](https://luma.gl/next/examples/experimental/physics-stress) and [Physics Batch Lab](https://luma.gl/next/examples/experimental/physics-batch) expose qualification and scale workloads.

## Common questions[​](#common-questions "Direct link to Common questions")

**Why has `node.matrix` not moved?** It describes authored or animated placement. The solver's evaluated poses stay on the GPU; the renderer consumes the publication. Use GPU picking for evaluated selection and deliberate readback for CPU inspection.

**Why does the simulation run slowly even though it looks smooth?** Smooth rendering is not proof of real-time simulation. Inspect `droppedTime`, simulated seconds per wall second, GPU timings and queue latency. See [Performance](https://luma.gl/next/docs/api-guide/physics/performance.md).

**Why does changing a mesh not change its collider?** Collision geometry is cooked at preparation. Geometry, scale and hierarchy edits require an explicit rebuild. A material change affects appearance, not collision friction or mass.

**Does loading a glTF file enable every proposed physics feature?** Importing a declaration, executing it correctly and qualifying its performance are different promises. Check the pinned capability report and collision matrix for the workload you need.

## API contracts and maturity[​](#api-contracts-and-maturity "Direct link to API contracts and maturity")

The [module reference](https://luma.gl/next/docs/api-reference/graph/gpu-physics.md) includes feature cards, ownership rules and implementation boundaries. The [collision coverage matrix](https://luma.gl/next/docs/api-reference/graph/gpu-physics-collision-coverage.md) distinguishes implemented shape pairs from qualification evidence.

Physics remains experimental. Complete execution, a plausible image and competitive performance are separate claims. Check diagnostics and numerical tolerances for the actual scene, device and quality settings. The [roadmap](https://github.com/visgl/luma.gl/blob/master/dev-docs/roadmaps/gpu-physics-roadmap.md) records remaining work.
