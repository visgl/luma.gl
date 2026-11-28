# Vector Observatory

An interactive WebGPU scientific-vector-field advection example. Start from the
repository root with `yarn workspace luma.gl-examples-vector-observatory start`.
Requires a WebGPU browser. All particle integration, streak rendering and HDR
trail persistence run on the GPU; the frame loop reads no particle positions.

Start with the synthetic weather globe, or select an evolving double gyre, a counter-rotating vortex pair, or a meandering jet. These are
analytic benchmarks sampled onto a 256 × 256 collocated grid, not observed data.
The scientific adapter accepts the same structural normalized input used by
loaders.gl. Integration uses RK4 by default and automatic substeps bounded by half-cell
travel and 1/30 second. Time scale controls simulation seconds per wall second;
background gaps are capped at 0.1 second. The double gyre has a ten-second cycle,
with linear interpolation between quarter-second snapshots at every RK stage.
Only two snapshots reside on the GPU. The clock displays simulated seconds.
FPS is frame-loop timing, not a GPU timestamp benchmark.

Controls support 65,536 through 1,048,576 particles, RK2/RK4/RK45, pause/resume, reseed,
speed and exposure. History is cleared when the field, integrator, density or
viewport changes. Pause preserves the accumulated image. Resource cleanup runs
when the page is left.

Adaptive RK45 mode traces a single scientific release with stable particle identity.
Select a local absolute error tolerance, accepted-step coloring or status coloring.
Stopped particles remain visible: gray means expired, orange means outside the
domain, purple means missing data, and red means tolerance/numerical failure.
Reseed starts a new release. Tolerance controls integration error, not interpolation
or total trajectory error.

RK45 submits one bounded batch per frame, reads the batch counters, and
shows pending particles plus queued simulation time when work falls behind.
Particle positions stay on the GPU. The clock advances only when a requested
horizon completes; particles can have different intermediate times while pending.
The GPU timer, when available, measures compute only, excluding counter readback
and rendering. See the [tracer API](../../../docs/api-reference/experimental/scientific-flow-tracer.md)
for status codes, accuracy limits and the opt-in accuracy/cost benchmark.

The example uses the shared cinematic InfoBox and schema-driven Settings panel.
Expand the InfoBox to access Settings, Info, Diagnostics, Graph, Trace, and bundled Source tabs.
Settings and the simulation persist when switching tabs or collapsing the panel.
RK45-specific controls appear only in adaptive mode. Diagnostics reports every
particle termination reason separately. The same collapsible, resizable panel
works in standalone and embedded views, including on mobile.

Graph and Trace inspect actual command encodings for RK2, RK4 and RK45. The
adaptive graph resets dispatch counters before running bounded RKF45 integration;
resource inspection includes particle states, diagnostics, counters and both
velocity snapshots. Trace samples every 60 encodings, with CPU timing for counter
reset and CPU/GPU timing for integration. Diagnostics identifies new horizons and
continuations by dispatch number and target time. Reseeding or switching integrators
clears prior inspection state. Counter readback and trail rendering are outside
these graph timings; resource previews explicitly read current GPU allocations.


### Weather globe

The default weather case projects animated synthetic wind bands, meandering jets,
and drifting vortices onto the repository's Earth texture. Drag horizontally to
turn the globe and vertically to tilt toward either pole, or use **Rotate globe** for automatic rotation. **Pause** freezes
both the flow and automatic rotation; manual rotation remains available. Trails
are accumulated in a longitude/latitude atlas, so turning the globe does not smear
the flow. RK2, RK4 and RK45 retain their Graph/Trace inspection support.

This is an illustrative normalized 2D field projected onto a sphere, not observed
weather, a forecast, or a spherical atmospheric model. Its seconds and velocities
are illustrative. The field is sampled at evolving 0.25-second intervals. Both polar caps include evolving angular circulation; meridional motion tends
to zero at the exact poles. Periodic longitude sampling and wrapped particle
states preserve trajectories across the antimeridian in all three integrators.
Trail segments crossing the atlas boundary are drawn on both edges, and the globe
uses wrapped bilinear sampling to avoid a visible texture seam. Earth imagery reuses
`examples/showcase/globe/earth.jpg`; no remote data service is required.

