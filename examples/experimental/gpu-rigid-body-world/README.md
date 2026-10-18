# GPU Rigid Bodies

Run `yarn workspace luma.gl-examples-experimental-gpu-rigid-body-world start`.

Box stacks, a mixed sphere/box scene and an off-center impact exercise the experimental
`GPURigidBodyWorld`. Drag to orbit, scroll to zoom, and use **Push a box** to apply an
impulse away from its center. Reset recreates the selected scene. Rendering binds
world-owned position and quaternion buffers directly; half-second snapshots only
update the sleeping counter.

This is a bounded reference solver, limited to 128 sphere/box bodies including static
colliders. Collision discovery runs parallel GPU SAT and clipped manifolds; an ordered
GPU sequential-impulse solve provides a stable baseline for future parallel solvers.
The large sphere example uses `GPUSphereWorld` instead. This path is discrete and does
not provide CCD: reduce timestep for fast or small bodies. Joints and general convex
shapes are not part of this example.
