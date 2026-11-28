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
3D transport, polar transport and staggered grids remain future work. Adaptive
RKF45 is available through `ScientificFlowTracer`, with explicit stopping reasons
and stable particle identities; see the [tracer API](../../../../../docs/api-reference/experimental/scientific-flow-tracer.md). `step()` accepts 0–1/30 second. `advance()` splits
an interval into substeps capped at 1/30 second and half a grid cell of travel per axis,
using a conservative maximum component velocity across both snapshots. This is a
travel bound, not an error estimate or a guarantee against crossing a thin mask.
Up to 4096 substeps run inside one GPU dispatch; larger requests are rejected.
Output and `previous` bracket the entire call, not its final internal substep.

## Time-dependent fields

```ts
const flow = new ScientificFlowGraph(device, {
  input: snapshotAtZero,
  nextInput: snapshotAtOne,
  timeRange: [0, 1], // seconds, finite and strictly increasing
  bounds: [0, 0, 1, 1],
  particleCount: 65536
});
flow.advance(0.5);
flow.advance(0.5);
console.log(flow.time); // 1
flow.setNextSnapshot(snapshotAtTwo, 2);
flow.advance(1);
flow.destroy();
```

Both snapshots must share dimensions, bounds, and coordinates. Two textures stay
resident. At an interval endpoint, `setNextSnapshot` retains the last snapshot,
uploads the next one, and releases the expired texture. The application controls
loading and waits for the next snapshot before advancing. There is no implicit
extrapolation, looping, or fetching. Advance to each endpoint before rotating;
requests crossing the endpoint fail without moving the clock or particle buffers.
An upload/compatibility failure leaves the existing pair usable.

Sampling is bilinear in space and linear in time. Every RK2/RK4 stage uses its
own timestamp. A snapshot's validity mask contributes only when its interpolation
weight is nonzero; between timestamps both snapshots must be valid. GPU time and compensated CPU elapsed time are relative to the current interval,
so repeated frame durations are never accumulated onto a large epoch. Endpoints
snap within 1e-12 of the interval duration. Use `remainingTime` to split requests
at an endpoint, then rotate when it is zero; it is infinity for steady fields.
The absolute `time` getter is a JavaScript double and may round small increments
at large epochs, so do not calculate scheduling remainders by subtracting it.

The clock advances when commands are encoded, so caller-owned commands must be
submitted in order and must not be discarded. Submit each `record()`/`encode()`
call before recording another or rotating snapshots: uniform storage is shared
between calls. `record(encoder, stepTime, substeps)` batches up to 4096 bounded
substeps with one uniform write; `advance()` calculates and submits such a batch.
No intermediate particle state is read back. Geographic inputs use a conservative
longitude conversion at the domain's largest absolute latitude for the travel
bound. Boundary and missing-data behavior remains deterministic respawning;
the adaptive tracer stops instead of respawning. Both APIs support optional
`periodicLongitude` with matching first/last grid columns. Reflect/slip boundaries
remain future work.

`record(encoder, deltaTime)` records the compiled graph into a caller-owned
command encoder. `encode(computePass, deltaTime)` is the lower-level escape hatch
for an existing pass. Neither submits commands. `commandGraph` exposes graph
preflight and workload information for diagnostics. Owned fields, buffers, and
kernels are released by `destroy()`.

Run the **Vector Observatory** with:

```bash
yarn workspace luma.gl-examples-vector-observatory start
```

Alongside the default synthetic weather globe, its three analytic benchmark fields (unsteady double gyre, vortex pair, and meandering jet)
are sampled onto a 256² scientific grid. It renders up to 1,048,576 particles with
persistent HDR trails, speed coloring, selectable RK2/RK4/RK45 integration, exposure,
time scale, a simulation clock, pause, and deterministic reseeding. The double
gyre has a ten-second cycle and quarter-second snapshots. Playback follows elapsed
wall time, with gaps capped at 0.1 second to avoid catching up background-tab time. Fields are synthetic benchmarks,
not observed weather/ocean data. FPS measures the browser frame loop, not GPU time.

