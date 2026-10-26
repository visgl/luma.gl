# Vector Observatory

An interactive WebGPU scientific-vector-field advection example. Start from the
repository root with `yarn workspace luma.gl-examples-vector-observatory start`.
Requires a WebGPU browser. All particle integration, streak rendering and HDR
trail persistence run on the GPU; the frame loop reads no particle positions.

Select an evolving double gyre, a counter-rotating vortex pair, or a meandering jet. These are
analytic benchmarks sampled onto a 256 × 256 collocated grid, not observed data.
The scientific adapter accepts the same structural normalized input used by
loaders.gl. Integration uses RK4 by default and automatic substeps bounded by half-cell
travel and 1/30 second. Time scale controls simulation seconds per wall second;
background gaps are capped at 0.1 second. The double gyre has a ten-second cycle,
with linear interpolation between quarter-second snapshots at every RK stage.
Only two snapshots reside on the GPU. The clock displays simulated seconds.
FPS is frame-loop timing, not a GPU timestamp benchmark.

Controls support 65,536 through 1,048,576 particles, RK2/RK4, pause/resume, reseed,
speed and exposure. History is cleared when the field, integrator, density or
viewport changes. Pause preserves the accumulated image. Resource cleanup runs
when the page is left.

Adaptive RK45 mode traces a single scientific release with stable particle identity.
Select a local absolute error tolerance, accepted-step coloring or status coloring.
Stopped particles remain visible: gray means expired, orange means outside the
domain, purple means missing data, and red means tolerance/numerical failure.
Reseed starts a new release. Tolerance controls integration error, not interpolation
or total trajectory error.

RK45 performs one bounded dispatch per frame, reads nine counters (36 bytes), and
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
