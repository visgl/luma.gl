# GPU physics prototype

`GPUSphereWorld` is a first WebGPU physics pass implemented as a declarative
`GPUCommandGraph` component. The caller owns the GPU buffers; the physics graph
imports them and performs a fixed number of ordered integration passes without
readback. The position buffer can also be bound to an instanced renderer.

## State layout

- `positions`: packed `vec4f` per body: xyz center, w sphere radius.
- `velocities`: packed `vec4f` per body: xyz linear velocity, w inverse mass.
- Zero inverse mass means static.

## Scope

Implemented: gravity, semi-implicit Euler integration, static horizontal plane,
restitution, tangential damping, fixed substeps, and validation.

**Not implemented:** sphere-sphere collision detection, spatial hashing, contact
constraint solving, angular dynamics, friction impulses, joints, or glTF adapters.
This is a deliberately small GPU command-graph integration milestone, not a
10,000-body collision solver or a physics engine equivalent to Rapier.

## Next steps

1. Build GPU broad-phase using uniform-grid cell assignment, prefix sums and
   bounded pair emission. Avoid O(N²) all-pairs testing.
2. Sphere-sphere narrow-phase, contact buffers, overflow reporting and
   deterministic test scenes.
3. Jacobi or graph-colored contact solver with explicit convergence tests,
   friction and resting-contact stabilization.
4. GPU-resident instancing showcase with 10k spheres and frame-time benchmarks.
5. `KHR_collision_shapes` / `KHR_physics_rigid_bodies` adapters after the
   extension schemas stabilize.

See `gpu-sphere-world.ts` for the executable compute pass.
