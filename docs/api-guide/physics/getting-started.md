---
title: Getting started with physics
description: Create a GPU world and connect fixed-step simulation to rendering.
---

# Getting started with physics

Create one physics world on an existing WebGPU device, attach it to a command graph,
and compile once. The following scene has a static floor and a falling box:

```ts
import {GPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';

const world = new GPURigidBodyWorld({
  bodies: [
    {position: [0, 0, -0.5], mass: 0, shape: {type: 'box', halfExtents: [8, 8, 0.5]}},
    {position: [0, 0, 3], shape: {type: 'box', halfExtents: [0.5, 0.5, 0.5]}}
  ],
  solver: 'parallel',
  timeStep: 1 / 60,
  iterations: 16,
  failurePolicy: 'rollback'
});
const definition = new GPUCommandGraph(device);
world.addToGraph(definition);
const graph = await definition.compileAsync();
```

The application supplies `device`; see [GPU initialization](/docs/api-guide/gpu/gpu-initialization).
The world owns its simulation buffers. It can attach to one graph.

## Advance fixed steps

Accumulate wall-clock time and encode the graph once per fixed step. Bound catch-up work
so a slow frame cannot create an ever-growing queue:

```ts
accumulator = Math.min(accumulator + elapsedSeconds, 4 * world.timeStep);
const encoder = device.createCommandEncoder();
while (accumulator >= world.timeStep) {
  graph.encode(encoder, {parameters: undefined});
  accumulator -= world.timeStep;
}
device.submit(encoder.finish());
```

Initialize `accumulator` to zero and derive `elapsedSeconds` from the render loop. Choose an
explicit overload policy: this example discards excess elapsed time rather than allowing
unbounded catch-up. It may slow simulated time under sustained overload.

## Render and inspect

Bind `world.positions` and `world.orientations` to a renderer. GPU pose publication can
also supply body-node matrices. Avoid reading all body state back every frame simply to
rebuild render transforms. The [scene integration guide](./scenes-and-gltf.md) describes
transform ownership.

Sample `readSimulationDiagnostics()` asynchronously. A complete step means its bounded
work finished; it does not establish acceptable penetration, joint error or frame time.
Use `readState()` for inspection and qualification rather than as a mandatory render bridge.

## Reset and destroy

Reset should restore authored body state and any associated commands/events. Keep camera
state separate. A reusable checkpoint or a rebuilt world can provide the starting state;
see the rigid-body reference for their different lifetime rules.

Stop scheduling, finish pending GPU work and readbacks, release renderer bindings, destroy
the compiled graph, and then destroy the world. Renderers borrow world buffers and must
not retain them after world destruction.