Scientific capabilities and remaining qualification work are tracked in the
[advection roadmap](../../../dev-docs/roadmaps/advection-roadmap.md).

### Archived GFS trajectory lab

Select **GFS Atlantic · archived model winds**, or open `gfs.html` on the same
example server. Both pages are included in the standalone and website builds.
The regional map shows the pinned 2016-11-20 00:00–06:00 UTC NOAA GFS 10 m wind
archive, decoded from Mapbox's quantized PNGs. It is model data, not observations.
The Info panel retains the data license and links the exact source revision.

RK45 advances four reference releases plus 1,024 interior background particles
on the GPU. A fixed ring captures 73 common horizons at five-minute intervals;
one explicit trajectory readback supplies Canvas2D playback. The map shows the full regional
field and trajectories, while desktop insets magnify each qualified release.
White dashed tracks connect the independently refined CPU hourly samples. Error
is compared at those common hourly horizons only. Playback does not integrate
particles or read live GPU buffers, and is bounded to the archived six hours.

Pause, scrub, change playback speed, or replay the retained release. **Export CSV**
builds a native Apache Arrow table and passes it directly to loaders.gl `CSVWriter`,
saving the four reference identities with UTC timestamps, elapsed seconds,
longitude/latitude, age, generation and hourly reference error. Empty error cells
mean no independent reference exists at that five-minute horizon. Graph and Trace
inspect actual RK45 encodings; Diagnostics includes termination counts and per-release
error. The history and tracer remain alive for inspection until page teardown.

**Accuracy / cost** runs a warmup followed by two samples of seven variants:
baseline, tighter/looser local tolerance, shorter steps, 2°/3° decimation, and a
frozen initial snapshot. The second pass reverses order. GPU time measures compute;
wall time includes setup, counter synchronization, capture and final readback.
Four-particle timing measures latency, not large-release throughput. JSON export
includes backend metadata, source revision, settings, errors, work counts and
memory. Cancellation keeps completed samples. Grid decimation and frozen snapshots
change the sampled field and are not pure integrator comparisons.

Reproduce the same sweep without the UI:

```bash
LUMA_TEST_BROWSER_BENCHMARKS=true yarn test-headless --no-coverage --silent=false modules/graph/test/experimental/simulation/scientific-flow-gfs-benchmark.spec.ts
```

A local Apple/Metal run found 0.64 m maximum hourly error at the baseline settings,
2.23 m with 60-second steps, and identical results for 0.1/1/10 m tolerances while
the 300-second cap dominated. Smaller steps can accumulate more float32 error;
tighter local tolerance alone does not establish better total trajectory accuracy.
The 2°/3° decimations differed from the original-grid reference by about 31/57 km;
freezing the initial field differed by 113 km. These are fixture-specific sensitivity
measurements, not meteorological accuracy or hardware-independent performance claims.

### loaders.gl writer integration

The export lazily loads `apache-arrow`, `encodeText` from `@loaders.gl/core`, and
`CSVWriter` from `@loaders.gl/tables/csv`. It passes a bare native Arrow table to
the writer, with Uint32 identities/generations, Float64 physical quantities and
nullable Float64 reference errors. `time_utc` is explicit ISO-UTC UTF-8 text, so
CSV consumers do not need an external schema to recover its timezone. No custom
CSV quoting or serialization remains.

The integration audit against loaders.gl 5.0.1 and current upstream identified
two follow-ups, neither of which blocks this export:

