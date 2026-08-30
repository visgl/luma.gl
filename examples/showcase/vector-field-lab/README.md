# Vector Field Lab

A WebGPU showcase for navigating a sampled three-dimensional field and its differential operators.
Four synchronized `StructuredVolumeRenderer` instances imported from `@luma.gl/scene/raymarch`
consume the same GPU-resident buffers and orbit camera.
Vector-valued views add small solid 3D arrow glyphs on a sparse 6³ lattice. Their shafts and tapered
heads are evaluated volumetrically, preserving orientation, occlusion, and perspective while orbiting.

## GPU command graph

One example-local `GPUVectorFieldSampler3D` graph node evaluates the analytic preset directly into
scalar and padded xyz storage buffers. Four reusable `GPUFiniteDifference3D` nodes then evaluate
gradient, Laplacian, divergence, and curl. Rendering consumes these buffers without volume
readback. `GPUFiniteDifference2D` remains available for planar analysis workflows.

## Numerical method

- Regular `40 × 40 × 40` grid over `[-1, 1]³`, so `dx = dy = dz = 2 / 39` by default.
- `f32` scalar buffers and 16-byte-aligned `vec4<f32>` rows whose xyz components store vectors.
- Second-order centered first and second derivatives in the interior.
- Second-order forward/backward stencils on all six boundary faces; reusable 2D and 3D primitives
  also support periodic wrapping.
- Gradient and curl output vectors. Divergence and Laplacian output scalars. Units follow the input
  units divided by distance, or distance squared for the Laplacian.

The six presets have analytic derivatives used by the center probe and focused primitive tests.
Every preset evolves over time: sources breathe, vortices accelerate, the incompressible lattice
translates, and scalar potentials change shape or move. Updates run at 30 Hz inside one
caller-owned graph encode; pause freezes every linked view at the same instant.

## Performance envelope

The default volume contains 64,000 voxels. A field refresh dispatches five `O(N³)` graph nodes,
then each pixel ray marches only its selected linked view. The 40³ default and 72 ray samples are
chosen for integrated GPUs; resolution and march count can scale independently on larger devices.

## Follow-ups

Natural extensions are fourth-order stencils, Jacobian/Hessian tensors, GPU particle advection,
vortex tubes, spectral derivatives through 3D FFTs, Helmholtz decomposition, Poisson solvers, and
coupled fluid/PDE visualization.
