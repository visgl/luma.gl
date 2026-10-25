# Scientific vector fields and GPU particle advection

The structural input contract matches loaders.gl's experimental
`ScientificVectorField` adapter from visgl/loaders.gl#4312, without introducing
a runtime dependency between the repositories.

```ts
const flow = new ScientificFlowGraph(device, {
  input: vectorField,
  particleCount: 100000
});
const state = flow.step(1 / 60);
// state.texture and state.previousTexture remain GPU resident.
```

`ScientificFlowField` uploads row-major east/north velocities (m/s) and a
validity mask into an rgba32float velocity texture. The existing
`FlowParticleSimulation` performs GPU advection and produces GPU state textures.

This is a composition of existing GPU render-pass simulation, **not yet an
implementation of the dedicated GPU compute command graph**. It is not a
scientific-quality 3D or time-dependent integrator. Geographic input must be
regular, west-to-east and south-to-north, and is restricted to ±85 degrees
latitude by the current simulation. Staggered grids, polar transport, temporal
interpolation, CF metadata and chunk streaming remain outside this PR.

Build/typecheck, WebGPU integration tests and scientific reference trajectories
must pass before the PR is ready.