GPU regression tests compare both integration methods against exact steady and
accelerating rotations and uniform acceleration, including partial workgroups,
large timestamps, mask transitions, snapshot rollover, and batched-versus-separate
substeps. Accelerating-rotation tests halve the timestep to verify convergence.
An unsteady double gyre on a 129² grid with 0.125-second snapshots is compared
against an independent double-precision CPU trajectory using continuous analytic
velocities and 2000 RK4 steps: normalized position error must stay below 1e-4 after
one second. This qualifies synthetic trajectories; it is not validation against
observational ocean data. An offline quantized GFS model-wind fixture now compares hourly GPU trajectories
with a refined independent CPU reference; observational qualification remains follow-up work. The opt-in
`scientific-flow-benchmark.spec.ts` measures RK4/RK45 accuracy and GPU compute
timestamps; it excludes counter readback and rendering. Higher integrator order alone cannot remove spatial or temporal
interpolation error. Run with:

```bash
yarn test-headless --no-coverage modules/graph/test/experimental/simulation/scientific-flow
```

## Qualification and retained trajectories

The [dedicated advection roadmap](../../../../../dev-docs/roadmaps/advection-roadmap.md)
tracks scientific qualification separately from visual features. Manufactured
shear and time-quadratic tests now isolate spatial/temporal interpolation error
from RK45 integration error. `conservativeMask: true` opts the adaptive tracer
into crossed-cell interpolation checks, including short intersections between
RK stages. Simultaneous diagonal crossings do not test adjacent unvisited cells.
This does not implement curved-path collision, coastline reflection or sliding.

`FlowTrajectoryHistory` retains GPU particle snapshots in a fixed-capacity ring.
It records copies into a caller-owned encoder without submission or readback.
`readFrames()` explicitly reads populated slots in chronological order using at
most two contiguous ranges.
See the [tracer API](../../../../../docs/api-reference/experimental/scientific-flow-tracer.md)
for synchronization, memory costs and completed-horizon capture.

## Cartesian C-grid transport and batched tracing

`ScientificFlowInput` also accepts `StaggeredVectorFieldInput`. Bounds enclose
cells; normal face velocities and separate component masks are retained in the
packed texture. Face reconstruction reproduces cell divergence without collocation.
See the [field contract](../../../../../docs/api-reference/experimental/staggered-flow-fields.md).

RK45 `dispatchesPerReadback` batches 1–32 bounded dispatches before reading their
counter snapshots together. Results retain individual graph encodings, aggregate
work and final status counts. This reduces synchronization without compacting
active particles. The opt-in scientific-flow benchmark reports sparse/dense costs.

### Active scheduling

`ScientificFlowTracer` optionally compacts unfinished stable IDs and dispatches RK45
indirectly. A separate GPU scan applies per-call lifecycle changes to all slots and
counts skipped statuses; integration counts queued statuses. Empty queues launch
zero integration workgroups. Queue ordering never changes public particle storage.
Dense scheduling remains the default. Scheduling telemetry and matched-error costs
include an explicit distinction between integration work and full-slot queue scans;
see the [tracer API](../../../../../docs/api-reference/experimental/scientific-flow-tracer.md).

### Persistent survivors and adaptive spherical transport

Persistent Cartesian scheduling initializes a stable-ID queue once per requested
horizon, then integration appends unfinished IDs directly to the alternating queue.
Status totals persist while transient counters reset. A GPU copy captures every
previous slot once per call. See the checked-in survivor benchmark for matched-error
end-to-end gains and the inconclusive single-dispatch results.

`SphericalFlowTracer` adds bounded Cartesian RKF45 with physical chord-error control
to dense global world-vector snapshots. It uses the shared spherical sampler and
Parcels-attributed embedded tableau, preserves unit directions, and exposes explicit
continuation, lifetime/tolerance failure and a reset/integration command graph.
Broader fields and multi-adapter qualification remain separate roadmap work.
