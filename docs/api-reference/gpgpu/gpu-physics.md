---
title: GPU physics
description: Choose a WebGPU physics world and integrate its simulation, rendering and diagnostics.
---

# GPU physics

`@luma.gl/gpgpu/gpu-physics` provides experimental WebGPU simulation. Import this
subpath explicitly; the physics API is not exported from the package root. It
requires a WebGPU device and has no WebGL or CPU simulation fallback.

| World | Use it for | Important boundary |
| --- | --- | --- |
| [GPUSphereWorld](./gpu-sphere-world.md) | Large sphere fields, rolling balls, pool and small continuous sphere scenes | Dynamic shapes are spheres; continuous mode and events are bounded to small worlds |
| [GPURigidBodyWorld](./gpu-rigid-body-world.md) | Oriented shapes, compounds, mass properties and glTF physics workloads | Discrete contacts; parallel solving remains experimental |

These are separate implementations with different controls, storage ownership and
failure counters. A feature on one world does not imply support on the other.
Neither establishes complete glTF proposal coverage or state-of-the-art performance.
The [background guide](/docs/api-guide/gpu/gpu-physics) explains the algorithms and
GPU tradeoffs; the references below describe the actual contracts.

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

The Sphere World, Pool and Rigid Body Lab examples use procedural scenes. The glTF
Physics example tests authored semantics through the separate `@luma.gl/gltf/physics`
adapter. Its supported draft profile and render integration limitations are documented
in the [adapter reference](https://github.com/visgl/luma.gl/blob/master/modules/gltf/src/physics/README.md).

[Qualification tooling](https://github.com/visgl/luma.gl/blob/master/scripts/physics/README.md)
separates schema/import evidence, numerical behavior, capacity and performance.
A successful import, finite poses or zero overflow alone is not proof of accuracy.
