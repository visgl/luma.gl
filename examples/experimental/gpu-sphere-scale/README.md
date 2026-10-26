# GPU Sphere Scale

Run `yarn workspace luma.gl-examples-experimental-gpu-sphere-scale start`.

Starts with **10,000 spheres**, with 25,000 and 50,000 stress settings. Shares the sphere
world renderer, spatial hashing, scenario controls and benchmark export. Position and
orientation buffers are rendered directly. Sparse layers, dense piles and racks expose
different candidate and contact workloads; a larger selectable count is not a claim
that every scene fits every adapter's performance budget.

Interactive playback submits at most one 1/120-second physics step per rendered frame
and reports the actual simulation-time/wall-time ratio. It deliberately slows simulation
under load instead of building an unbounded queue of catch-up work. The benchmark runs
one step per frame and reports GPU timing separately from frame and CPU encoding time.
Dropped contacts, invalid bodies or exhausted candidate budgets invalidate a run.
Use the benchmark export to record adapter-specific results.

The standard luma.gl InfoBox starts collapsed. Open **Controls** for scene, count,
playback and benchmark settings, or **GPU Graph** for compiled nodes, operation
timings and diagnostic counters. The inspector reuses existing timing readbacks
and updates its graph when the scene or sphere count changes.
