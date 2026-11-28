# ScientificFlowTracer (Experimental)

`ScientificFlowTracer` traces explicitly seeded particles through regular 2D
vector fields on WebGPU. It adds adaptive embedded Runge–Kutta–Fehlberg 4(5)
integration and persistent termination states alongside the visualization-oriented
`ScientificFlowGraph`. Import it from `@luma.gl/graph/experimental-simulation`.

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

Collocated sampling is bilinear and requires all four grid corners to be valid.
Cartesian C-grid inputs use face-preserving interpolation; see [staggered fields](./staggered-flow-fields.md).
Optional `nextInput` and `timeRange: [start, end]` enable linear interpolation in time
at every RK stage. Both snapshots must share layout, texture dimensions, bounds and coordinates.
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
collocated or Cartesian C-grids; curvilinear grids, 3D fields, diffusion, boundary
sliding and global trajectory-error guarantees are outside its current scope.

## Bounded work and clocks

Each awaited `advance()` or `continue()` submits `dispatchesPerReadback` dispatches
(default 1, range 1–32), each with at most `maximumAttempts` trials per particle
(default 32, range 1–256). Rejected trials consume that budget. A batch is submitted
without waiting for CPU counters between dispatches. Completed particles skip later
trials. The default `scheduling: 'dense'` launches all particle slots; opt-in
`scheduling: 'active'` compacts unfinished slots on the GPU before indirect integration. Use small batches for responsiveness and larger ones for long traces. `complete: false` means work remains for the same requested
horizon. Resume with `continue()` before starting another request or rotating a
snapshot. Calls must not overlap. Await the current call before destroying resources.

The committed `time` stays unchanged while a request is pending. Individual GPU
particles may be at different intermediate times until completion. Stopped
particles retain their earlier ages even after the horizon commits. Completion
means every particle reached the horizon **or explicitly stopped**; inspect status
counts to distinguish these outcomes. `remainingTime` bounds the next request for
a time-dependent field. Stationary fields have no interval bound.

Each call reads one contiguous counter snapshot of `36 * dispatchesPerReadback`
bytes in dense mode, or `44 * dispatchesPerReadback` in active mode, never particle positions. `counterReadbackBytes` reports that size.
`pending` and status counts describe the last dispatch; `acceptedSteps` and
`rejectedSteps` sum all work in the batch, including rejected trials. The fixed
batch may contain idle tail dispatches after an early completion. `previous` retains
the state before the whole call, so idle tails do not erase the rendered segment. It cannot commit
the CPU horizon until readback finishes. If the device enables `timestamp-query`,
`gpuMilliseconds` sums all compute-pass durations across the batch, including active queue scans; it excludes readback latency and rendering. A
submission/readback failure disables further advancement of that tracer; destroy
it and create a new instance.

## GPU active scheduling

Use `scheduling: 'persistent'` to carry unfinished IDs between dispatches, or
`scheduling: 'active'` to rebuild the queue every time. Active mode builds a compact queue of unfinished particle indices
before each integration dispatch. The GPU writes the indirect workgroup count;
an empty queue launches zero integration workgroups. Queue order is unspecified,
but `output`, `previous`, `diagnostics` and trajectory-history slots never move.
The queue has at most `particleCount` entries and is rebuilt for every dispatch.
New requests reset elapsed progress and each call captures `previous` for **all**
slots, including stopped ones. Status totals still cover the whole allocation.

`scheduledParticles` reports slots sent to the integration kernel over the batch;
`integrationWorkgroups` reports its actual workgroups, including padded lanes.
Neither count includes the full-allocation compaction scan. In dense mode these
are `particleCount * dispatchCount` and `ceil(particleCount / 128) * dispatchCount`.
The two active-mode telemetry words share the existing single counter readback.

