# ScientificFlowTracer (Experimental)

`ScientificFlowTracer` traces explicitly seeded particles through regular 2D
vector fields on WebGPU. It adds adaptive embedded Runge–Kutta–Fehlberg 4(5)
integration and persistent termination states alongside the visualization-oriented
`ScientificFlowGraph`. Import it from `@luma.gl/experimental`.

```typescript
const tracer = new ScientificFlowTracer(device, {
  input, // normalized scientific grid: dimensions, shape, eastward, northward, valid
  bounds: [0, 0, 10000, 10000],
  coordinates: 'cartesian',
  positions: new Float32Array([0.25, 0.5, 0.75, 0.5]), // normalized x/y pairs
  tolerance: 0.01, // absolute local position-error tolerance in bounds units
  maximumTimeStep: 60,
  maximumAttempts: 32
});

let result = await tracer.advance(3600);
while (!result.complete) result = await tracer.continue();
// tracer.time is now 3600; output remains on the GPU.
tracer.destroy();
```

## Accuracy and field support

The tolerance compares the embedded fourth- and fifth-order displacement estimates;
accepted steps use the fifth-order update. It controls estimated **local integration
error**, not accumulated trajectory error or grid-interpolation error. Cartesian
errors use bounds units. With `coordinates: 'lnglat'`, velocities and tolerance use
metres per second and metres; longitude displacement accounts for latitude.

Spatial sampling is bilinear and requires all four grid corners to be valid.
Optional `nextInput` and `timeRange: [start, end]` enable linear interpolation in time
at every RK stage. Both snapshots must share dimensions, bounds and coordinates.
At an interval endpoint, `setNextSnapshot(input, endTime)` rotates the pair without
resetting particles. No extrapolation is permitted.

The controller halves rejected steps and doubles accepted steps whose estimated
error is below one tenth of the tolerance. A half-cell travel limit also caps the
step. `minimumTimeStep` defaults to `1e-4` seconds, `maximumTimeStep` to `1` second,
and `initialTimeStep` to the maximum. Request and lifetime endpoints may clip a
step below the minimum. An unmet tolerance is never force-accepted at the minimum.
Invalid trial positions first trigger step reduction; an unrecoverable trial stops
the particle at its last accepted position.

Computation uses float32. A non-finite calculation or an increment too small to
advance the particle's age/request clock produces `NumericalFailure`. A final
roundoff-sized request remainder is still integrated and checked against the
tolerance, even when it is smaller than the age clock can represent. Very strict
tolerances can reach float32 limits. This API supports forward tracing on regular
collocated 2D grids; curvilinear/staggered grids, 3D fields, diffusion, boundary
sliding and global trajectory-error guarantees are outside its current scope.

## Bounded work and clocks

Each awaited `advance()` or `continue()` submits one dispatch, with at most
`maximumAttempts` trials per particle (default 32, range 1–256). Rejected trials
consume that budget. `complete: false` means work remains for the same requested
horizon. Resume with `continue()` before starting another request or rotating a
snapshot. Calls must not overlap. Await the current call before destroying resources.

The committed `time` stays unchanged while a request is pending. Individual GPU
particles may be at different intermediate times until completion. Stopped
particles retain their earlier ages even after the horizon commits. Completion
means every particle reached the horizon **or explicitly stopped**; inspect status
counts to distinguish these outcomes. `remainingTime` bounds the next request for
a time-dependent field. Stationary fields have no interval bound.

Each dispatch reads back nine counters (36 bytes), never particle positions.
Results include `pending`, counts for each status, and per-dispatch `acceptedSteps`
and `rejectedSteps`. If the device enables `timestamp-query`, `gpuMilliseconds`
reports compute-pass duration; it excludes readback latency and rendering. A
submission/readback failure disables further advancement of that tracer; destroy
it and create a new instance.

## Graph inspection and tracing

Every `advance()` and `continue()` executes the same compiled `commandGraph`:
`reset-trace-counters` copies nine zero counters, then `trace-particles-rk45`
runs the bounded adaptive kernel. The graph declares particle, previous-state,
diagnostic, counter, uniform and velocity-texture access, including the reset-to-compute
dependency. Snapshot rotation rebinds both velocity textures on the next encoding.
Use `advance()` and `continue()` for execution; encoding `commandGraph` directly
bypasses the tracer's request and readback lifecycle.

