# GPU physics implementation

Experimental WebGPU physics with two distinct world implementations. Public API
contracts live in the website documentation:

- [Overview, feature cards and integration](../../../../docs/api-reference/gpgpu/gpu-physics.md)
- [GPUSphereWorld](../../../../docs/api-reference/gpgpu/gpu-sphere-world.md)
- [GPURigidBodyWorld](../../../../docs/api-reference/gpgpu/gpu-rigid-body-world.md)
- [Algorithms and GPU tradeoffs](../../../../docs/api-guide/gpu/gpu-physics.md)
- [Roadmap and qualification gates](../../../../dev-docs/roadmaps/gpu-physics-roadmap.md)

## Implementation map

The sphere path composes grid hashing, sort/scan, bounded directed contacts and
Jacobi solving. Its optional continuous/event/persistent-contact modes are bounded
small-world features. They do not imply corresponding rigid-world features.

The rigid path combines analytic and support-mapped shape contacts with persistent
manifolds. `rigid-body-shaders.ts` owns shared contact response and the ordered
reference solver. `rigid-body-parallel-shaders.ts` adds per-pair updates, per-body
gathering and island sleeping. Both can use hierarchical sparse discovery.
`rigid-body-capacity.ts` centralizes world allocation layout;
`rigid-body-diagnostics.ts` accumulates lifetime execution failures on the GPU.
Geometry cooking and mass-property calculation happen before graph execution.

## Invariants for changes

- Maintain explicit graph dependencies using the original resource handles.
- Never use racing floating-point updates to shared body state.
- Preserve contact identity before reusing cached impulses.
- Report bounded-work exhaustion; rendering a frame does not validate that step.
- Keep constructor/node origins distinct from GPU center-of-mass positions.
- Preserve ownership: sphere worlds can borrow state; rigid worlds own state;
  compiled graphs own scratch. Render bindings borrow buffers.
- Count dispatch work inside semantic graph operations when measuring performance.
- Keep glTF interpretation in the adapter and unsupported features visible.

Run focused GPU tests through the repository Vitest runner and full checks through
root `yarn test`. Node-only tests cannot validate WGSL, GPU ordering or numerical
behavior. [Qualification tooling](../../../../scripts/physics/README.md) separates
behavior, capacity and timing evidence. The whole-step benchmark is an observation,
not an automatic correctness or performance certification.