- [`encodeTableAsText`](https://github.com/visgl/loaders.gl/blob/master/modules/core/src/lib/api/encode-table.ts)
  still accepts the legacy structural `Table` type instead of the writer's inferred
  data type. Aligning table convenience APIs with `WriterDataType` would make native
  Arrow calls type-safe. `encodeText` already has the correct generic contract.
- [`CSVWriter`](https://github.com/visgl/loaders.gl/blob/master/modules/tables/src/csv/lib/encoders/encode-csv.ts)
  formats Arrow timestamp values as the epoch numbers returned by Arrow row access.
  A documented, opt-in schema-aware timestamp formatting policy would allow ISO-UTC
  output without preparing a UTF-8 column. Existing numeric behavior should remain
  compatible, with tests for timestamp units, nulls, precision and timezone metadata.

The published writer already quotes commas, quotes, CR/LF and Unicode correctly;
this example does not need an escaping workaround. Batched writing is outside this
bounded 292-row export and is not a prerequisite for it.

## Spherical transport and stronger globe streaks

The default weather globe uses fewer, wider streaks, adjustable persistence in seconds
and bounded glow to keep Earth imagery readable. Trail decay follows elapsed wall
time. The separate **Pole-crossing globe · spherical** preset uses equal-area seeds
and Cartesian RK2/RK4 transport with Graph/Trace inspection. It is an illustrative
evolving rotation, not observed weather. See the [spherical API](../../../docs/api-reference/experimental/spherical-flow-graph.md)
for units, seam/pole conventions, ownership and qualification limits.

The spherical preset draws Cartesian history as four-piece great-circle ribbons,
with no longitude-atlas seam or pole-segment cutoff. Its at-most-24-frame GPU ring
uses `particleCount × capacity × 16` bytes (24 MiB at 65536 particles); capacity is
reduced to fit the device storage-binding limit. Rendering selects at most 8192
stable slots. Capture cadence follows the requested persistence in simulation
seconds; frame rate limits how densely it can sample. Long frame gaps therefore
produce approximate short arcs, not reconstructed solver paths. Antipodal arcs
are omitted. Pausing retains trails and permits camera rotation. Tests render
pole/seam crossings after ring wrap and verify back-face occlusion.

## Native C-grid fixture

**C-grid gyre · face velocities** uses a 32 × 32 Cartesian cell grid with separate
x/y face arrays. Vertex streamfunction differences manufacture a discrete
divergence-free circulation; exterior faces are valid zeros, not missing data.
RK2, RK4 and RK45 sample this layout directly. The existing Settings, Graph and
Trace panels inspect the same simulation pipeline. This is a manufactured fixture,
not ocean observations or curvilinear-grid support.

### RK45 scheduling

Select Adaptive RK45 to compare **Dense · all slots** and **Active · GPU queue**,
with 1, 4 or 16 dispatches per readback. Changing either setting reseeds the simulation.
Graph and Trace show queue reset/compaction before indirect integration; Diagnostics
reports integration slots and workgroups for the complete batch. These counters
exclude the queue scan, while compute timings include it. Dense remains the default
because compaction overhead can outweigh saved integration work.

### Persistent and spherical RK45

Cartesian RK45 offers **Persistent · survivors**, which initializes a queue once
per requested horizon and carries unfinished stable IDs through bounded continuation.
Graph/Trace show the skipped initialization pass on later dispatches.
The spherical preset now also offers RK45 with a physical local-error tolerance,
Diagnostics and Graph/Trace while retaining great-circle trails. The spherical preset supports dense and persistent scheduling and the same batch control.


### Globe whole-frame comparison

Open the example with `?benchmarkScheduling=dense` or
`?benchmarkScheduling=persistent`. The benchmark sets 65,536 particles, RK45 and
16 dispatches per readback. The ordinary globe loop advances the same fixed
simulation time in both modes. After 60 warm-up frames the page records 180
animation-frame intervals, including solver synchronization, trail history, globe
rendering and browser frame pacing. The page prints a JSON report and stops.

Measured on the same Mac in the in-app browser at 2560 × 1440 on November 28, 2026.
Runs were sequential in dense/persistent/persistent/dense order. Each completed
8 seconds of simulation with negligible queued time.

| Run | Mean frame (ms) | Median (ms) | p95 (ms) |
| --- | ---: | ---: | ---: |
| Dense 1 | 16.66 | 16.70 | 17.60 |
| Persistent 1 | 16.67 | 16.70 | 17.60 |
| Persistent 2 | 16.67 | 16.70 | 17.60 |
| Dense 2 | 16.85 | 16.70 | 17.70 |

The mean ratio is about 1.005×. Both modes ran near 60 FPS, so the experiment
shows no meaningful whole-frame speedup at this workload. Frame pacing can hide
GPU headroom below the display interval. A heavier workload or an uncapped GPU
completion measurement would be needed to quantify that headroom.