The returned `encoding` is the actual submitted `GPUCommandGraphEncoding`. Register
`tracer.commandGraph` with `GPUCommandGraphInspector` and record `result.encoding`
to inspect it without executing another simulation step. `dispatchIndex` counts
submitted dispatches from one; `isContinuation` distinguishes resumed work, and
`targetTime` identifies the requested horizon even while `time` is uncommitted.

```typescript
const result = await tracer.advance(1);
const report = await result.encoding.readTimings();
// report.nodes contains reset CPU cost and adaptive compute CPU/GPU timings.
```

GPU timing uses immutable per-encoding timestamp snapshots, so later dispatches
can reuse the query set without changing an earlier report. Without timestamp
support, CPU encoding and resource inspection remain available. Copy nodes have
CPU timing only. `gpuMilliseconds` measures the adaptive compute pass, excluding
counter readback and trail rendering. Resource previews are explicit, additional
GPU readbacks of current allocations, not historical snapshots of particle data;
read them before destroying the tracer or rotating away their field textures.

Vector Observatory's Graph and Trace tabs show this graph for RK45 as well as
RK2/RK4. They sample every 60 encodings and clear on reseed or integrator changes.
Diagnostics shows the dispatch number, continuation state, target horizon, work
counts and particle outcomes.

## GPU buffers and particle identity

Particle index is stable identity. There is no automatic respawn. `lifetime`
defaults to `1e30` seconds; expiration clips the final step exactly to that age.
Create a new tracer to seed another release.

| Buffer | Four float32 values per particle |
| --- | --- |
| `output` | Normalized x, normalized y, age in seconds, generation (always 1) |
| `previous` | State at the start of the most recent dispatch |
| `diagnostics` | Elapsed seconds in the current request, proposed step, status, last accepted step |

`ScientificParticleStatus` exports these stable numeric values:

| Value | Status | Meaning |
| --- | --- | --- |
| 0 | `Active` | May continue tracing |
| 1 | `Expired` | Reached configured lifetime |
| 2 | `OutsideDomain` | Outside the field or unable to keep a trial inside it |
| 3 | `MissingData` | Required interpolation samples are invalid |
| 4 | `ToleranceFailure` | Error still exceeds tolerance at the minimum step |
| 5 | `NumericalFailure` | Non-finite arithmetic or float32 clock stagnation |

## Qualification and example

Vector Observatory offers RK45, tolerance selection, accepted-step coloring,
status coloring and stopped-particle markers. Adaptive mode performs one bounded
dispatch per animation frame and displays pending particles and queued simulation
time. Work can lag behind wall time; the clock shows only committed simulation time.

GPU tests cover analytic rotation and convergence, geographic units, temporal
snapshot rotation, physical-hour requests, dispatch-budget independence, missing
samples, domain exit, lifetime and numerical/tolerance failures. Run the opt-in
accuracy/cost benchmark with:

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true yarn test-headless --no-coverage --silent=false modules/experimental/test/simulation/scientific-flow-benchmark.spec.ts
```

The benchmark compares 65,536 identical rotation trajectories over two seconds,
requiring both fixed RK4 and adaptive RK45 to have final position error below
`1e-5`. It records three measured samples after warmup, alternates execution order,
and reports work counts and optional GPU timestamps. This controlled case is not
a general speedup claim; heterogeneous trajectories and counter readback can change
end-to-end cost substantially.

The RKF45 stages and basic controller are adapted from the MIT-licensed Parcels
`AdvectionRK45` implementation. The shader retains its copyright and permission
notice; the complete notice also ships in `simulation/PARCELS-LICENSE.txt`.


## Periodic longitude

Set `periodicLongitude: true` for a horizontally periodic field. The first and last
grid columns must describe the same meridian. Sampling wraps every Runge–Kutta
stage and accepted particle positions stay in normalized `[0, 1)` longitude,
without respawning or changing particle identity. Latitude and missing-data
boundaries retain their usual behavior. Snapshot rotation preserves this option.
Renderers should unwrap segment displacement and split trails at the atlas seam;
raw consecutive x coordinates can jump from near one to near zero.
