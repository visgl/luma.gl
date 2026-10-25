# Scientific vector fields and GPU particle advection

`ScientificFlowGraph` runs WebGPU particle advection through a compiled
`GPUCommandGraph`: scientific upload → bilinear field sampling → Runge–Kutta
integration → ping-pong storage buffers. Renderers consume the buffers directly.
There is no particle readback or runtime dependency on loaders.gl.

```ts
const flow = new ScientificFlowGraph(device, {
  input: vectorField,
  particleCount: 262144,
  lifetime: 45,
  integrator: 'rk4' // default; 'rk2' selects midpoint integration
});
const state = flow.step(1 / 60); // Buffer: normalized x, y, age, generation
// Bind state and flow.previous as read-only storage buffers when rendering.
flow.destroy();
```

The structural input contract accepts the normalized regular grids produced by
loaders.gl's experimental ScientificVectorField adapter (visgl/loaders.gl#4312).
`shape` is `[rows, columns]`, row zero is the southern edge, and both axis steps
must be positive. Valid velocities are finite metres/second for geographic
coordinates; Cartesian velocities use bounds units/second. Missing samples remain
invalid rather than being treated as calm water. All four interpolation corners
and every integration stage must be valid; invalid trajectories respawn with a
new generation, letting renderers suppress false streaks across discontinuities.

Choose Cartesian bounds explicitly for analytic or local fields. Geographic
bounds are derived from sample centers and use a spherical local metres-to-degree
conversion, limited to ±85° latitude. This is a regular 2D collocated-grid tracer,
not a fluid solver: it does not solve pressure or reconstruct staggered grids.
3D transport, polar transport, temporal field interpolation, streaming, and
adaptive integration remain future work. A bounded step of 0–1/30 second is
required; callers control simulation time and submit each step before recording
the next because uniform data is shared between encodings.

`record(encoder, deltaTime)` records the compiled graph into a caller-owned
command encoder. `encode(computePass, deltaTime)` is the lower-level escape hatch
for an existing pass. Neither submits commands. `commandGraph` exposes graph
preflight and workload information for diagnostics. Owned fields, buffers, and
kernels are released by `destroy()`.

Run the **Vector Observatory** with:

```bash
yarn workspace luma.gl-examples-vector-observatory start
```

Its three analytic benchmark fields (double gyre, vortex pair, and meandering jet)
are sampled onto a 256² scientific grid. It renders up to 1,048,576 particles with
persistent HDR trails, speed coloring, selectable RK2/RK4 integration, exposure,
time scale, pause, and deterministic reseeding. Fields are synthetic benchmarks,
not observed weather/ocean data. FPS measures the browser frame loop, not GPU time.

GPU regression tests compare both integration methods against an exact rotating
trajectory, including a partial final workgroup. Run with:

```bash
yarn test-headless --no-coverage modules/experimental/test/simulation/scientific-flow-compute.spec.ts
```