Active mode adds `4 * (particleCount + 1) + 24` bytes for the queue and indirect/reset
commands, plus eight staging bytes per batch dispatch. It adds a scan, reset copies,
a compute pass and timestamp snapshots. Dense remains the default: avoiding idle
integration lanes does **not** guarantee a lower end-to-end cost. Compare matched
fields, tolerances and batches using the benchmark described below. The checked-in
[Apple WebGPU measurements](https://github.com/visgl/luma.gl/blob/master/dev-docs/benchmarks/advection-active-scheduling.md)
reduce sparse integration workgroups but show higher end-to-end time in the inexpensive uniform field.

The active graph adds `reset-active-queue` and `compact-active-particles` between
counter reset and integration. The scan has explicit read/write dependencies;
the integration node declares the queue as storage-read and the command as indirect.
Graph/Trace expose both compute passes, while Diagnostics reports scheduled slots,
workgroups and readback bytes. No CPU particle-state readback controls scheduling.

### Persistent survivor queues

`scheduling: 'persistent'` uses two bounded index queues. A full-slot scan initializes
status totals and the first queue once per requested horizon. Each integration
invocation appends its ID to the other queue only if it still has work. Subsequent
dispatches and `continue()` calls consume survivors directly; they skip the full scan.
Queues are rebuilt at every new `advance()`, including after snapshot rotation.
Empty queues launch zero integration workgroups. This does not skip the fixed number
of batch encodings or their counter snapshots.

Status totals persist across dispatches and change only when a particle terminates.
Work and pending counters reset each dispatch. `previous` is a full GPU buffer copy
once per call, preserving completed and stopped slots as well as survivors. The graph
shows `prepare-survivor-dispatch`, conditionally executed `initialize-survivor-queue`,
and `trace-survivors-rk45`; skipped initialization is visible in inspection.

Persistent queue/command storage is `8 * (particleCount + 1) + 36` bytes. Counter
staging remains 44 bytes per dispatch. Timing includes initialization when it runs
and integration, but GPU compute timings exclude copy passes; wall-time measurements
include those copies and readback. Public particle slots remain stable and queue
order remains unspecified. Treat borrowed output/diagnostic buffers as read-only
while the tracer owns a request; external edits invalidate its survivor queue.
[Matched-error measurements](https://github.com/visgl/luma.gl/blob/master/dev-docs/benchmarks/advection-survivor-scheduling.md)
show a 2.57× end-to-end speedup in the repeat (1.45× initially) over dense scheduling
in the batched sparse fixture; single-dispatch results vary across runs.

## Graph inspection and tracing

Every `advance()` and `continue()` executes the same compiled `commandGraph`:
`reset-trace-counters` copies nine zero counters, then `trace-particles-rk45`
runs the bounded adaptive kernel. The graph declares particle, previous-state,
diagnostic, counter, uniform and velocity-texture access, including the reset-to-compute
dependency. Snapshot rotation rebinds both velocity textures on the next encoding.
Use `advance()` and `continue()` for execution; encoding `commandGraph` directly
bypasses the tracer's request and readback lifecycle.

The returned `encodings` contains every submitted `GPUCommandGraphEncoding` in order;
`encoding` remains the final one for compatibility. `dispatchCount` reports the batch
size. Per-dispatch counter staging copies occur outside the integration graph. Register
`tracer.commandGraph` with `GPUCommandGraphInspector` and record every entry in `result.encodings`
to inspect a batch without executing another simulation step. `dispatchIndex` counts
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
CPU timing only. `gpuMilliseconds` measures compaction and adaptive compute passes, excluding
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
| `previous` | State at the start of the most recent advance/continue batch |
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
status coloring and stopped-particle markers. Adaptive mode offers dense/active
scheduling and 1/4/16-dispatch batches, submitting one bounded batch per animation frame and displays pending particles and queued simulation
time. Work can lag behind wall time; the clock shows only committed simulation time.

GPU tests cover analytic rotation and convergence, geographic units, temporal
snapshot rotation, physical-hour requests, dispatch-budget independence, missing
samples, domain exit, lifetime and numerical/tolerance failures. Run the opt-in
accuracy/cost benchmark with:

```sh
LUMA_TEST_BROWSER_BENCHMARKS=true yarn test-headless --no-coverage --silent=false modules/graph/test/experimental/simulation/scientific-flow-benchmark.spec.ts
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

## Conservative mask footprints

Set `conservativeMask: true` to check all four interpolation corners of every
grid cell crossed by each proposed accepted chord, in addition to RK-stage checks.
The default remains stage-only validation. Missing samples reject the trial and
reduce its timestep; failure at the minimum timestep reports `MissingData` and
retains the last accepted position. Longitude footprints wrap when periodic
longitude is enabled. Both snapshots contribute when their temporal weights do.

Traversal advances both axes at a simultaneous grid-corner crossing, avoiding
false stops in adjacent cells that the chord does not enter. It detects short cell
intersections between RK stages. It does not resolve the curved path between stages,
localize coastline impact, reflect particles or provide slip boundaries. Use it
when all interpolation cells along an accepted chord must have valid samples.

## Retaining GPU trajectories

`FlowTrajectoryHistory` is an optional, separately owned ring buffer exported from
`@luma.gl/graph/experimental-simulation`:

```ts
import {FlowTrajectoryHistory} from '@luma.gl/graph/experimental-simulation';

const history = new FlowTrajectoryHistory(device, {
  particleCount: tracer.particleCount,
  capacity: Math.min(32, Math.floor(
    Math.min(device.limits.maxBufferSize, device.limits.maxStorageBufferBindingSize) /
    (tracer.particleCount * 16)
  ))
});
let result = await tracer.advance(1);
while (!result.complete) result = await tracer.continue();
const encoder = device.createCommandEncoder();
history.record(encoder, tracer.output, tracer.time);
device.submit(encoder.finish());
// Bind history.buffer for rendering. history.frames lists chronological byte offsets.
// Later, after the renderer no longer borrows it:
history.destroy();
```

Memory is exactly `capacity * particleCount * 16` bytes and must fit both
`maxBufferSize` and `maxStorageBufferBindingSize`; oversized histories are rejected
before allocating. Capacity must be at least one. Each frame preserves
normalized x/y, age and generation, with particle identity given by its index.
Recording beyond capacity overwrites the oldest frame. `frames` returns detached
CPU metadata (`time`, `byteOffset`, `sequence`), not particle readback. Times must
be finite and nondecreasing. `reset()` forgets metadata and starts a new capture
sequence without clearing GPU bytes; reset when reseeding or changing clocks.
Captured source buffers are borrowed, never destroyed by history.

Submit encoders in recording order and do not discard recorded commands: metadata
advances at recording time. Capture a completed RK45 horizon for synchronized
particle times; intermediate dispatches contain mixed progress. Stopped particles
retain their earlier age, even when the request horizon completes. For visual
RK2/RK4 simulations, generation changes identify respawns; never join across them.
Periodic trajectories still require seam-aware rendering.

The [advection roadmap](https://github.com/visgl/luma.gl/blob/master/dev-docs/roadmaps/advection-roadmap.md) separates
implemented qualification/history from real-data validation, true spherical
transport, grid extensions and GPU scheduling work.


### Explicit trajectory readback

Call `await history.readFrames()` when CPU trajectories are needed for comparison,
export or analysis. It returns chronological `FlowTrajectorySnapshot` objects:
`time`, `sequence`, the original GPU `byteOffset`, and `particles` containing
interleaved normalized x/y, age and generation. Readback uses at most two contiguous
ranges and transfers only populated slots, including after ring wraparound.
An empty history returns an empty array without GPU work.

Submit all recorded captures before calling it. Both readback copies are queued
before the method yields; subsequent captures or `reset()` do not change the
returned snapshot. Returned arrays are independent of GPU storage. Await every
outstanding readback before `destroy()`; premature destruction is rejected.
`record()` and the `frames` getter continue to perform no readback.

```ts
const snapshots = await history.readFrames();
for (const snapshot of snapshots) {
  const firstParticleX = snapshot.particles[0];
  console.log(snapshot.time, firstParticleX);
}
```

### Archived wind qualification

The offline GFS Atlantic fixture checks four six-hour releases at hourly horizons
against an independent double-precision CPU RK4 reference. With a 1 m local
RK45 tolerance and 300-second maximum step, every retained point must be within
5 m of the reference. Geographic conversion uses a bounded latitude cosine
polynomial to avoid backend-dependent trigonometric drift. The reference's
15-second and 30-second integrations agree within 0.0013 m. This qualifies a pinned, 8-bit-quantized model-wind archive, not
observations or unquantized GFS. See the [fixture provenance and reproduction guide](https://github.com/visgl/luma.gl/blob/master/modules/graph/test/experimental/simulation/fixtures/README.md).


The [Vector Observatory GFS lab](https://github.com/visgl/luma.gl/tree/master/examples/experimental/vector-observatory#archived-gfs-trajectory-lab)
visualizes the same archive and reference releases. It demonstrates bounded GPU
history, explicit readback, common-horizon comparison and physical-coordinate CSV
export. Its optional accuracy/cost sweep separates solver settings from changes
to grid spacing and snapshot interpolation, with backend-tagged JSON results.
