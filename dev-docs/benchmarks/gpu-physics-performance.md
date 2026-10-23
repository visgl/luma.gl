# GPU sphere physics performance evidence

Measured October 16, 2026 on an Apple WebGPU adapter reporting Metal 3, using local
headless Chromium with GPU presentation enabled. Other development tasks were
running. These are single-device observations, not portable performance guarantees.
Raw adapter metadata, settings and diagnostics are in
[gpu-physics-performance-2026-10-16.json](gpu-physics-performance-2026-10-16.json).

Each run uses 30 warmup frames and 300 measured frames, one 1/120-second physics
step per frame, eight solver iterations, 32 contacts per body and a 512-entry
candidate traversal budget. Frame duration includes display pacing. Encoding time
is CPU time; GPU timestamps cover simulation work separately from rendering.

| Scene | Bodies | Median frame (ms) | p95 frame (ms) | Median encode (ms) | Median GPU simulation (ms) |
| --- | --- | --- | --- | --- | --- |
| Sparse layers | 64 | 16.7 | 17.3 | 0.4 | 0.59 |
| Rack | 64 | 16.7 | 17.4 | 0.3 | 0.59 |
| Dense pile | 64 | 16.7 | 17.3 | 0.3 | 0.88 |
| Sparse layers | 1,024 | 16.7 | 17.4 | 0.5 | 2.24 |
| Sparse layers | 10,000 | 32.4 | 34.0 | 0.6 | 24.43 |

All five reports have zero sampled dropped contacts, invalid bodies, exhausted
candidate budgets and readback errors. Diagnostics were sampled 10–16 times per
run, including warmup; this is not proof of every step's validity. Large dense-pile
capacity and other adapters need separate measurements.

The 10,000-body scene exceeds an 8.33 ms simulation budget on this adapter. Do not
interpret a 1/120-second numerical timestep as a demonstrated 120 Hz wall-clock
simulation rate. Catch-up steps cost additional GPU work; cap them explicitly and
report discarded time or slow playback. A saturated contact or traversal budget
invalidates a run even when its frame time looks good.

## Reproduce

Run `yarn workspace luma.gl-examples-experimental-gpu-sphere-world start`. Select
a body count and scene, wait for compilation, reset, then click **Benchmark** and
**Save report**. Keep the tab visible and do not edit source during measurement:
Vite reloads reset the example. Confirm the report's body count and scenario match
the requested run. Capture separate sparse, rack and pile reports, and vary solver
iterations/contact capacity in code when investigating those costs.

The discrete grid benchmark does not measure the small-world continuous sweep or
pool event path. Those are bounded to 256 bodies and have separate regression
coverage. Warm starting and alternative dense-cell acceleration remain experiments,
not measured improvements claimed by this report.


## Parallel contact compaction checkpoint (2026-10-23)

The new sparse-contact fixture reserves 8192 pair slots for 24 independent impacts.
At the end of the run the compact queue has zero contacts and dispatches zero pair
workgroups per iteration; full-scan mode dispatches 128. A separate correctness
fixture retains 80 simultaneous contacts in two workgroups, compared with 64 full
capacity workgroups at 4096 slots. Body gathers and collision discovery still run.

An exploratory Apple/Metal-3 run (30 samples, no warmup) measured median full-step
GPU work of 0.610 ms compacted versus 1.041 ms scanning. Median completion with
diagnostics was 2.5 versus 2.6 ms. The two extra compaction passes and host/submission
costs remain part of these totals. Contacts separate early; this is predominantly
an empty/sparse queue measurement, not a dense-pile result. Other browser work was
allowed on the machine. No cross-device or statistical performance gate is claimed.

The machine-readable summary is [gpu-physics-compaction.json](./gpu-physics-compaction.json).
Reproduce both modes using the same timestep, solver iterations and capacity:

```bash
node scripts/physics/benchmark-rigid-body.mjs --url http://127.0.0.1:5236/ --fixture sparseContacts --solver parallel --maximum-pairs 8192 --warmup 0 --samples 30
node scripts/physics/benchmark-rigid-body.mjs --url http://127.0.0.1:5236/ --fixture sparseContacts --solver parallel --maximum-pairs 8192 --warmup 0 --samples 30 --full-scan
```
